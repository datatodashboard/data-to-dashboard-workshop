import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  adminClient,
  constantTimeEqual,
  hmacHex,
  isAllowedBrowserOrigin,
  json,
  razorpayFetch,
  requireEnv,
} from "../_shared/workshop.ts";

type VerificationInput = {
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json(request, {}, 204);
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  if (!isAllowedBrowserOrigin(request)) return json(request, { error: "Untrusted origin." }, 403);

  try {
    const input = await request.json() as VerificationInput;
    const orderId = typeof input.razorpay_order_id === "string" ? input.razorpay_order_id : "";
    const paymentId = typeof input.razorpay_payment_id === "string" ? input.razorpay_payment_id : "";
    const signature = typeof input.razorpay_signature === "string" ? input.razorpay_signature : "";
    if (!orderId || !paymentId || !signature) {
      return json(request, { error: "Invalid payment response." }, 400);
    }

    const expectedSignature = await hmacHex(
      orderId + "|" + paymentId,
      requireEnv("WORKSHOP_RAZORPAY_KEY_SECRET"),
    );
    if (!constantTimeEqual(expectedSignature, signature)) {
      return json(request, { error: "Payment verification failed." }, 401);
    }

    const supabase = adminClient();
    const { data: order, error: orderError } = await supabase
      .from("workshop_orders")
      .select("id, registration_id, provider_order_id, amount_paise, currency, status, provider_payment_id")
      .eq("provider_order_id", orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return json(request, { error: "Unknown workshop order." }, 404);

    if (order.status === "paid") {
      return order.provider_payment_id === paymentId
        ? json(request, { success: true, registrationId: order.registration_id })
        : json(request, { error: "Order was already paid." }, 409);
    }

    const paymentResponse = await razorpayFetch("/payments/" + encodeURIComponent(paymentId));
    if (!paymentResponse.ok) throw new Error("Razorpay payment lookup failed.");
    const payment = await paymentResponse.json() as {
      order_id?: string; amount?: number; currency?: string; status?: string;
    };

    if (
      payment.order_id !== order.provider_order_id ||
      payment.amount !== order.amount_paise ||
      payment.currency !== order.currency
    ) {
      return json(request, { error: "Payment details do not match the workshop order." }, 400);
    }

    if (payment.status !== "captured") {
      return json(request, {
        pending: true,
        error: "Payment is being confirmed. Please do not pay again.",
      }, 202);
    }

    const paidAt = new Date().toISOString();
    const { error: markOrderPaidError } = await supabase
      .from("workshop_orders")
      .update({ status: "paid", provider_payment_id: paymentId, paid_at: paidAt, updated_at: paidAt })
      .eq("id", order.id)
      .in("status", ["created", "authorized"]);
    if (markOrderPaidError) throw markOrderPaidError;

    const { error: markRegistrationPaidError } = await supabase
      .from("workshop_registrations")
      .update({ status: "paid", paid_at: paidAt, updated_at: paidAt })
      .eq("id", order.registration_id);
    if (markRegistrationPaidError) throw markRegistrationPaidError;

    return json(request, { success: true, registrationId: order.registration_id });
  } catch (error) {
    console.error("workshop-verify-payment failed", error);
    return json(request, { error: "Payment verification could not be completed." }, 500);
  }
});
