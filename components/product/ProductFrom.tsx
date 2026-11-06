"use client";
import { Checkbox } from "primereact/checkbox";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  useWatch,
  Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";
import axiosInstance from "@/service/axios.service";
import {
  getStoreSettings,
  updateStoreSettings,
  resolveBusinessType,
  StoreBusinessType,
  PaymentMode,
} from "@/service/storeSetting.service";
import {
  createProductSchema,
  updateProductSchema,
} from "@/helper/schema/Schema";
import {
  useVideoTrimmer,
  appendMediaFile,
  MAX_CLIP_SECONDS,
} from "@/components/VideoTrim";

type ProductFormData = z.infer<typeof createProductSchema>;

type ProductFormProps = {
  productId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const UNIT_OPTIONS = [
  { label: "Pieces (PCS)", value: "PCS" },
  { label: "Kilogram (KG)", value: "KG" },
  { label: "Gram (GM)", value: "GM" },
  { label: "Litre (LTR)", value: "LTR" },
  { label: "Millilitre (ML)", value: "ML" },
  { label: "Box", value: "BOX" },
  { label: "Dozen", value: "DOZEN" },
  { label: "Pack", value: "PACK" },
];

// ---------- Media (image + gif + video) config: backend multer er sathe match kora ----------
const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MEDIA_ACCEPT = ALLOWED_MEDIA_TYPES.join(",");
const MAX_IMAGE_SIZE_MB = 50;
const MAX_VIDEO_SIZE_MB = 100; // original video (backend multer limit er sathe mil)
const MAX_FILES_PER_REQUEST = 30;

const MEDIA_HINT = `JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM, MOV. Images up to ${MAX_IMAGE_SIZE_MB}MB, videos up to ${MAX_VIDEO_SIZE_MB}MB. Videos can be up to ${MAX_CLIP_SECONDS} seconds (you can trim them) and are saved as GIF.`;

const VIDEO_URL_REGEX = /\.(mp4|webm|mov)(\?.*)?$/i;
const isVideoUrl = (url?: string | null) => !!url && VIDEO_URL_REGEX.test(url);
const isVideoFile = (file?: File | null) =>
  !!file && file.type.startsWith("video/");

// invalid type / oversize / empty file bad diye valid gulo return kore, reason toast e dekhay
const filterMediaFiles = (files: File[]): File[] => {
  const valid: File[] = [];
  files.forEach((file) => {
    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      toast.error(
        `"${file.name}" is not supported. Use JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM or MOV.`,
      );
      return;
    }
    const isVideo = file.type.startsWith("video/");
    const maxMb = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(
        `"${file.name}" is too large. Max ${maxMb}MB for ${isVideo ? "video" : "image"}.`,
      );
      return;
    }
    if (file.size === 0) {
      toast.error(`"${file.name}" is empty.`);
      return;
    }
    valid.push(file);
  });
  return valid;
};

const isValidObjectId = (id?: string | null) =>
  !!id && /^[a-fA-F0-9]{24}$/.test(id);

const isNil = (v: any) => v === undefined || v === null || v === "";

// nil hole undefined (JSON.stringify e key ta bad jabe), noile value
const numOrUndef = (v: any) => (isNil(v) ? undefined : v);

const hasAttribute = (v: any) =>
  !!(
    String(v?.size ?? "").trim() ||
    String(v?.weight ?? "").trim() ||
    String(v?.height ?? "").trim()
  );

// stray default row (no text / no price) -> silently skipped
const isEmptySizeVariant = (v: any) =>
  !hasAttribute(v) && !v?.sku && isNil(v?.mrp) && isNil(v?.offerPrice);

const hasPackaging = (p: any) => !!p && Object.values(p).some((x) => !isNil(x));

// row packaging if filled, otherwise the global packaging
const packagingOf = (own: any, fallback: any) =>
  hasPackaging(own) ? own : fallback || {};

// ---------- [GST] ----------
const GST_KEYS = ["cgst", "sgst", "igst"] as const;

// khali hole undefined (key bad jabe)
const cleanGst = (g: any) => {
  const out: Record<string, number> = {};
  GST_KEYS.forEach((k) => {
    if (!isNil(g?.[k])) out[k] = Number(g[k]);
  });
  return Object.keys(out).length ? out : undefined;
};

const validateGstFields = (label: string, g: any): string | null => {
  for (const k of GST_KEYS) {
    if (isNil(g?.[k])) continue;
    const n = Number(g[k]);
    if (!Number.isFinite(n) || n < 0 || n > 100)
      return `${label}${k.toUpperCase()} must be between 0 and 100`;
  }
  return null;
};

// ---------- [HSN] ----------
const HSN_REGEX = /^(\d{4}|\d{6}|\d{8})$/;

// product / color / size, je kono level e GST dewa ache kina
const hasAnyGstInForm = (gst: any, variants: any[]): boolean =>
  !!cleanGst(gst) ||
  (variants || []).some(
    (v: any) =>
      !!cleanGst(v?.gst) ||
      (v?.sizeVariants || []).some((s: any) => !!cleanGst(s?.gst)),
  );

const genUiKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

// ---------- [TIER] quantity based price helpers ----------
// minQty user likhe na: 1st tier = 1, porer tier = ager tier er maxQty + 1.
const cleanTiers = (tiers: any) => {
  if (!Array.isArray(tiers)) return [];
  const out: { minQty: number | null; maxQty: number | null; price: any }[] =
    [];
  tiers.forEach((t: any, i: number) => {
    const prev = out[i - 1];
    const minQty =
      i === 0 ? 1 : prev && prev.maxQty !== null ? prev.maxQty + 1 : null;
    out.push({
      minQty,
      maxQty: isNil(t?.maxQty) ? null : Number(t.maxQty),
      price: isNil(t?.price) ? null : Number(t.price),
    });
  });
  return out;
};

const validateTiers = (
  label: string,
  rawTiers: any,
  _mrp?: any, // tier price er sathe MRP check nei
): string | null => {
  if (!Array.isArray(rawTiers) || rawTiers.length === 0) return null;
  const tiers = cleanTiers(rawTiers);

  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const n = `${label}Tier ${i + 1}: `;
    const isLast = i === tiers.length - 1;

    if (isNil(t.price)) return `${n}price is required`;
    if (Number(t.price) < 0) return `${n}price cannot be negative`;

    if (!isLast && isNil(t.maxQty)) {
      return `${n}max quantity is required (only the last tier can be empty = no limit)`;
    }
    if (
      !isNil(t.maxQty) &&
      (!Number.isInteger(t.maxQty) || Number(t.maxQty) < Number(t.minQty))
    ) {
      return `${n}max quantity must be a whole number >= ${t.minQty}`;
    }
  }
  return null;
};

type PackagingDetails = {
  expectedDeliveryDays?: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
};

// global values that pre-fill every new / untouched row
type Defaults = {
  mrp?: number | null;
  offerPrice?: number | null;
  openingStock?: number | null;
  lowStockThreshold?: number | null;
  sku?: string | null;
};

const buildEmptySizeVariant = (d: Defaults = {}) => ({
  size: "",
  weight: "",
  height: "",
  mrp: (d.mrp ?? undefined) as number | undefined,
  offerPrice: (d.offerPrice ?? undefined) as number | undefined,
  openingStock: d.openingStock ?? 0,
  lowStockThreshold: d.lowStockThreshold ?? 0,
  sku: d.sku ?? "",
  packagingDetails: {} as PackagingDetails,
  priceTiers: [] as any[],
  gst: {} as any, // [GST]
});

const buildEmptyColorVariant = (withSize = false, d: Defaults = {}) => ({
  _uiKey: genUiKey(),
  color: "",
  mrp: (d.mrp ?? undefined) as number | undefined,
  offerPrice: (d.offerPrice ?? undefined) as number | undefined,
  openingStock: d.openingStock ?? 0,
  lowStockThreshold: d.lowStockThreshold ?? 0,
  sku: d.sku ?? "",
  packagingDetails: {} as PackagingDetails,
  priceTiers: [] as any[],
  gst: {} as any, // [GST]
  sizeVariants: (withSize ? [buildEmptySizeVariant(d)] : []) as ReturnType<
    typeof buildEmptySizeVariant
  >[],
});

type FacingMode = "user" | "environment";

type ImageState = {
  existing: string[];
  files: File[];
  previews: string[];
};

// first message from a zod / react-hook-form error tree
const firstErrorMessage = (errs: any): string | null => {
  if (!errs || typeof errs !== "object") return null;
  if (typeof errs.message === "string" && errs.message) return errs.message;
  for (const key of Object.keys(errs)) {
    if (key === "ref") continue;
    const m = firstErrorMessage(errs[key]);
    if (m) return m;
  }
  return null;
};

// ===============================================================
// SMALL UI HELPERS
// ===============================================================

