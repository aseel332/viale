import Link from "next/link";
import Logo from "./Logo";

const shopLinks    = ["All", "Collections", "Men", "Women"];
const companyLinks = ["About", "Our Story", "Authenticity"];
const supportLinks = ["FAQ", "Shipping", "Returns", "Contact"];

export default function Footer({ fromPrice }: { fromPrice: string }) {
  return (
    <footer className="bg-[#111111] text-white mt-24">
      {/* Trust strip */}
      <div className="border-b border-white/10 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-4 w-max">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-8 px-12 text-[10px] tracking-[0.25em] uppercase text-white/50"
            >
              <span>100% Authentic</span>
              <span className="text-[#C9A86C]">·</span>
              <span>Try Before You Commit</span>
              <span className="text-[#C9A86C]">·</span>
              <span>Ships in 24 Hours</span>
              <span className="text-[#C9A86C]">·</span>
              <span>200+ Luxury Brands</span>
              <span className="text-[#C9A86C]">·</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-14 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-5">
              <Logo variant="light" />
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-[220px]">
              Discover luxury, one ml at a time. Premium decants from {fromPrice}.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-5">Shop</h4>
            <ul className="space-y-3">
              {shopLinks.map((label) => (
                <li key={label}>
                  <Link
                    href={label === "All" ? "/" : `/${label.toLowerCase()}`}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-5">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((label) => (
                <li key={label}>
                  <span className="text-sm text-white/70 cursor-pointer hover:text-white transition-colors">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-5">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((label) => (
                <li key={label}>
                  <span className="text-sm text-white/70 cursor-pointer hover:text-white transition-colors">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-white/30 tracking-wide">
            © 2026 Viale. All rights reserved. Decants sourced from authentic bottles.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-white/30">Privacy</span>
            <span className="text-[11px] text-white/30">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
