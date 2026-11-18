const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://adet-backend-dbxs.onrender.com";

export const CONFIG = {
  API_BASE_URL: rawBaseUrl.replace(/\/+$/, ""),
  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
  },
  ROUTES: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard",
  },
  ENDPOINTS: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    POSITIONS: "/positions",
  },
} as const;