import axios from "axios";
import { getSupabaseClient } from "@/lib/supabase-client";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch {
      // getSupabaseClient puede fallar si las env vars no están definidas en SSR
    }
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
          const supabase = getSupabaseClient();
          await supabase.auth.signOut();
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
