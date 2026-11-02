"use client";
import { useState } from "react";
import { Star } from "lucide-react";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
export const ratingLabel = (v: number) => LABELS[Math.ceil(v)] ?? "";

/* Display: 4.5, 3.7 (jekono fraction) shothik bhabe fill hoy */
export function StarsDisplay({
  value,
  size = 14,
}: {
  value: number;
  size?: number;
}) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <span
      className="relative inline-flex align-middle"
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      <span className="flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} className="text-[#e4cfae]" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={size}
            className="shrink-0 fill-[#f2b632] text-[#f2b632]"
          />
        ))}
      </span>
    </span>
  );
}

/* Input: proti star er bam half = x.5, dan half = full. Keyboard (<- ->) o cholbe */
export function StarInput({
  value,
  onChange,
  size = 34,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="relative inline-flex"
        role="slider"
        tabIndex={0}
        aria-label="Your rating"
        aria-valuemin={0.5}
        aria-valuemax={5}
        aria-valuenow={value || 0}
        onMouseLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.min(5, (value || 0) + 0.5));
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(0.5, (value || 1) - 0.5));
          }
        }}
      >
        <StarsDisplay value={shown} size={size} />
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }, (_, k) => {
            const v = (k + 1) / 2;
            return (
              <button
                key={k}
                type="button"
                aria-label={`${v} stars`}
                className="h-full flex-1 cursor-pointer"
                onMouseEnter={() => setHover(v)}
                onClick={() => onChange(v)}
              />
            );
          })}
        </div>
      </div>
      <span className="text-sm font-bold text-[#4a0710]">
        {shown ? `${shown.toFixed(1)} · ${ratingLabel(shown)}` : "Tap a star"}
      </span>
    </div>
  );
}