import PolicyPage from "@/components/legal/PolicyPage";
import { BUSINESS } from "@/lib/site";

export const metadata = { title: "Shipping Policy — Viale" };

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      title="Shipping Policy"
      intro="How and when your Viale order reaches you."
    >
      <section>
        <h2>Delivery timelines</h2>
        <p>
          Orders are dispatched within 1–2 business days and typically delivered within{" "}
          <strong>4–10 days</strong>, depending on your location. Estimated delivery times are shown at
          checkout based on your pincode and the selected courier.
        </p>
      </section>
      <section>
        <h2>Shipping charges</h2>
        <p>
          Shipping is calculated live using our courier partners. {BUSINESS.brand} subsidises 50% of the
          cheapest available courier rate, so you only pay half. Orders above ₹2,999 ship free.
        </p>
      </section>
      <section>
        <h2>Serviceable areas</h2>
        <p>
          We currently ship across India only. If your pincode isn&apos;t serviceable, you&apos;ll be
          notified at checkout. We support both prepaid (online) and Cash on Delivery, subject to courier
          availability at your location.
        </p>
      </section>
      <section>
        <h2>Tracking</h2>
        <p>
          Once shipped, your tracking link and AWB number appear on your order page under{" "}
          <a href="/account?tab=orders">My Orders</a>, and we email you updates as your order progresses.
        </p>
      </section>
      <section>
        <h2>Questions</h2>
        <p>
          Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call {BUSINESS.phone}.
        </p>
      </section>
    </PolicyPage>
  );
}
