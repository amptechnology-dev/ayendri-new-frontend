"use client";
import { Check } from "lucide-react";

type Props = {
  orderId?: string;
  message?: string;
  onView: () => void;
  onContinue: () => void;
};

export default function OrderSuccessModal({ orderId, message, onView, onContinue }: Props) {
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
    >
      <div className="max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-3xl bg-white px-6 py-10 text-center shadow-2xl">
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-green-100">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-green-600 text-white">
            <Check size={34} />
          </div>
        </div>
        <h2 id="order-success-title" className="mt-6 text-3xl font-black">
          Order placed!
        </h2>
        {orderId && <p className="mt-1 break-all font-bold text-[#e0622d]">Order #{orderId}</p>}
        <p className="mt-2 text-sm text-[#6b4a4a]">
          {message || "Your order has been placed successfully. We'll keep you updated on its status."}
        </p>
        <button
          onClick={onContinue}
          className="mt-8 block w-full rounded-full border-2 border-[#e0622d] py-3 font-bold text-[#e0622d]"
        >
          Continue Shopping
        </button>
        <button onClick={onView} className="shop-gold-btn mt-3 block w-full rounded-full py-3.5">
          View Order Status
        </button>
      </div>
    </div>
  );
}