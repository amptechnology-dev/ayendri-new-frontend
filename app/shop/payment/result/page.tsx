"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import axiosInstance from "@/service/axios.service";
import { submitPayUPayment } from "../../checkout/payment";
import OrderSuccessModal from "../../components/order-success-modal";

const KEY = "ayendri:payOrder";

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

const errMsg = (e: unknown, fallback: string) => {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data;
    if (d?.errors?.[0]?.message) return d.errors[0].message as string;
    if (d?.message) return d.message as string;
    if (e.response) return `${fallback} (HTTP ${e.response.status})`;
    if (e.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (e.code === "ERR_NETWORK") return "Cannot reach the server. Please check your connection.";
  }
  return e instanceof Error ? e.message : fallback;
};

function Result() {
  const router = useRouter();
  const q = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [state, setState] = useState<"checking" | "paid" | "failed" | "error">("checking");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let id = q.get("orderId") ?? "";
    if (!id) {
      try {
        id = sessionStorage.getItem(KEY) ?? "";
      } catch {}
    }
    if (!id) {
      setMsg("We couldn't tell which order this payment was for. Please check your Orders page.");
      setState("error");
      return;
    }
    setOrderId(id);

    let dead = false;
    (async () => {
      try {
        let status = "";
        for (let n = 0; n < 4; n++) {
          const res = await axiosInstance.get(
            `/api/payment/verify/${encodeURIComponent(id)}`,
            noCreds,
          );
          const order = res.data?.order ?? res.data?.data?.order;
          status = order?.paymentStatus ?? "";
          if (status === "PAID" || status === "FAILED") break;
          await new Promise((r) => setTimeout(r, 2000));
        }
        if (dead) return;
        if (status === "PAID") {
          try {
            sessionStorage.removeItem(KEY);
          } catch {}
        }
        setState(status === "PAID" ? "paid" : "failed");
      } catch (e) {
        if (!dead) {
          setMsg(errMsg(e, "Could not confirm payment. Please check your Orders page."));
          setState("error");
        }
      }
    })();
    return () => {
      dead = true;
    };
  }, [q]);

  async function retry() {
    try {
      const r = await axiosInstance.post(
        `/api/payment/initiate/${encodeURIComponent(orderId)}`,
        {},
        noCreds,
      );
      const p = r.data?.data ?? r.data;
      if (!p?.paymentUrl || !p?.payuParams) {
        throw new Error(p?.message || "Unable to restart payment.");
      }
      try {
        sessionStorage.setItem(KEY, orderId);
      } catch {}
      submitPayUPayment(p.paymentUrl, p.payuParams);
    } catch (e) {
      setMsg(errMsg(e, "Could not restart payment."));
    }
  }

  if (state === "paid") {
    return (
      <OrderSuccessModal
        orderId={orderId}
        message="Payment successful. Your order has been placed."
        onView={() => router.replace("/shop/orders")}
        onContinue={() => router.replace("/shop")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[520px] space-y-4 px-6 py-20 text-center">
      {state === "checking" && (
        <h1 className="text-2xl font-black">Confirming your payment…</h1>
      )}
      {state === "failed" && (
        <>
          <h1 className="text-2xl font-black text-red-700">Payment not completed</h1>
          <p className="text-sm">
            Your order is saved. If money was deducted, please contact the store.
            Unpaid orders are cancelled after 30 minutes.
          </p>
          <button className="shop-gold-btn rounded-full px-6 py-3 font-bold" onClick={retry}>
            Retry payment
          </button>
          <button
            className="mx-auto block text-sm font-bold"
            onClick={() => router.replace("/shop/orders")}
          >
            View my orders
          </button>
        </>
      )}
      {state === "error" && (
        <>
          <p className="text-red-700">{msg}</p>
          <button
            className="shop-gold-btn rounded-full px-6 py-3 font-bold"
            onClick={() => router.replace("/shop/orders")}
          >
            View my orders
          </button>
        </>
      )}
      {state !== "checking" && state !== "error" && msg && (
        <p className="text-sm text-red-700">{msg}</p>
      )}
    </div>
  );
}

export default function PaymentResult() {
  return (
    <Suspense fallback={null}>
      <Result />
    </Suspense>
  );
}