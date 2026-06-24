import type { ReactNode } from "react";

export default function PolicyPage({
  title,
  intro,
  updated = "June 2026",
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-24">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">Viale</p>
        <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] mb-3">
          {title}
        </h1>
        <p className="text-[12px] text-[#9A9A9A] mb-8">Last updated: {updated}</p>
        {intro && <p className="text-[15px] text-[#4A4A4A] leading-relaxed mb-8">{intro}</p>}
        <div className="policy-body space-y-6 text-[14px] text-[#4A4A4A] leading-relaxed [&_h2]:text-[#111] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_a]:text-[#111] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}
