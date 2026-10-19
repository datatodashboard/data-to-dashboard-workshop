import { createClient } from "npm:@supabase/supabase-js@2";

const defaultOrigin = "https://d2d-sql-workshop.sriramsarathy87.chatgpt.site";

export function allowedOrigin(_request: Request) {
  return Deno.env.get("WORKSHOP_ALLOWED_ORIGIN") ?? defaultOrigin;
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = allowedOrigin(request);

  return {
    "Access-Control-Allow-Origin": origin === allowed ? allowed : "null",
    "Access-Control-Allow-Headers": "content-type, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}

export function isAllowedBrowserOrigin(request: Request) {
  return request.headers.get("origin") === allowedOrigin(request);
}

export function normalizePhone(value: unknown) {
  const raw = typeof value === "string" ? value.replace(/[\s()-]/g, "") : "";
  if (/^\d{10}$/.test(raw)) return "+91" + raw;
  return raw;
}

export function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing required server configuration: " + name);
  return value;
}

export function adminClient() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function razorpayAuthorization() {
  return "Basic " + btoa(
    requireEnv("WORKSHOP_RAZORPAY_KEY_ID") + ":" + requireEnv("WORKSHOP_RAZORPAY_KEY_SECRET"),
  );
}

export async function razorpayFetch(path: string, init: RequestInit = {}) {
  return fetch("https://api.razorpay.com/v1" + path, {
    ...init,
    headers: {
      Authorization: razorpayAuthorization(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function hmacHex(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
