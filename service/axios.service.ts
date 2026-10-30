import axios from "axios";

const SHOP_KEY = "ayendri-shop-auth";

const readShopToken = (): string | null => {
  try {
    const raw =
      localStorage.getItem(SHOP_KEY) ?? sessionStorage.getItem(SHOP_KEY);
    return raw ? (JSON.parse(raw)?.token ?? null) : null;
  } catch {
    return null;
  }
};

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token =
        readShopToken() ||
        localStorage.getItem("login-token") ||
        sessionStorage.getItem("login-token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers["x-access-token"] = token;
      }
    }
    return config;
  },
  (err) => Promise.reject(err),
);

export default axiosInstance;