"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import clinicaService, { Clinica } from "@/services/clinica.service";
import { useAuth } from "./auth-provider";

interface ClinicaContextType {
  clinica: Clinica | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

const ClinicaContext = createContext<ClinicaContextType | undefined>(undefined);

export function ClinicaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await clinicaService.getMe();
      setClinica(data);
    } catch {
      // silently fail — user might not be logged in
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      reload();
    } else {
      setClinica(null);
      setIsLoading(false);
    }
  }, [user, reload]);

  return (
    <ClinicaContext.Provider value={{ clinica, isLoading, reload }}>
      {children}
    </ClinicaContext.Provider>
  );
}

export function useClinica() {
  const context = useContext(ClinicaContext);
  if (!context) throw new Error("useClinica must be used within ClinicaProvider");
  return context;
}
