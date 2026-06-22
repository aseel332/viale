import Link from "next/link";

interface CollectionCardProps {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  theme: "summer" | "winter" | "celebrity";
}

const themes = {
  summer: {
    wrapper:    "bg-gradient-to-br from-[#F7E4C0] via-[#F0D4A0] to-[#E8C888]",
    label:      "text-[#8A6A2A]",
    title:      "text-[#4A3010]",
    body:       "text-[#7A5A20]",
    btnBg:      "bg-[#4A3010] text-[#F7E4C0] hover:bg-[#2A1A04]",
    divider:    "bg-[#C9A86C]/30",
  },
  winter: {
    wrapper:    "bg-gradient-to-br from-[#D8E4EC] via-[#C4D4E0] to-[#B4C8D8]",
    label:      "text-[#3A5468]",
    title:      "text-[#1A2A38]",
    body:       "text-[#3A5468]",
    btnBg:      "bg-[#1A2A38] text-[#D8E4EC] hover:bg-[#0A1A28]",
    divider:    "bg-[#3A5468]/20",
  },
  celebrity: {
    wrapper:    "bg-gradient-to-br from-[#1A1A1A] via-[#252018] to-[#1A1814]",
    label:      "text-[#C9A86C]",
    title:      "text-white",
    body:       "text-white/60",
    btnBg:      "bg-[#C9A86C] text-[#111] hover:bg-[#E8D5A3]",
    divider:    "bg-[#C9A86C]/20",
  },
};

export default function CollectionCard({
  title,
  subtitle,
  description,
  href,
  theme,
}: CollectionCardProps) {
  const t = themes[theme];

  return (
    <Link href={href} className="block group relative overflow-hidden">
      <div
        className={`${t.wrapper} aspect-[3/4] md:aspect-[2/3] flex flex-col justify-end p-7 md:p-8 transition-transform duration-500 group-hover:scale-[1.02]`}
      >
        {/* Decorative circle */}
        <div
          className="absolute top-6 right-6 w-24 h-24 rounded-full opacity-10 border-2 border-current"
        />
        <div
          className="absolute top-16 right-10 w-10 h-10 rounded-full opacity-10 border border-current"
        />

        {/* Content */}
        <div>
          <p className={`${t.label} text-[9px] tracking-[0.3em] uppercase mb-3`}>
            {subtitle}
          </p>
          <div className={`w-8 h-px ${t.divider} mb-4`} />
          <h3
            className={`${t.title} text-2xl md:text-3xl font-[family-name:var(--font-cormorant)] font-medium italic leading-tight mb-3`}
          >
            {title}
          </h3>
          <p className={`${t.body} text-[13px] leading-relaxed mb-6 max-w-[200px]`}>
            {description}
          </p>
          <span
            className={`${t.btnBg} inline-block text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 transition-colors duration-200`}
          >
            Explore →
          </span>
        </div>
      </div>
    </Link>
  );
}
