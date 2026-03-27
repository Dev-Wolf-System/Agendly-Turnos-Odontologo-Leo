import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número normalizado 549XXXXXXXXXX para display legible.
 * Ej: "5491112345678" → "+54 9 11 1234-5678"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 13 && digits.startsWith("549")) {
    const area = digits.slice(3, 5);
    const local = digits.slice(5);
    return `+54 9 ${area} ${local.slice(0, 4)}-${local.slice(4)}`;
  }

  // Si no matchea el formato esperado, devolver como está
  return phone;
}
