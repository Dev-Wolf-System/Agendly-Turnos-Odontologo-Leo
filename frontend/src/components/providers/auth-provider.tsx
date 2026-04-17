"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { authService } from "@/services/auth.service";
import { getSupabaseClient } from "@/lib/supabase-client";
import api from "@/services/api";
import type { User, LoginRequest, RegisterRequest } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();

    // onAuthStateChange dispara INITIAL_SESSION al montar — es la única fuente de verdad.
    // Evitamos llamar getSession() por separado para no generar dos refreshes concurrentes
    // que traban la carga al recargar la página con token vencido.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED"
        ) {
          try {
            const response = await api.get<User>("/auth/me");
            if (mounted) setUser(response.data);
          } catch {
            if (mounted) setUser(null);
          } finally {
            if (mounted) setIsLoading(false);
          }
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (data: LoginRequest): Promise<User> => {
    const response = await authService.login(data);
    setUser(response.user);
    return response.user;
  };

  const register = async (
    data: RegisterRequest,
  ): Promise<{ success: boolean; message: string }> => {
    return authService.register(data);
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
