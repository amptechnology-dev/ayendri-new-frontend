"use client";
import axios from "axios";
import { create } from "zustand";
import { API as BASE } from "./config";

const KEY = "ayendri-shop-auth"; // separate from the dashboard's "login-token"

export type ShopUser = { id: string; name: string; email: string; phone?: string; picture?: string };

export const shopApi = axios.create({ baseURL: BASE, timeout: 30000 });

const authHeaders = (t: string) => ({ "x-access-token": t, Authorization: `Bearer ${t}` });

shopApi.interceptors.request.use((cfg) => {
  // same rule as the app: if the base already ends in /api (or is the /backend proxy), don't repeat /api
  if ((BASE.endsWith("/api") || BASE.endsWith("/backend")) && cfg.url?.startsWith("/api/")) {
    cfg.url = cfg.url.slice(4);
  }
  const t = useAuth.getState().token;
  if (t) {
    cfg.headers["x-access-token"] = t;
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

export const errMsg = (e: any, fallback: string) => {
  const d = e?.response?.data;
  if (d?.errors?.[0]?.message) return d.errors[0].message;
  if (d?.message) return d.message;
  if (e?.response) return `${fallback} (HTTP ${e.response.status})`;
  if (e?.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (e?.code === "ERR_NETWORK")
    return "Cannot reach the server. Check that the backend is running and allows this origin (CORS).";
  return e?.message || fallback;
};

type OtpLoginResponse = {
  token: string;
  user: {
    id?: string;
    _id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    role?: string;
    image?: string;
    picture?: string;
    isActive?: boolean;
  };
};

type State = {
  token: string | null;
  user: ShopUser | null;
  ready: boolean;
  hydrate: () => void;
  signIn: (
    email: string,
    password: string,
    remember: boolean
  ) => Promise<void>;
  loginWithOtp: (
    data: OtpLoginResponse,
    remember: boolean
  ) => Promise<void>;
  signOut: () => void;
};

export const useAuth = create<State>((set, get) => ({
  token: null,
  user: null,
  ready: false,

  hydrate: () => {
    try {
      const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
      const s = raw ? JSON.parse(raw) : null;
      set({ token: s?.token ?? null, user: s?.user ?? null, ready: true });
    } catch {
      set({ token: null, user: null, ready: true });
    }
  },

  signIn: async (email, password, remember) => {
    let res;
    try {
      res = await shopApi.post("/api/login", { email, password, role: "USER" }); // same body as the app
    } catch (e) {
      throw new Error(errMsg(e, "Sign in failed. Please try again."));
    }

    const token: string | undefined = res.data?.token;
    if (!token) throw new Error(res.data?.message || "Sign in failed. Please try again.");

    let u = res.data.user ?? res.data.data;
    try {
      const p = await shopApi.get("/api/login/profile-page", { headers: authHeaders(token) });
      u = p.data?.user ?? p.data?.data ?? u;
    } catch {}

    if (u?.role && u.role !== "USER") {
      throw new Error("This is a seller/admin account. Please use the seller login.");
    }

    const user: ShopUser = {
      id: u?._id || u?.id,
      name: u?.name || [u?.first_name, u?.last_name].filter(Boolean).join(" ") || email,
      email: u?.email || email,
      phone: u?.phone,
      picture: u?.image ?? u?.picture,
    };
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify({ token, user }));
    set({ token, user, ready: true });
  },

  loginWithOtp: async (data, remember) => {
    const { token, user: u } = data;

    if (!token || !u) {
      throw new Error("Invalid login response from server.");
    }

    if (u.role && !["USER"].includes(u.role)) {
      throw new Error(
        "Your account does not have permission to access this store."
      );
    }

    if (u.isActive === false) {
      throw new Error(
        "Your account is inactive. Please contact support."
      );
    }

    const user: ShopUser = {
      id: u.id || u._id || "",
      name:
        u.name ||
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        u.email ||
        u.phone ||
        "Ayendri User",
      email: u.email || "",
      phone: u.phone,
      picture: u.image ?? u.picture,
    };

    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);

    (remember ? localStorage : sessionStorage).setItem(
      KEY,
      JSON.stringify({ token, user })
    );

    set({ token, user, ready: true });
  },

  signOut: () => {
  const t = get().token;

  if (t) {
    shopApi
      .post("/api/login/logout", null, { headers: authHeaders(t) })
      .catch(() => {});
  }

  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);

  set({ token: null, user: null, ready: true });
},
}));