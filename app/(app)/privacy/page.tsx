import PolicyPage from "@/components/legal/PolicyPage";
import { BUSINESS } from "@/lib/site";

export const metadata = { title: "Privacy Policy — Viale" };

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro={`${BUSINESS.legalName} ("we", "us") respects your privacy. This policy explains what we collect, why, and how we protect it.`}
    >
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>Account details: name, email, phone number.</li>
          <li>Order details: shipping address, items, and order history.</li>
          <li>Payment metadata processed by our payment partner (we never store full card numbers).</li>
          <li>Technical data such as device/browser information for security and performance.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          To process and deliver orders, provide customer support, send order updates, prevent fraud, and
          comply with legal obligations. We do not sell your personal information.
        </p>
      </section>
      <section>
        <h2>Payments</h2>
        <p>
          Online payments are processed securely by Razorpay. Card and banking details are handled by
          Razorpay under PCI-DSS standards and are never stored on our servers.
        </p>
      </section>
      <section>
        <h2>Sharing</h2>
        <p>
          We share data only with service providers who help us operate — for example our payment gateway
          (Razorpay) and shipping partner (Shiprocket and its couriers) — strictly to fulfil your order.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          You can access, correct or delete your account data, or ask questions about this policy, by
          emailing <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
        </p>
      </section>
    </PolicyPage>
  );
}
