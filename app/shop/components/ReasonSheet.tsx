"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { validateBank, type BankDetails } from "../order-requests";
import {
  ACTION_LABEL,
  CANCEL_REASONS,
  REQUEST_REASONS,
  type ActionKind,
} from "../order-actions";

export default function ReasonSheet({
  kind,
  itemName,
  needsBank,
  onClose,
  onSubmit,
}: {
  kind: ActionKind;
  itemName: string;
  needsBank: boolean;
  onClose: () => void;
  onSubmit: (reason: string, bank?: BankDetails) => Promise<void>;
}) {
  const reasons = kind === "CANCEL" ? CANCEL_REASONS : REQUEST_REASONS;
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [bank, setBank] = useState<BankDetails>({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const input =
    "mt-1 block w-full rounded-xl border border-[#e4cfae] bg-white px-3 py-2 text-sm outline-none focus:border-[#a3161c]";

  const submit = async () => {
    setErr("");
    const finalReason =
      kind === "CANCEL"
        ? details.trim() || reason
        : reason === "Other"
          ? details.trim()
          : reason;
    if (!reason) return setErr("Please choose a reason.");
    if (!finalReason) return setErr("Please add a few details.");
    if (needsBank) {
      const problem = validateBank(bank);
      if (problem) return setErr(problem);
    }
    setBusy(true);
    try {
      await onSubmit(finalReason, needsBank ? bank : undefined);
    } catch (e: any) {
      setErr(
        e?.response?.data?.errors?.[0]?.message ??
          e?.response?.data?.message ??
          e?.message ??
          "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-black/50 md:place-items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 md:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">
              {kind === "CANCEL" ? "Cancel order" : `${ACTION_LABEL[kind]} request`}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-[#9a7a7a]">{itemName}</p>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <p className="mt-4 text-sm font-bold">Reason *</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                reason === r ? "border-[#e0622d] bg-orange-50 font-bold" : ""
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={
            reason === "Other" && kind !== "CANCEL"
              ? "Tell us what went wrong *"
              : "Additional details (optional)"
          }
          className="mt-3 h-20 w-full rounded-xl border p-3 text-sm"
        />

        {needsBank && (
          <div className="mt-4 space-y-3 rounded-2xl bg-[#fff7ec] p-4">
            <p className="text-sm font-bold">Where should we send your refund?</p>
            <label className="block text-xs font-bold text-[#4a0710]">
              Account holder name
              <input className={input} value={bank.accountHolderName} onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })} />
            </label>
            <label className="block text-xs font-bold text-[#4a0710]">
              Account number
              <input className={input} inputMode="numeric" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, "") })} />
            </label>
            <label className="block text-xs font-bold text-[#4a0710]">
              IFSC code
              <input className={input} value={bank.ifscCode} onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase() })} />
            </label>
            <label className="block text-xs font-bold text-[#4a0710]">
              Bank name
              <input className={input} value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
            </label>
          </div>
        )}

        {err && <p className="mt-3 text-sm font-semibold text-red-600">{err}</p>}

        <button
          disabled={busy}
          onClick={() => void submit()}
          className="shop-gold-btn mt-4 w-full rounded-full py-3 disabled:opacity-50"
        >
          {busy ? "Please wait…" : kind === "CANCEL" ? "CONFIRM CANCELLATION" : "SUBMIT REQUEST"}
        </button>
      </div>
    </div>
  );
}