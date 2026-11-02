"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { StarInput } from "./Stars";
import { saveReview } from "../api";
import { useShop } from "../shop-data";
const EXAMPLES = [
  {
    stars: 5,
    text: "Beautiful quality and exactly as shown in the photos. Arrived well packed and on time. Will order again.",
  },
  {
    stars: 4,
    text: "Good product and nice finish. Delivery took a day longer than expected, but the item is worth it.",
  },
  {
    stars: 3,
    text: "Product is okay. The size is a little smaller than I imagined, but the colour and packaging were good.",
  },
];
export default function ReviewModal({
  productId,
  productName,
  onClose,
  onDone,
}: {
  productId: string;
  productName?: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErr("Please choose an image file");
    if (f.size > 5 * 1024 * 1024) return setErr("Image must be under 5MB");
    setErr("");
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const dropImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const close = () => {
    if (preview) URL.revokeObjectURL(preview);
    onClose();
  };

  const submit = async () => {
    if (!rating) return setErr("Please select a star rating");
    setBusy(true);
    setErr("");
    try {
      await saveReview(productId, {
        rating,
        comment: comment.trim(),
        image: file,
        removeImage: false,
      });
      useShop.getState().reload();
      if (preview) URL.revokeObjectURL(preview);
      onDone?.();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Failed to save review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-extrabold text-[#4a0710]">Rate this product</h3>
            {productName && <p className="truncate text-xs text-[#6b4a4a]">{productName}</p>}
          </div>
          <button onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-3">
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div className="mt-3 rounded-xl bg-[#fff8e8] p-3">
          <p className="text-xs font-extrabold text-[#4a0710]">What makes a helpful review?</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-[#6b4a4a]">
            <li>Quality, size, and colour: was it as shown?</li>
            <li>Packaging and delivery experience</li>
            <li>Would you buy it again or recommend it?</li>
          </ul>
          <p className="mt-2 text-[11px] font-semibold text-[#4a0710]">Tap an example to use it as a starting point:</p>
          <div className="mt-1.5 space-y-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.stars}
                type="button"
                onClick={() => {
                  setRating(ex.stars);
                  setComment(ex.text);
                }}
                className="block w-full rounded-lg border border-[#e4cfae] bg-white p-2 text-left text-[11px] italic leading-snug text-[#3a2a2a] hover:border-[#a3161c]"
              >
                <span className="not-italic font-bold text-[#f2b632]">{"★".repeat(ex.stars)}</span>{" "}
                “{ex.text}”
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Share your experience with this product (optional)"
          className="mt-3 w-full rounded-xl border border-[#e4cfae] bg-white p-3 text-sm outline-none focus:border-[#a3161c]"
        />
        <div className="text-right text-[11px] text-[#9a7a7a]">{comment.length}/1000</div>

        <div className="mt-2">
          {preview ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#e4cfae]">
              <img src={preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={dropImage}
                aria-label="Remove image"
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#e4cfae] text-[11px] text-[#6b4a4a] hover:bg-[#fffaf0]">
              <ImagePlus size={18} />
              Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        {err && <p className="mt-2 text-sm font-semibold text-red-600">{err}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-full bg-[#a3161c] px-6 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Submit review"}
          </button>
          <button
            onClick={close}
            className="rounded-full border border-[#e4cfae] px-6 py-2 text-sm font-semibold text-[#4a0710]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}