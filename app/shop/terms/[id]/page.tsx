"use client";
import { use } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { htmlToBlocks, useTerms } from "../../terms-api";

export default function TermDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { terms, loading } = useTerms();
  const term = terms.find((t) => t._id === decodeURIComponent(id));

  return (
    <article className="shop-card flex-1 p-6">
      <div className="mb-3 flex items-center gap-1 text-xs text-[#9a7a7a]">
        <Link href="/shop" className="hover:underline">Home</Link>
        <ChevronRight size={12} />
        <Link href="/shop/terms" className="hover:underline">Terms and Conditions</Link>
        {term && (
          <>
            <ChevronRight size={12} />
            <span className="line-clamp-1">{term.title}</span>
          </>
        )}
      </div>

      {loading && <p className="py-10 text-center text-sm text-[#9a7a7a]">Loading…</p>}

      {!loading && !term && (
        <p className="py-10 text-center text-sm text-[#9a7a7a]">This section could not be found.</p>
      )}

      {term && (
        <div className="space-y-3">
          <h1 className="text-xl font-black text-[#4a0710]">{term.title}</h1>
          {htmlToBlocks(term.description).map((b, i) =>
            b.type === "space" ? (
              <div key={i} className="h-2.5" />
            ) : (
              <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-[#444]">
                {b.text}
              </p>
            ),
          )}
        </div>
      )}
    </article>
  );
}