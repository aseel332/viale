import PolicyPage from "@/components/legal/PolicyPage";
import { BUSINESS } from "@/lib/site";

export const metadata = { title: "Contact — Viale" };

export default function ContactPage() {
  return (
    <PolicyPage
      title="Contact Us"
      intro="We're here to help with orders, deliveries, returns and product questions."
    >
      <section>
        <h2>Customer support</h2>
        <ul>
          <li>Email: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></li>
          <li>Phone: <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a></li>
          <li>Hours: {BUSINESS.supportHours}</li>
        </ul>
      </section>
      <section>
        <h2>Registered address</h2>
        <p>
          {BUSINESS.legalName}
          <br />
          {BUSINESS.address}
        </p>
      </section>
      <section>
        <h2>Order help</h2>
        <p>
          For the fastest response, include your order number (e.g. #ABC12345) from your confirmation
          email. You can also track any order from your account under{" "}
          <a href="/account?tab=orders">Orders</a>.
        </p>
      </section>
    </PolicyPage>
  );
}
