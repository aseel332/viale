// Typographic Viale wordmark — crisp, scalable, no background.
// Replaces the raster logo (which carried an opaque box that clashed on dark
// and scrolled surfaces). Drop a real asset back in later if desired.

interface LogoProps {
  variant?: "dark" | "light";
  tagline?: boolean;
  className?: string;
}

export default function Logo({ variant = "dark", tagline = true, className = "" }: LogoProps) {
  const word = variant === "light" ? "text-white" : "text-[#111]";
  const sub = variant === "light" ? "text-white/55" : "text-[#6B6B6B]";

  return (
    <span className={`inline-flex flex-col items-start leading-none select-none ${className}`}>
      <span className="relative">
        <span
          className={`font-[family-name:var(--font-cormorant)] italic font-medium tracking-tight text-[1.6rem] ${word}`}
        >
          Vialé
        </span>
        {/* Sparkle accent */}
        <span className="absolute -top-1 -right-2.5 text-[0.7rem] text-[#C9A86C] not-italic leading-none">
          ✦
        </span>
      </span>
      {tagline && (
        <span className={`text-[7px] tracking-[0.38em] uppercase mt-1 ${sub}`}>
          Luxury Decants
        </span>
      )}
    </span>
  );
}
