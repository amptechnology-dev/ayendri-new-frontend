"use client";
import axiosInstance from "@/service/axios.service";

const BASE = "/api/notifications";

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

export type AppNotification = {
  _id: string;
  type: string;
  title: string;
  body: string;
  storeId?: string | { _id?: string; id?: string } | null;
  orderId?: string | { _id?: string } | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationPage = {
  page?: number;
  totalPages?: number;
  unreadCount: number;
  notifications: AppNotification[];
};

export const notificationOrderId = (n: AppNotification): string | undefined => {
  const raw = n.orderId;
  const id = typeof raw === "object" && raw ? raw._id : raw;
  return id ? String(id) : undefined;
};

export function filterNotificationsForStore(list: AppNotification[], storeIds: string[]) {
  const ids = storeIds.filter(Boolean);
  if (!ids.length) return list;
  return list.filter((n) => {
    const s = n.storeId;
    if (!s) return true;
    const sid = typeof s === "string" ? s : (s._id ?? s.id);
    return !sid || ids.includes(sid);
  });
}

// token parameter ager moto thakche jate caller gulo na bhange,
// kintu ekhon use hoy na: axiosInstance interceptor nije token pathay.
export async function fetchNotifications(
  _token?: string,
  page = 1,
  storeId?: string,
): Promise<NotificationPage> {
  const { data } = await axiosInstance.get(BASE, {
    params: { page, limit: 20, ...(storeId ? { storeId } : {}) },
    ...noCreds,
  });
  return data;
}

export async function markRead(_token?: string, ids?: string[], storeId?: string) {
  await axiosInstance.patch(
    `${BASE}/read`,
    ids ? { notificationIds: ids } : undefined,
    { params: storeId ? { storeId } : undefined, ...noCreds },
  );
}

export async function deleteNotification(_token: string | undefined, id: string) {
  await axiosInstance.delete(`${BASE}/clear-single/${encodeURIComponent(id)}`, noCreds);
}

export async function clearAllNotifications(_token?: string, storeId?: string) {
  await axiosInstance.delete(`${BASE}/clear-all`, {
    params: storeId ? { storeId } : undefined,
    ...noCreds,
  });
}