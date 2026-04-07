"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Avax Health"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text text-transparent">
              Avax Health
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/planes"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Planes
            </Link>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/planes"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-[var(--ht-primary)] hover:to-[var(--ht-accent)] transition-all"
            >
              Comenzar gratis
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-lg">
            <div className="flex flex-col gap-1 px-4 py-3">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Inicio
              </Link>
              <Link
                href="/planes"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Planes
              </Link>
              <hr className="my-2 border-border/40" />
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Iniciar sesion
              </Link>
              <Link
                href="/planes"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2.5 text-sm font-semibold text-white shadow-md"
              >
                Comenzar gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image
                  src="/logo.png"
                  alt="Avax Health"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-base font-bold tracking-tight bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text text-transparent">
                  Avax Health
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Plataforma SaaS para la gestion integral de clinicas y consultorios de salud.
              </p>
            </div>

            {/* Producto */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Producto</h4>
              <ul className="space-y-2">
                <li><Link href="/planes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planes</Link></li>
                <li><Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Registrarse</Link></li>
                <li><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Iniciar sesion</Link></li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="mailto:ventas@avaxhealth.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contacto</a></li>
                <li><a href="mailto:soporte@avaxhealth.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Soporte</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-muted-foreground">Terminos de servicio</span></li>
                <li><span className="text-sm text-muted-foreground">Politica de privacidad</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border/40 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Avax Health. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              {/* Social placeholder icons */}
              <a href="mailto:soporte@avaxhealth.com" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Email">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
