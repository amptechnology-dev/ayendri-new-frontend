"use client";
import React from "react";

export type PickupContact = {
  contactName?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

// 10 digit hole 91 prefix, nahole jeta ache seta (country code soho)
export const toWhatsAppNumber = (phone?: string | null, cc = "91") => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `${cc}${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `${cc}${digits.slice(1)}`;
  return digits;
};

export const formatPickupAddress = (a?: PickupContact | null) =>
  [a?.addressLine, a?.area, a?.city, a?.state, a?.pincode]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(", ");

// wa.me: desktop e WhatsApp Web / app, mobile e app e khule
export const buildWhatsAppLink = (phone?: string | null, message = "") => {
  const n = toWhatsAppNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : null;
};

const fmtDate = (d?: string | Date | null) => {
  if (!d) return null;
  const x = new Date(d);
  return Number.isNaN(x.getTime())
    ? null
    : x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const buildPickupMessage = (o: {
  contactName?: string;
  storeName?: string;
  productName?: string;
  productCode?: string;
  productType?: "PRODUCT" | "SERVICE";
  quantity?: number;
  orderNumber?: string;
  address?: string;
  pickupDate?: string | Date | null;
  courierName?: string | null;
  awb?: string | null;
}) => {
  const kind = o.productType === "SERVICE" ? "Service" : "Product";
  const date = fmtDate(o.pickupDate);
  return [
    `Hello ${o.contactName || ""},`.replace(" ,", ","),
    `This is ${o.storeName || "the store"}.`,
    o.orderNumber ? `Order: ${o.orderNumber}` : null,
    o.productName
      ? `${kind}: ${o.productName}${o.productCode ? ` (${o.productCode})` : ""}${
          o.quantity ? ` x ${o.quantity}` : ""
        }`
      : null,
    o.address ? `Pickup address: ${o.address}` : null,
    date ? `Courier pickup date: ${date}` : null,
    o.courierName ? `Courier: ${o.courierName}` : null,
    o.awb ? `AWB: ${o.awb}` : null,
    "Please keep it packed and ready for pickup. Thank you.",
  ]
    .filter(Boolean)
    .join("\n");
};

// phone number-i clickable, click korle WhatsApp e message ready hoye khule
export function PickupWhatsAppButton({
  phone,
  message,
  canSend = true, // role === "STORE" hole true pass koro
  className = "",
}: {
  phone?: string | null;
  message: string;
  canSend?: boolean;
  className?: string;
}) {
  if (!canSend || !phone) return <span>{phone || "-"}</span>;
  const href = buildWhatsAppLink(phone, message);
  if (!href) return <span>{phone}</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Send details on WhatsApp"
      className={`inline-flex items-center gap-1.5 text-green-700 font-semibold hover:underline ${className}`}
    >
      <i className="pi pi-whatsapp" />
      {phone}
    </a>
  );
}