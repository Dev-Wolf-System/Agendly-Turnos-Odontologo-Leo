"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { IconArrowRight } from "@/components/landing/landing-icons";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ── Navbar ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/92 backdrop-blur-xl border-b border-border/60 shadow-sm py-2"
            : "bg-background/72 backdrop-blur-xl border-b border-transparent py-3"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 transition-transform hover:-translate-y-px">
            <Image
              src="/logo.png"
              alt="Avax Health"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text text-transparent">
              Avax Health
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-7">
            {[
              { label: "Funcionalidades", href: "/#funcionalidades" },
              { label: "Agente IA", href: "/#agente" },
              { label: "Planes", href: "/planes" },
              { label: "FAQ", href: "/#faq" },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="group relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5"
                >
                  {link.label}
                  <span className="absolute inset-x-0 -bottom-px h-[2px] origin-left scale-x-0 rounded-full bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent)] transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/planes"
              className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm hover:opacity-90 hover:-translate-y-px transition-all"
            >
              Comenzar gratis
              <IconArrowRight size={14} />
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
          <div className="md:hidden border-t border-border/40 bg-background/96 backdrop-blur-xl">
            <div className="flex flex-col gap-1 px-4 py-3">
              {[
                { label: "Funcionalidades", href: "/#funcionalidades" },
                { label: "Agente IA", href: "/#agente" },
                { label: "Planes", href: "/planes" },
                { label: "FAQ", href: "/#faq" },
                { label: "Iniciar sesión", href: "/login" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/planes"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-md"
              >
                Comenzar gratis
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1 pt-[68px]">{children}</main>

      {/* ── Footer dark ── */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <Image
                  src="/logo.png"
                  alt="Avax Health"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-base font-extrabold text-white tracking-tight">
                  Avax Health
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400/85 max-w-[280px]">
                Plataforma SaaS para la gestión integral de clínicas y consultorios de salud.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-4">Producto</h4>
              <ul className="space-y-2.5">
                <li><Link href="/#funcionalidades" className="text-sm text-slate-400 hover:text-white transition-colors">Funcionalidades</Link></li>
                <li><Link href="/#agente" className="text-sm text-slate-400 hover:text-white transition-colors">Agente IA</Link></li>
                <li><Link href="/planes" className="text-sm text-slate-400 hover:text-white transition-colors">Planes</Link></li>
                <li><Link href="/register" className="text-sm text-slate-400 hover:text-white transition-colors">Registrarse</Link></li>
                <li><Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Iniciar sesión</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-4">Integraciones</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-slate-400">WhatsApp</span></li>
                <li><span className="text-sm text-slate-400">Mercado Pago</span></li>
                <li><span className="text-sm text-slate-400">Google Calendar</span></li>
                <li><span className="text-sm text-slate-400">Google Sheets</span></li>
                <li><span className="text-sm text-slate-400">Google Docs</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-4">Empresa</h4>
              <ul className="space-y-2.5">
                <li><a href="mailto:ventas@avaxhealth.com" className="text-sm text-slate-400 hover:text-white transition-colors">Contacto</a></li>
                <li><a href="mailto:soporte@avaxhealth.com" className="text-sm text-slate-400 hover:text-white transition-colors">Soporte</a></li>
                <li><span className="text-sm text-slate-400">Términos de servicio</span></li>
                <li><span className="text-sm text-slate-400">Política de privacidad</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-7 border-t border-white/10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs text-slate-500">
              © 2026 Avax Health. Todos los derechos reservados.
            </p>
            <p className="text-xs text-slate-500/70 tracking-wide select-none">
              Desarrollado por{" "}
              <span className="font-medium text-slate-400/80">DevWolf Soluciones IT</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
