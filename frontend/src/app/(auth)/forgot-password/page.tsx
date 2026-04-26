"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Error al procesar la solicitud");
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
              Recuperá el acceso a tu{" "}
              <span className="bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent)] bg-clip-text text-transparent">
                cuenta
              </span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/50">
              Te enviaremos un link seguro para que puedas crear una nueva contraseña en minutos.
            </p>
          </div>
        </div>

        <div className="relative z-10 p-10">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Avax Health</p>
        </div>
      </div>

      {/* ═══ Right Panel — Form ═══ */}
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

            {sent ? (
              /* ── Estado enviado ── */
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <svg className="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Revisá tu email</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Si el email <strong>{email}</strong> está registrado, recibirás un link para restablecer tu contraseña.
                  El link es válido por <strong>60 minutos</strong>.
                </p>
                <p className="mt-4 text-xs text-muted-foreground/60">
                  ¿No lo recibiste? Revisá la carpeta de spam o intentá de nuevo.
                </p>
                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold transition-all hover:bg-muted"
                  >
                    Intentar con otro email
                  </button>
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                    </svg>
                    Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            ) : (
              /* ── Formulario ── */
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">¿Olvidaste tu contraseña?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ingresá tu email y te enviamos un link para restablecerla.
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
                    <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg className="h-4 w-4 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                        autoComplete="email"
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
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Enviar link de recuperación
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                    </svg>
                    Volver al inicio de sesión
                  </Link>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
