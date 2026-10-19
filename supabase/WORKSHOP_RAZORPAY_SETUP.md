# Workshop Razorpay setup

These functions use separate Workshop Razorpay secrets. Never replace Crack SQL Razorpay settings.

In Supabase Edge Functions, add WORKSHOP_RAZORPAY_KEY_ID, WORKSHOP_RAZORPAY_KEY_SECRET, RAZORPAY_WORKSHOP_WEBHOOK_SECRET, and WORKSHOP_ALLOWED_ORIGIN.

Use this test webhook URL in Razorpay Test Mode:
https://qklnaqfspvmnlequqagf.supabase.co/functions/v1/workshop-razorpay-webhook

Use payment.captured and payment.failed events. The URL saved in the Razorpay business profile does not connect checkout to Supabase; these secrets and webhook are required.
