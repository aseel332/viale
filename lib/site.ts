// Central business details surfaced on the legal/policy pages required for
// Razorpay activation. Replace the placeholder values with your registered
// details before going live.

export const BUSINESS = {
  legalName: "Viale Fragrances",
  brand: "Viale",
  email: "support@viale.example",
  phone: "+91 00000 00000",
  address: "Replace with your registered business address, City, State, PIN",
  // Window within which order/return queries are handled.
  supportHours: "Mon–Sat, 10:00–18:00 IST",
} as const;

export const POLICY_LINKS: { label: string; href: string }[] = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund & Cancellation", href: "/refund-policy" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];
