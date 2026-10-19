import { env } from "cloudflare:workers";
import { confirmPayment, verifyHmac } from "@/lib/funnel";

export async function POST(request: Request) {
  const config = env as unknown as Record<string, string | undefined>;
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!config.RAZORPAY_WEBHOOK_SECRET || !(await verifyHmac(body, signature, config.RAZORPAY_WEBHOOK_SECRET))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(body) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment.id) await confirmPayment(payment.order_id, payment.id);
  }
  return Response.json({ received: true });
}
