"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Info, Minus, Plus, Trash2, Zap } from "lucide-react";
import { useAuth } from "../auth";
import { useCart } from "../cart";
import { inr } from "../data";
import {
  buildBill, deliveryDateText, hasTiers, imageUrl, isFastestDelivery, policyNotes, tierPriceFor,
  type Item, type Product,
} from "../cart-api";

const unitPrice = (i: Item) =>
  tierPriceFor(i.product, i.quantity || 1) ?? (typeof i.product.price === "number" ? i.product.price : 0);
const originalPrice = (i: Item) =>
  unitPrice(i) <= 0 ? 0
    : hasTiers(i.product) ? unitPrice(i) // tiered products have no real MRP discount
    : typeof i.product.originalPrice === "number" ? i.product.originalPrice
    : unitPrice(i);

export default function Cart() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const ready = useAuth((s) => s.ready);
  const { items, products, loading, changeQuantity, removeItem, addItem, applyPromo, promo, discount } = useCart();

  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestionIds, setSuggestionIds] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);
  // pick 3 products that are not in the cart, once
  useEffect(() => {
    if (suggestionIds.length || !products.length) return;
    const inCart = new Set(items.map((i) => i.id));
    setSuggestionIds(products.filter((p) => !inCart.has(p._id)).slice(0, 3).map((p) => p._id));
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !ready) return null;

  if (!token)
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-black text-[#4a0710]">Your cart is empty</h1>
        <p className="mt-2 text-sm text-[#9a7a7a]">Log in to see the items in your cart.</p>
        <Link href="/shop/login?next=/shop/cart" className="shop-gold-btn mt-6 inline-block rounded-full px-8 py-3">Log In</Link>
      </div>
    );

  if (loading && !items.length)
    return <div className="py-24 text-center text-sm text-[#9a7a7a]">Loading your cart…</div>;

  if (!items.length)
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-black text-[#4a0710]">Your cart is empty</h1>
        <p className="mt-2 text-sm text-[#9a7a7a]">Start adding some items!</p>
        <Link href="/" className="shop-gold-btn mt-6 inline-block rounded-full px-8 py-3">Continue shopping</Link>
      </div>
    );

  const listedOf = (i: Item) => products.find((p) => p._id === i.id);
  const subtotal = items.reduce((s, i) => s + unitPrice(i) * (i.quantity || 1), 0);
  const totalOriginal = items.reduce((s, i) => s + originalPrice(i) * (i.quantity || 1), 0);
  const totalDiscount = totalOriginal - subtotal;
  const bill = buildBill(
    items.map((i) => {
      const l = listedOf(i);
      return { unitPrice: unitPrice(i), quantity: i.quantity || 1, gst: i.product.gst ?? l?.gst, gstInclusive: Boolean(i.product.gstInclusive ?? l?.gstInclusive) };
    }),
  );
  const payable = Math.max(bill.total - discount, 0);
  const hasPending = items.some((i) => unitPrice(i) <= 0);
  const splitOrders = items.length > 1 && hasPending;
  const payableText = payable > 0 ? `${inr(payable)}${hasPending ? " + quote" : ""}` : "Price pending";

  const add = (p: Product) => addItem(p).catch((e) => alert(e.message));

  const checkout = async () => {
    const bad = items.filter((i) => i.isAvailable === false);
    if (bad.length) {
      if (!window.confirm("Some items in your cart are no longer available. Remove them and continue to checkout?")) return;
      const remaining = items.length - bad.length;
      for (const i of bad) await removeItem(i);
      if (remaining <= 0) return;
    }
    router.push("/shop/checkout");
  };

  const suggestions = suggestionIds.map((id) => products.find((p) => p._id === id)).filter(Boolean) as Product[];

  const Stepper = ({ item, small }: { item: Item; small?: boolean }) => (
    <div className="flex items-center gap-3">
      <button aria-label="Decrease quantity" onClick={() => (item.quantity > 1 ? changeQuantity(item, -1) : removeItem(item))}
        className={`grid place-items-center rounded-full border border-[#dcdcdc] ${small ? "h-6 w-6" : "h-8 w-8"}`}><Minus size={14} /></button>
      <span className="w-5 text-center font-bold">{item.quantity}</span>
      <button aria-label="Increase quantity" onClick={() => changeQuantity(item, 1)}
        className={`grid place-items-center rounded-full bg-[#1a1a1a] text-white ${small ? "h-6 w-6" : "h-8 w-8"}`}><Plus size={14} /></button>
    </div>
  );

  return (
    <div className="mx-auto grid w-full max-w-[1200px] min-w-0 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-8 lg:py-10">
      <div className="min-w-0 space-y-4">
        <h1 className="text-3xl font-black text-[#4a0710]">My Cart</h1>

        {splitOrders && (
          <div className="flex items-start gap-2 rounded-2xl bg-[#fff4dc] px-4 py-3 text-xs font-medium">
            <Info size={16} className="mt-0.5 shrink-0 text-[#b26a00]" />
            Your cart has an &quot;Order to know price&quot; item, so each product will be ordered separately (Cash on Delivery).
          </div>
        )}

        {items.map((item) => {
          const p = item.product;
          const l = listedOf(item);
          const dlv = l?.delivery;
          const fastest = isFastestDelivery(dlv, l);
          const na = item.isAvailable === false;
          const notes = policyNotes({ ...(l ?? {}), ...p });
          const img = imageUrl(p.image);
          return (
            <div key={item.lineId} className={`shop-card flex items-center gap-4 p-4 ${na ? "border border-[#ffcdd2] opacity-70" : ""}`}>
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#fff1da]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img} alt={p.title} className="h-full w-full object-contain" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{p.title}</span>
                  <button aria-label="Remove item" onClick={() => removeItem(item)} className="text-[#e53935]"><Trash2 size={18} /></button>
                </div>
                {!!item.variantLabel && <div className="text-[11px] font-semibold text-[#999]">{item.variantLabel}</div>}
                {na && <span className="mt-1 inline-block rounded bg-[#ffebee] px-2 py-0.5 text-[11px] font-bold text-[#d32f2f]">Out of Stock / Unavailable</span>}
                {!!notes.length && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {notes.map((n) => <span key={n} className="rounded bg-[#f1f7ee] px-1.5 py-0.5 text-[10px] font-semibold text-[#1b7f4b]">{n}</span>)}
                  </div>
                )}
                {fastest && !na && <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#b26a00]"><Zap size={12} /> Fastest delivery</div>}
                {!na && dlv && dlv.deliverable !== false && (
                  <div className="mt-1 text-xs text-[#999]">
                    {fastest ? "Fastest delivery by " : "Delivery by "}
                    <b className="text-[#1b7f4b]">{deliveryDateText(dlv, l?.deliveryTime)}</b>
                  </div>
                )}
                {!na && dlv?.deliverable === false && <div className="mt-1 text-xs text-[#e53935]">Not deliverable to your pincode</div>}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-[#7a1118]">
                    {unitPrice(item) > 0 ? inr(unitPrice(item)) : "Order to know Price"}
                    {originalPrice(item) > unitPrice(item) && <s className="ml-2 text-xs font-normal text-[#9a8080]">{inr(originalPrice(item))}</s>}
                  </span>
                  <Stepper item={item} />
                </div>
              </div>
            </div>
          );
        })}

        {suggestions.length > 0 && (
          <div className="shop-card p-4">
            <h2 className="mb-2 text-sm font-bold">You might also like this</h2>
            {suggestions.map((p, i) => {
              const off = typeof p.originalPrice === "number" && p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : null;
              const inCart = items.find((it) => it.id === p._id);
              return (
                <div key={p._id} className={`flex items-center gap-3 py-2 ${i < suggestions.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(p.image)} alt="" className="h-11 w-11 rounded-xl bg-[#fff1da] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.title}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <b>{p.price > 0 ? inr(p.price) : "Order to know Price"}</b>
                      {off !== null && <><s className="text-xs text-[#999]">{inr(p.originalPrice)}</s><span className="text-xs font-bold text-[#22a45d]">{off}% OFF</span></>}
                    </div>
                  </div>
                  {inCart ? <Stepper item={inCart} small /> : (
                    <button onClick={() => add(p)} className="rounded-full border border-[#edad78] px-4 py-1.5 text-xs font-extrabold text-[#edad78]">ADD</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {products.length > 0 && (
          <>
            <h2 className="pt-6 text-xl font-extrabold text-[#4a0710]">Keep exploring</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {products.slice(0, 8).map((p) => (
                <div key={p._id} className="w-[150px] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(p.image)} alt={p.title} className="aspect-square w-full rounded-2xl bg-[#fff1da] object-cover" />
                  <div className="mt-2 line-clamp-2 text-sm font-semibold">{p.title}</div>
                  <div className="text-sm font-extrabold">{p.price > 0 ? inr(p.price) : "Order to know Price"}</div>
                  <button onClick={() => add(p)} className="mt-1 rounded-full border border-[#edad78] px-4 py-1 text-xs font-extrabold text-[#edad78]">ADD</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <aside className="shop-card box-border h-fit w-full min-w-0 space-y-4 p-4 sm:p-6">
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter Promo Code" className="flex-1 rounded-full border border-[#e8cfa8] px-4 py-2.5 text-sm outline-none" />
          <button onClick={() => setMsg(applyPromo(code) ? "₹10 off applied" : "Invalid code")} className="shop-gold-btn rounded-full px-5 text-sm">Apply</button>
        </div>
        {(msg || promo) && <p className="text-xs font-semibold text-green-700">{msg || `${promo} applied`}</p>}

        <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between font-extrabold">
          Bill Details <span className="flex items-center gap-1">{payableText} <ChevronDown size={16} className={open ? "rotate-180" : ""} /></span>
        </button>
        {open && (
          <div className="space-y-2 text-sm">
            <Row l="Total item price" v={inr(totalOriginal)} />
            <Row l="Total discount" v={"-" + inr(totalDiscount)} green />
            {bill.totalGst > 0 && (
              <>
                <Row l="Subtotal (excl. GST)" v={inr(bill.subtotal)} />
                {bill.cgst > 0 && <Row l="CGST" v={inr(bill.cgst)} />}
                {bill.sgst > 0 && <Row l="SGST" v={inr(bill.sgst)} />}
                {bill.igst > 0 && <Row l="IGST" v={inr(bill.igst)} />}
              </>
            )}
            {discount > 0 && <Row l="Promo" v={"-" + inr(discount)} green />}
            <div className="flex justify-between border-t border-[#eaeaea] pt-3 font-extrabold"><span>Total payable</span><span>{payableText}</span></div>
          </div>
        )}

        {items.length > 1 && hasPending && <p className="text-center text-xs text-[#999]">Items will be placed as separate orders.</p>}
        <button onClick={checkout} className="shop-gold-btn w-full rounded-full py-3.5">Order Now</button>
      </aside>
    </div>
  );
}

const Row = ({ l, v, green }: { l: string; v: string; green?: boolean }) => (
  <div className={`flex justify-between ${green ? "text-green-700" : ""}`}><span>{l}</span><span>{v}</span></div>
);