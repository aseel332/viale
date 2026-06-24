import PolicyPage from "@/components/legal/PolicyPage";
import { BUSINESS } from "@/lib/site";

export const metadata = { title: "About — Viale" };

export default function AboutPage() {
  return (
    <PolicyPage
      title="About Us"
      intro={`${BUSINESS.brand} makes luxury fragrance accessible, one millilitre at a time. We decant authentic, sealed designer and niche bottles into premium 5ml, 10ml and 30ml formats so you can discover what truly suits you before committing to a full bottle.`}
    >
      <section>
        <h2>Who we are</h2>
        <p>
          {BUSINESS.legalName} is an India-based fragrance decant studio. Every decant is poured from a
          genuine, sealed bottle sourced through authorised channels, and packaged with care for safe
          transit across the country.
        </p>
      </section>
      <section>
        <h2>Our promise</h2>
        <ul>
          <li>100% authentic fragrances — never imitations.</li>
          <li>Honest, transparent pricing with shipping partly subsidised by us.</li>
          <li>Reliable nationwide delivery in 4–10 days via trusted couriers.</li>
        </ul>
      </section>
      <section>
        <h2>Get in touch</h2>
        <p>
          Questions? Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call{" "}
          {BUSINESS.phone} ({BUSINESS.supportHours}).
        </p>
      </section>
    </PolicyPage>
  );
}
