const endpoint = "https://qklnaqfspvmnlequqagf.supabase.co/functions/v1/workshop-verify-payment";
export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input?.razorpay_order_id || !input?.razorpay_payment_id || !input?.razorpay_signature) {
      return Response.json({ error: "Invalid payment response." }, { status: 400 });
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: new URL(request.url).origin },
      body: JSON.stringify({
        razorpay_order_id: input.razorpay_order_id,
        razorpay_payment_id: input.razorpay_payment_id,
        razorpay_signature: input.razorpay_signature,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await response.json();
    return Response.json(data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ pending: true, error: "Payment confirmation is pending. Please do not pay again. Contact Data to Dashboard with your payment ID." }, { status: 502 });
  }
}
