/**
 * Normaliza un número de teléfono argentino al formato 549XXXXXXXXXX.
 *
 * Ejemplos de entrada → salida:
 *   "+54 9 11 1234-5678"  → "5491112345678"
 *   "54 9 11 12345678"    → "5491112345678"
 *   "011 1234-5678"       → "5491112345678"
 *   "11 12345678"         → "5491112345678"
 *   "1112345678"          → "5491112345678"
 *   "549 11 12345678"     → "5491112345678"
 *   "+5491112345678"      → "5491112345678"
 *   "15 1234-5678"        → "5491112345678" (requiere código de área por contexto)
 *
 * Reglas:
 * 1. Elimina todo lo que no sea dígito
 * 2. Elimina el "15" del inicio de la parte local (viejo formato móvil)
 * 3. Elimina el "0" del código de área (011 → 11)
 * 4. Asegura prefijo "549"
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Eliminar todo excepto dígitos
  let digits = phone.replace(/\D/g, '');

  if (digits.length === 0) return null;

  // Si ya tiene formato completo 549XXXXXXXXXX (13 dígitos)
  if (digits.length === 13 && digits.startsWith('549')) {
    return digits;
  }

  // Si empieza con 54 pero sin el 9 (ej: 541112345678 → 12 dígitos)
  if (digits.startsWith('54') && !digits.startsWith('549') && digits.length === 12) {
    return '549' + digits.slice(2);
  }

  // Si empieza con 549 pero tiene dígitos extra o menos, limpiamos
  if (digits.startsWith('549')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('54')) {
    digits = digits.slice(2);
  }

  // Eliminar el 0 del inicio (código de área con 0: 011, 0351, etc.)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Eliminar el 15 del inicio de la parte local (viejo formato móvil)
  // Solo si después del código de área (2-4 dígitos) viene 15
  // Ej: "11 15 12345678" → ya no se usa mucho, pero por si acaso
  // Si tiene más de 10 dígitos y contiene un 15 interno, lo removemos
  if (digits.length > 10 && digits.startsWith('15')) {
    digits = digits.slice(2);
  }

  // Para números que empiezan con código de área + 15 (ej: 1115XXXXXXXX → 12 dígitos)
  if (digits.length === 12) {
    const codigoArea = digits.slice(0, 2);
    if (digits.slice(2, 4) === '15') {
      digits = codigoArea + digits.slice(4);
    }
  }

  // Si tenemos 10 dígitos (código de área + número), es el formato correcto
  if (digits.length === 10) {
    return '549' + digits;
  }

  // Si tenemos 8 dígitos (sin código de área), asumimos Buenos Aires (11)
  if (digits.length === 8) {
    return '54911' + digits;
  }

  // Para cualquier otro largo, agregamos 549 y dejamos como está
  return '549' + digits;
}
