import "server-only";

// Centralised, fail-fast access to third-party integration secrets (Razorpay,
// Shiprocket). Getters throw a clear error only when actually used, so the app
// still boots (and COD / flat-rate fallbacks keep working) when an integration
// is left unconfigured.

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Set it in .env.local (see .env.local.example) or your hosting provider's env settings.`,
    );
  }
  return value;
}

// ── Razorpay ──────────────────────────────────────────────────────────────────
export const razorpayKeyId = () => required("RAZORPAY_KEY_ID", process.env.RAZORPAY_KEY_ID);
export const razorpayKeySecret = () => required("RAZORPAY_KEY_SECRET", process.env.RAZORPAY_KEY_SECRET);
export const razorpayWebhookSecret = () =>
  required("RAZORPAY_WEBHOOK_SECRET", process.env.RAZORPAY_WEBHOOK_SECRET);

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

// ── Shiprocket ────────────────────────────────────────────────────────────────
export const shiprocketEmail = () => required("SHIPROCKET_EMAIL", process.env.SHIPROCKET_EMAIL);
export const shiprocketPassword = () => required("SHIPROCKET_PASSWORD", process.env.SHIPROCKET_PASSWORD);
export const shiprocketPickupPincode = () =>
  required("SHIPROCKET_PICKUP_PINCODE", process.env.SHIPROCKET_PICKUP_PINCODE);
/** Nickname of the pickup location configured in the Shiprocket panel. */
export const shiprocketPickupLocation = () =>
  process.env.SHIPROCKET_PICKUP_LOCATION?.trim() || "Primary";

export function isShiprocketConfigured(): boolean {
  return Boolean(
    process.env.SHIPROCKET_EMAIL &&
      process.env.SHIPROCKET_PASSWORD &&
      process.env.SHIPROCKET_PICKUP_PINCODE,
  );
}
