# Deployment & Go‑Live Checklist

Most of the storefront is configured in code, but a few things **must be set in
the Supabase and Google dashboards** — they cannot be done from the repo. This
file lists every external step needed to make auth, email, payments and shipping
work in production.

> Code-side behaviour already implemented:
> - **Sign-up auto-login** — when email confirmation is **off**, sign-up returns
>   a session and the user is logged straight in (no "check your email" dead-end).
>   When confirmation is **on**, the confirmation link points at our own
>   `/auth/callback` (set via `emailRedirectTo`).
> - **Google OAuth** wiring (`signInWithGoogle` → `/auth/callback`) is complete;
>   it only needs the dashboard steps below.
> - **Buy Now** checks out the selected product only (never the whole cart).
> - **Checkout** uses the saved address book (select / edit / add) and shows the
>   recipient name + phone.
> - **Razorpay** is shown as a payment option. Until the keys below are set it
>   renders as **"Coming soon"** (display only) and Cash on Delivery is used.

---

## 1. Environment variables (`.env.local` / host env)

See `.env.local.example` for the full list. Currently set: Supabase URL + anon
key, OpenAI, Shiprocket. Still needed for full production:

| Variable | Needed for | Notes |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Razorpay **webhook** (`/api/webhooks/razorpay`) | Server-only. Never expose to the browser. |
| `RAZORPAY_KEY_ID` | Online payments | Until set, the Razorpay option is display-only. |
| `RAZORPAY_KEY_SECRET` | Online payments | Use `rzp_test_…` until the account is activated. |
| `RAZORPAY_WEBHOOK_SECRET` | Payment state source-of-truth | Point the webhook at `https://<domain>/api/webhooks/razorpay`. |

After setting `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`, the checkout option
automatically becomes selectable (`isRazorpayConfigured()` flips to `true`).

---

## 2. Supabase → Authentication

### 2a. Instant login on sign-up (the "directly log the user in" requirement)
**Dashboard → Authentication → Providers → Email** → turn **"Confirm email" OFF**.
With it off, sign-up establishes a session immediately and the user is redirected
to their destination. (If you keep it **on**, users must click the email link
first — the link now returns to our branded `/auth/callback`.)

### 2b. Branded confirmation / reset emails (not the default Supabase email)
The default mail comes from Supabase with no brand. To send mail as **Viale**:
1. **Authentication → Emails → SMTP Settings** → enable **Custom SMTP** and enter
   your provider (Resend, SendGrid, Postmark, Amazon SES, …). Set
   **Sender name = `Viale`** and **Sender email = `no-reply@yourdomain`**.
2. **Authentication → Emails → Templates** → edit *Confirm signup*, *Magic Link*,
   *Reset password* etc. with Viale branding/copy.
   - Without custom SMTP, Supabase's built-in mailer is rate-limited and
     unbranded — do **not** ship to real customers on it.

### 2c. URLs (required for OAuth + email links to land back on the site)
**Authentication → URL Configuration**:
- **Site URL**: `https://<your-production-domain>`
- **Redirect URLs** (add all that apply):
  - `https://<your-production-domain>/auth/callback`
  - `http://localhost:3000/auth/callback` (local dev)

---

## 3. Google OAuth (the "Google login not working" requirement)

The code is ready; enable the provider:

1. **Google Cloud Console** → APIs & Services → Credentials → **OAuth client ID**
   (type *Web application*).
   - **Authorized redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback`
     (find `<project-ref>` in your Supabase URL).
2. Copy the **Client ID** + **Client secret**.
3. **Supabase → Authentication → Providers → Google** → enable, paste the Client
   ID + secret, save.
4. Make sure the redirect URLs from **2c** are present, then test "Continue with
   Google".

---

## 4. Razorpay activation

`docs`/policy pages required for activation already exist (About, Contact,
Shipping, Refund, Privacy, Terms — all live and returning 200). To go live:
1. Activate the Razorpay account (submit business + the policy page URLs over HTTPS).
2. Set the three `RAZORPAY_*` env vars (section 1).
3. Create a webhook (**Settings → Webhooks**) → `https://<domain>/api/webhooks/razorpay`
   with events `payment.captured`, `payment.failed`, `refund.processed`, and set
   `RAZORPAY_WEBHOOK_SECRET` to its secret.

---

## 5. Database migrations

Migrations are run **by hand** in the Supabase SQL Editor (the app only holds the
anon key). Apply everything in `supabase/migrations/` in order — including the
newest:
- `010_size_pricing.sql`
- `011_checkout_fulfillment.sql` (payment + courier columns on `orders`)

---

## 6. Smoke test after configuring the above
1. Sign up with a fresh email → you should be logged in (2a) **or** receive a
   branded confirmation email (2b).
2. "Continue with Google" → returns signed-in to the app (section 3).
3. Open a product → **Buy Now** → checkout shows **only that product**; existing
   cart items are untouched.
4. In checkout, **select / edit / add** an address; confirm the recipient name +
   phone show in the order summary.
5. Place a **Cash on Delivery** order → success page shows order number + name.
6. (After Razorpay keys) repeat with **Pay online** and confirm capture +
   webhook updates the order to `paid`.
