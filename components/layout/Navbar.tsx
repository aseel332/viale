"use client";

import { useState, useEffect } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Menu, X, ShoppingBag, Loader2 } from "lucide-react";
import Logo from "./Logo";

// Subtle, debounced spinner shown over a nav icon while its route loads.
// Prefetched routes skip the pending state entirely, so this only appears on
// slow networks where the loading.tsx shell hasn't arrived yet.
function NavPending() {
  const { pending } = useLinkStatus();
  return (
    <span aria-hidden className={`nav-pending ${pending ? "is-pending" : ""}`}>
      {pending && <Loader2 strokeWidth={2} />}
    </span>
  );
}

const navLinks = [
  { label: "All",         href: "/" },
  { label: "Collections", href: "/collections" },
  { label: "Men",         href: "/men" },
  { label: "Women",       href: "/women" },
];

interface NavbarProps {
  isSignedIn?: boolean;
  cartCount?:  number;
}

export default function Navbar({ isSignedIn = false, cartCount = 0 }: NavbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const pathname = usePathname();

  // Solid bg after hero scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on navigation
  useEffect(() => {
    const timer = window.setTimeout(() => setDrawerOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      {/* ── Main bar ─────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
          scrolled
            ? "bg-white/98 backdrop-blur-sm border-b border-[#E8E4DE] shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-5 py-4 md:px-10">

          {/* Mobile: hamburger left */}
          <button
            className="md:hidden p-1 -ml-1 text-[#111]"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>

          {/* Logo — centered on mobile, left on desktop */}
          <Link
            href="/"
            aria-label="Viale — home"
            className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
          >
            <Logo variant="dark" />
          </Link>

          {/* Desktop nav — center */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] tracking-[0.18em] uppercase font-medium transition-colors duration-200 ${
                  pathname === link.href
                    ? "text-[#111] border-b border-[#111] pb-px"
                    : "text-[#6B6B6B] hover:text-[#111]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons — larger tap targets + breathing room on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-1 -mr-2.5">
            <Link
              href="/search"
              aria-label="Search"
              className="relative inline-flex items-center justify-center p-2.5 text-[#111] hover:text-[#C9A86C] transition-colors"
            >
              <Search size={22} strokeWidth={1.5} />
              <NavPending />
            </Link>
            <Link
              href="/cart"
              aria-label="Shopping bag"
              className="relative inline-flex items-center justify-center p-2.5 text-[#111] hover:text-[#C9A86C] transition-colors"
            >
              <span className="relative inline-flex">
                <ShoppingBag size={22} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#C9A86C] text-[#111] text-[9px] font-bold flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </span>
              <NavPending />
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className="relative hidden md:inline-flex items-center justify-center p-2.5 transition-colors hover:text-[#C9A86C]"
            >
              <User
                size={22}
                strokeWidth={1.5}
                className={isSignedIn ? "text-[#C9A86C]" : "text-[#111]"}
              />
              <NavPending />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div className="absolute left-0 top-0 bottom-0 w-[80vw] max-w-xs bg-white flex flex-col animate-slide-in-left">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E4DE]">
              <Logo variant="dark" tagline={false} />
              <button onClick={() => setDrawerOpen(false)} aria-label="Close">
                <X size={22} strokeWidth={1.5} className="text-[#111]" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col px-6 py-6 gap-0">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-4 border-b border-[#F0EDE8] text-[11px] tracking-[0.18em] uppercase font-medium transition-colors ${
                    pathname === link.href ? "text-[#111]" : "text-[#6B6B6B] hover:text-[#111]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/search"
                className="py-4 border-b border-[#F0EDE8] text-[11px] tracking-[0.18em] uppercase font-medium text-[#6B6B6B] hover:text-[#111] transition-colors flex items-center gap-2"
              >
                <Search size={14} strokeWidth={1.5} />
                Search
              </Link>
              <Link
                href="/cart"
                className="py-4 border-b border-[#F0EDE8] text-[11px] tracking-[0.18em] uppercase font-medium text-[#6B6B6B] hover:text-[#111] transition-colors flex items-center gap-2"
              >
                <ShoppingBag size={14} strokeWidth={1.5} />
                Bag{cartCount > 0 ? ` (${cartCount})` : ""}
              </Link>
              <Link
                href="/account"
                className="py-4 text-[11px] tracking-[0.18em] uppercase font-medium text-[#6B6B6B] hover:text-[#111] transition-colors flex items-center gap-2"
              >
                <User size={14} strokeWidth={1.5} />
                {isSignedIn ? "My Account" : "Sign In"}
              </Link>
            </nav>

            {/* Footer trust note */}
            <div className="px-6 py-5 border-t border-[#E8E4DE]">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B]">
                100% Authentic Decants
              </p>
              <p className="text-[10px] text-[#6B6B6B] mt-1">© 2026 Viale</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
