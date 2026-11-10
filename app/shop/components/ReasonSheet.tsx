"use client";
import { useRef, useState } from "react";
import { X, Paperclip } from "lucide-react";
import {
  validateBank,
  validateUpi,
  type BankAccountDetails,
  type BankDetails,
} from "../order-requests";
import {
  ACTION_LABEL,
  CANCEL_REASONS,
  REQUEST_REASONS,
  LATE_REASON,
  EVIDENCE_MAX_FILES,
  EVIDENCE_IMAGE_MB,
  EVIDENCE_VIDEO_MB,
  type ActionKind,
} from "../order-actions";

export default function ReasonSheet({
  kind,
  itemName,
  needsBank,
  onClose,
  onSubmit,
  allowLate = true,
}: {
  kind: ActionKind;
  itemName: string;
  needsBank: boolean;
  onClose: () => void;
  onSubmit: (
    reason: string,
    bank?: BankDetails,
    extra?: { category: string; details: string; files: File[] },
  ) => Promise<void>;
  allowLate?: boolean;
}) {
  const reasons = kind === "CANCEL" ? CANCEL_REASONS : REQUEST_REASONS;
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"BANK" | "UPI">("BANK");
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState<BankAccountDetails>({
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const input =
    "mt-1 block w-full rounded-xl border border-[#e4cfae] bg-white px-3 py-2 text-sm outline-none focus:border-[#a3161c]";

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      const isVideo = f.type.startsWith("video/");
      const isImage = f.type.startsWith("image/");
      if (!isVideo && !isImage)
        return setErr("Only photos or videos are allowed.");
      if (isImage && f.size > EVIDENCE_IMAGE_MB * 1024 * 1024)
        return setErr(`Each photo must be under ${EVIDENCE_IMAGE_MB} MB.`);
      if (isVideo && f.size > EVIDENCE_VIDEO_MB * 1024 * 1024)
        return setErr(`Each video must be under ${EVIDENCE_VIDEO_MB} MB.`);
      if (next.length >= EVIDENCE_MAX_FILES)
        return setErr(`You can attach at most ${EVIDENCE_MAX_FILES} files.`);
      next.push(f);
    }
    setErr("");
    setFiles(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    setErr("");
    const isRequest = kind !== "CANCEL";
    const finalReason = isRequest ? details.trim() : details.trim() || reason;
    if (!reason) return setErr("Please choose a reason.");
    if (isRequest && finalReason.length < 3)
      return setErr("Please explain the issue in a few words.");
    if (isRequest && files.length === 0)
      return setErr("Please attach at least one photo or video as proof.");
    let payout: BankDetails | undefined;
    if (needsBank) {
      const problem = mode === "UPI" ? validateUpi(upiId) : validateBank(bank);
      if (problem) return setErr(problem);
      payout = mode === "UPI" ? { upiId: upiId.trim() } : bank;
    }
    setBusy(true);
    try {
      await onSubmit(
        finalReason,
        payout,
        isRequest ? { category: reason, details: finalReason, files } : undefined,
      );
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
          {reasons.filter((r) => r !== LATE_REASON || allowLate).map((r) => (
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
          maxLength={250}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={
            kind !== "CANCEL"
              ? "Explain the issue *"
              : "Additional details (optional)"
          }
          className="mt-3 h-20 w-full rounded-xl border p-3 text-sm"
        />

        {kind !== "CANCEL" && (
          <div className="mt-3">
            <p className="text-sm font-bold">Photos / videos *</p>
            <p className="text-[11px] text-[#9a7a7a]">
              Add proof of the issue. Up to {EVIDENCE_MAX_FILES} files.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={files.length >= EVIDENCE_MAX_FILES}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#e0622d] px-4 py-2 text-xs font-bold text-[#9b4326] disabled:opacity-50"
            >
              <Paperclip size={14} /> Add photos / videos
            </button>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li
                    key={f.name + i}
                    className="flex items-center justify-between gap-2 rounded-lg bg-[#fff7ec] px-3 py-1.5 text-xs"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      onClick={() => setFiles(files.filter((_, k) => k !== i))}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {needsBank && (
          <div className="mt-4 space-y-3 rounded-2xl bg-[#fff7ec] p-4">
            <p className="text-sm font-bold">Where should we send your refund?</p>
            <div className="flex gap-2">
              {(["BANK", "UPI"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold ${
                    mode === m ? "border-[#e0622d] bg-orange-50" : "bg-white"
                  }`}
                >
                  {m === "BANK" ? "Bank account" : "UPI"}
                </button>
              ))}
            </div>
            {mode === "BANK" ? (
              <>
            <label className="block text-xs font-bold text-[#4a0710]">
              Account holder name
              <input className={input} value={bank.accountHolder} onChange={(e) => setBank({ ...bank, accountHolder: e.target.value })} />
            </label>
            <label className="block text-xs font-bold text-[#4a0710]">
              Account number
              <input className={input} inputMode="numeric" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, "") })} />
            </label>
            <label className="block text-xs font-bold text-[#4a0710]">
              IFSC code
              <input className={input} value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} />
            </label>
            <label className="block text-xs font-bold text-[#4a0710]">
              Bank name
              <input className={input} value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
            </label>
              </>
            ) : (
              <label className="block text-xs font-bold text-[#4a0710]">
                UPI ID
                <input
                  className={input}
                  placeholder="name@okhdfcbank"
                  autoCapitalize="none"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </label>
            )}
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