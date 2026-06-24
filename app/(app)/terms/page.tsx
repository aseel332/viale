import PolicyPage from "@/components/legal/PolicyPage";
import { BUSINESS } from "@/lib/site";

export const metadata = { title: "Terms & Conditions — Viale" };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      intro={`By using ${BUSINESS.brand} and placing an order, you agree to the terms below.`}
    >
      <section>
        <h2>Products</h2>
        <p>
          We sell decants poured from authentic, sealed fragrance bottles into 5ml, 10ml and 30ml
          formats. Product images are illustrative; decant bottles differ from the original retail
          packaging.
        </p>
      </section>
      <section>
        <h2>Pricing &amp; payment</h2>
        <p>
          All prices are in Indian Rupees (₹) and inclusive of applicable taxes unless stated otherwise.
          We accept online payments via Razorpay and Cash on Delivery where available. Orders are
          confirmed only after successful payment (for prepaid orders) or order placement (for COD).
        </p>
      </section>
      <section>
        <h2>Shipping &amp; delivery</h2>
        <p>
          Delivery timelines (typically 4–10 days) are estimates. Please review our{" "}
          <a href="/shipping-policy">Shipping Policy</a> and{" "}
          <a href="/refund-policy">Refund &amp; Cancellation Policy</a>.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          You agree not to misuse the site, attempt unauthorised access, or place fraudulent orders. We
          reserve the right to cancel orders we reasonably believe to be fraudulent.
        </p>
      </section>
      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the extent permitted by law, {BUSINESS.legalName}&apos;s liability for any order is limited to
          the amount paid for that order.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          {BUSINESS.legalName}, {BUSINESS.address}. Email{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> · {BUSINESS.phone}.
        </p>
      </section>
    </PolicyPage>
  );
}
