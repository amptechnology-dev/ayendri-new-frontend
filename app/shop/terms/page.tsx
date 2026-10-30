"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTerms } from "../terms-api";

export default function TermsList() {
  const { terms, loading, error, reload } = useTerms();

  return (
    <div className="mx-auto max-w-[640px] space-y-3 px-6 py-10">
      <h1 className="text-2xl font-black text-[#4a0710]">Terms and Conditions</h1>

      {loading && <p className="py-10 text-center text-sm text-[#9a7a7a]">Loading…</p>}

      {!!error && !loading && (
        <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">
          {error}
          <button onClick={() => void reload()} className="ml-2 font-bold underline">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && terms.length === 0 && (
        <p className="py-10 text-center text-sm text-[#9a7a7a]">Nothing to show yet.</p>
      )}

      {terms.map((t) => (
        <Link
          key={t._id}
          href={`/shop/terms/${encodeURIComponent(t._id)}`}
          className="shop-card flex items-center justify-between p-4 font-bold"
        >
          {t.title}
          <ChevronRight size={16} className="text-[#9a7a7a]" />
        </Link>
      ))}
    </div>
  );
}