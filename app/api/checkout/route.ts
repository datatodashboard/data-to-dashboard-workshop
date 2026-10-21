import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { leads } from "@/db/schema";

type CheckoutPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  experience?: string;
  goal?: string;
};

export async function POST(request: Request) {
  const config = env as unknown as Record<string, string | undefined>;
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    return Response.json(
      { error: "Online payment is being connected. Please try again shortly." },
      { status: 503 },
    );
  }

  const input = (await request.json()) as CheckoutPayload;
  const fullName = input.fullName?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const phone = input.phone?.replace(/\s/g, "") ?? "";
  const experience = input.experience?.trim() ?? "";
  const goal = input.goal?.trim() ?? "";
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !/^\+?\d{10,13}$/.test(phone) || !experience) {
    return Response.json({ error: "Please enter valid registration details." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const amount = 99900;
  const auth = btoa(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`);
  const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt: id, notes: { workshop: "D2D SQL 2026-11-14" } }),
  });
  if (!orderResponse.ok) {
    return Response.json({ error: "Payment could not be started. Please try again." }, { status: 502 });
  }
  const order = (await orderResponse.json()) as { id: string };
  const db = getDb();
  await db.insert(leads).values({
    id,
    fullName,
    email,
    phone,
    experience,
    goal,
    orderId: order.id,
    amount,
    createdAt: new Date().toISOString(),
  });

  return Response.json({
    keyId: config.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount,
    registrationId: id,
  });
}
