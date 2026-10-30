"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Heart,
  LogOut,
  Mail,
  Phone,
  ShoppingBag,
  User,
} from "lucide-react";
import { useShop } from "../shop-data";
import { useAuth } from "../auth";
import ProfileForm from "../components/ProfileForm";
import ProductCard from "../components/ProductCard";
import PageArt from "../components/PageArt";

export default function Profile() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const products = useShop((s) => s.products);
  const [editing, setEditing] = useState(false); // keep above the early return
  if (!user) return null; // RequireAuth redirects to login

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // update the logged-in user in the store so the name/phone change everywhere
  const handleUpdated = ({ name, phone }: { name: string; phone: string }) => {
    useAuth.setState((s: any) => ({
      user: s.user ? { ...s.user, name, phone: phone || s.user.phone } : s.user,
    }));
  };

  const handleLogout = () => {
    signOut();
    router.replace("/shop");
  };

  const rowBase =
    "flex w-full items-center gap-4 border-t border-[#e5e7eb] px-6 py-5 text-left";

  return (
    <main className="relative isolate min-h-screen bg-[#e5e7eb] px-4 py-8 md:px-8">
      <PageArt />
      <div className="mx-auto grid max-w-[1240px] gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        {/* Left sidebar */}
        <aside className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="p-5 pb-0">
            <div className="rounded-xl border border-[#e5e7eb] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-[#1f2430]">Hey, {user.name}</p>
                  {user.phone && (
                    <p className="mt-1 truncate text-sm text-[#3c4150]">Logged with {user.phone}</p>
                  )}
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1a56db] text-xl font-bold text-white">
                  {initials}
                </span>
              </div>
            </div>
          </div>

          <p className="px-6 pb-3 pt-8 text-lg font-semibold text-[#1f2430]">Account</p>

          <nav>
            {/* My Profile: opens the edit form on the right */}
            <button
              onClick={() => setEditing(true)}
              className={`${rowBase} ${editing ? "bg-[#ececef]" : "bg-white hover:bg-[#f6f6f8]"}`}
            >
              <User size={22} className="shrink-0 text-[#1f2430]" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium text-[#1f2430]">My Profile</span>
                <span className="block text-sm text-[#3c4150]">Edit your personal details</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-[#1f2430]" />
            </button>

            <Link href="/shop/orders" className={`${rowBase} bg-white hover:bg-[#f6f6f8]`}>
              <ShoppingBag size={22} className="shrink-0 text-[#1f2430]" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium text-[#1f2430]">My Orders</span>
                <span className="block text-sm text-[#3c4150]">Track your recent purchases</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-[#1f2430]" />
            </Link>

            <Link href="/shop/wishlist" className={`${rowBase} bg-white hover:bg-[#f6f6f8]`}>
              <Heart size={22} className="shrink-0 text-[#1f2430]" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium text-[#1f2430]">Wishlist</span>
                <span className="block text-sm text-[#3c4150]">Products you have saved</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-[#1f2430]" />
            </Link>

            <Link href="/shop/terms" className={`${rowBase} bg-white hover:bg-[#f6f6f8]`}>
              <FileText size={22} className="shrink-0 text-[#1f2430]" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium text-[#1f2430]">Terms and Conditions</span>
                <span className="block text-sm text-[#3c4150]">Read our policies</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-[#1f2430]" />
            </Link>
          </nav>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 border-t border-[#e5e7eb] px-6 py-8 text-left text-lg font-medium text-[#c8161d]"
          >
            <LogOut size={22} />
            Logout
          </button>
        </aside>

        {/* Right panel */}
        <section className="min-h-[500px] rounded-xl bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-[#1f2430]">My Profile</h1>
            <Link
              href="/shop/wishlist"
              aria-label="Open wishlist"
              className="rounded-full p-2 transition-colors hover:bg-[#f7a04b]/10"
            >
              <Heart size={24} className="text-[#D5684A]" />
            </Link>
          </div>

          {/* Details card */}
          <div className="mt-6 flex overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8f9fb]">
            <div className="grid w-28 shrink-0 place-items-center bg-[#e5e7eb] sm:w-32">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f7a04b] text-xl font-black text-white">
                {initials}
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 p-5">
              <p className="truncate text-lg font-semibold text-[#1f2430]">{user.name}</p>
              {user.phone && (
                <p className="flex items-center gap-2 text-sm text-[#3c4150]">
                  <Phone size={14} className="shrink-0" /> {user.phone}
                </p>
              )}
              {user.email && (
                <p className="flex items-center gap-2 truncate text-sm text-[#3c4150]">
                  <Mail size={14} className="shrink-0" /> {user.email}
                </p>
              )}
              <button
                onClick={() => setEditing((v) => !v)}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#1a56db]"
              >
                {editing ? "Close" : "Edit profile"}
                {editing ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>

          {editing && (
            <div className="mt-5 rounded-lg border border-[#e5e7eb] bg-white p-4 md:p-5">
              <ProfileForm user={user} onUpdated={handleUpdated} />
            </div>
          )}
        </section>
      </div>

      {/* You May Also Like: full-width row under both panels */}
      {products.length > 0 && (
        <section className="mx-auto mt-8 max-w-[1240px]">
          <h2 className="text-xl font-semibold text-[#1f2430]">You May Also Like</h2>
          <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-4">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}