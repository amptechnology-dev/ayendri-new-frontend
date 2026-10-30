export type ApiGst = {
  igst?: number | string | null;
  cgst?: number | string | null;
  sgst?: number | string | null;
};

export type ApiDelivery = {
  deliverable?: boolean;
  label?: string | null;
  minDays?: number | null;
  maxDays?: number | null;
  maxMinutes?: number | null;
  estimatedMinDate?: string | null;
  estimatedMaxDate?: string | null;
  shippingCharge?: number | null;
  shippingNote?: string | null;
  fastest?: boolean;
};