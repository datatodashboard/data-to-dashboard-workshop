import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  adminClient,
  isAllowedBrowserOrigin,
  json,
  normalizePhone,
  razorpayFetch,
} from "../_shared/workshop.ts";

type CheckoutInput = {
  workshopSlug?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  experience?: unknown;
  goal?: unknown;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json(request, {}, 204);
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  if (!isAllowedBrowserOrigin(request)) return json(request, { error: "Untrusted origin." }, 403);

  try {
    const input = await request.json() as CheckoutInput;
    const workshopSlug = typeof input.workshopSlug === "string" ? input.workshopSlug.trim() : "";
    const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const phone = normalizePhone(input.phone);
    const sqlLevel = typeof input.experience === "string" ? input.experience.trim() : "";
    const learningGoal = typeof input.goal === "string" ? input.goal.trim().slice(0, 1000) : null;

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(workshopSlug) ||
      !fullName || fullName.length > 120 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !/^[+][1-9][0-9]{7,14}$/.test(phone) ||
      !["new", "beginner", "working"].includes(sqlLevel)
    ) {
      return json(request, { error: "Please enter valid registration details." }, 400);
    }

    const supabase = adminClient();
    const { data: event, error: eventError } = await supabase
      .from("workshop_events")
      .select("id, slug, title, price_paise, currency, capacity")
      .eq("slug", workshopSlug)
      .eq("status", "open")
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return json(request, { error: "Workshop registration is not open." }, 409);

    const { data: registration, error: registrationError } = await supabase
      .from("workshop_registrations")
      .insert({
        event_id: event.id,
        full_name: fullName,
        email,
        phone_e164: phone,
        sql_level: sqlLevel,
        learning_goal: learningGoal,
      })
      .select("id")
      .single();

    if (registrationError) {
      if (registrationError.code === "23505") {
        return json(request, { error: "This email is already registered for the workshop." }, 409);
      }
      throw registrationError;
    }

    const receipt = "d2dw_" + registration.id.replaceAll("-", "");
    const razorpayResponse = await razorpayFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: event.price_paise,
        currency: event.currency,
        receipt,
        notes: {
          workshop_registration_id: registration.id,
          workshop_event_id: String(event.id),
          workshop_slug: event.slug,
        },
      }),
    });

    if (!razorpayResponse.ok) throw new Error("Razorpay order creation failed.");
    const razorpayOrder = await razorpayResponse.json() as { id: string };

    const { error: orderError } = await supabase.from("workshop_orders").insert({
      registration_id: registration.id,
      provider_order_id: razorpayOrder.id,
      receipt,
      amount_paise: event.price_paise,
      currency: event.currency,
    });
    if (orderError) throw orderError;

    return json(request, {
      keyId: Deno.env.get("WORKSHOP_RAZORPAY_KEY_ID"),
      orderId: razorpayOrder.id,
      amount: event.price_paise,
      currency: event.currency,
      registrationId: registration.id,
      workshopTitle: event.title,
    });
  } catch (error) {
    console.error("workshop-create-order failed", error);
    return json(request, { error: "Payment could not be started. Please try again." }, 500);
  }
});
