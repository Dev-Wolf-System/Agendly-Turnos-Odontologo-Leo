import axios from "axios";
import { getAccessToken } from "@/lib/auth-token";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isAuthRoute =
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/register");
      if (!isAuthRoute) {
        try {
          const { getSupabaseClient } = await import("@/lib/supabase-client");
          await getSupabaseClient().auth.signOut();
        } catch {
          // ignorar
        }
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
