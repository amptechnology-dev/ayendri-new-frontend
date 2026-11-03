"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTerms } from "../terms-api";

export default function TermsIndex() {
  const { terms, loading, error } = useTerms();
  const router = useRouter();

  useEffect(() => {
    if (terms[0]?._id) {
      router.replace(`/shop/terms/${encodeURIComponent(terms[0]._id)}`);
    }
  }, [terms]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="shop-card flex-1 p-6">
      {loading && <p className="py-10 text-center text-sm text-[#9a7a7a]">Loading…</p>}
      {!loading && !error && terms.length === 0 && (
        <p className="py-10 text-center text-sm text-[#9a7a7a]">Nothing to show yet.</p>
      )}
    </div>
  );
}