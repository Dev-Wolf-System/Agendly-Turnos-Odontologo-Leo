import { getSupabaseClient } from "@/lib/supabase-client";
import { setAccessToken } from "@/lib/auth-token";
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
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw new Error(mapSupabaseError(error.message));
    }

    // Disponibilizar el token inmediatamente para el interceptor de api.ts
    if (authData.session?.access_token) {
      setAccessToken(authData.session.access_token);
    }

    // Obtener datos del usuario desde nuestra API (incluye clinicaId, role, etc.)
    try {
      const response = await api.get("/auth/me");
      return { user: response.data };
    } catch (apiError: any) {
      // Si el backend no responde, cerrar sesión de Supabase para no quedar en estado inconsistente
      await supabase.auth.signOut();
      const msg =
        apiError?.code === "ECONNABORTED"
          ? "El servidor no responde. Verificá que el backend esté activo."
          : apiError?.response?.data?.message ?? apiError?.message ?? "Error al conectar con el servidor";
      throw new Error(msg);
    }
  },

  async register(data: RegisterRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async logout() {
    setAccessToken(null);
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
