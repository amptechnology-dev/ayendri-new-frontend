"use client";
import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { htmlToBlocks, useTerms } from "../../terms-api";

export default function TermDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { terms, loading } = useTerms();
  const term = terms.find((t) => t._id === decodeURIComponent(id));

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10">
      <Link href="/shop/terms" className="inline-flex items-center text-sm font-bold text-[#9b4326]">
        <ChevronLeft size={16} /> Terms and Conditions
      </Link>

      {loading && <p className="py-10 text-center text-sm text-[#9a7a7a]">Loading…</p>}

      {!loading && !term && (
        <p className="py-10 text-center text-sm text-[#9a7a7a]">This section could not be found.</p>
      )}

      {term && (
        <article className="shop-card mt-4 space-y-3 p-6">
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
        </article>
      )}
    </div>
  );
}