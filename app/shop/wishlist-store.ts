"use client";
import { create } from "zustand";
import { fetchWishlist, addToWishlist, removeFromWishlist } from "./wishlist";

type State = {
  ids: Set<string>;
  pending: Set<string>;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  setIds: (ids: string[]) => void;
  drop: (id: string) => void;
  toggle: (id: string) => Promise<void>;
  clear: () => void;
};

export const useWishlist = create<State>((set, get) => ({
  ids: new Set(),
  pending: new Set(),
  loaded: false,

  load: async (force = false) => {
    if (get().loaded && !force) return;
    try {
      const items = await fetchWishlist();
      set({ ids: new Set(items.map((i) => i.id)), loaded: true });
    } catch {
      // keep the hearts empty; the next load will retry
    }
  },

  setIds: (ids) => set({ ids: new Set(ids), loaded: true }),

  drop: (id) => {
    const next = new Set(get().ids);
    next.delete(id);
    set({ ids: next });
  },

  toggle: async (id) => {
    if (get().pending.has(id)) return;
    const was = get().ids.has(id);

    const optimistic = new Set(get().ids);
    if (was) optimistic.delete(id);
    else optimistic.add(id);
    set({ ids: optimistic, pending: new Set(get().pending).add(id) });

    try {
      if (was) await removeFromWishlist(id);
      else await addToWishlist(id);
    } catch (e) {
      const back = new Set(get().ids);
      if (was) back.add(id);
      else back.delete(id);
      set({ ids: back });
      throw e;
    } finally {
      const p = new Set(get().pending);
      p.delete(id);
      set({ pending: p });
    }
  },

  clear: () => set({ ids: new Set(), pending: new Set(), loaded: false }),
}));