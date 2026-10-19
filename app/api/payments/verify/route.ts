import { env } from "cloudflare:workers";
import { confirmPayment, verifyHmac } from "@/lib/funnel";

export async function POST(request: Request) {
  const config = env as unknown as Record<string, string | undefined>;
  const input = (await request.json()) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  if (!config.RAZORPAY_KEY_SECRET || !input.razorpay_order_id || !input.razorpay_payment_id || !input.razorpay_signature) {
    return Response.json({ error: "Invalid payment response." }, { status: 400 });
  }
  const valid = await verifyHmac(
    `${input.razorpay_order_id}|${input.razorpay_payment_id}`,
    input.razorpay_signature,
    config.RAZORPAY_KEY_SECRET,
  );
  if (!valid) return Response.json({ error: "Payment verification failed." }, { status: 401 });
  const lead = await confirmPayment(input.razorpay_order_id, input.razorpay_payment_id);
  return Response.json({ success: true, registrationId: lead.id });
}
