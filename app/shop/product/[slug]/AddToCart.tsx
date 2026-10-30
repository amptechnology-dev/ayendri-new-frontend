"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { useCart } from "../../cart";
import { isValidBookingDate, parseApiDate } from "../../booking-date";

export default function AddToCart({
  slug,
  madeFor = false,
  bookingDate = "",
  compact = false,
}: {
  slug: string;
  madeFor?: boolean;
  bookingDate?: string; // "YYYY-MM-DD", empty when missing or invalid
  compact?: boolean; // sticky-bar version: no stepper, quantity 1
}) {
  const [q, setQ] = useState(1);
  const [error, setError] = useState("");
  const add = useCart((s) => s.add);
  const router = useRouter();

  useEffect(() => {
    if (bookingDate) setError("");
  }, [bookingDate]);

  const needsDate = madeFor && !bookingDate;

  const ensureBookingDate = () => {
    if (!madeFor) return true;
    if (!bookingDate) {
      setError("Please choose a booking date (from tomorrow onwards) to continue.");
      return false;
    }
    if (!isValidBookingDate(parseApiDate(bookingDate))) {
      setError("Same-day booking isn't available. Please pick a later date.");
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!ensureBookingDate()) return;
    setError("");
    await add(slug, q);
  };

  const handleBuyNow = async () => {
    if (!ensureBookingDate()) return;
    setError("");
    await add(slug, q);
    router.push(
      madeFor
        ? `/shop/cart?madeFor=true&bookingDate=${encodeURIComponent(bookingDate)}`
        : "/shop/cart",
    );
  };

  const pad = compact ? "px-5 py-2.5 text-sm" : "flex-1 py-3.5";
  const dim = needsDate ? "opacity-60" : "";

  return (
    <div className={compact ? "" : "mt-6"}>
      {!compact && (
        <div className="mb-4 flex items-center gap-4">
          <span className="font-bold text-[#4a0710]">Quantity</span>
          <div className="flex items-center overflow-hidden rounded-lg bg-[#7a1118] text-white">
            <button aria-label="Decrease quantity" onClick={() => setQ(Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center"><Minus size={16} /></button>
            <span className="grid h-9 w-12 place-items-center bg-white font-bold text-[#4a0710]">{q}</span>
            <button aria-label="Increase quantity" onClick={() => setQ(q + 1)} className="grid h-9 w-9 place-items-center"><Plus size={16} /></button>
          </div>
        </div>
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