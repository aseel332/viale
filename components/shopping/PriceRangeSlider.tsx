"use client";

interface Props {
  min:      number;
  max:      number;
  value:    [number, number];
  onChange: (val: [number, number]) => void;
  step?:    number;
}

export default function PriceRangeSlider({
  min, max, value, onChange, step = 1,
}: Props) {
  const [lo, hi] = value;

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const handleLo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), hi - step);
    onChange([v, hi]);
  };

  const handleHi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), lo + step);
    onChange([lo, v]);
  };

  const left  = pct(lo);
  const right = 100 - pct(hi);

  return (
    <div className="w-full select-none">
      {/* Current values */}
      <div className="flex justify-between mb-5">
        <div className="text-center">
          <p className="text-[9px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-0.5">From</p>
          <p className="text-sm font-semibold text-[#111]">${lo}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-0.5">To</p>
          <p className="text-sm font-semibold text-[#111]">${hi}</p>
        </div>
      </div>

      {/* Slider track + inputs */}
      <div className="relative h-5 flex items-center">
        {/* Background track */}
        <div className="absolute inset-x-0 h-[3px] bg-[#E8E4DE] rounded-full pointer-events-none">
          {/* Active range highlight */}
          <div
            className="absolute h-full bg-[#111] rounded-full"
            style={{ left: `${left}%`, right: `${right}%` }}
          />
        </div>

        {/* Low thumb input */}
        <input
          type="range"
          min={min} max={max} step={step}
          value={lo}
          onChange={handleLo}
          className="price-range-input"
          style={{ zIndex: lo > max - 5 ? 5 : 3 }}
          aria-label="Minimum price"
        />

        {/* High thumb input */}
        <input
          type="range"
          min={min} max={max} step={step}
          value={hi}
          onChange={handleHi}
          className="price-range-input"
          style={{ zIndex: 4 }}
          aria-label="Maximum price"
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[9px] text-[#6B6B6B]">${min}</span>
        <span className="text-[9px] text-[#6B6B6B]">${max}</span>
      </div>
    </div>
  );
}
