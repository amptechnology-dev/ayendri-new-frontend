"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { useCart } from "../../cart";


export default function AddToCart({
  slug,
  madeFor = false,
  bookingDate = "",
  compact = false,
  maxQty,
  disabled = false,
}: {
  slug: string;
  madeFor?: boolean;
  bookingDate?: string;
  compact?: boolean;
  maxQty?: number;
  disabled?: boolean; // sticky-bar version: no stepper, quantity 1
}) {
  const [q, setQ] = useState(1);
  const [error, setError] = useState("");
  const add = useCart((s) => s.add);
  const router = useRouter();

  useEffect(() => {
    if (bookingDate) setError("");
  }, [bookingDate]);

  const needsDate = madeFor && !bookingDate;
  const atMax = maxQty !== undefined && q >= maxQty;
  const blocked = disabled || (maxQty !== undefined && maxQty <= 0);

  // if the available slots drop (e.g. user switches date), pull quantity down
  useEffect(() => {
    if (maxQty !== undefined && maxQty > 0 && q > maxQty) setQ(maxQty);
  }, [maxQty, q]);

   const ensureBookingDate = () => {
    if (!madeFor) return true;
    if (!bookingDate) {
      setError("Please choose an available booking date to continue.");
      return false;
    }
    return true; // the 4 PM rule is enforced by the backend
  };

  const handleAddToCart = async () => {
    if (blocked) return;
    if (!ensureBookingDate()) return;
    setError("");
    const msg = await add(slug, q);
    if (typeof msg === "string") setError(msg);
  };

  const handleBuyNow = async () => {
    if (blocked) return;
    if (!ensureBookingDate()) return;
    setError("");
    const msg = await add(slug, q);
    if (typeof msg === "string") {
      setError(msg);
      return;
    }
    router.push(
      madeFor
        ? `/shop/cart?madeFor=true&bookingDate=${encodeURIComponent(bookingDate)}`
        : "/shop/cart",
    );
  };


  const pad = compact ? "px-5 py-2.5 text-sm" : "flex-1 py-3.5";
  const dim = needsDate || blocked ? "opacity-60" : "";

  return (
    <div className={compact ? "" : "mt-6"}>
      {!compact && (
        <div className="mb-4 flex items-center gap-4">
          <span className="font-bold text-[#4a0710]">Quantity</span>
          <div className="flex items-center overflow-hidden rounded-lg bg-[#7a1118] text-white">
            <button aria-label="Decrease quantity" onClick={() => setQ(Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center"><Minus size={16} /></button>
            <span className="grid h-9 w-12 place-items-center bg-white font-bold text-[#4a0710]">{q}</span>
            <button aria-label="Increase quantity" disabled={atMax || blocked} onClick={() => setQ(maxQty !== undefined ? Math.min(q + 1, maxQty) : q + 1)} className="grid h-9 w-9 place-items-center disabled:opacity-40"><Plus size={16} /></button>
          </div>
        </div>
      )}

      {!compact && atMax && maxQty !== undefined && maxQty > 0 && (
        <p className="-mt-2 mb-3 text-xs font-semibold text-[#b26a00]">
          Maximum available: {maxQty}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          aria-disabled={needsDate}
          className={`rounded-full bg-[#7a1118] font-bold text-white ${pad} ${dim}`}
        >
          Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          aria-disabled={needsDate}
          className={`shop-gold-btn rounded-full font-bold ${pad} ${dim}`}
        >
          Buy Now
        </button>
      </div>

      {!compact && needsDate && !error && (
        <p className="mt-3 text-xs font-semibold text-[#b26a00]">
          📅 Select a booking date above to add this to your cart or buy now
        </p>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}