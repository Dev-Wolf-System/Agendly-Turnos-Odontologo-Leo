"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./auth-provider";

export type ViewMode = "admin" | "professional";

interface ViewModeContextValue {
  /** Vista actualmente activa (puede ser distinta del rol real si el admin está como profesional). */
  viewMode: ViewMode;
  /** Rol efectivo según la vista actual. Lo que deben usar guards/sidebar. */
  effectiveRole: string;
  /** True si el usuario puede alternar entre vistas (admin con also_professional=true). */
  canSwitch: boolean;
  /** Cambia la vista activa. */
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: "admin",
  effectiveRole: "admin",
  canSwitch: false,
  setViewMode: () => {},
});

const STORAGE_KEY = "avax-view-mode";

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const canSwitch = user?.role === "admin" && !!user?.also_professional;
  const [viewMode, setViewModeState] = useState<ViewMode>("admin");

  // Hidratar desde localStorage al montar
  useEffect(() => {
    if (!canSwitch) {
      setViewModeState("admin");
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "professional" || saved === "admin") {
      setViewModeState(saved);
    }
  }, [canSwitch]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  const value = useMemo<ViewModeContextValue>(() => {
    const realRole = user?.role ?? "admin";
    const effectiveRole =
      canSwitch && viewMode === "professional" ? "professional" : realRole;
    return { viewMode, effectiveRole, canSwitch, setViewMode };
  }, [viewMode, canSwitch, user?.role]);

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
