"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; } }
type FormState = { fullName: string; email: string; phone: string; experience: string; goal: string };
const initialForm: FormState = { fullName: "", email: "", phone: "", experience: "", goal: "" };

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script);
  });
}

export function RegistrationForm() {
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState(""); const [registrationId, setRegistrationId] = useState("");
  const update = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setState("loading");
    try {
      if (!(await loadRazorpay())) throw new Error("The secure payment window could not load. Please try again.");
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = (await response.json()) as { error?: string; keyId?: string; orderId?: string; amount?: number; registrationId?: string };
      if (!response.ok || !data.keyId || !data.orderId) throw new Error(data.error ?? "Payment could not be started.");
      const checkout = new window.Razorpay!({
        key: data.keyId, amount: data.amount, currency: "INR", name: "Data to Dashboard", description: "SQL for Data Analysis Workshop", order_id: data.orderId,
        prefill: { name: form.fullName, email: form.email, contact: form.phone }, theme: { color: "#075e54" },
        handler: async (payment: Record<string, string>) => {
          try {
          const verification = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
          const verified = (await verification.json()) as { error?: string; registrationId?: string; success?: boolean; pending?: boolean };
          if (!verification.ok || verified.success !== true || verified.pending) { setState("idle"); setError(verified.error ?? "Payment verification is pending. We will update you shortly."); return; }
          setRegistrationId(verified.registrationId ?? data.registrationId ?? ""); setState("success");
          } catch { setState("idle"); setError("Payment confirmation is pending. Please do not pay again. Contact Data to Dashboard with your payment ID."); }
        }, modal: { ondismiss: () => setState("idle") },
      });
      checkout.open();
    } catch (caught) { setState("idle"); setError(caught instanceof Error ? caught.message : "Please try again."); }
  }

  if (state === "success") return <div className="success-panel" role="status"><CheckCircle2 size={52} /><h3>Your seat is confirmed!</h3><p>Your payment has been verified. Please keep your registration ID for workshop access.</p>{registrationId && <small>Registration ID: {registrationId}</small>}</div>;

  return (
    <form className="registration-form" onSubmit={submit}>
      <div className="field-row"><Label htmlFor="fullName">Full name • பெயர்</Label><Input id="fullName" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Your name" required /></div>
      <div className="split-fields">
        <div className="field-row"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" required /></div>
        <div className="field-row"><Label htmlFor="phone">WhatsApp number • எண்</Label><Input id="phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="10-digit number" required /></div>
      </div>
      <div className="field-row"><Label htmlFor="experience">Your SQL level</Label><select id="experience" value={form.experience} onChange={(event) => update("experience", event.target.value)} required><option value="">Select your level</option><option value="new">New to SQL</option><option value="beginner">Know the basics</option><option value="working">Use SQL at work</option></select></div>
      <div className="field-row"><Label htmlFor="goal">What do you want to learn? <span>(optional)</span></Label><Textarea id="goal" value={form.goal} onChange={(event) => update("goal", event.target.value)} placeholder="Tell us your goal in one line" /></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button className="payment-button" type="submit" disabled={state === "loading"}>{state === "loading" ? <><LoaderCircle className="spin" /> Preparing secure payment</> : <>Pay ₹999 • இடத்தை உறுதி செய்யுங்கள் <ArrowRight /></>}</Button>
      <p className="form-note">Secure payment powered by Razorpay. Confirmation is automatic.</p>
    </form>
  );
}
