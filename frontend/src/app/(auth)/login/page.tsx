"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const loggedUser = await login({ email, password });
      router.push(loggedUser.role === "superadmin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Email o contraseña incorrectos";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ═══ Left Panel — Branding ═══ */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0F172A]">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#38BDF8]/8 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#10B981]/6 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[#38BDF8]/4 blur-[60px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Top — Logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Avax Health"
              width={44}
              height={44}
              className="rounded-xl shadow-lg shadow-black/20"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              Avax Health
            </span>
          </Link>
        </div>

        {/* Center — Value Prop */}
        <div className="relative z-10 flex-1 flex items-center px-10 lg:px-14">
          <div className="max-w-md">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/20 bg-[#38BDF8]/10 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#38BDF8] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#38BDF8]" />
              </span>
              <span className="text-xs font-medium text-[#38BDF8]">Plataforma activa</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
              Gestiona tu clinica de manera{" "}
              <span className="bg-gradient-to-r from-[#38BDF8] to-[#10B981] bg-clip-text text-transparent">
                inteligente
              </span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-white/50">
              Turnos, pacientes, historial medico, pagos e inventario. Todo en un solo lugar, impulsado por inteligencia artificial.
            </p>

            {/* Mini features */}
            <div className="mt-10 space-y-4">
              {[
                { icon: "M8 2v4M16 2v4M3 10h18M3 4h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z", text: "Agenda inteligente con recordatorios" },
                { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "Historial medico seguro y completo" },
                { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "Impulsado por inteligencia artificial" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/10">
                    <svg className="h-4 w-4 text-[#38BDF8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                  </div>
                  <span className="text-sm text-white/60">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom — Testimonial */}
        <div className="relative z-10 p-10 lg:p-14">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm p-5">
            <p className="text-sm leading-relaxed text-white/40 italic">
              &ldquo;Desde que usamos Avax Health, la gestion de turnos paso de ser un caos a algo automatico. Nuestros pacientes reciben recordatorios y la agenda se organiza sola.&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#38BDF8] to-[#10B981] text-[10px] font-bold text-[#0F172A]">
                LM
              </div>
              <div>
                <p className="text-xs font-medium text-white/70">Dra. Laura Mendez</p>
                <p className="text-[10px] text-white/30">Centro Odontologico Sonrisa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Right Panel — Login Form ═══ */}
      <div className="relative flex flex-col bg-background">
        {/* Mobile logo */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Avax Health"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#0F172A] to-[#38BDF8] bg-clip-text text-transparent">
              Avax Health
            </span>
          </Link>
        </div>

        {/* Top right spacer */}
        <div className="hidden lg:block h-16" />

        {/* Center — Form */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-8">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">
                Bienvenido de vuelta
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ingresa tus credenciales para acceder a tu clinica
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-4">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Form */}
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contraseña
                  </label>
                </div>
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
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
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
                        <path d="m1 1 22 22" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-primary)] transition-all hover:shadow-[0_4px_24px_rgba(14,165,233,0.35)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "var(--gradient-primary)" }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Ingresar
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground/50 font-medium tracking-wider">o</span>
              </div>
            </div>

            {/* Register CTA — mobile visible, desktop for emphasis */}
            <div className="text-center space-y-4">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:border-[#38BDF8]/30"
              >
                Solicitar Prueba Gratuita
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                </svg>
                Volver al inicio
              </Link>
            </div>

            {/* Footer */}
            <p className="mt-10 text-center text-[11px] text-muted-foreground/40">
              Al ingresar, aceptas los terminos de servicio y la politica de privacidad de Avax Health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
