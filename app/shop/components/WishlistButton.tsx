"use client";
import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../auth";
import { useWishlist } from "../wishlist-store";

export default function WishlistButton({
  productId,
  size = 18,
  className = "",
}: {
  productId: string;
  size?: number;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuth((s) => s.token);
  const active = useWishlist((s) => s.ids.has(productId));
  const busy = useWishlist((s) => s.pending.has(productId));
  const toggle = useWishlist((s) => s.toggle);

  const onClick = async (e: React.MouseEvent) => {
    // the button often sits next to / over a product link
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      router.push(`/shop/login?next=${encodeURIComponent(pathname || "/shop")}`);
      return;
    }
    try {
      await toggle(productId);
    } catch {
      // state is already rolled back by the store
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      title={active ? "Remove from wishlist" : "Add to wishlist"}
      className={`grid place-items-center rounded-full bg-white/95 shadow-md transition hover:scale-110 active:scale-95 disabled:opacity-60 ${className}`}
    >
      <Heart
        size={size}
        className={active ? "fill-[#e0262d] text-[#e0262d]" : "text-[#7a1118]"}
      />
    </button>
  );
}