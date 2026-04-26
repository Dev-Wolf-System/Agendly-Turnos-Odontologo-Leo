"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import { getSupabaseClient } from "@/lib/supabase-client";

type PageState = "loading" | "form" | "success" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");

    if (!token_hash || type !== "recovery") {
      setPageState("invalid");
      return;
    }

    const supabase = getSupabaseClient();
    supabase.auth
      .verifyOtp({ token_hash, type: "recovery" })
      .then(({ error }) => {
        if (error) {
          setPageState("invalid");
        } else {
          setPageState("form");
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(password);
      setPageState("success");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Error al actualizar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ═══ Left Panel — Branding ═══ */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0F172A]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[var(--ht-primary-light)]/8 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[var(--ht-accent)]/6 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo.png" alt="Avax Health" width={44} height={44} className="rounded-xl shadow-lg shadow-black/20" />
            <span className="text-xl font-bold tracking-tight text-white">Avax Health</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex items-center px-10 lg:px-14">
          <div className="max-w-md">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
              Creá una nueva{" "}
              <span className="bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent)] bg-clip-text text-transparent">
                contraseña
              </span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/50">
              Elegí una contraseña segura para proteger tu cuenta en Avax Health.
            </p>
          </div>
        </div>

        <div className="relative z-10 p-10">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Avax Health</p>
        </div>
      </div>

      {/* ═══ Right Panel ═══ */}
      <div className="relative flex flex-col bg-background">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/logo.png" alt="Avax Health" width={36} height={36} className="rounded-xl" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-primary-light)] bg-clip-text text-transparent">
              Avax Health
            </span>
          </Link>
        </div>

        <div className="hidden lg:block h-16" />

        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-8">
          <div className="w-full max-w-sm">

            {/* ── Loading ── */}
            {pageState === "loading" && (
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="mt-4 text-sm text-muted-foreground">Verificando link...</p>
              </div>
            )}

            {/* ── Link inválido ── */}
            {pageState === "invalid" && (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Link inválido o vencido</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Este link de recuperación ya venció o no es válido. Los links son válidos por <strong>60 minutos</strong>.
                </p>
                <div className="mt-8 space-y-3">
                  <Link
                    href="/forgot-password"
                    className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    Solicitar nuevo link
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                    </svg>
                    Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            )}

            {/* ── Formulario ── */}
            {pageState === "form" && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">Nueva contraseña</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ingresá y confirmá tu nueva contraseña.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-4">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg className="h-4 w-4 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="w-full rounded-xl border bg-background py-3 pl-11 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <path d="m1 1 22 22" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg className="h-4 w-4 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <input
                        id="confirm"
                        type={showPassword ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repetí la contraseña"
                        required
                        autoComplete="new-password"
                        className="w-full rounded-xl border bg-background py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-primary)] transition-all hover:shadow-[0_4px_24px_rgba(14,165,233,0.35)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Guardando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Guardar nueva contraseña
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ── Éxito ── */}
            {pageState === "success" && (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <svg className="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">¡Contraseña actualizada!</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Tu contraseña fue cambiada correctamente. Serás redirigido al inicio de sesión en unos segundos.
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Ir al inicio de sesión
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
