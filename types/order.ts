import axiosInstance from "@/service/axios.service";
import type { DeliveryInfo, OrderShipment } from "@/helper/delivery";

// 🔥 CHANGED: PENDING muche dewa hoyeche (order ekhon shoja CONFIRMED hoye start hoy)
export type OrderStatus = "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

// price on request flow
export type PriceStatus =
  | "NOT_REQUIRED"
  | "AWAITING_QUOTE"
  | "QUOTED"
  | "CONFIRMED";

// ---------- Payment ----------
export type PaymentMethod = "COD" | "ONLINE";

export type PaymentStatus =
  | "PENDING"
  | "INITIATED"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type PaymentAttemptStatus = "INITIATED" | "SUCCESS" | "FAILED";

export type OrderParcelItem = {
  productId?: string;
  variantId?: string | null;
  name?: string | null;
  quantity: number;
  unitWeightKg: number;
  lineWeightKg: number;
  length: number;
  breadth: number;
  height: number;
  usedDefaultWeight?: boolean;
  usedDefaultDims?: boolean;
};

export type OrderParcel = {
  length: number;
  breadth: number;
  height: number;
  weight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  dimsComplete?: boolean;
  weightComplete?: boolean;
  items: OrderParcelItem[];
};

export type PaymentAttempt = {
  txnid: string;
  amount: number;
  status: PaymentAttemptStatus;
  mihpayid?: string | null;
  mode?: string | null;
  bankRefNum?: string | null;
  errorMessage?: string | null;
  createdAt: string; // required
  completedAt?: string | null;
};

// ---------- GST ----------
export type GstRates = {
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
};

export type GstMode = "INTRA" | "INTER";

