"use client";
import { useState } from "react";
import {
  createOrderRequest,
  validateBank,
  type BankDetails,
  type RequestType,
} from "../order-requests";
type Props = {
  orderId: string;
  itemId?: string;
  productId: string;
  allowedTypes: RequestType[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};
const REASONS: Record<RequestType, string[]> = {
  RETURN: [
    "Product is damaged",
    "Product is defective",
    "Wrong product received",
    "Product does not match description",
    "Other",
  ],
  REPLACEMENT: [
    "Product is damaged",
    "Product is defective",
    "Wrong product received",
    "Wrong size or variant",
    "Other",
  ],
  REFUND: [
    "Order cancelled",
    "Product unavailable",
    "Product is damaged",
    "Refund requested for another reason",
    "Other",
  ],
};
const EMPTY_BANK: BankDetails = {
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
};
export default function OrderRequestSheet({
  orderId,
  itemId,
  productId,
  allowedTypes,
  onClose,
  onSuccess,
}: Props) {
  const [type, setType] = useState<RequestType>(allowedTypes[0] ?? "RETURN");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [bank, setBank] = useState<BankDetails>(EMPTY_BANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (!allowedTypes.includes(type)) {
      setError("This request type is not available for this item.");
      return;
    }
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    if (reason === "Other" && !description.trim()) {
      setError("Please describe your reason.");
      return;
    }
    if (type === "REFUND") {
      const bankError = validateBank(bank);
      if (bankError) {
        setError(bankError);
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      await createOrderRequest(orderId, {
        type,
        reason,
        itemId,
        productId,
        description: description.trim() || undefined,
        ...(type === "REFUND" ? { bankDetails: bank } : {}),
      });
      await onSuccess();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "Unable to submit your request. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 md:items-center md:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      {" "}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-request-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 md:rounded-3xl"
      >
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <h2
            id="order-request-title"
            className="text-xl font-black text-[#4a0710]"
          >
            {" "}
            Request {type.toLowerCase()}{" "}
          </h2>{" "}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-full border px-3 py-1.5 text-sm"
          >
            {" "}
            ✕{" "}
          </button>{" "}
        </div>{" "}
        {allowedTypes.length > 1 && (
          <div className="mt-5">
            {" "}
            <label className="mb-2 block text-sm font-bold">
              {" "}
              Request type{" "}
            </label>{" "}
            <div className="flex flex-wrap gap-2">
              {" "}
              {allowedTypes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setType(option);
                    setReason("");
                    setError("");
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-bold ${type === option ? "border-[#e0622d] bg-orange-50 text-[#9b4326]" : "border-[#e8cfa8]"}`}
                >
                  {" "}
                  {option.charAt(0) + option.slice(1).toLowerCase()}{" "}
                </button>
              ))}{" "}
            </div>{" "}
          </div>
        )}{" "}
        <div className="mt-5">
          {" "}
          <label className="mb-2 block text-sm font-bold">
            {" "}
            Reason *{" "}
          </label>{" "}
          <div className="space-y-2">
            {" "}
            {REASONS[type].map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#eee1d0] p-3 text-sm"
              >
                {" "}
                <input
                  type="radio"
                  name="request-reason"
                  value={option}
                  checked={reason === option}
                  onChange={() => setReason(option)}
                  className="accent-[#e0622d]"
                />{" "}
                {option}{" "}
              </label>
            ))}{" "}
          </div>{" "}
        </div>{" "}
        <div className="mt-4">
          {" "}
          <label className="mb-2 block text-sm font-bold">
            {" "}
            Additional details {reason === "Other" ? "*" : "(optional)"}{" "}
          </label>{" "}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explain your request..."
            className="h-24 w-full rounded-xl border border-[#e8cfa8] p-3 text-sm outline-none focus:border-[#e0622d]"
          />{" "}
        </div>{" "}
        {type === "REFUND" && (
          <div className="mt-5 space-y-3 rounded-2xl bg-[#fff7ec] p-4">
            {" "}
            <h3 className="font-extrabold">Bank details</h3>{" "}
            <p className="text-xs text-[#9a7a7a]">
              {" "}
              Enter the account details required by your store's refund
              process.{" "}
            </p>{" "}
            {(
              [
                ["accountHolderName", "Account holder name"],
                ["accountNumber", "Account number"],
                ["ifscCode", "IFSC code"],
                ["bankName", "Bank name"],
              ] as const
            ).map(([key, label]) => (
              <input
                key={key}
                value={bank[key]}
                onChange={(event) =>
                  setBank((current) => ({
                    ...current,
                    [key]:
                      key === "ifscCode"
                        ? event.target.value.toUpperCase()
                        : event.target.value,
                  }))
                }
                placeholder={label}
                autoComplete="off"
                className="w-full rounded-xl border border-[#e8cfa8] bg-white px-4 py-3 text-sm outline-none focus:border-[#e0622d]"
              />
            ))}{" "}
          </div>
        )}{" "}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {" "}
            {error}{" "}
          </p>
        )}{" "}
        <button
          type="button"
          onClick={submit}
          disabled={busy || allowedTypes.length === 0}
          className="shop-gold-btn mt-5 w-full rounded-full py-3 font-bold disabled:opacity-50"
        >
          {" "}
          {busy ? "Submitting..." : "Submit request"}{" "}
        </button>{" "}
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="mt-3 w-full py-2 text-sm font-bold text-[#9a7a7a]"
        >
          {" "}
          Go back{" "}
        </button>{" "}
      </section>{" "}
    </div>
  );
}
