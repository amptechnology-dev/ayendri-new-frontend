"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, ready, hydrate } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => { if (!ready) hydrate(); }, [ready, hydrate]);
  useEffect(() => {
    if (ready && !token) router.replace(`/shop/login?next=${encodeURIComponent(path)}`);
  }, [ready, token, path, router]);

  if (!ready || !token) {
    return <div className="grid min-h-[50vh] place-items-center text-sm text-[#9a7a7a]">Loading…</div>;
  }
  return <>{children}</>;
}