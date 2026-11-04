"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

export default function Pagination({
  page,
  totalPages,
  onChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1) return null;

  const btn =
    "grid h-9 min-w-[36px] place-items-center rounded-full border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        className={`${btn} border-[#e8cfa8] text-[#9b4326] hover:bg-[#fff8ec]`}
      >
        <ChevronLeft size={16} />
      </button>

      {pageList(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-[#9a7a7a]">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            disabled={disabled || p === page}
            aria-current={p === page ? "page" : undefined}
            className={`${btn} ${
              p === page
                ? "border-[#a3161c] bg-[#a3161c] text-white disabled:opacity-100"
                : "border-[#e8cfa8] text-[#9b4326] hover:bg-[#fff8ec]"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
        className={`${btn} border-[#e8cfa8] text-[#9b4326] hover:bg-[#fff8ec]`}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}