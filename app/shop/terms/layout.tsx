"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTerms } from "../terms-api";

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  const { terms, loading, error, reload } = useTerms();
  const pathname = usePathname();

  return (
    <div className="mx-auto grid min-h-[420px] max-w-[1200px] items-stretch gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* ───────── LEFT: topics sidebar ───────── */}
      <aside className="shop-card max-h-64 overflow-y-auto py-3 lg:max-h-none">
        <h2 className="px-6 pb-2 pt-1 text-xs font-bold tracking-wide text-[#4a0710]">
          TERMS AND CONDITIONS
        </h2>

        {loading && <p className="px-6 py-4 text-sm text-[#9a7a7a]">Loading…</p>}

        {!!error && !loading && (
          <div className="mx-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            {error}
            <button onClick={() => void reload()} className="ml-2 font-bold underline">
              Try again
            </button>
          </div>
        )}

        <nav>
          {terms.map((t) => {
            const href = `/shop/terms/${encodeURIComponent(t._id)}`;
            const active = pathname === href || pathname === `/shop/terms/${t._id}`;
            return (
              <Link
                key={t._id}
                href={href}
                className={`block px-6 py-3 text-sm transition-colors ${
                  active
                    ? "bg-orange-50 font-bold text-[#9b4326]"
                    : "text-[#3a2a2a] hover:bg-[#fdf6ec]"
                }`}
              >
                {t.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ───────── RIGHT: list page or selected term ───────── */}
      <main className="flex min-w-0 flex-col">{children}</main>
    </div>
  );
}