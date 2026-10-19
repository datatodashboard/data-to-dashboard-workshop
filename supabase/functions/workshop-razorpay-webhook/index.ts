import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  adminClient,
  constantTimeEqual,
  hmacHex,
  requireEnv,
  sha256Hex,
} from "../_shared/workshop.ts";

type RazorpayEvent = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
      };
    };
  };
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const expectedSignature = await hmacHex(body, requireEnv("RAZORPAY_WORKSHOP_WEBHOOK_SECRET"));
    if (!constantTimeEqual(expectedSignature, signature)) {
      return new Response("Invalid webhook signature", { status: 401 });
    }

    const event = JSON.parse(body) as RazorpayEvent;
    const payment = event.payload?.payment?.entity;
    const eventType = event.event ?? "unknown";
    const paymentId = payment?.id ?? await sha256Hex(body);
    const providerEventId = eventType + ":" + paymentId;
    const supabase = adminClient();
    let orderId: string | null = null;

    if (payment?.order_id) {
      const { data: order, error: orderError } = await supabase
        .from("workshop_orders")
        .select("id, registration_id, amount_paise, currency, status")
        .eq("provider_order_id", payment.order_id)
        .maybeSingle();
      if (orderError) throw orderError;

      if (order) {
        orderId = order.id;
        if (eventType === "payment.captured") {
          if (payment.amount !== order.amount_paise || payment.currency !== order.currency) {
            throw new Error("Webhook payment details do not match the workshop order.");
          }

          const paidAt = new Date().toISOString();
          const { error: orderUpdateError } = await supabase
            .from("workshop_orders")
            .update({ status: "paid", provider_payment_id: paymentId, paid_at: paidAt, updated_at: paidAt })
            .eq("id", order.id)
            .in("status", ["created", "authorized"]);
          if (orderUpdateError) throw orderUpdateError;

          const { error: registrationUpdateError } = await supabase
            .from("workshop_registrations")
            .update({ status: "paid", paid_at: paidAt, updated_at: paidAt })
            .eq("id", order.registration_id);
          if (registrationUpdateError) throw registrationUpdateError;
        }
      }
    }

    const { error: eventError } = await supabase.from("workshop_payment_events").upsert({
      provider_event_id: providerEventId,
      event_type: eventType,
      order_id: orderId,
      payload: event,
      processed_at: new Date().toISOString(),
    }, { onConflict: "provider_event_id", ignoreDuplicates: true });
    if (eventError) throw eventError;

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("workshop-razorpay-webhook failed", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
