import axiosInstance from "@/service/axios.service";
import type { DeliveryInfo, DurationUnit } from "@/helper/delivery";

export type DeliveryType = "LOCAL" | "NATIONAL" | "BOTH";

export type LocalSlab = {
  upToKm: number;
  charge: number;
  etaValue: number;
  etaUnit: DurationUnit;
  etaMinutes?: number;
};

export type ChargeRule = { minOrderValue: number; charge: number };

export type DeliverySettings = {
  _id: string;
  storeId: string;
  deliveryType: DeliveryType;
  pincode: string;
  radiusKm: number | null;
  localSlabs?: LocalSlab[];
  localDeliveryDays?: number;
  localDeliveryCharge?: number;
  // purono field (notun save e khali). Notun rule na thakle eta-i duto type er fallback
  chargeRules?: ChargeRule[];
  // [NEW] product / service alada rule
  productChargeRules?: ChargeRule[];
  serviceChargeRules?: ChargeRule[];
  nationalMinDays: number;
  nationalMaxDays: number;
  nationalFallbackCharge?: number;
  allowInternational?: boolean;
  internationalMinDays?: number;
  internationalMaxDays?: number;
  internationalFallbackCharge?: number;
  handlingValue?: number;
  handlingUnit?: DurationUnit;
  handlingDays?: number;
  isActive: boolean;
};

export type SaveDeliveryPayload = {
  storeId: string;
  deliveryType: DeliveryType;
  pincode: string;
  radiusKm?: number;
  localSlabs?: LocalSlab[];
  // [NEW]
  productChargeRules?: ChargeRule[];
  serviceChargeRules?: ChargeRule[];
  nationalMinDays?: number;
  nationalMaxDays?: number;
  nationalFallbackCharge?: number;
  allowInternational?: boolean;
  internationalMinDays?: number;
  internationalMaxDays?: number;
  internationalFallbackCharge?: number;
  handlingValue?: number;
  handlingUnit?: DurationUnit;
};

export type PincodeInfo = {
  pincode: string;
  area?: string;
  district?: string;
  state?: string;
};

export type ProductType = "PRODUCT" | "SERVICE";

export type DeliveryCheckResult = {
  success: boolean;
  deliverable: boolean;
  configured: boolean;
  message: string | null;
  productType?: ProductType; // [NEW]
  delivery: DeliveryInfo | null;
  isFree?: boolean; // [NEW]
  freeDeliveryAbove?: number | null; // [NEW] ei product type er free threshold
  freeDeliveryRules?: { PRODUCT: number | null; SERVICE: number | null } | null; // [NEW]
  payment?: {
    paymentMode: "BOTH" | "ONLINE_ONLY" | "OFF";
    codAvailable: boolean;
    onlineAvailable: boolean;
  };
};

export const getDeliverySettings = (storeId: string) =>
  axiosInstance.get(`/api/delivery/settings/${storeId}`);

export const saveDeliverySettings = (payload: SaveDeliveryPayload) =>
  axiosInstance.put("/api/delivery/settings", payload);

export const getServicePincodes = (storeId: string) =>
  axiosInstance.get(`/api/delivery/settings/${storeId}/service-pincodes`);

export const lookupPincode = (pincode: string) =>
  axiosInstance.get(`/api/delivery/pincode/${pincode}`);

export const checkDelivery = (
  storeUniqueId: string,
  pincode: string,
  opts?: {
    country?: string;
    itemsTotal?: number;
    productId?: string;
    variantId?: string | null;
    quantity?: number;
    cod?: boolean;
    productType?: ProductType; // [NEW]
  },
) =>
  axiosInstance.get("/api/delivery/check", {
    params: {
      storeUniqueId,
      pincode,
      ...(opts?.country ? { country: opts.country } : {}),
      ...(opts?.itemsTotal !== undefined
        ? { itemsTotal: opts.itemsTotal }
        : {}),
      ...(opts?.productId ? { productId: opts.productId } : {}),
      ...(opts?.variantId ? { variantId: opts.variantId } : {}),
      ...(opts?.quantity ? { quantity: opts.quantity } : {}),
      ...(opts?.cod ? { cod: 1 } : {}),
      ...(opts?.productType ? { productType: opts.productType } : {}),
    },
  });

// ===================== [NEW] SHIPPING COST REPORT (STORE) =====================
export type ShippingCostRow = {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  storeName?: string;
  status: string;
  paymentMethod: string;
  courierName: string | null;
  courierMode: "AIR" | "SURFACE" | null;
  awb: string | null;
  shipmentStatus: string | null;
  booked: boolean;
  courierCost: number;
  customerPaid: number;
  freeForCustomer: boolean;
  storeBears: number;
  note: string | null;
};

export type ShippingCostSummary = {
  orders: number;
  courierCost: number;
  customerPaid: number;
  storeBears: number;
  freeOrders: number;
  booked: { orders: number; courierCost: number; storeBears: number };
  pending: { orders: number; courierCost: number; storeBears: number };
};

export const getShippingCostReport = (params?: {
  storeId?: string;
  from?: string;
  to?: string;
  booked?: "true" | "false";
  page?: number;
  limit?: number;
}) => axiosInstance.get("/api/delivery/shipping-cost", { params });