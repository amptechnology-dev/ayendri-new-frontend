const RAW_API = (
  process.env.NEXT_PUBLIC_API_URL || "https://backend.ayendri.com/api"
).replace(/\/+$/, "");

export const API = /\/api$/.test(RAW_API) ? RAW_API : `${RAW_API}/api`;