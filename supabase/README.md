# Supabase workshop migration staging

This directory is deliberately separate from the existing Cloudflare D1 implementation and from every existing Crack SQL table.

## What is safe to do now

- Review the draft schema in `drafts/20261019_workshop_schema.sql`.
- Create three new, workshop-only Edge Functions: `workshop-create-order`, `workshop-verify-payment`, and `workshop-razorpay-webhook`.
- Test the draft against a Supabase development branch or separate staging project.

## What must not happen without an explicit production approval

- Applying the SQL to the live Crack SQL project.
- Deploying an Edge Function with live Razorpay secrets.
- Changing any existing Crack SQL table, RLS policy, function, payment flow, or user data.
- Pointing the public workshop checkout at the new endpoints.

## Promotion procedure

1. Create a Supabase CLI migration from the draft (`supabase migration new workshop_schema`).
2. Copy the reviewed SQL into that generated migration file; do not rename it manually.
3. Run it in a development branch or separate staging project.
4. Verify RLS, order idempotency, payment-signature rejection, webhook replay handling, and the existing Crack SQL regression checklist.
5. Obtain approval before applying the reviewed migration to production.

## Security model

The browser has no direct table privileges. Public registration reaches a narrowly scoped Edge Function that validates input, creates the Razorpay order server-side, and stores only the necessary registration data. Payment finalization happens only after server-side signature verification or a separately verified, idempotent Razorpay webhook. Service-role credentials and Razorpay secrets are server-side only and must never be committed or added to browser variables.
