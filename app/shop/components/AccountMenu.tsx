"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, LogOut, User, UserRound } from "lucide-react";
import { useAuth } from "../auth";

export default function AccountMenu() {
  const { user, token, hydrate, signOut } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, []);

  const next = encodeURIComponent(path.startsWith("/shop") ? path : "/shop");

  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Account" aria-expanded={open}>
        <User size={22} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+14px)] z-50 w-72 rounded-2xl bg-white p-4 text-[#2a0a0d] shadow-2xl">
          {token && user ? (
            <>
              <div className="flex items-center gap-3 border-b border-[#f0dcc0] pb-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#f7a04b] font-black text-white">
                  {user.name.trim()[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <b className="block truncate text-sm">{user.name}</b>
                  <span className="block truncate text-xs text-[#9a7a7a]">{user.email}</span>
                </div>
              </div>
              <Link href="/shop/profile" className="mt-2 flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold hover:bg-[#f6efe6]"><UserRound size={16} /> My Profile</Link>
              <Link href="/shop/orders" className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold hover:bg-[#f6efe6]"><ClipboardList size={16} /> My Orders</Link>
              <button
                onClick={() => { signOut(); setOpen(false); router.replace("/shop"); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold text-[#a3161c] hover:bg-[#f6efe6]"
              >
                <LogOut size={16} /> Log out
              </button>
            </>
          ) : (
            <>
              <b className="block text-base">Welcome to Ayendri</b>
              <p className="mt-1 text-xs text-[#9a7a7a]">Log in or create an account to track orders and check out faster.</p>
              <Link href={`/shop/login?next=${next}`} className="mt-4 grid h-11 place-items-center rounded-xl bg-[#7a1118] text-sm font-bold text-white">Log In</Link>
              <Link href={`/shop/register?next=${next}`} className="mt-2 grid h-11 place-items-center rounded-xl border border-[#7a1118] text-sm font-bold text-[#7a1118]">Create Account</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}