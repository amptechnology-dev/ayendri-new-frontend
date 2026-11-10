"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { shopApi, errMsg } from "../../auth";
import { useCart } from "../../cart";
import {
  clearPending, loadPending, savePending,
  startSessionPayment, verifySession, moveBuyNowToCart,
} from "../../checkout/payment";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Phase = "checking" | "paid" | "next" | "failed" | "refund" | "error";

function Result() {
  const params = useSearchParams();
  const cart = useCart();
  const ran = useRef(false);
  const [phase, setPhase] = useState<Phase>("checking");
  const [msg, setMsg] = useState("");
  const [nextId, setNextId] = useState("");


  async function run() {
    setPhase("checking");
    const pending = loadPending();
    const sid = params.get("sessionId") || pending?.sessionIds[0] || "";

    if (!sid) { setMsg("No payment found."); setPhase("failed"); return; }

    try {
      let v = await verifySession(sid);
      // paid but order not created yet: poll briefly
      for (let i = 0; i < 3 && v.status === "PAID" && !v.order; i++) {
        await sleep(3000);
        v = await verifySession(sid);
      }

      if (v.status === "PAID") {
        const rest = (pending?.sessionIds ?? []).filter((id) => id !== sid);
        if (rest.length) {
          savePending({ ...pending!, sessionIds: rest });
          setNextId(rest[0]);
          setPhase("next");
          return;
        }
        clearPending();
        try { await shopApi.delete("/api/cart"); } catch {}
        cart.clear();
        setPhase("paid");
        return;
      }

      if (v.status === "REFUND_REQUIRED") {
        clearPending();
        setPhase("refund");
        return;
      }

      // PENDING / EXPIRED = payment was not completed
      if (pending?.source === "BUY_NOW" && pending.buyNow) {
        await moveBuyNowToCart(pending.buyNow).catch(() => {});
        setMsg("Payment was not completed. The item has been moved to your cart.");
      } else {
        setMsg("Payment was not completed. Your items are still in your cart.");
      }
      clearPending();
      setPhase("failed");
    } catch (e) {
      setMsg(errMsg(e, "We could not confirm your payment."));
      setPhase("error"); // do NOT clear anything here
    }
  }

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      {phase === "checking" && <p className="font-bold">Confirming your payment…</p>}
      {phase === "paid" && (<>
        <h1 className="text-2xl font-black">Payment successful 🎉</h1>
        <Link href="/shop/orders" className="shop-gold-btn mt-5 inline-block rounded-full px-6 py-3">View orders</Link>
      </>)}
      {phase === "next" && (<>
        <h1 className="text-xl font-black">Payment 1 done</h1>
        <p className="mt-2 text-sm">Your cart has items from another store. Pay for them next.</p>
        <button onClick={() => startSessionPayment(nextId)} className="shop-gold-btn mt-5 rounded-full px-6 py-3">Continue to next payment</button>
      </>)}
      {phase === "failed" && (<>
        <h1 className="text-xl font-black">Payment unsuccessful</h1>
        <p className="mt-2 text-sm">{msg}</p>
        <Link href="/shop/cart" className="shop-gold-btn mt-5 inline-block rounded-full px-6 py-3">Go to cart</Link>
      </>)}
      {phase === "refund" && (<>
        <h1 className="text-xl font-black">Payment received, order not created</h1>
        <p className="mt-2 text-sm">Your money was deducted. A refund will be issued.</p>
      </>)}
      {phase === "error" && (<>
        <p className="text-sm text-red-600">{msg}</p>
        <p className="mt-1 text-xs">Please do not pay again. Check again or look in your Orders.</p>
        <button onClick={() => { ran.current = true; void run(); }} className="mt-4 rounded-full border px-5 py-2 font-bold">Check again</button>
      </>)}
    </div>
  );
}

export default function PaymentResult() {
  return <Suspense fallback={null}><Result /></Suspense>;
}