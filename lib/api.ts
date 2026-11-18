import { CONFIG } from "./config";
import { clearTokens, getAccessToken } from "./auth";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = false, headers, ...restOptions } = options;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const baseUrl = CONFIG.API_BASE_URL.replace(/\/+$/, "");
  const url = `${baseUrl}/${endpoint.replace(/^\/+/, "")}`;

  const response = await fetch(url, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...restOptions,
  });

  if (response.status === 401 && requiresAuth) {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = CONFIG.ROUTES.LOGIN;
    }
    throw new Error("Session expired. Please log in again.");
  }

  const text = await response.text();
  let data: any = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok || data?.error) {
    const rawError = data?.message ?? data?.error;
    const errorMessage = Array.isArray(rawError)
      ? rawError.join(", ")
      : rawError || "An unexpected error occurred.";
    throw new Error(errorMessage);
  }

  return data as T;
}