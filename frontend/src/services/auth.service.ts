import { getSupabaseClient } from "@/lib/supabase-client";
import api from "./api";
import type { RegisterRequest } from "@/types";

const SUPABASE_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Email o contraseña incorrectos",
  "Email not confirmed": "Debés confirmar tu email antes de iniciar sesión",
  "User not found": "No existe una cuenta con ese email",
  "Too many requests": "Demasiados intentos. Esperá unos minutos e intentá de nuevo",
};

function mapSupabaseError(message: string): string {
  return SUPABASE_ERROR_MAP[message] ?? message;
}

export const authService = {
  async login(data: { email: string; password: string }) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw new Error(mapSupabaseError(error.message));
    }

    // Obtener datos del usuario desde nuestra API (incluye clinicaId, role, etc.)
    const response = await api.get("/auth/me");
    return { user: response.data };
  },

  async register(data: RegisterRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async logout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  async getAccessToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  },

  async isAuthenticated(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },
};
