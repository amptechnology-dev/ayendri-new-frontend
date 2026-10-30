"use client";
import axiosInstance from "@/service/axios.service";

export type SavedAddress = {
  _id?: string;
  label?: string;
  fullName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
};

const BASE = "/api/login/addresses";

// only the fields the backend schema knows about
const toPayload = (a: SavedAddress) => ({
  label: a.label || "HOME",
  addressLine: a.addressLine.trim(),
  ...(a.area?.trim() ? { area: a.area.trim() } : {}),
  city: a.city.trim(),
  state: a.state.trim(),
  pincode: a.pincode.trim(),
  country: a.country?.trim() || "India",
});

const norm = (v?: string) => (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const sameAddress = (a: SavedAddress, b: SavedAddress) =>
  norm(a.addressLine) === norm(b.addressLine) &&
  norm(a.area) === norm(b.area) &&
  norm(a.city) === norm(b.city) &&
  norm(a.state) === norm(b.state) &&
  norm(a.pincode) === norm(b.pincode);

// Default address first
export async function getSavedAddresses(contact?: {
  fullName?: string;
  phone?: string;
}): Promise<SavedAddress[]> {
  const res = await axiosInstance.get(BASE);
  const list: SavedAddress[] = res.data?.addresses ?? res.data?.data?.addresses ?? [];
  return [...list]
    .sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault))
    .map((a) => ({
      ...a,
      fullName: a.fullName || contact?.fullName || "",
      phone: a.phone || contact?.phone || "",
    }));
}

// Used after an order: skips duplicates and never throws,
// so a failed save can't make a successful order look failed.
export async function addSavedAddress(address: SavedAddress) {
  try {
    const existing = await getSavedAddresses();
    if (existing.some((a) => sameAddress(a, address))) return;
    await axiosInstance.post(BASE, toPayload(address));
  } catch (e) {
    console.warn("[Addresses] could not save address", e);
  }
}

// For an address-management page (these throw, so the page can show the error)
export const createSavedAddress = (a: SavedAddress) =>
  axiosInstance.post(BASE, toPayload(a)).then((r) => r.data);
export const updateSavedAddress = (id: string, a: SavedAddress) =>
  axiosInstance.put(`${BASE}/${encodeURIComponent(id)}`, toPayload(a)).then((r) => r.data);
export const deleteSavedAddress = (id: string) =>
  axiosInstance.delete(`${BASE}/${encodeURIComponent(id)}`).then((r) => r.data);
export const setDefaultSavedAddress = (id: string) =>
  axiosInstance.patch(`${BASE}/${encodeURIComponent(id)}/default`).then((r) => r.data);