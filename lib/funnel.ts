import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";

type RuntimeEnv = Record<string, string | undefined>;

function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

export async function verifyHmac(payload: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return diff === 0;
}

function calendarInvite() {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Data to Dashboard//SQL Workshop//EN",
    "BEGIN:VEVENT",
    "UID:d2d-sql-20261114@datatodashboard.in",
    "DTSTAMP:20261021T000000Z",
    "DTSTART:20261114T043000Z",
    "DTEND:20261114T073000Z",
    "RRULE:FREQ=WEEKLY;BYDAY=SA,SU",
    "SUMMARY:D2D SQL for Data Analysis Workshop",
    "DESCRIPTION:Live SQL classes by Ramgokul Jeyakumar. Every Saturday and Sunday from 10 AM to 1 PM IST. Your joining link will be shared before the session.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

async function sendEmail(lead: typeof leads.$inferSelect) {
  const config = runtimeEnv();
  if (!config.RESEND_API_KEY || !config.FROM_EMAIL) return;
  const invite = btoa(calendarInvite());
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.FROM_EMAIL,
      to: [lead.email],
      subject: "You’re confirmed — D2D SQL Workshop",
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#112036"><h2>Registration confirmed</h2><p>Hi ${lead.fullName},</p><p>Your seat for the <strong>D2D SQL for Data Analysis Workshop</strong> is confirmed.</p><p><strong>Starts Saturday, 14 November 2026<br>Every Saturday and Sunday<br>10:00 AM-1:00 PM IST<br>Live online session</strong></p><p>Your joining link and learning materials will be sent before the workshop.</p><p>- Ramgokul Jeyakumar<br>Data to Dashboard</p></div>`,
      attachments: [
        { filename: "D2D-SQL-Workshop.ics", content: invite },
      ],
    }),
  });
}

async function sendWhatsApp(lead: typeof leads.$inferSelect) {
  const config = runtimeEnv();
  if (
    !config.WHATSAPP_ACCESS_TOKEN ||
    !config.WHATSAPP_PHONE_NUMBER_ID ||
    !config.WHATSAPP_TEMPLATE_NAME
  ) return;
  const digits = lead.phone.replace(/\D/g, "");
  const to = digits.length === 10 ? `91${digits}` : digits;
  await fetch(
    `https://graph.facebook.com/v23.0/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: config.WHATSAPP_TEMPLATE_NAME,
          language: { code: config.WHATSAPP_TEMPLATE_LANGUAGE ?? "en" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: lead.fullName }],
            },
          ],
        },
      }),
    },
  );
}

export async function confirmPayment(orderId: string, paymentId: string) {
  const db = getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.orderId, orderId)).limit(1);
  if (!lead) throw new Error("Registration not found");
  if (lead.status === "paid") return lead;
  const paidAt = new Date().toISOString();
  const [updated] = await db
    .update(leads)
    .set({ status: "paid", paymentId, paidAt })
    .where(eq(leads.id, lead.id))
    .returning();
  await Promise.allSettled([sendEmail(updated), sendWhatsApp(updated)]);
  return updated;
}
