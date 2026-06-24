import PolicyPage from "@/components/legal/PolicyPage";
import { BUSINESS } from "@/lib/site";

export const metadata = { title: "Refund & Cancellation Policy — Viale" };

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund & Cancellation Policy"
      intro="Our commitment to fair returns, cancellations and refunds."
    >
      <section>
        <h2>Cancellations</h2>
        <p>
          You can cancel an order any time before it is shipped by contacting us at{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your order number. Once an order
          has been shipped it can no longer be cancelled, but you may follow the returns process below.
        </p>
      </section>
      <section>
        <h2>Returns &amp; eligibility</h2>
        <p>
          Because fragrances are personal-care items, we accept returns only for products that arrive
          damaged, defective, leaked, or incorrect. Report any such issue within{" "}
          <strong>48 hours of delivery</strong> with photos of the item and packaging.
        </p>
      </section>
      <section>
        <h2>Refunds</h2>
        <ul>
          <li>Approved refunds are issued to your original payment method.</li>
          <li>Online (Razorpay) payments are refunded within <strong>5–7 business days</strong> of approval.</li>
          <li>Cash on Delivery orders are refunded via bank transfer/UPI to details you provide.</li>
        </ul>
        <p>
          For damaged or incorrect items, we cover return shipping or arrange a replacement at no extra
          cost.
        </p>
      </section>
      <section>
        <h2>How to request</h2>
        <p>
          Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call {BUSINESS.phone} (
          {BUSINESS.supportHours}) with your order number and reason. We&apos;ll guide you through the rest.
        </p>
      </section>
    </PolicyPage>
  );
}