// Numbered card. Every part of the form lives inside one of these.
function FormSection({
  step,
  icon,
  title,
  description,
  badge,
  children,
}: {
  step: number;
  icon: string;
  title: string;
  description?: string;
  badge?: "Required" | "Optional";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <header className="flex items-start gap-3 px-3.5 py-2.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <span className="h-7 w-7 shrink-0 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
            <i className={`pi ${icon} text-xs text-blue-600`}></i>
            {title}
            {badge && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  badge === "Required"
                    ? "bg-red-50 text-red-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {badge}
              </span>
            )}
          </h3>
          {description && (
            <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </header>
      <div className="p-3.5 space-y-3">{children}</div>
    </section>
  );
}

// Label + input + hint + error in one place
function Field({
  label,
  required,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 min-w-0 ${className}`}>
      <label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-gray-400">{hint}</p>}
      {error && (
        <small className="text-red-500 flex items-center gap-1">
          <i className="pi pi-exclamation-circle"></i>
          {error}
        </small>
      )}
    </div>
  );
}

// On/off row used for switches
function ToggleRow({
  icon,
  iconClass = "text-blue-600",
  title,
  description,
  checked,
  onChange,
  tone = "blue",
}: {
  icon?: string;
  iconClass?: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  tone?: "blue" | "orange" | "green";
}) {
  const toneCls = {
    blue: "border-blue-100 bg-blue-50/40",
    orange: "border-orange-200 bg-orange-50/50",
    green: "border-green-100 bg-green-50/40",
  }[tone];
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${toneCls}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          {icon && <i className={`pi ${icon} ${iconClass}`}></i>}
          {title}
        </p>
        <p className="text-[11px] text-gray-500">{description}</p>
      </div>
      <InputSwitch checked={checked} onChange={(e) => onChange(!!e.value)} />
    </div>
  );
}

// Decimal price input wired to react-hook-form
function MoneyField({
  control,
  name,
  label,
  placeholder = "Optional",
}: {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1 min-w-0">
      <label className="text-[11px] font-semibold text-gray-600">{label}</label>
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <InputNumber
            value={field.value ?? null}
            onValueChange={(e) => field.onChange(e.value)}
            className="w-full"
            inputClassName="w-full p-inputtext-sm"
            min={0}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            useGrouping={false}
            placeholder={placeholder}
          />
        )}
      />
    </div>
  );
}

// Whole number input (stock) wired to react-hook-form
function IntField({
  control,
  name,
  label,
  required,
  placeholder,
}: {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1 min-w-0">
      <label className="text-[11px] font-semibold text-gray-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <InputNumber
            value={field.value ?? 0}
            onValueChange={(e) => field.onChange(e.value)}
            className="w-full"
            inputClassName="w-full p-inputtext-sm"
            min={0}
            useGrouping={false}
            placeholder={placeholder}
          />
        )}
      />
    </div>
  );
}

// ===============================================================
// Media thumbnail (image / gif / video) with remove button
// ===============================================================
function MediaThumb({
  src,
  isVideo,
  sizeClass,
  removeBtnClass,
  onRemove,
}: {
  src: string;
  isVideo: boolean;
  sizeClass: string;
  removeBtnClass: string;
  onRemove: () => void;
}) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden border bg-gray-100 ${sizeClass}`}
    >
      {isVideo ? (
        <>
          {/* #t=0.1 : iOS Safari e first frame poster hishebe dekhate help kore */}
          <video
            src={`${src}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white rounded px-1 text-[9px] flex items-center gap-0.5 pointer-events-none">
            <i className="pi pi-play text-[8px]"></i>
            Video
          </span>
        </>
      ) : (
        <img src={src} alt="" className="w-full h-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        className={`absolute bg-red-500 text-white rounded-full flex items-center justify-center ${removeBtnClass}`}
      >
        ×
      </button>
    </div>
  );
}

// ===============================================================
// Package size & weight (used by couriers to calculate shipping)
// ===============================================================
function PackagingFieldsBlock({
  control,
  basePath,
  title = "Package size & weight",
}: {
  control: Control<any>;
  basePath: string;
  title?: string;
}) {
  const packagingValue = useWatch({ control, name: basePath as any });

  const hasExistingValue = (val: any) =>
    !!val &&
    Object.values(val).some((v) => v !== undefined && v !== null && v !== "");

  const [open, setOpen] = useState(() => hasExistingValue(packagingValue));

  useEffect(() => {
    if (hasExistingValue(packagingValue)) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packagingValue]);

  const fieldsMeta: { name: string; label: string; decimal?: boolean }[] = [
    { name: "length", label: "Length (cm)", decimal: true },
    { name: "breadth", label: "Breadth (cm)", decimal: true },
    { name: "height", label: "Height (cm)", decimal: true },
    { name: "weight", label: "Weight (kg)", decimal: true },
  ];

  return (
    <div className="border border-dashed border-blue-200 rounded-lg bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-blue-700"
      >
        <span className="flex items-center gap-1.5">
          <i className="pi pi-inbox text-blue-500"></i>
          {title}
          <span className="text-[10px] font-normal text-gray-400">
            (optional)
          </span>
        </span>
        <i
          className={`pi ${open ? "pi-chevron-up" : "pi-chevron-down"} text-[10px]`}
        ></i>
      </button>
      {open && (
        <div className="p-2 pt-0 space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fieldsMeta.map((f) => (
              <div key={f.name} className="space-y-1 min-w-0">
                <label className="text-[10px] font-medium text-gray-500">
                  {f.label}
                </label>
                <Controller
                  name={`${basePath}.${f.name}` as any}
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      value={field.value ?? null}
                      onValueChange={(e) => field.onChange(e.value)}
                      className="w-full"
                      inputClassName="w-full text-xs p-1.5"
                      min={0}
                      useGrouping={false}
                      mode="decimal"
                      minFractionDigits={0}
                      maxFractionDigits={f.decimal ? 3 : 0}
                    />
                  )}
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400">
            Used to calculate courier charges. Accurate values give accurate
            shipping rates.
          </p>
        </div>
      )}
    </div>
  );
}

// ===============================================================
// [GST] CGST / SGST / IGST percentage (optional)
// Khali rakhle parent (size -> color -> product) er GST inherit hobe
// ===============================================================
function GstFieldsBlock({
  control,
  basePath,
  title = "GST rates (optional)",
  hint,
  defaultOpen = false,
}: {
  control: Control<any>;
  basePath: string;
  title?: string;
  hint?: string;
  defaultOpen?: boolean;
}) {
  const value = useWatch({ control, name: basePath as any });

  const hasValue = (v: any) =>
    !!v &&
    Object.values(v).some((x) => x !== undefined && x !== null && x !== "");

  const [open, setOpen] = useState(() => defaultOpen || hasValue(value));

  useEffect(() => {
    if (hasValue(value)) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fieldsMeta = [
    { name: "cgst", label: "CGST %" },
    { name: "sgst", label: "SGST %" },
    { name: "igst", label: "IGST %" },
  ];

  return (
    <div className="mt-1.5 border border-dashed border-green-200 rounded-lg bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-green-700"
      >
        <span className="flex items-center gap-1.5">
          <i className="pi pi-percentage text-green-600"></i>
          {title}
        </span>
        <i
          className={`pi ${open ? "pi-chevron-up" : "pi-chevron-down"} text-[10px]`}
        ></i>
      </button>
      {open && (
        <div className="p-2 pt-0 space-y-1.5">
          <div className="grid grid-cols-3 gap-2">
            {fieldsMeta.map((f) => (
              <div key={f.name} className="space-y-1 min-w-0">
                <label className="text-[10px] font-medium text-gray-500">
                  {f.label}
                </label>
                <Controller
                  name={`${basePath}.${f.name}` as any}
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      value={field.value ?? null}
                      onValueChange={(e) => field.onChange(e.value)}
                      className="w-full"
                      inputClassName="w-full text-xs p-1.5"
                      min={0}
                      max={100}
                      mode="decimal"
                      minFractionDigits={0}
                      maxFractionDigits={2}
                      suffix="%"
                      useGrouping={false}
                      placeholder="—"
                    />
                  )}
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400">
            {hint ||
              "Use CGST + SGST for sales within the same state and IGST for sales to another state. If left empty, the parent GST (or no GST) applies."}
          </p>
        </div>
      )}
    </div>
  );
}

// ===============================================================
// [TIER] Bulk pricing (1-4 => ₹20, 5-10 => ₹40, 50+ => ₹200)
// Min Qty auto-calculated (read-only): 1st = 1, next = previous Max Qty + 1
// ===============================================================
function PriceTiersBlock({
  control,
  name,
}: {
  control: Control<any>;
  name: string; // e.g. "priceTiers" ba "variants.0.priceTiers"
}) {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: name as any,
  });
  const rows = (useWatch({ control, name: name as any }) || []) as any[];
  const enabled = fields.length > 0;

  const minOf = (i: number): number | null => {
    if (i === 0) return 1;
    const prevMax = rows[i - 1]?.maxQty;
    return isNil(prevMax) ? null : Number(prevMax) + 1;
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    if (last && isNil(last.maxQty)) {
      toast.error(
        `Set "Max Qty" of Tier ${rows.length} first, then add the next tier.`,
      );
      return;
    }
    append({
      minQty: last ? Number(last.maxQty) + 1 : 1,
      maxQty: null,
      price: null,
    } as any);
  };

  return (
    <div className="mt-1.5 border border-dashed border-purple-200 rounded-lg bg-white p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
            <i className="pi pi-sort-amount-up"></i>
            Bulk pricing (price by quantity)
            <span className="text-[10px] font-normal text-gray-400">
              (optional)
            </span>
          </p>
          <p className="text-[10px] text-gray-400">
            Example: 1-4 pcs ₹20, 5-10 pcs ₹18, 11+ pcs ₹15.
          </p>
        </div>
        <InputSwitch
          checked={enabled}
          onChange={(e) =>
            e.value
              ? replace([{ minQty: 1, maxQty: null, price: null }] as any)
              : replace([])
          }
        />
      </div>

      {enabled && (
        <div className="mt-2 space-y-1.5">
          {fields.map((f, i) => {
            const isLast = i === fields.length - 1;
            const min = minOf(i);
            return (
              <div
                key={f.id}
                className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
              >
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-medium text-gray-500">
                    From qty (auto)
                  </label>
                  <InputNumber
                    value={min}
                    className="w-full"
                    inputClassName="w-full p-inputtext-sm"
                    useGrouping={false}
                    disabled
                    placeholder="—"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-medium text-gray-500">
                    Up to qty
                  </label>
                  <Controller
                    name={`${name}.${i}.maxQty` as any}
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        value={field.value ?? null}
                        onValueChange={(e) => field.onChange(e.value)}
                        className="w-full"
                        inputClassName="w-full p-inputtext-sm"
                        min={min ?? 1}
                        useGrouping={false}
                        placeholder={isLast ? "No limit" : "Required"}
                      />
                    )}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-medium text-gray-500">
                    Price / unit
                  </label>
                  <Controller
                    name={`${name}.${i}.price` as any}
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        value={field.value ?? null}
                        onValueChange={(e) => field.onChange(e.value)}
                        className="w-full"
                        inputClassName="w-full p-inputtext-sm"
                        min={0}
                        mode="decimal"
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        useGrouping={false}
                      />
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-red-500 hover:text-red-700 pb-2"
                >
                  <i className="pi pi-trash"></i>
                </button>
              </div>
            );
          })}
          <Button
            type="button"
            label="Add tier"
            icon="pi pi-plus"
            size="small"
            outlined
            onClick={addRow}
          />
        </div>
      )}
    </div>
  );
}

// ===============================================================
// Single Size/Weight/Height row
// ===============================================================
function SizeVariantRow({
  control,
  register,
  basePath,
  onRemove,
  canRemove,
  showRemove,
  showStock,
}: {
  control: Control<any>;
  register: any;
  basePath: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  showRemove: boolean;
  showStock: boolean;
}) {
  return (
    <div className="border border-blue-100 rounded-lg p-2.5 bg-blue-50/40 relative space-y-2">
      {showRemove && canRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Remove this option"
          className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
        >
          <i className="pi pi-times-circle"></i>
        </button>
      )}

      <div>
        <p className="text-[11px] font-semibold text-gray-700">
          Option details <span className="text-red-500">*</span>
        </p>
        <p className="text-[10px] text-gray-500">
          Fill at least one of Size, Weight or Height.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="space-y-1 min-w-0">
          <label className="text-[11px] font-semibold text-gray-600">
            Size
          </label>
          <InputText
            className="w-full p-inputtext-sm"
            {...register(`${basePath}.size`)}
            placeholder="e.g. Large"
          />
        </div>
        <div className="space-y-1 min-w-0">
          <label className="text-[11px] font-semibold text-gray-600">
            Weight
          </label>
          <InputText
            className="w-full p-inputtext-sm"
            {...register(`${basePath}.weight`)}
            placeholder="e.g. 40kg"
          />
        </div>
        <div className="space-y-1 min-w-0">
          <label className="text-[11px] font-semibold text-gray-600">
            Height
          </label>
          <InputText
            className="w-full p-inputtext-sm"
            {...register(`${basePath}.height`)}
            placeholder="e.g. 6ft"
          />
        </div>
      </div>

      <div
        className={`grid grid-cols-2 gap-2 ${
          showStock ? "sm:grid-cols-5" : "sm:grid-cols-3"
        }`}
      >
        <MoneyField control={control} name={`${basePath}.mrp`} label="MRP" />
        <MoneyField
          control={control}
          name={`${basePath}.offerPrice`}
          label="Selling price"
        />
        {showStock && (
          <>
            <IntField
              control={control}
              name={`${basePath}.openingStock`}
              label="Opening stock"
              required
            />
            <IntField
              control={control}
              name={`${basePath}.lowStockThreshold`}
              label="Low stock alert"
              placeholder="0 = off"
            />
          </>
        )}
        <div className="space-y-1 min-w-0">
          <label className="text-[11px] font-semibold text-gray-600">SKU</label>
          <InputText
            className="w-full p-inputtext-sm"
            {...register(`${basePath}.sku`)}
            placeholder="Optional"
          />
        </div>
      </div>

      <PriceTiersBlock control={control} name={`${basePath}.priceTiers`} />
      <GstFieldsBlock
        control={control}
        basePath={`${basePath}.gst`}
        title="GST override for this option (optional)"
        hint="If left empty, the color or product GST will be used."
      />
      <PackagingFieldsBlock
        control={control}
        basePath={`${basePath}.packagingDetails`}
      />
    </div>
  );
}

// ===============================================================
// One Color block
// ===============================================================
function ColorVariantBlock({
  control,
  register,
  colorIndex,
  onRemoveColor,
  canRemoveColor,
  imgState,
  onAddImages,
  onRemoveImage,
  onOpenCamera,
  getDefaults,
  showStock,
}: {
  control: Control<any>;
  register: any;
  colorIndex: number;
  onRemoveColor: () => void;
  canRemoveColor: boolean;
  imgState: ImageState;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (index: number, isExisting: boolean) => void;
  onOpenCamera: () => void;
  getDefaults: () => Defaults;
  showStock: boolean;
}) {
  const {
    fields: sizeFields,
    append: appendSize,
    remove: removeSize,
    replace: replaceSizes,
  } = useFieldArray({ control, name: `variants.${colorIndex}.sizeVariants` });

  const sizeMode = sizeFields.length > 0;

  const toggleSizeMode = (on: boolean) =>
    on ? appendSize(buildEmptySizeVariant(getDefaults())) : replaceSizes([]);

  return (
    <div className="border border-blue-100 rounded-xl p-3 bg-white shadow-sm space-y-3">
      {/* Color header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="h-6 w-6 shrink-0 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center">
            {colorIndex + 1}
          </span>
          <InputText
            className="w-full max-w-[240px] p-inputtext-sm font-semibold"
            {...register(`variants.${colorIndex}.color`)}
            placeholder="Color name, e.g. Red *"
          />
        </div>
        {canRemoveColor && (
          <button
            type="button"
            onClick={onRemoveColor}
            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 shrink-0"
          >
            <i className="pi pi-trash"></i> Remove
          </button>
        )}
      </div>

      {/* Color media */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-gray-600">
          Photos / videos of this color <span className="text-red-500">*</span>
        </label>
        {(imgState.existing.length > 0 || imgState.previews.length > 0) && (
          <div className="flex gap-2 flex-wrap">
            {imgState.existing.map((url, i) => (
              <MediaThumb
                key={`ex-${i}`}
                src={url}
                isVideo={isVideoUrl(url)}
                sizeClass="w-14 h-14"
                removeBtnClass="top-0.5 right-0.5 text-[9px] w-4 h-4"
                onRemove={() => onRemoveImage(i, true)}
              />
            ))}
            {imgState.previews.map((src, i) => (
              <MediaThumb
                key={`new-${i}`}
                src={src}
                isVideo={isVideoFile(imgState.files[i])}
                sizeClass="w-14 h-14"
                removeBtnClass="top-0.5 right-0.5 text-[9px] w-4 h-4"
                onRemove={() => onRemoveImage(i, false)}
              />
            ))}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input
            type="file"
            multiple
            accept={MEDIA_ACCEPT}
            onChange={(e) => {
              if (!e.target.files) return;
              onAddImages(Array.from(e.target.files));
              e.target.value = "";
            }}
            className="text-xs flex-1 min-w-0"
          />
          <Button
            type="button"
            icon="pi pi-camera"
            outlined
            size="small"
            onClick={onOpenCamera}
          />
        </div>
      </div>

      {/* Size options toggle for this color */}
      <ToggleRow
        title="This color has size / weight / height options"
        description="Turn on to add separate options (and prices) for this color."
        checked={sizeMode}
        onChange={toggleSizeMode}
      />

      {/* Color-level GST */}
      <GstFieldsBlock
        control={control}
        basePath={`variants.${colorIndex}.gst`}
        title="GST for this color (optional)"
        hint={
          sizeMode
            ? "Default GST for this color's options. To use a different GST for one option, set a GST override on that option."
            : "If left empty, the product GST will be used."
        }
      />

      {sizeMode ? (
        <div className="space-y-2">
          {sizeFields.map((sf, si) => (
            <SizeVariantRow
              key={sf.id}
              control={control}
              register={register}
              basePath={`variants.${colorIndex}.sizeVariants.${si}`}
              index={si}
              onRemove={() => removeSize(si)}
              canRemove={sizeFields.length > 1}
              showRemove
              showStock={showStock}
            />
          ))}
          <Button
            type="button"
            label="Add another option"
            icon="pi pi-plus"
            size="small"
            outlined
            onClick={() => appendSize(buildEmptySizeVariant(getDefaults()))}
          />
        </div>
      ) : (
        <div className="border border-blue-100 rounded-lg p-2.5 bg-blue-50/30 space-y-2">
          <div
            className={`grid grid-cols-2 gap-2 ${
              showStock ? "sm:grid-cols-5" : "sm:grid-cols-3"
            }`}
          >
            <MoneyField
              control={control}
              name={`variants.${colorIndex}.mrp`}
              label="MRP"
            />
            <MoneyField
              control={control}
              name={`variants.${colorIndex}.offerPrice`}
              label="Selling price"
            />
            {showStock && (
              <>
                <IntField
                  control={control}
                  name={`variants.${colorIndex}.openingStock`}
                  label="Opening stock"
                  required
                />
                <IntField
                  control={control}
                  name={`variants.${colorIndex}.lowStockThreshold`}
                  label="Low stock alert"
                  placeholder="0 = off"
                />
              </>
            )}
            <div className="space-y-1 min-w-0">
              <label className="text-[11px] font-semibold text-gray-600">
                SKU
              </label>
              <InputText
                className="w-full p-inputtext-sm"
                {...register(`variants.${colorIndex}.sku`)}
                placeholder="Optional"
              />
            </div>
          </div>
          <PriceTiersBlock
            control={control}
            name={`variants.${colorIndex}.priceTiers`}
          />
          <PackagingFieldsBlock
            control={control}
            basePath={`variants.${colorIndex}.packagingDetails`}
          />
        </div>
      )}
    </div>
  );
}

// ===============================================================
// [POLICY] Returnable / Replaceable / Refundable
// ===============================================================
type ProductType = "PRODUCT" | "SERVICE";

type PolicyState = {
  isReturnable: boolean;
  returnDays: number | null;
  isReplaceable: boolean;
  replaceDays: number | null;
  isRefundable: boolean;
  refundDays: number | null;
};

const DEFAULT_POLICY: PolicyState = {
  isReturnable: false,
  returnDays: null,
  isReplaceable: false,
  replaceDays: null,
  isRefundable: false,
  refundDays: null,
};

const POLICY_ROWS = [
  {
    flag: "isReturnable",
    days: "returnDays",
    title: "Returnable",
    hint: "Customer can send the product back. Leave days empty if the delivery agent will decide.",
    daysRequired: false,
  },
  {
    flag: "isReplaceable",
    days: "replaceDays",
    title: "Replaceable",
    hint: "Customer can ask for a replacement. Leave days empty if the delivery agent will decide.",
    daysRequired: false,
  },
  {
    flag: "isRefundable",
    days: "refundDays",
    title: "Refundable",
    hint: "Customer gets the money back on return or cancellation. You pay the refund to the customer's bank account.",
    daysRequired: true,
  },
] as const;

// FormData e policy field gulo boshay (faka days = "" pathay, backend e null hoy)
const appendPolicyFields = (
  fd: FormData,
  type: ProductType,
  p: PolicyState,
) => {
  const isService = type === "SERVICE";
  const days = (on: boolean, v: number | null) =>
    on && !isNil(v) ? String(v) : "";

  fd.append("productType", type);
  fd.append("isReturnable", String(!isService && p.isReturnable));
  fd.append("returnDays", days(!isService && p.isReturnable, p.returnDays));
  fd.append("isReplaceable", String(!isService && p.isReplaceable));
  fd.append("replaceDays", days(!isService && p.isReplaceable, p.replaceDays));
  fd.append("isRefundable", String(p.isRefundable));
  fd.append("refundDays", days(!isService && p.isRefundable, p.refundDays));
};

// ---------- [PICKUP] ----------
type PickupAddress = {
  contactName: string;
  phone: string;
  email: string;
  addressLine: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

const EMPTY_PICKUP: PickupAddress = {
  contactName: "",
  phone: "",
  email: "",
  addressLine: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

const validatePickup = (p: PickupAddress): string | null => {
  if (!p.contactName.trim()) return "Pickup contact name is required";
  if (!/^\d{10}$/.test(p.phone.trim()))
    return "Pickup phone must be a 10 digit number";
  if (!p.email.trim()) return "Pickup contact email is required";
  if (!/^\S+@\S+\.\S+$/.test(p.email.trim())) return "Pickup email is invalid";
  if (!p.addressLine.trim()) return "Pickup address is required";
  if (p.addressLine.trim().length < 10)
    return "Pickup address is too short. Please add a full address";
  if (!p.city.trim()) return "Pickup city is required";
  if (!p.state.trim()) return "Pickup state is required";
  if (!/^\d{6}$/.test(p.pincode.trim()))
    return "Pickup pincode must be 6 digits";
  return null;
};

const cleanPickup = (p: PickupAddress) => ({
  contactName: p.contactName.trim(),
  phone: p.phone.trim(),
  email: p.email.trim().toLowerCase(),
  addressLine: p.addressLine.trim(),
  area: p.area.trim() || undefined,
  city: p.city.trim(),
  state: p.state.trim(),
  pincode: p.pincode.trim(),
  country: p.country.trim() || "India",
});

function PickupAddressBlock({
  enabled,
  onToggle,
  value,
  onChange,
  isService,
}: {
  enabled: boolean;
  onToggle: (on: boolean) => void;
  value: PickupAddress;
  onChange: (patch: Partial<PickupAddress>) => void;
  isService: boolean;
}) {
  const fields: {
    key: keyof PickupAddress;
    label: string;
    required?: boolean;
    placeholder?: string;
    full?: boolean;
    clean?: (v: string) => string;
  }[] = [
    { key: "contactName", label: "Contact person", required: true },
    {
      key: "phone",
      label: "Phone",
      required: true,
      placeholder: "10 digit number",
      clean: (v) => v.replace(/\D/g, "").slice(0, 10),
    },
    {
      key: "email",
      label: "Email",
      required: true,
      placeholder: "contact@example.com",
    },
    {
      key: "addressLine",
      label: "Address (house, street)",
      required: true,
      full: true,
    },
    { key: "area", label: "Area / Landmark (optional)" },
    { key: "city", label: "City", required: true },
    { key: "state", label: "State", required: true },
    {
      key: "pincode",
      label: "Pincode",
      required: true,
      placeholder: "6 digit pincode",
      clean: (v) => v.replace(/\D/g, "").slice(0, 6),
    },
  ];

  const kind = isService ? "service" : "product";

  return (
    <div className="space-y-2">
      <ToggleRow
        icon="pi-map-marker"
        title={`Use a different pickup address for this ${kind}`}
        description={
          isService
            ? "Turn on to add the address and contact person for this service."
            : "Turn on if the courier should pick this product up from a different address. When off, your store's default pickup address is used."
        }
        checked={enabled}
        onChange={onToggle}
      />

      {enabled && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-2.5 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fields.map((f) => (
              <div
                key={f.key}
                className={`space-y-1 min-w-0 ${f.full ? "sm:col-span-2" : ""}`}
              >
                <label className="text-[11px] font-semibold text-gray-600">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                <InputText
                  className="w-full p-inputtext-sm"
                  value={value[f.key]}
                  placeholder={f.placeholder}
                  inputMode={f.clean ? "numeric" : undefined}
                  onChange={(e) =>
                    onChange({
                      [f.key]: f.clean
                        ? f.clean(e.target.value)
                        : e.target.value,
                    } as Partial<PickupAddress>)
                  }
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500">
            The contact person gets an email when this {kind} is added or its
            pickup details change, when an order is placed, and when the courier
            pickup is scheduled.
            {!isService &&
              " Shipping charge and delivery time are calculated from this pincode. Products with different pickup addresses are placed as separate orders. Local (own) delivery is not available for products with a custom pickup address."}
          </p>
        </div>
      )}
    </div>
  );
}

// ===============================================================
// [CAT TYPE] Product / Service selector
// ===============================================================
function ProductTypeSelector({
  value,
  onChange,
}: {
  value: ProductType;
  onChange: (t: ProductType) => void;
}) {
  const btn = (v: ProductType, label: string, sub: string, icon: string) => (
    <button
      type="button"
      onClick={() => onChange(v)}
      className={`flex-1 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        value === v
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
          : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <span
        className={`h-9 w-9 rounded-lg flex items-center justify-center ${
          value === v ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        <i className={`pi ${icon}`}></i>
      </span>
      <span className="min-w-0">
        <span
          className={`block text-sm font-semibold ${
            value === v ? "text-blue-800" : "text-gray-700"
          }`}
        >
          {label}
        </span>
        <span className="block text-[11px] text-gray-500">{sub}</span>
      </span>
    </button>
  );

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col sm:flex-row gap-2">
        {btn("PRODUCT", "Product", "Physical item, delivered to the customer", "pi-box")}
        {btn("SERVICE", "Service", "Customer picks a booking date", "pi-calendar")}
      </div>
      <p className="text-[11px] text-gray-500">
        {value === "SERVICE"
          ? "Only service categories are shown below."
          : "Only product categories are shown below."}
      </p>
    </div>
  );
}

// Returns & refunds
function ProductPolicyBlock({
  productType,
  policy,
  onPolicyChange,
}: {
  productType: ProductType;
  policy: PolicyState;
  onPolicyChange: (patch: Partial<PolicyState>) => void;
}) {
  const isService = productType === "SERVICE";
  const rows = isService
    ? POLICY_ROWS.filter((r) => r.flag === "isRefundable")
    : POLICY_ROWS;

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const on = policy[row.flag];
        const showDays = !isService;
        return (
          <div
            key={row.flag}
            className={`rounded-lg border p-2.5 transition-colors ${
              on ? "border-blue-200 bg-blue-50/40" : "border-gray-100 bg-white"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Checkbox
                inputId={row.flag}
                checked={on}
                onChange={(e) =>
                  onPolicyChange({
                    [row.flag]: !!e.checked,
                    ...(e.checked ? {} : { [row.days]: null }),
                  } as Partial<PolicyState>)
                }
              />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={row.flag}
                  className="text-sm font-semibold text-gray-800 cursor-pointer"
                >
                  {row.title}
                </label>
                <p className="text-[11px] text-gray-500">
                  {isService
                    ? "Customer can cancel and get a refund before the booking date. No refund on or after the booking date."
                    : row.hint}
                </p>
              </div>
            </div>

            {on && showDays && (
              <div className="mt-2 sm:w-1/2">
                <label className="text-[10px] font-medium text-gray-500">
                  Within how many days
                  {row.daysRequired && <span className="text-red-500"> *</span>}
                </label>
                <InputNumber
                  value={policy[row.days]}
                  onValueChange={(e) =>
                    onPolicyChange({
                      [row.days]: e.value ?? null,
                    } as Partial<PolicyState>)
                  }
                  min={1}
                  max={365}
                  suffix=" days"
                  useGrouping={false}
                  placeholder={
                    row.daysRequired ? "Required" : "Delivery agent decides"
                  }
                  className="w-full"
                  inputClassName="w-full p-inputtext-sm"
                />
              </div>
            )}
          </div>
        );
      })}
      <p className="text-[10px] text-gray-500">
        Customers must give a reason for every return, replacement, refund or
        cancellation. You can reject a request if the reason is not valid.
      </p>
    </div>
  );
}

// ===============================================================
// [SETTINGS] Payment option (same as Store Settings)
// ===============================================================
const PAYMENT_CHOICES: {
  value: PaymentMode;
  title: string;
  desc: string;
  icon: string;
}[] = [
  {
    value: "BOTH",
    title: "Online + Cash on Delivery",
    desc: "Customers choose how to pay",
    icon: "pi-wallet",
  },
  {
    value: "ONLINE_ONLY",
    title: "Online payment only",
    desc: "Cash on Delivery is hidden",
    icon: "pi-credit-card",
  },
  {
    value: "OFF",
    title: "Payment off",
    desc: "No payment inside the app",
    icon: "pi-ban",
  },
];

function PaymentModeBlock({ storeId }: { storeId?: string | null }) {
  const [mode, setMode] = useState<PaymentMode | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isValidObjectId(storeId)) {
      setMode(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getStoreSettings(storeId as string);
        const m = res.data?.settings?.paymentMode;
        if (!cancelled) {
          setMode(["BOTH", "ONLINE_ONLY", "OFF"].includes(m) ? m : "BOTH");
        }
      } catch {
        if (!cancelled) setMode(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const change = async (next: PaymentMode) => {
    if (!isValidObjectId(storeId) || next === mode || saving) return;
    const prev = mode;
    setMode(next);
    try {
      setSaving(true);
      await updateStoreSettings(storeId as string, { paymentMode: next });
      toast.success("Payment option updated");
      window.dispatchEvent(new Event("storeSettingsChanged"));
    } catch (err: any) {
      setMode(prev);
      toast.error(
        err?.response?.data?.message || "Failed to update payment option",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!mode) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-gray-500 flex items-center gap-2">
        This is a store-wide setting. Changing it here also changes it in Store
        Settings for all products of this store.
        {saving && <i className="pi pi-spin pi-spinner text-blue-500"></i>}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PAYMENT_CHOICES.map((opt) => {
          const active = mode === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              disabled={saving}
              onClick={() => change(opt.value)}
              className={`text-left rounded-lg border p-2.5 transition-all disabled:opacity-60 ${
                active
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <i
                  className={`pi ${opt.icon} ${
                    active ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs font-semibold ${
                    active ? "text-blue-800" : "text-gray-700"
                  }`}
                >
                  {opt.title}
                </span>
                {active && (
                  <i className="pi pi-check-circle text-blue-600 ml-auto" />
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===============================================================
// MAIN FORM
// ===============================================================
function ProductFrom({ productId, onClose, onSuccess }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productCode, setProductCode] = useState<string>("");
  const [currentStockInfo, setCurrentStockInfo] = useState<number | null>(null);
  const isEditMode = !!productId;

  // video 15s er beshi hole trim dialog khule (prepareFiles), trimDialog form er baire render hoy
  const { prepareFiles, trimDialog } = useVideoTrimmer();

  const [businessType, setBusinessType] =
    useState<StoreBusinessType>("MADE_FOR_PRODUCT");
  const [madeForProduct, setMadeForProduct] = useState(false); // shudhu BOTH type e user choose kore
  const [editStockManaged, setEditStockManaged] = useState(true);
  const [productType, setProductType] = useState<ProductType>("PRODUCT");
  const [fastestDelivery, setFastestDelivery] = useState(false);
  const [policy, setPolicy] = useState<PolicyState>(DEFAULT_POLICY);
  const [dailyBookingLimit, setDailyBookingLimit] = useState<number | null>(
    null,
  );

  // [PICKUP] product er nijosho pickup address (off thakle store default)
  const [customPickup, setCustomPickup] = useState(false);
  const [pickup, setPickup] = useState<PickupAddress>(EMPTY_PICKUP);

  // hasColor = color variants on/off
  // hasSize  = global size/weight/height toggle
  const [hasColor, setHasColor] = useState(false);
  const [hasSize, setHasSize] = useState(false);
  const hasVariants = hasColor || hasSize;

  const {
    register,
    handleSubmit,
    control: typedControl,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(
      (isEditMode ? updateProductSchema : createProductSchema) as any,
    ),
    defaultValues: {
      name: "",
      description: "",
      unit: "",
      storeId: undefined,
      categoryId: undefined,
      mrp: undefined,
      offerPrice: undefined,
      openingStock: 0,
      lowStockThreshold: 0,
      packagingDetails: {},
      priceTiers: [],
      gst: {},
      gstInclusive: false,
      hsnCode: "",
      variants: [],
    },
  });

  const handleTypeChange = (t: ProductType) => {
    if (t === productType) return;
    setProductType(t);
    setValue("categoryId", undefined as any, { shouldValidate: false });
    if (t === "SERVICE") {
      setFastestDelivery(false);
      // [SERVICE] stock values clear
      setValue("openingStock", 0);
      setValue("lowStockThreshold" as any, 0);
      setMadeForProduct(false);
      setPolicy((p) => ({
        ...p,
        isReturnable: false,
        returnDays: null,
        isReplaceable: false,
        replaceDays: null,
        refundDays: null,
      }));
    } else {
      setDailyBookingLimit(null);
    }
  };

  const stockEnabled =
    productType === "SERVICE"
      ? false
      : isEditMode
        ? editStockManaged
        : businessType === "RETAIL" ||
          (businessType === "BOTH" && !madeForProduct);

  const control = typedControl as unknown as Control<any>;

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
    replace: replaceVariants,
  } = useFieldArray({ control, name: "variants" });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [colorImages, setColorImages] = useState<Record<string, ImageState>>(
    {},
  );

  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraOpenRef = useRef(false);
  const previewsRef = useRef<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const cameraTargetRef = useRef<string | null>(null);

  const selectedStoreId = watch("storeId");

  const watchedGst = useWatch({ control, name: "gst" as any });
  const watchedVariants = useWatch({ control, name: "variants" as any });
  const gstOn = hasAnyGstInForm(watchedGst, watchedVariants as any[]);

  const getUiKey = (field: any): string => field?._uiKey || field?.id;

  // ---------- Global values -> pre-fill rows ----------
  const getDefaults = (): Defaults => ({
    mrp: getValues("mrp") as any,
    offerPrice: getValues("offerPrice") as any,
    openingStock: (getValues("openingStock") as any) ?? 0,
    lowStockThreshold: (getValues("lowStockThreshold" as any) as any) ?? 0,
    sku: (getValues("sku" as any) as any) ?? "",
  });

  const normalize = (field: string, v: any) =>
    field === "openingStock" || field === "lowStockThreshold"
      ? (v ?? 0)
      : isNil(v)
        ? null
        : v;

  // Update the global field, then copy the new value into every color / size row
  // whose value still equals the previous global value (manual edits are kept).
  const onGlobalChange = (
    field: "mrp" | "offerPrice" | "openingStock" | "lowStockThreshold" | "sku",
    next: any,
  ) => {
    const prev = getValues(field as any);
    setValue(field as any, next, { shouldDirty: true });

    const variants = (getValues("variants") || []) as any[];
    const same = (a: any) => normalize(field, a) === normalize(field, prev);

    variants.forEach((v, i) => {
      if (same(v?.[field])) {
        setValue(`variants.${i}.${field}` as any, next);
      }
      (v?.sizeVariants || []).forEach((sv: any, j: number) => {
        if (same(sv?.[field])) {
          setValue(`variants.${i}.sizeVariants.${j}.${field}` as any, next);
        }
      });
    });
  };

  // ---------- Main product media (image / gif / video) ----------
  const addImageFiles = async (files: File[]) => {
    const valid = filterMediaFiles(files);
    if (!valid.length) return;
    const ready = await prepareFiles(valid);
    if (!ready.length) return;
    setImageFiles((prev) => [...prev, ...ready]);
    setImagePreviews((prev) => [
      ...prev,
      ...ready.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addImageFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const removeImage = (index: number, isExisting = false) => {
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const url = imagePreviews[index];
      if (url) URL.revokeObjectURL(url);
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const clearNewImages = () => {
    imagePreviews.forEach((u) => URL.revokeObjectURL(u));
    setImageFiles([]);
    setImagePreviews([]);
  };

  // ---------- Color media ----------
  const getColorImageState = (uiKey: string): ImageState =>
    colorImages[uiKey] || { existing: [], files: [], previews: [] };

  const addColorImageFiles = async (uiKey: string, files: File[]) => {
    const valid = filterMediaFiles(files);
    if (!valid.length) return;
    const ready = await prepareFiles(valid);
    if (!ready.length) return;
    setColorImages((prev) => {
      const cur = prev[uiKey] || { existing: [], files: [], previews: [] };
      return {
        ...prev,
        [uiKey]: {
          ...cur,
          files: [...cur.files, ...ready],
          previews: [
            ...cur.previews,
            ...ready.map((f) => URL.createObjectURL(f)),
          ],
        },
      };
    });
  };

  const removeColorImage = (
    uiKey: string,
    index: number,
    isExisting: boolean,
  ) => {
    setColorImages((prev) => {
      const cur = prev[uiKey] || { existing: [], files: [], previews: [] };
      if (isExisting) {
        return {
          ...prev,
          [uiKey]: {
            ...cur,
            existing: cur.existing.filter((_, i) => i !== index),
          },
        };
      }
      const url = cur.previews[index];
      if (url) URL.revokeObjectURL(url);
      return {
        ...prev,
        [uiKey]: {
          ...cur,
          files: cur.files.filter((_, i) => i !== index),
          previews: cur.previews.filter((_, i) => i !== index),
        },
      };
    });
  };

  // New rows start with the current global values
  const handleAddVariant = () => {
    const d = getDefaults();
    appendVariant(
      (hasColor
        ? buildEmptyColorVariant(hasSize, d)
        : buildEmptySizeVariant(d)) as any,
    );
  };

  const handleRemoveVariant = (index: number, uiKey: string) => {
    removeVariant(index);
    setColorImages((prev) => {
      const cur = prev[uiKey];
      if (cur) cur.previews.forEach((u) => URL.revokeObjectURL(u));
      const next = { ...prev };
      delete next[uiKey];
      return next;
    });
  };

  // ---------- Color toggle (keeps the size toggle state) ----------
  const toggleColor = (value: boolean) => {
    setColorImages({});
    const d = getDefaults();
    if (value) {
      setHasColor(true);
      replaceVariants([buildEmptyColorVariant(hasSize, d)] as any);
    } else {
      setHasColor(false);
      replaceVariants(hasSize ? ([buildEmptySizeVariant(d)] as any) : []);
    }
  };

  // ---------- Global size toggle ----------
  const toggleSize = (value: boolean) => {
    setHasSize(value);
    const d = getDefaults();
    if (hasColor) {
      const current = (getValues("variants") || []) as any[];
      replaceVariants(
        current.map((v) => ({
          ...v,
          sizeVariants: value
            ? v.sizeVariants?.length
              ? v.sizeVariants
              : [buildEmptySizeVariant(d)]
            : [],
        })) as any,
      );
      return;
    }
    replaceVariants(value ? ([buildEmptySizeVariant(d)] as any) : []);
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(
    async (mode: FacingMode) => {
      stopCamera();
      setCameraError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera is not supported in this browser, or the page is not served over HTTPS.",
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (!cameraOpenRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          setHasMultipleCameras(
            devices.filter((d) => d.kind === "videoinput").length > 1,
          );
        } catch {
          setHasMultipleCameras(false);
        }
      } catch (err: any) {
        switch (err?.name) {
          case "NotAllowedError":
          case "SecurityError":
            setCameraError(
              "Camera permission denied. Allow camera access in your browser settings and try again.",
            );
            break;
          case "NotFoundError":
          case "OverconstrainedError":
            setCameraError("No camera found on this device.");
            break;
          case "NotReadableError":
            setCameraError(
              "Camera is being used by another app. Close it and try again.",
            );
            break;
          default:
            setCameraError("Unable to access the camera.");
        }
      }
    },
    [stopCamera],
  );

  const openCamera = (targetUiKey: string | null = null) => {
    cameraOpenRef.current = true;
    cameraTargetRef.current = targetUiKey;
    setCapturedCount(0);
    setCameraError("");
    setCameraOpen(true);
  };

  const closeCamera = () => {
    cameraOpenRef.current = false;
    stopCamera();
    setCameraOpen(false);
  };

  const switchCamera = () => {
    const next: FacingMode =
      facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Failed to capture photo");
          return;
        }
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        if (cameraTargetRef.current) {
          addColorImageFiles(cameraTargetRef.current, [file]);
        } else {
          addImageFiles([file]);
        }
        setCapturedCount((c) => c + 1);
      },
      "image/jpeg",
      0.9,
    );
  };

  useEffect(() => {
    previewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      cameraOpenRef.current = false;
      stopCamera();
      previewsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [stopCamera]);

  useEffect(() => {
    fetchStores();
    if (productId) fetchProductData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // [CAT TYPE] store + product type onujayi category load.
  useEffect(() => {
    if (!isValidObjectId(selectedStoreId)) {
      setCategories([]);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        setCategoriesLoading(true);
        const res = await axiosInstance.get("/api/category", {
          params: { storeId: selectedStoreId, type: productType },
        });
        if (!cancelled) setCategories(res.data?.categories || []);
      } catch (err: any) {
        if (!cancelled) {
          toast.error(
            err?.response?.data?.message || "Failed to fetch categories",
          );
          setCategories([]);
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedStoreId, productType]);

  // [STOCK] create mode: selected store er stock management setting load
  useEffect(() => {
    if (isEditMode || !isValidObjectId(selectedStoreId)) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await getStoreSettings(selectedStoreId as string);
        if (!cancelled) {
          setBusinessType(resolveBusinessType(res.data?.settings));
          setMadeForProduct(false);
        }
      } catch {
        if (!cancelled) setBusinessType("MADE_FOR_PRODUCT");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedStoreId, isEditMode]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/api/product/single-product/${productId}`,
      );
      const product = res.data.product;

      setValue("name", product.name);
      setValue("description", product.description || "");
      setValue("unit", product.unit || "");
      setValue("packagingDetails", product.packagingDetails || {});
      // [GST] product level GST + inclusive flag
      setValue("gst" as any, (product.gst || {}) as any);
      setValue("gstInclusive" as any, (product.gstInclusive === true) as any);
      setValue("hsnCode" as any, (product.hsnCode || "") as any);

      setProductType(product.productType === "SERVICE" ? "SERVICE" : "PRODUCT");
      setDailyBookingLimit(product.dailyBookingLimit ?? null);
      setFastestDelivery(product.fastestDelivery === true);
      setPolicy({
        isReturnable: product.isReturnable === true,
        returnDays: product.returnDays ?? null,
        isReplaceable: product.isReplaceable === true,
        replaceDays: product.replaceDays ?? null,
        isRefundable: product.isRefundable === true,
        refundDays: product.refundDays ?? null,
      });
      setEditStockManaged(product.hasStockManagement !== false);
      setMadeForProduct(product.isMadeForProduct === true);

      const rawVariants: any[] = Array.isArray(product.variants)
        ? product.variants
        : [];
      const productHasColor = rawVariants.some((v) => v && v.color);
      const isSized = (v: any) =>
        Array.isArray(v?.sizeVariants) && v.sizeVariants.length > 0;

      setHasColor(productHasColor);
      setHasSize(
        productHasColor
          ? rawVariants.length > 0 && rawVariants.every(isSized)
          : rawVariants.length > 0,
      );

      if (rawVariants.length === 0) {
        setValue("mrp", product.mrp ?? undefined);
        setValue("offerPrice", product.offerPrice ?? undefined);
        setValue("openingStock", product.openingStock ?? 0);
        setValue("lowStockThreshold" as any, product.lowStockThreshold ?? 0);
        setValue("priceTiers" as any, (product.priceTiers || []) as any);
        setCurrentStockInfo(product.currentStock ?? null);
        replaceVariants([]);
      } else {
        const first = rawVariants[0];
        const firstRow = isSized(first) ? first.sizeVariants[0] : first;
        setValue("mrp", firstRow?.mrp ?? undefined);
        setValue("offerPrice", firstRow?.offerPrice ?? undefined);
        setValue("openingStock", firstRow?.openingStock ?? 0);
        setValue("lowStockThreshold" as any, firstRow?.lowStockThreshold ?? 0);
        setValue("sku" as any, (firstRow?.sku || "") as any);
        setValue("priceTiers" as any, [] as any);

        if (productHasColor) {
          const uiKeys = rawVariants.map(() => genUiKey());

          replaceVariants(
            rawVariants.map((v: any, idx: number) => ({
              _uiKey: uiKeys[idx],
              color: v.color || "",
              mrp: v.mrp ?? undefined,
              offerPrice: v.offerPrice ?? undefined,
              openingStock: v.openingStock ?? 0,
              lowStockThreshold: v.lowStockThreshold ?? 0,
              sku: v.sku || "",
              packagingDetails: v.packagingDetails || {},
              priceTiers: v.priceTiers || [],
              gst: v.gst || {}, // [GST]
              sizeVariants: isSized(v)
                ? v.sizeVariants.map((sv: any) => ({
                    size: sv.size || "",
                    weight: sv.weight || "",
                    height: sv.height || "",
                    mrp: sv.mrp ?? undefined,
                    offerPrice: sv.offerPrice ?? undefined,
                    openingStock: sv.openingStock ?? 0,
                    lowStockThreshold: sv.lowStockThreshold ?? 0,
                    sku: sv.sku || "",
                    packagingDetails: sv.packagingDetails || {},
                    priceTiers: sv.priceTiers || [],
                    gst: sv.gst || {}, // [GST]
                  }))
                : [],
            })) as any,
          );

          setColorImages(() => {
            const next: Record<string, ImageState> = {};
            rawVariants.forEach((v: any, idx: number) => {
              next[uiKeys[idx]] = {
                existing: Array.isArray(v.images) ? v.images : [],
                files: [],
                previews: [],
              };
            });
            return next;
          });
        } else {
          replaceVariants(
            rawVariants.map((v: any) => ({
              size: v.size || "",
              weight: v.weight || "",
              height: v.height || "",
              mrp: v.mrp ?? undefined,
              offerPrice: v.offerPrice ?? undefined,
              openingStock: v.openingStock ?? 0,
              lowStockThreshold: v.lowStockThreshold ?? 0,
              sku: v.sku || "",
              packagingDetails: v.packagingDetails || {},
              priceTiers: v.priceTiers || [],
              gst: v.gst || {}, // [GST]
            })),
          );
        }
      }

      // [PICKUP] address private, alada owner-only API theke ane
      try {
        const pr = await axiosInstance.get(
          `/api/product/pickup-address/${productId}`,
        );
        const pa = pr.data?.pickupAddress;
        if (pa) {
          setCustomPickup(true);
          setPickup({
            ...EMPTY_PICKUP,
            ...Object.fromEntries(
              Object.entries(pa).map(([k, v]) => [k, v ?? ""]),
            ),
          } as PickupAddress);
        } else {
          setCustomPickup(false);
          setPickup(EMPTY_PICKUP);
        }
      } catch {
        /* na ashle default store pickup-i thakbe */
      }

      setProductCode(product.productCode || "");
      if (Array.isArray(product.images)) setExistingImages(product.images);

      const storeId =
        typeof product.storeId === "object"
          ? product.storeId?._id
          : product.storeId;
      if (storeId) setValue("storeId", storeId);

      const categoryId =
        typeof product.categoryId === "object"
          ? product.categoryId?._id
          : product.categoryId;
      if (categoryId) setValue("categoryId", categoryId);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch product data",
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await axiosInstance.get("/api/register/user-based-stores");
      const list = res.data?.stores || [];
      setStores(list);
      if (list.length > 0 && !isEditMode) setValue("storeId", list[0]._id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch stores");
    }
  };

  // ---------- Validation ----------
  const priceError = (label: string, mrp: any, offer: any): string | null => {
    if (!isNil(mrp) && !isNil(offer) && Number(offer) > Number(mrp))
      return `${label}Selling price cannot be greater than MRP`;
    return null;
  };

  const validateSizeRow = (label: string, sv: any): string | null => {
    if (!hasAttribute(sv))
      return `${label}enter at least one of Size, Weight or Height`;
    return (
      priceError(label, sv.mrp, sv.offerPrice) ||
      validateTiers(label, sv.priceTiers, sv.mrp) ||
      validateGstFields(label, sv.gst) // [GST]
    );
  };

  const validateForm = (): string | null => {
    const values = getValues();
    const variants = (values.variants || []) as any[];

    if (!values.categoryId) {
      return `Please select a ${productType.toLowerCase()} category`;
    }

    // ---- [GST] product level ----
    const topGstErr = validateGstFields("", (values as any).gst);
    if (topGstErr) return topGstErr;

    if (hasAnyGstInForm((values as any).gst, variants)) {
      const hsn = String((values as any).hsnCode ?? "").trim();
      if (!hsn) return "HSN code is required when GST is applied";
      if (!HSN_REGEX.test(hsn)) return "HSN code must be 4, 6 or 8 digits";
    }

    // ---- [POLICY] return / replace / refund days ----
    if (
      productType === "PRODUCT" &&
      policy.isRefundable &&
      isNil(policy.refundDays)
    ) {
      return "Refund days is required for a refundable product";
    }
    const daysChecks: [string, boolean, number | null][] = [
      [
        "Return days",
        productType === "PRODUCT" && policy.isReturnable,
        policy.returnDays,
      ],
      [
        "Replace days",
        productType === "PRODUCT" && policy.isReplaceable,
        policy.replaceDays,
      ],
      [
        "Refund days",
        productType === "PRODUCT" && policy.isRefundable,
        policy.refundDays,
      ],
    ];
    for (const [label, on, val] of daysChecks) {
      if (!on || isNil(val)) continue;
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 365) {
        return `${label} must be a whole number between 1 and 365`;
      }
    }

    // ---- [PICKUP] ----
    if (customPickup) {
      const pickupErr = validatePickup(pickup);
      if (pickupErr) return pickupErr;
    }

    if (productType === "SERVICE" && !isNil(dailyBookingLimit)) {
      const n = Number(dailyBookingLimit);
      if (!Number.isInteger(n) || n < 1 || n > 10000) {
        return "Daily booking limit must be a whole number between 1 and 10000";
      }
    }

    if (stockEnabled) {
      const rows: any[] = !hasVariants
        ? [values]
        : variants.flatMap((v: any) => {
            const sizes = (v.sizeVariants || []).filter(
              (sv: any) => !isEmptySizeVariant(sv),
            );
            return sizes.length ? sizes : [v];
          });
      if (rows.some((r) => isNil(r?.openingStock)))
        return "Opening stock is required";
    }

    // ---- Media ----
    if (!hasColor && existingImages.length + imageFiles.length === 0) {
      return "Product image is required. Add at least one image or video in the 'Photos & Videos' section.";
    }

    // ---- Total upload count (backend multer files limit) ----
    let totalNewFiles = imageFiles.length;
    if (hasColor) {
      variants.forEach((_, i) => {
        totalNewFiles += getColorImageState(getUiKey(variantFields[i])).files
          .length;
      });
    }
    if (totalNewFiles > MAX_FILES_PER_REQUEST) {
      return `Too many files. You can upload at most ${MAX_FILES_PER_REQUEST} new files at once (currently ${totalNewFiles}).`;
    }

    // ---- Simple product ----
    if (!hasVariants) {
      return (
        priceError("", values.mrp, values.offerPrice) ||
        validateTiers("", (values as any).priceTiers, values.mrp)
      );
    }

    if (!variants.length) return "At least one variant is required";

    // ---- Color mode ----
    if (hasColor) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const label = `Color ${i + 1}: `;
        if (!String(v.color ?? "").trim())
          return `${label}color name is required`;

        const imgs = getColorImageState(getUiKey(variantFields[i]));
        if (imgs.existing.length + imgs.files.length === 0)
          return `${label}at least one image or video is required`;

        const colorGstErr = validateGstFields(label, v.gst);
        if (colorGstErr) return colorGstErr;

        const sizeRows = Array.isArray(v.sizeVariants) ? v.sizeVariants : [];

        if (sizeRows.length > 0) {
          const rows = sizeRows.filter((sv: any) => !isEmptySizeVariant(sv));
          if (!rows.length)
            return `${label}fill a size option or turn its size toggle off`;
          for (let j = 0; j < rows.length; j++) {
            const err = validateSizeRow(
              `Color ${i + 1} - Size ${j + 1}: `,
              rows[j],
            );
            if (err) return err;
          }
        } else {
          const err =
            priceError(label, v.mrp, v.offerPrice) ||
            validateTiers(label, v.priceTiers, v.mrp);
          if (err) return err;
        }
      }
      return null;
    }

    // ---- Plain size/weight/height variants ----
    for (let i = 0; i < variants.length; i++) {
      const err = validateSizeRow(`Variant ${i + 1}: `, variants[i]);
      if (err) return err;
    }
    return null;
  };

  // if the zod resolver blocks the submit, show the reason
  const onInvalid = (errs: any) => {
    console.log("Form validation errors:", errs);
    toast.error(firstErrorMessage(errs) || "Please check the form fields");
  };

  const onSubmit = async (data: ProductFormData) => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/product/update-product/${productId}`
        : `/api/product/create-product`;

      const formData = new FormData();
      formData.append("name", data.name || "");
      formData.append("description", data.description || "");
      formData.append("unit", data.unit || "");
      formData.append("hasColor", String(hasColor));
      appendPolicyFields(formData, productType, policy);
      formData.append(
        "fastestDelivery",
        String(productType !== "SERVICE" && fastestDelivery),
      );
      formData.append(
        "dailyBookingLimit",
        productType === "SERVICE" && !isNil(dailyBookingLimit)
          ? String(dailyBookingLimit)
          : "",
      );
      // [PICKUP] Faka string = backend e purono pickup muche jabe
      formData.append(
        "pickupAddress",
        customPickup ? JSON.stringify(cleanPickup(pickup)) : "",
      );

      if (!isEditMode) {
        formData.append(
          "isMadeForProduct",
          String(
            productType !== "SERVICE" &&
              (businessType === "MADE_FOR_PRODUCT" ||
                (businessType === "BOTH" && madeForProduct)),
          ),
        );
      }

      // [GST] product level
      formData.append(
        "gst",
        JSON.stringify(cleanGst((getValues() as any).gst) ?? {}),
      );
      formData.append(
        "gstInclusive",
        String((getValues() as any).gstInclusive === true),
      );

      {
        const v = getValues() as any;
        const gstActive = hasAnyGstInForm(v.gst, (v.variants || []) as any[]);
        formData.append(
          "hsnCode",
          gstActive ? String(v.hsnCode ?? "").trim() : "",
        );
      }

      if (!isEditMode && data.storeId)
        formData.append("storeId", String(data.storeId));
      if (data.categoryId)
        formData.append("categoryId", String(data.categoryId));

      existingImages.forEach((url) => formData.append("images", url));
      imageFiles.forEach((file, idx) =>
        appendMediaFile(formData, `image${idx}`, file),
      );

      const values = getValues();
      const globalPackaging = values.packagingDetails || {};

      const stockOf = (o: any) =>
        stockEnabled
          ? {
              openingStock: o?.openingStock ?? 0,
              lowStockThreshold: o?.lowStockThreshold ?? 0,
            }
          : { openingStock: 0, lowStockThreshold: 0 };

      if (!hasVariants) {
        if (!isNil(values.mrp)) formData.append("mrp", String(values.mrp));
        if (!isNil(values.offerPrice))
          formData.append("offerPrice", String(values.offerPrice));
        formData.append(
          "lowStockThreshold",
          String(stockEnabled ? ((values as any).lowStockThreshold ?? 0) : 0),
        );
        formData.append(
          "openingStock",
          String(stockEnabled ? (values.openingStock ?? 0) : 0),
        );
        formData.append("packagingDetails", JSON.stringify(globalPackaging));
        formData.append(
          "priceTiers",
          JSON.stringify(cleanTiers((values as any).priceTiers)),
        );
        formData.append("variants", JSON.stringify([]));
      } else {
        const variants = (values.variants || []) as any[];

        formData.append("priceTiers", JSON.stringify([]));

        const variantsPayload = variants.map((v, idx) => {
          const uiKey = getUiKey(variantFields[idx]);
          const imgState = uiKey
            ? getColorImageState(uiKey)
            : { existing: [] as string[] };

          if (hasColor) {
            const sizeRows = Array.isArray(v.sizeVariants)
              ? v.sizeVariants.filter((sv: any) => !isEmptySizeVariant(sv))
              : [];
            const color = String(v.color || "").trim() || undefined;

            // color + size options
            if (sizeRows.length > 0) {
              return {
                color,
                images: imgState.existing,
                gst: cleanGst(v.gst),
                packagingDetails: packagingOf(
                  v.packagingDetails,
                  globalPackaging,
                ),
                sizeVariants: sizeRows.map((sv: any) => ({
                  size: sv.size || undefined,
                  weight: sv.weight || undefined,
                  height: sv.height || undefined,
                  mrp: numOrUndef(sv.mrp),
                  offerPrice: numOrUndef(sv.offerPrice),
                  ...stockOf(sv),
                  sku: sv.sku || undefined,
                  priceTiers: cleanTiers(sv.priceTiers),
                  gst: cleanGst(sv.gst),
                  packagingDetails: packagingOf(
                    sv.packagingDetails,
                    globalPackaging,
                  ),
                })),
              };
            }

            // color without sizes
            return {
              color,
              images: imgState.existing,
              mrp: numOrUndef(v.mrp),
              offerPrice: numOrUndef(v.offerPrice),
              ...stockOf(v),
              sku: v.sku || undefined,
              priceTiers: cleanTiers(v.priceTiers),
              gst: cleanGst(v.gst),
              packagingDetails: packagingOf(
                v.packagingDetails,
                globalPackaging,
              ),
            };
          }

          // plain size/weight/height variant
          return {
            size: v.size || undefined,
            weight: v.weight || undefined,
            height: v.height || undefined,
            mrp: numOrUndef(v.mrp),
            offerPrice: numOrUndef(v.offerPrice),
            ...stockOf(v),
            sku: v.sku || undefined,
            priceTiers: cleanTiers(v.priceTiers),
            gst: cleanGst(v.gst),
            packagingDetails: packagingOf(v.packagingDetails, globalPackaging),
          };
        });

        formData.append("variants", JSON.stringify(variantsPayload));

        if (hasColor) {
          variants.forEach((_, idx) => {
            const uiKey = getUiKey(variantFields[idx]);
            const imgState = uiKey
              ? getColorImageState(uiKey)
              : { files: [] as File[] };
            imgState.files.forEach((file) =>
              appendMediaFile(formData, `variantImage_${idx}`, file),
            );
          });
        }
      }

      const res = await axiosInstance.request({
        url,
        method: isEditMode ? "put" : "post",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10 * 60 * 1000,
      });

      toast.success(
        res.data.message ||
          `Product ${isEditMode ? "updated" : "created"} successfully!`,
      );
      reset();
      clearNewImages();
      setExistingImages([]);
      setColorImages({});
      setCustomPickup(false);
      setPickup(EMPTY_PICKUP);
      onSuccess();
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;
      console.log("Product save error:", error.response?.data);
      toast.error(
        (Array.isArray(apiErrors) && apiErrors[0]?.message) ||
          error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} product`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <i className="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
      </div>
    );
  }

  const hasNewVideo =
    imageFiles.some(isVideoFile) ||
    Object.values(colorImages).some((s) => s.files.some(isVideoFile));

  const isService = productType === "SERVICE";
  const itemWord = isService ? "service" : "product";

  return (
    <div className="px-4 pt-2 pb-0 min-h-[80vh] bg-gray-50/60">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-3">
        {/* Edit mode info bar */}
        {isEditMode && productCode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-wrap">
            <i className="pi pi-hashtag text-blue-500"></i>
            <span className="text-sm text-gray-600">Product code:</span>
            <span className="text-sm font-semibold text-gray-800">
              {productCode}
            </span>
            {currentStockInfo !== null && !hasVariants && stockEnabled && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                Current stock: {currentStockInfo}
              </span>
            )}
          </div>
        )}

        <p className="text-[11px] text-gray-500">
          Fields marked <span className="text-red-500 font-semibold">*</span>{" "}
          are required. Everything else is optional.
        </p>

        {/* ============ 1. TYPE ============ */}
        <FormSection
          step={1}
          icon="pi-tag"
          title="What are you adding?"
          description="Choose first. This decides which categories and options you see."
          badge="Required"
        >
          <ProductTypeSelector
            value={productType}
            onChange={handleTypeChange}
          />
        </FormSection>

        {/* ============ 2. BASIC DETAILS ============ */}
        <FormSection
          step={2}
          icon="pi-box"
          title="Basic Details"
          description={`Name and describe your ${itemWord}.`}
          badge="Required"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <Field
              label="Category"
              required
              error={errors.categoryId?.message as string | undefined}
            >
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    options={categories.map((c) => ({
                      label: c.name,
                      value: c._id,
                    }))}
                    optionLabel="label"
                    optionValue="value"
                    placeholder={
                      !isValidObjectId(selectedStoreId)
                        ? "Loading..."
                        : categoriesLoading
                          ? "Loading categories..."
                          : categories.length === 0
                            ? `No ${itemWord} categories found. Add one first.`
                            : "Select category"
                    }
                    className="w-full border-blue-200"
                    disabled={
                      !isValidObjectId(selectedStoreId) || categoriesLoading
                    }
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
            </Field>

            <Field
              label={isService ? "Service name" : "Product name"}
              required
              error={errors.name?.message}
            >
              <InputText
                className="w-full"
                {...register("name")}
                placeholder={`Enter ${itemWord} name`}
              />
            </Field>

            <Field label="Unit" required error={errors.unit?.message}>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    options={UNIT_OPTIONS}
                    placeholder="Select unit"
                    className="w-full"
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
            </Field>
          </div>

          <Field
            label="Description"
            required
            error={errors.description?.message}
          >
            <InputTextarea
              className="w-full"
              rows={3}
              {...register("description")}
              placeholder={`Describe your ${itemWord}`}
            />
          </Field>
        </FormSection>

        {/* ============ 3. PHOTOS ============ */}
        <FormSection
          step={3}
          icon="pi-image"
          title="Photos & Videos"
          description={
            hasColor
              ? "Optional here. Add photos and videos inside each color below."
              : "Add at least one photo or video."
          }
          badge={hasColor ? "Optional" : "Required"}
        >
          {(existingImages.length > 0 || imagePreviews.length > 0) && (
            <div className="flex gap-2 flex-wrap">
              {existingImages.map((url, idx) => (
                <MediaThumb
                  key={`ex-${idx}`}
                  src={url}
                  isVideo={isVideoUrl(url)}
                  sizeClass="w-28 h-24"
                  removeBtnClass="top-1 right-1 p-1 text-xs"
                  onRemove={() => removeImage(idx, true)}
                />
              ))}
              {imagePreviews.map((src, idx) => (
                <MediaThumb
                  key={`new-${idx}`}
                  src={src}
                  isVideo={isVideoFile(imageFiles[idx])}
                  sizeClass="w-28 h-24"
                  removeBtnClass="top-1 right-1 p-1 text-xs"
                  onRemove={() => removeImage(idx, false)}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              type="file"
              multiple
              onChange={handleImageChange}
              className="flex-1 min-w-0 p-1.5 border border-dashed border-blue-300 rounded-lg bg-blue-50/30 text-sm"
              accept={MEDIA_ACCEPT}
            />
            <Button
              type="button"
              label="Take photo"
              icon="pi pi-camera"
              onClick={() => openCamera(null)}
              outlined
              className="shrink-0"
            />
          </div>
          <p className="text-[11px] text-gray-400">{MEDIA_HINT}</p>
        </FormSection>

        {/* ============ 4. COLORS & SIZES ============ */}
        <FormSection
          step={4}
          icon="pi-palette"
          title="Colors & Sizes"
          description={`Does your ${itemWord} come in different colors or sizes? Skip this if it does not.`}
          badge="Optional"
        >
          <ToggleRow
            icon="pi-palette"
            title="Different colors"
            description="Each color gets its own photos, videos and price."
            checked={hasColor}
            onChange={toggleColor}
          />
          <ToggleRow
            icon="pi-arrows-h"
            title="Different sizes / weights / heights"
            description={
              hasColor
                ? "Shortcut: turn size options on or off for all colors at once. You can also set them for one color inside its block."
                : "Add separate options with their own prices."
            }
            checked={hasSize}
            onChange={toggleSize}
          />

          {/* {!isEditMode && businessType === "BOTH" && !isService && (
            <ToggleRow
              icon="pi-wrench"
              iconClass="text-orange-500"
              tone="orange"
              title="Made for product"
              description="Turn on if this product is made after the customer orders it. No quantity needs to be entered. This cannot be changed after the product is created."
              checked={madeForProduct}
              onChange={setMadeForProduct}
            />
          )} */}
        </FormSection>

        {/* ============ 5. PRICING & STOCK ============ */}
        <FormSection
          step={5}
          icon="pi-indian-rupee"
          title={`Pricing${stockEnabled ? " & Stock" : ""}`}
          description={
            hasVariants
              ? "Fill the common values once. They are copied into every variant below, and you can still change any variant."
              : `Set the price${stockEnabled ? " and stock" : ""} of your ${itemWord}.`
          }
        >
          <div
            className={`grid grid-cols-2 gap-2.5 ${
              stockEnabled ? "sm:grid-cols-5" : "sm:grid-cols-3"
            }`}
          >
            <Field
              label="MRP"
              hint="Original price (optional)"
            >
              <Controller
                name="mrp"
                control={control}
                render={({ field: f }) => (
                  <InputNumber
                    value={f.value ?? null}
                    onValueChange={(e) => onGlobalChange("mrp", e.value)}
                    placeholder="Optional"
                    min={0}
                    className="w-full"
                    inputClassName="w-full"
                    useGrouping={false}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                  />
                )}
              />
            </Field>

            <Field
              label="Selling price"
              hint="Leave empty to quote later"
            >
              <Controller
                name="offerPrice"
                control={control}
                render={({ field: f }) => (
                  <InputNumber
                    value={f.value ?? null}
                    onValueChange={(e) => onGlobalChange("offerPrice", e.value)}
                    placeholder="Optional"
                    min={0}
                    className="w-full"
                    inputClassName="w-full"
                    useGrouping={false}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                  />
                )}
              />
            </Field>

            {stockEnabled && (
              <>
                <Field label="Opening stock" required>
                  <Controller
                    name="openingStock"
                    control={control}
                    render={({ field: f }) => (
                      <InputNumber
                        value={f.value ?? 0}
                        onValueChange={(e) =>
                          onGlobalChange("openingStock", e.value ?? 0)
                        }
                        placeholder="Opening stock"
                        min={0}
                        className="w-full"
                        inputClassName="w-full"
                        useGrouping={false}
                      />
                    )}
                  />
                </Field>
                <Field label="Low stock alert" hint="0 = off">
                  <Controller
                    name={"lowStockThreshold" as any}
                    control={control}
                    render={({ field: f }) => (
                      <InputNumber
                        value={f.value ?? 0}
                        onValueChange={(e) =>
                          onGlobalChange("lowStockThreshold", e.value ?? 0)
                        }
                        placeholder="0 = off"
                        min={0}
                        className="w-full"
                        inputClassName="w-full"
                        useGrouping={false}
                      />
                    )}
                  />
                </Field>
              </>
            )}

            <Field label="SKU" hint="Your own item code">
              <Controller
                name={"sku" as any}
                control={control}
                render={({ field: f }) => (
                  <InputText
                    className="w-full"
                    value={(f.value as string) ?? ""}
                    onChange={(e) => onGlobalChange("sku", e.target.value)}
                    placeholder="Optional"
                  />
                )}
              />
            </Field>
          </div>

          {/* Bulk pricing: only for simple products (variants have their own) */}
          {!hasVariants && (
            <PriceTiersBlock control={control} name="priceTiers" />
          )}

          {/* ---- Variant list ---- */}
          {hasVariants && (
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">
                    {hasColor ? "Color details" : "Variant details"}{" "}
                    <span className="text-red-500">*</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {hasColor
                      ? "Add each color with its own photos and prices."
                      : "Add each size / weight / height option."}
                  </p>
                </div>
                <Button
                  type="button"
                  label={hasColor ? "Add color" : "Add variant"}
                  icon="pi pi-plus"
                  onClick={handleAddVariant}
                  className="p-button-sm"
                  style={{
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                />
              </div>

              <div className="space-y-2.5 w-full min-w-0">
                {variantFields.map((field, index) => {
                  const uiKey = getUiKey(field);
                  return hasColor ? (
                    <div key={field.id} className="relative">
                      <ColorVariantBlock
                        control={control}
                        register={register}
                        colorIndex={index}
                        onRemoveColor={() => handleRemoveVariant(index, uiKey)}
                        canRemoveColor={variantFields.length > 1}
                        imgState={getColorImageState(uiKey)}
                        onAddImages={(files) =>
                          addColorImageFiles(uiKey, files)
                        }
                        onRemoveImage={(i, isExisting) =>
                          removeColorImage(uiKey, i, isExisting)
                        }
                        onOpenCamera={() => openCamera(uiKey)}
                        getDefaults={getDefaults}
                        showStock={stockEnabled}
                      />
                    </div>
                  ) : (
                    <div key={field.id} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-600">
                          Variant {index + 1}
                        </span>
                        {variantFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(index, uiKey)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                          >
                            <i className="pi pi-trash"></i> Remove
                          </button>
                        )}
                      </div>
                      <SizeVariantRow
                        control={control}
                        register={register}
                        basePath={`variants.${index}`}
                        index={index}
                        onRemove={() => handleRemoveVariant(index, uiKey)}
                        canRemove={variantFields.length > 1}
                        showRemove={false}
                        showStock={stockEnabled}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </FormSection>

        {/* ============ 6. TAX ============ */}
        <FormSection
          step={6}
          icon="pi-percentage"
          title="Tax (GST)"
          description="Only fill this if GST applies to your item."
          badge="Optional"
        >
          <GstFieldsBlock
            control={control}
            basePath="gst"
            title={
              hasVariants ? "GST rates (all variants)" : "GST rates"
            }
            hint={
              hasVariants
                ? "Applies to all variants. To use a different GST for a color or size, set a GST override on that variant."
                : undefined
            }
          />

          {/* HSN shows only when GST is set at any level */}
          {gstOn && (
            <Field
              label="HSN code"
              required
              hint="Enter a 4, 6 or 8 digit code. Required when GST is applied."
              className="border border-green-100 rounded-lg px-2.5 py-2 bg-green-50/40"
            >
              <Controller
                name={"hsnCode" as any}
                control={control}
                render={({ field }) => (
                  <InputText
                    className="w-full"
                    value={(field.value as string) ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/\D/g, "").slice(0, 8),
                      )
                    }
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="e.g. 6109 / 610910 / 61091000"
                  />
                )}
              />
            </Field>
          )}

          <Controller
            name={"gstInclusive" as any}
            control={control}
            render={({ field }) => (
              <ToggleRow
                tone="green"
                title="My prices already include GST"
                description="On: GST is calculated from within the price. Off: GST is added on top of the price."
                checked={!!field.value}
                onChange={(v) => field.onChange(v)}
              />
            )}
          />
        </FormSection>

        {/* ============ 7. DELIVERY / BOOKING + PICKUP ============ */}
        <FormSection
          step={7}
          icon={isService ? "pi-calendar-plus" : "pi-truck"}
          title={isService ? "Booking & Pickup" : "Delivery & Pickup"}
          description={
            isService
              ? "Limit daily bookings and set where the service happens."
              : "Package details help us calculate shipping. All optional."
          }
          badge="Optional"
        >
          {isService ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-2.5 space-y-1.5">
              <p className="text-sm font-semibold text-gray-800">
                Daily booking limit
              </p>
              <p className="text-[11px] text-gray-500">
                Maximum bookings per day for this service. When the limit is
                reached, customers must choose another date. Leave empty for no
                limit.
              </p>
              <div className="sm:w-1/2">
                <InputNumber
                  value={dailyBookingLimit}
                  onValueChange={(e) => setDailyBookingLimit(e.value ?? null)}
                  min={1}
                  max={10000}
                  useGrouping={false}
                  placeholder="No limit"
                  suffix=" bookings / day"
                  className="w-full"
                  inputClassName="w-full p-inputtext-sm"
                />
              </div>
            </div>
          ) : (
            <>
              <PackagingFieldsBlock
                control={control}
                basePath="packagingDetails"
                title="Package size & weight (default for all variants)"
              />
              <ToggleRow
                icon="pi-bolt"
                iconClass="text-orange-500"
                tone="orange"
                title="Show fastest delivery"
                description="Shows the time and charge of the fastest courier for this product. The shipping charge may be higher. When off, the normal delivery estimate is shown."
                checked={fastestDelivery}
                onChange={setFastestDelivery}
              />
            </>
          )}

          <PickupAddressBlock
            enabled={customPickup}
            onToggle={setCustomPickup}
            value={pickup}
            onChange={(patch) => setPickup((p) => ({ ...p, ...patch }))}
            isService={isService}
          />
        </FormSection>

        {/* ============ 8. RETURNS ============ */}
        <FormSection
          step={8}
          icon="pi-replay"
          title="Returns & Refunds"
          description={
            isService
              ? "Decide if customers can cancel for a refund."
              : "Decide what customers can do after delivery."
          }
          badge="Optional"
        >
          <ProductPolicyBlock
            productType={productType}
            policy={policy}
            onPolicyChange={(patch) => setPolicy((p) => ({ ...p, ...patch }))}
          />
        </FormSection>

        {/* ============ 9. PAYMENT ============ */}
        {isValidObjectId(selectedStoreId) && (
          <FormSection
            step={9}
            icon="pi-credit-card"
            title="Payment Options"
            description="How customers can pay for orders from your store."
            badge="Optional"
          >
            <PaymentModeBlock storeId={selectedStoreId} />
          </FormSection>
        )}

        {/* ============ STICKY SAVE BAR ============ */}
        <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-white/95 backdrop-blur border-t border-gray-200 flex gap-3">
          <Button
            type="button"
            label="Cancel"
            icon="pi pi-times"
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 border-0 hover:bg-gray-200"
            outlined
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            label={
              isSubmitting
                ? hasNewVideo
                  ? "Converting video..."
                  : "Saving..."
                : isEditMode
                  ? `Update ${isService ? "Service" : "Product"}`
                  : `Create ${isService ? "Service" : "Product"}`
            }
            icon={isSubmitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={isSubmitting}
          />
        </div>
      </form>

      {/* CAMERA DIALOG */}
      <Dialog
        header="Take Photo"
        visible={cameraOpen}
        onShow={() => startCamera(facingMode)}
        onHide={closeCamera}
        style={{ width: "min(92vw, 640px)" }}
        modal
        draggable={false}
      >
        <div className="space-y-3">
          {cameraError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 flex flex-col gap-2">
              <span className="flex items-start gap-2">
                <i className="pi pi-exclamation-circle mt-0.5"></i>
                {cameraError}
              </span>
              <Button
                type="button"
                label="Try again"
                icon="pi pi-refresh"
                size="small"
                outlined
                className="self-start"
                onClick={() => startCamera(facingMode)}
              />
            </div>
          )}

          <div
            className={`relative bg-black rounded-lg overflow-hidden ${cameraError ? "hidden" : ""}`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setCameraReady(true)}
              className="w-full"
              style={{ maxHeight: "60vh", objectFit: "contain" }}
            />
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <i className="pi pi-spin pi-spinner text-2xl"></i>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-gray-600">
              {capturedCount > 0
                ? `${capturedCount} photo${capturedCount > 1 ? "s" : ""} added`
                : "Capture as many photos as you need"}
            </span>
            <div className="flex gap-2">
              {hasMultipleCameras && (
                <Button
                  type="button"
                  icon="pi pi-sync"
                  label="Switch"
                  outlined
                  onClick={switchCamera}
                  disabled={!cameraReady}
                />
              )}
              <Button
                type="button"
                icon="pi pi-camera"
                label="Capture"
                onClick={capturePhoto}
                disabled={!cameraReady}
              />
              <Button
                type="button"
                icon="pi pi-check"
                label="Done"
                severity="success"
                onClick={closeCamera}
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* VIDEO TRIM DIALOG */}
      {trimDialog}
    </div>
  );
}

export default ProductFrom;