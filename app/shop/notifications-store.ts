"use client";
import { create } from "zustand";
import {
  fetchNotifications,
  filterNotificationsForStore,
  type AppNotification,
} from "./notifications-api";

type State = {
  unread: number;
  popups: AppNotification[];
  seen: Record<string, true>;
  ready: boolean;
  setUnread: (n: number) => void;
  poll: (storeMongoId?: string) => Promise<void>;
  dismiss: (id: string) => void;
  reset: () => void;
};

export const useNotifications = create<State>((set, get) => ({
  unread: 0,
  popups: [],
  seen: {},
  ready: false,

  setUnread: (n) => set({ unread: Math.max(0, n) }),

  poll: async (storeMongoId) => {
    try {
      const d = await fetchNotifications(undefined, 1, storeMongoId || undefined);
      const list = filterNotificationsForStore(d.notifications ?? [], [storeMongoId ?? ""]);
      const { seen, ready } = get();
      const nextSeen = { ...seen };
      const fresh: AppNotification[] = [];
      for (const n of list) {
        if (!nextSeen[n._id]) {
          nextSeen[n._id] = true;
          // first poll only records what already exists, so old ones don't pop up
          if (ready && !n.isRead) fresh.push(n);
        }
      }
      set({
        unread: d.unreadCount ?? list.filter((n) => !n.isRead).length,
        seen: nextSeen,
        ready: true,
        popups: [...get().popups, ...fresh].slice(-3),
      });
    } catch {
      /* keep the last known count */
    }
  },

  dismiss: (id) => set({ popups: get().popups.filter((p) => p._id !== id) }),
  reset: () => set({ unread: 0, popups: [], seen: {}, ready: false }),
}));