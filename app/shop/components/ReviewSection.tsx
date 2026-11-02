"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Trash2, Store as StoreIcon, X } from "lucide-react";
import { StarsDisplay, StarInput } from "./Stars";
import { imgUrl, fetchReviews, saveReview, removeReview } from "../api";
import { useShop } from "../shop-data";

type Reply = { text: string; repliedAt?: string };
type Review = {
  _id: string;
  rating: number;
  comment?: string;
  image?: string | null;
  createdAt: string;
  reply?: Reply | null;
  user: { _id: string; name?: string; picture?: string } | null;
};
type SortKey = "newest" | "top" | "lowest";

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export default function ReviewSection({
  productId,
  storeName,
  currentUserId,
}: {
  productId: string;
  storeName?: string;
  /** logged in USER er id (apnar auth store theke dao). Na dile Edit/Delete button dekhabe na */
  currentUserId?: string | null;
}) {
  const [sort, setSort] = useState<SortKey>("newest");
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  });
  const [items, setItems] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // form
  const formRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [guestMsg, setGuestMsg] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImg, setRemoveImg] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(
    async (pg: number, replace: boolean) => {
      setLoading(true);
      try {
        const r = await fetchReviews(productId, sort, pg, 6);
        setSummary({
          averageRating: r.averageRating,
          totalReviews: r.totalReviews,
          breakdown: r.breakdown,
        });
        setItems((prev) => (replace ? r.reviews : [...prev, ...r.reviews]));
        setPage(r.page);
        setTotalPages(r.totalPages);
      } catch {
        if (replace) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [productId, sort],
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  const resetForm = () => {
    if (preview && file) URL.revokeObjectURL(preview);
    setShowForm(false);
    setEditing(null);
    setRating(0);
    setComment("");
    setFile(null);
    setPreview(null);
    setRemoveImg(false);
    setErr("");
  };

  const openNew = () => {
    if (!currentUserId) {
      setGuestMsg(true);
      return;
    }
    setGuestMsg(false);
    resetForm();
    setShowForm(true);
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      50,
    );
  };

  const openEdit = (r: Review) => {
    resetForm();
    setEditing(r);
    setRating(r.rating);
    setComment(r.comment ?? "");
    setPreview(r.image ? imgUrl(r.image) : null);
    setShowForm(true);
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      50,
    );
  };

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/"))
      return setErr("Please choose an image file");
    if (f.size > 5 * 1024 * 1024) return setErr("Image must be under 5MB");
    setErr("");
    if (preview && file) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setRemoveImg(false);
  };

  const dropImage = () => {
    if (preview && file) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setRemoveImg(true);
  };

  const submit = async () => {
    if (!rating) return setErr("Please select a star rating");
    setBusy(true);
    setErr("");
    try {
      await saveReview(
        productId,
        {
          rating,
          comment: comment.trim(),
          image: file,
          removeImage: removeImg,
        },
        editing?._id,
      );
      resetForm();
      useShop.getState().reload();
      await load(1, true);
    } catch (e: any) {
      setErr(e?.message || "Failed to save review");
    } finally {
      setBusy(false);
    }
  };

  const del = async (r: Review) => {
    if (!confirm("Delete your review?")) return;
    try {
      await removeReview(productId, r._id);
      useShop.getState().reload();
      await load(1, true);
    } catch (e: any) {
      alert(e?.message || "Failed to delete review");
    }
  };

  const total = summary.totalReviews;

  return (
    <section className="rounded-3xl border border-[#f0dcc0] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-[#4a0710]">
          Ratings &amp; Reviews
        </h2>
        <button
          onClick={openNew}
          className="rounded-full bg-[#8b1a2b] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#7a1118]"
        >
          Write a review
        </button>
      </div>

      {guestMsg && (
        <p className="mt-3 text-sm font-semibold text-red-600">
          Please sign in to write a review.
        </p>
      )}

      {/* ---------- Summary ---------- */}
      <div className="mt-5 grid gap-6 sm:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#fff4dc] p-4 text-center">
          <div className="text-5xl font-black text-[#7a1118]">
            {total ? summary.averageRating.toFixed(1) : "–"}
          </div>
          <div className="mt-1">
            <StarsDisplay value={summary.averageRating} size={18} />
          </div>
          <div className="mt-1 text-xs text-[#6b4a4a]">
            {total} {total === 1 ? "rating" : "ratings"}
          </div>
        </div>

        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => {
            const c = summary.breakdown[n] ?? 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-8 font-semibold text-[#4a0710]">{n} ★</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f3e6d3]">
                  <div
                    className="h-full rounded-full bg-[#f2b632]"
                    style={{ width: total ? `${(c / total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="w-8 text-right text-[#6b4a4a]">{c}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Form ---------- */}
      {showForm && (
        <div
          ref={formRef}
          className="mt-6 rounded-2xl border border-[#e4cfae] bg-[#fffaf0] p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[#4a0710]">
              {editing ? "Edit your review" : "Rate this product"}
            </h3>
            <button onClick={resetForm} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="mt-3">
            <StarInput value={rating} onChange={setRating} />
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Share your experience with this product (optional)"
            className="mt-3 w-full rounded-xl border border-[#e4cfae] bg-white p-3 text-sm outline-none focus:border-[#a3161c]"
          />
          <div className="text-right text-[11px] text-[#9a7a7a]">
            {comment.length}/1000
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {preview ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#e4cfae]">
                <img
                  src={preview}
                  alt=""
                  className="h-full w-full object-cover"
                />
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
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#e4cfae] text-[11px] text-[#6b4a4a] hover:bg-white">
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

          {err && (
            <p className="mt-2 text-sm font-semibold text-red-600">{err}</p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={submit}
              disabled={busy}
              className="rounded-full bg-[#a3161c] px-6 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : editing ? "Update review" : "Submit review"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-full border border-[#e4cfae] px-6 py-2 text-sm font-semibold text-[#4a0710]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ---------- Sort ---------- */}
      {total > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-[#4a0710]">Sort by:</span>
          {(
            [
              ["newest", "Newest"],
              ["top", "Top rated"],
              ["lowest", "Lowest rated"],
            ] as [SortKey, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`rounded-full border px-4 py-1 text-xs font-semibold ${
                sort === k
                  ? "border-[#8b1a2b] bg-[#8b1a2b] text-white"
                  : "border-[#e4cfae] text-[#5a1a22] hover:bg-[#fff4dc]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ---------- List ---------- */}
      <div className="mt-4 divide-y divide-[#f0dcc0]">
        {items.map((r) => {
          const mine = !!currentUserId && r.user?._id === currentUserId;
          const name = r.user?.name ?? "Customer";
          return (
            <article key={r._id} className="py-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#7a1118] font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-bold text-[#2a0a0d]">
                      {name}
                    </span>
                    <StarsDisplay value={r.rating} size={14} />
                    <span className="text-xs font-bold text-[#4a0710]">
                      {r.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-[#9a7a7a]">
                      {fmt(r.createdAt)}
                    </span>
                  </div>

                  {r.comment && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#3a2a2a]">
                      {r.comment}
                    </p>
                  )}

                  {r.image && (
                    <a href={imgUrl(r.image)} target="_blank" rel="noreferrer">
                      <img
                        src={imgUrl(r.image)}
                        alt="Review"
                        loading="lazy"
                        className="mt-3 h-24 w-24 rounded-xl border border-[#f0dcc0] object-cover"
                      />
                    </a>
                  )}

                  {/* STORE reply */}
                  {r.reply?.text && (
                    <div className="mt-3 rounded-xl border-l-4 border-[#a3161c] bg-[#fff4dc] p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#7a1118]">
                        <StoreIcon size={13} />
                        Response from {storeName ?? "the seller"}
                        <span className="font-normal text-[#9a7a7a]">
                          · {fmt(r.reply.repliedAt)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm text-[#3a2a2a]">
                        {r.reply.text}
                      </p>
                    </div>
                  )}

                  {mine && (
                    <div className="mt-3 flex gap-4 text-xs font-semibold">
                      <button
                        onClick={() => openEdit(r)}
                        className="flex items-center gap-1 text-[#8b1a2b]"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => del(r)}
                        className="flex items-center gap-1 text-red-600"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {!loading && items.length === 0 && (
          <p className="py-10 text-center text-sm text-[#9a7a7a]">
            No reviews yet. Be the first to review this product.
          </p>
        )}
      </div>

      {loading && (
        <p className="py-4 text-center text-sm text-[#9a7a7a]">
          Loading reviews…
        </p>
      )}

      {!loading && page < totalPages && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => load(page + 1, false)}
            className="rounded-full border border-[#8b1a2b] px-6 py-2 text-sm font-bold text-[#8b1a2b] hover:bg-[#fff4dc]"
          >
            Show more reviews
          </button>
        </div>
      )}
    </section>
  );
}
