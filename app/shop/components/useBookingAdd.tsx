"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { fetchAvailability } from "../api";
import { useCart, mergeCartSelection } from "../cart";
import {
  formatBookingDate, getMinBookingDate, isValidBookingDate,
  parseApiDate, toApiDate,
} from "../booking-date";

type AnyProduct = { slug: string; name: string; raw?: any };

const isService = (p?: AnyProduct) =>
  String(p?.raw?.productType ?? "").toUpperCase() === "SERVICE";
export const productNeedsBooking = (p: AnyProduct) =>
  isService(p) || Boolean(p.raw?.isMadeForProduct);

export function useBookingAdd(): {
  add: (p: AnyProduct, qty?: number, onAdded?: () => void) => void;
  modal: ReactNode;
} {
  const addToCart = useCart((s) => s.add);
  const [target, setTarget] = useState<{ p: AnyProduct; qty: number; onAdded?: () => void } | null>(null);
  const [date, setDate] = useState("");
  const [avail, setAvail] = useState<any>(null);

  useEffect(() => {
    const id = target?.p.raw?._id;
    if (!target || !isService(target.p) || !id) { setAvail(null); return; }
    let active = true;
    fetchAvailability(id)
      .then((r: any) => { if (active && r?.success) setAvail(r); })
      .catch(() => { if (active) setAvail(null); });
    return () => { active = false; };
  }, [target]);

  const close = () => { setTarget(null); setDate(""); setAvail(null); };

  const add = (p: AnyProduct, qty = 1, onAdded?: () => void) => {
    if (!productNeedsBooking(p)) {
      addToCart(p.slug, qty);
      onAdded?.();
      return;
    }
    setDate("");
    setTarget({ p, qty, onAdded });
  };

  const minDate = toApiDate(getMinBookingDate());
  const limit = avail?.limited ? Number(avail.dailyBookingLimit) || 0 : 0;
  const days: any[] = Array.isArray(avail?.days) ? avail.days : [];
  const parsed = parseApiDate(date);
  const full = Boolean(days.find((d) => d.date === date)?.full);
  const valid = Boolean(date) && isValidBookingDate(parsed) && !full;

  const confirm = async () => {
    if (!target || !valid) return;
    const { p, qty, onAdded } = target;
    mergeCartSelection(p.slug, { bookingDate: date });
    close();
    await addToCart(p.slug, qty);
    onAdded?.();
  };

  const modal =
    target && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" onClick={close}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-[#4a0710]">Select booking date</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[#6b4a4a]">{target.p.name}</p>
                </div>
                <button onClick={close} aria-label="Close"><X size={18} /></button>
              </div>

              <input
                type="date"
                value={date}
                min={minDate}
                onChange={(e) => setDate(e.target.value)}
                className="mt-4 block w-full rounded-xl border border-[#e4cfae] px-3 py-2 text-sm outline-none focus:border-[#a3161c]"
              />

              {limit > 0 && days.length > 0 && (
                <div className="mt-3 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#4a0710]">Choose a date</span>
                    <span className="text-[#9a7a7a]">{limit} bookings / day · swipe →</span>
                  </div>
                  <div className="-mx-1 mt-2 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
                    {days
                      .filter((d) => d.date >= minDate)
                      .map((d) => {
                        const dt = new Date(`${d.date}T00:00:00Z`);
                        const sel = date === d.date;
                        const low = !d.full && d.remaining <= Math.max(2, Math.ceil(limit * 0.2));
                        const part = (o: Intl.DateTimeFormatOptions) =>
                          dt.toLocaleDateString("en-IN", { ...o, timeZone: "UTC" });
                        return (
                          <button
                            key={d.date}
                            type="button"
                            disabled={d.full}
                            onClick={() => setDate(d.date)}
                            className={`flex w-[68px] shrink-0 snap-start flex-col items-center rounded-2xl border-2 px-2 py-2 transition ${
                              sel
                                ? "border-[#a3161c] bg-[#a3161c] text-white shadow-md"
                                : d.full
                                  ? "border-[#eee] bg-[#f5f5f5] text-[#b5b5b5]"
                                  : "border-[#e4cfae] bg-white text-[#4a0710] hover:border-[#a3161c]"
                            }`}
                          >
                            <span className="text-[10px] font-semibold uppercase opacity-80">{part({ weekday: "short" })}</span>
                            <span className="text-xl font-black leading-tight">{part({ day: "numeric" })}</span>
                            <span className="text-[10px] font-semibold uppercase opacity-80">{part({ month: "short" })}</span>
                            <span
                              className={`mt-1 text-[10px] font-bold ${
                                sel ? "text-white" : d.full ? "text-red-400" : low ? "text-[#b26a00]" : "text-green-700"
                              }`}
                            >
                              {d.full ? "Full" : `${d.remaining} left`}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {full && <p className="mt-2 text-xs font-semibold text-red-600">This date is fully booked. Please choose another.</p>}
              {date && !valid && !full && <p className="mt-2 text-xs font-semibold text-red-600">Same-day booking isn&apos;t available. Pick a later date.</p>}
              {valid && <p className="mt-2 text-xs text-[#6b4a4a]">Booking for {formatBookingDate(parsed)}</p>}

              <button
                disabled={!valid}
                onClick={confirm}
                className="mt-4 w-full rounded-full bg-[#a3161c] py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add to cart
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return { add, modal };
}