// [PICKUP] order place er somoy er pickup address snapshot (shudhu store side e ashe)
export type OrderPickupAddress = {
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

export type OrderItem = {
  _id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  productCode?: string;
  image?: string | null;
  unit?: string;
  color?: string | null;
  size?: string | null;
  weight?: string | null;
  height?: string | null;
  // price on request item e quote accept howar age null
  mrp: number | null;
  offerPrice: number | null;
  quantity: number;
  lineTotal: number | null;
  priceOnRequest?: boolean;

  // [GST] purono order e field na-o thakte pare
  gstRates?: GstRates | null;
  gstInclusive?: boolean;
  hsnCode?: string | null;
  taxableAmount?: number | null;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstAmount?: number;
  lineTotalWithGst?: number | null;
};

export type DeliveryAddress = {
  fullName: string;
  phone: string;
  addressLine: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type StatusHistoryEntry = {
  status: OrderStatus;
  changedBy?: string;
  note?: string | null;
  at: string;
};

export type OrderQuote = {
  items: { itemId: string; unitPrice: number }[];
  total: number;
  note?: string | null;
  quotedAt: string;
};

export type PriceHistoryEntry = {
  action: "QUOTED" | "ACCEPTED" | "REJECTED";
  byRole: "STORE" | "USER";
  total?: number;
  note?: string | null;
  at: string;
};

export type OrderRow = {
  _id: string;
  orderNumber: string;
  cartId?: string | null;
  checkoutId?: string | null;
  userId: { _id: string; name: string; email: string; phone: string };
  storeId: string;
  storeName?: string;
  storeUniqueId?: string;
  items: OrderItem[];
  totalItems: number;
  totalMrp: number;
  discount: number;
  // totalAmount = payable (GST soho)
  totalAmount: number;

  // [GST] purono order e field na-o thakte pare
  gstMode?: GstMode;
  subtotal?: number;
  totalTaxable?: number;
  totalCgst?: number;
  totalSgst?: number;
  totalIgst?: number;
  totalGst?: number;

  deliveryAddress: DeliveryAddress;
  note?: string | null;
  expectedDeliveryDate?: string | null;
  deliveryInfo?: DeliveryInfo | null;
  shipment?: OrderShipment | null;
  parcel?: OrderParcel | null;
  shippingCharge?: number;
  itemsTotal?: number | null;
  deliveryEnabled?: boolean;

  // [PICKUP] store side order details e ashe, customer API te kokhono na
  pickupAddress?: OrderPickupAddress | null;

  // ---------- payment ----------
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  // purono order e field na-o thakte pare
  paymentAttempts?: PaymentAttempt[];
  paidAt?: string | null;
  paymentExpiresAt?: string | null;

  status: OrderStatus;
  statusHistory?: StatusHistoryEntry[];
  // purono order e field na-o thakte pare (undefined = NOT_REQUIRED)
  priceStatus?: PriceStatus;
  quote?: OrderQuote | null;
  priceHistory?: PriceHistoryEntry[];
  cancelReason?: string | null;
  cancelledBy?: "USER" | "STORE" | null;
  createdAt: string;
  updatedAt: string;
  paymentOff?: boolean;

  // 🔥 CHANGED: auto-shipment fields
  autoShip?: boolean;
  shipStartDate?: string | null;
  shipmentDone?: boolean;
  shipError?: string | null;
};

// 🔥 CHANGED: PENDING remove
export const ORDER_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

// 🔥 CHANGED: PENDING key remove
export const STATUS_STYLES: Record<OrderStatus, string> = {
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

// 🔥 CHANGED: PENDING key remove
export const STATUS_ICONS: Record<OrderStatus, string> = {
  CONFIRMED: "pi pi-check-circle",
  SHIPPED: "pi pi-truck",
  DELIVERED: "pi pi-verified",
  CANCELLED: "pi pi-times-circle",
};

// ---------- Payment UI helpers ----------
export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  INITIATED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-800",
};

export const PAYMENT_STATUS_ICONS: Record<PaymentStatus, string> = {
  PENDING: "pi pi-clock",
  INITIATED: "pi pi-spinner",
  PAID: "pi pi-check-circle",
  FAILED: "pi pi-times-circle",
  REFUNDED: "pi pi-replay",
};

export const ATTEMPT_STYLES: Record<PaymentAttemptStatus, string> = {
  INITIATED: "bg-blue-100 text-blue-700",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export const TERMINAL_STATUSES: OrderStatus[] = ["DELIVERED", "CANCELLED"];

/**
 * 🔥 CHANGED: PENDING bad, SHIPPED ekhon auto (courier) set kore, manual na.
 * Backend er ALLOWED_TRANSITIONS er sathe match kore niyo.
 * key: target status, value: allowed *current* statuses.
 */
export const ALLOWED_FROM: Partial<Record<OrderStatus, OrderStatus[]>> = {
  SHIPPED: ["CONFIRMED"],
  DELIVERED: ["CONFIRMED", "SHIPPED"],
  CANCELLED: ["CONFIRMED"],
};

/** 🔥 CHANGED: Given current status, kon kon status-e move kora jabe (manual) */
export const getNextStatuses = (status: OrderStatus): OrderStatus[] => {
  if (status === "CONFIRMED") return ["DELIVERED", "CANCELLED"];
  if (status === "SHIPPED") return ["DELIVERED"];
  return [];
};

/** Store price estimate pathay / user accept-er opekkhay */
export const isQuotePending = (o: { priceStatus?: PriceStatus }) =>
  o.priceStatus === "AWAITING_QUOTE" || o.priceStatus === "QUOTED";

/** 🔥 CHANGED: ONLINE payment ekhono hoyni */
export const isPaymentPending = (o: OrderRow) =>
  o.paymentMethod === "ONLINE" &&
  !o.paymentOff &&
  o.paymentStatus !== "PAID" &&
  o.status === "CONFIRMED";

/** PATCH /store-orders/:orderId/status */
export const updateOrderStatusApi = (
  orderId: string,
  status: OrderStatus,
  note?: string,
) =>
  axiosInstance.patch(`/api/order/store-orders/${orderId}/status`, {
    status,
    ...(note ? { note } : {}),
  });

/** PATCH /store-orders/:orderId/quote */
export const submitQuoteApi = (
  orderId: string,
  items: { itemId: string; unitPrice: number }[],
  note?: string,
) =>
  axiosInstance.patch(`/api/order/store-orders/${orderId}/quote`, {
    items,
    ...(note ? { note } : {}),
  });

// 🔥 CHANGED: stage label (status badge hishebe dekhabe)
export const getStageLabel = (o: OrderRow): { label: string; tone: string } => {
  if (o.status === "CANCELLED")
    return { label: "Cancelled", tone: "bg-red-100 text-red-700" };
  if (o.status === "DELIVERED")
    return { label: "Delivered", tone: "bg-green-100 text-green-800" };
  if (o.status === "SHIPPED")
    return { label: "Shipped", tone: "bg-indigo-100 text-indigo-800" };

  // CONFIRMED
  if (o.priceStatus === "AWAITING_QUOTE")
    return { label: "Quote needed", tone: "bg-amber-100 text-amber-800" };
  if (o.priceStatus === "QUOTED")
    return { label: "Awaiting customer", tone: "bg-purple-100 text-purple-800" };
  if (isPaymentPending(o))
    return { label: "Awaiting payment", tone: "bg-amber-100 text-amber-800" };
  if (!o.autoShip)
    return { label: "Confirmed", tone: "bg-blue-100 text-blue-800" };
  if (o.shipError && !o.shipmentDone)
    return { label: "Courier retrying", tone: "bg-red-100 text-red-700" };
  if (o.shipmentDone || o.shipment?.awb)
    return { label: "Courier booked", tone: "bg-blue-100 text-blue-800" };
  if (o.shipStartDate && new Date(o.shipStartDate).getTime() > Date.now()) {
    const d = new Date(o.shipStartDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      timeZone: "Asia/Kolkata",
    });
    return { label: `Starts ${d}`, tone: "bg-sky-100 text-sky-800" };
  }
  return { label: "Booking courier", tone: "bg-blue-100 text-blue-800" };
};