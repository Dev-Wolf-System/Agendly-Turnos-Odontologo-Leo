"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      const pct = (y / Math.max(1, document.body.scrollHeight - window.innerHeight)) * 100;
      setProgress(pct);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#060f1e] text-white antialiased">
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 z-[200] h-[3px] bg-gradient-to-r from-[var(--ht-primary-light)] to-[#4ADE80] shadow-[0_0_12px_rgba(14,165,233,.6)] transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />

      {/* Navbar */}
      <header
        className={`fixed top-[3px] left-0 right-0 z-[100] h-[66px] flex items-center justify-between px-[5%] backdrop-blur-2xl transition-colors duration-500 ${
          scrolled
            ? "bg-[rgba(6,15,30,0.96)] shadow-[0_4px_24px_rgba(0,0,0,0.3)] border-b border-white/[0.06]"
            : "bg-[rgba(6,15,30,0.7)] border-b border-white/[0.06]"
        }`}
      >
        <Link
          href="/"
          className="bg-white rounded-[9px] px-[9px] py-1 inline-flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-shadow"
        >
          <Image src="/logo.png" alt="Avax Health" width={120} height={34} className="h-[34px] w-auto" priority />
        </Link>

        <ul className="hidden md:flex gap-7 list-none">
          <li><Link href="/#funcionalidades" className="text-[0.875rem] font-medium text-white/65 hover:text-[var(--ht-primary-light)] transition-colors">Funcionalidades</Link></li>
          <li><Link href="/#agente" className="text-[0.875rem] font-medium text-white/65 hover:text-[var(--ht-primary-light)] transition-colors">Agente IA</Link></li>
          <li><Link href="/planes" className="text-[0.875rem] font-medium text-white/65 hover:text-[var(--ht-primary-light)] transition-colors">Precios</Link></li>
          <li><Link href="/#faq" className="text-[0.875rem] font-medium text-white/65 hover:text-[var(--ht-primary-light)] transition-colors">FAQ</Link></li>
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-[0.85rem] font-medium text-white/65 hover:text-white transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-block rounded-full px-[22px] py-[10px] text-[0.85rem] font-bold text-white bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] shadow-[0_4px_20px_rgba(2,132,199,0.35)] hover:-translate-y-px hover:shadow-[0_6px_28px_rgba(2,132,199,0.55)] transition-all"
          >
            Prueba gratis 14 días
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-[5px] p-2"
          aria-label="Menu"
        >
          <span className={`w-[22px] h-0.5 bg-white rounded transition-transform duration-200 ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`w-[22px] h-0.5 bg-white rounded transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`w-[22px] h-0.5 bg-white rounded transition-transform duration-200 ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </header>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 top-[69px] z-[99] flex flex-col items-center justify-center gap-7 bg-[rgba(6,15,30,0.98)] backdrop-blur-xl"
        >
          <Link href="/#funcionalidades" onClick={close} className="text-lg font-semibold text-white/85 font-display">Funcionalidades</Link>
          <Link href="/#agente" onClick={close} className="text-lg font-semibold text-white/85 font-display">Agente IA</Link>
          <Link href="/planes" onClick={close} className="text-lg font-semibold text-white/85 font-display">Precios</Link>
          <Link href="/#faq" onClick={close} className="text-lg font-semibold text-white/85 font-display">FAQ</Link>
          <Link href="/login" onClick={close} className="text-lg font-semibold text-white/85 font-display">Iniciar sesión</Link>
          <Link
            href="/register"
            onClick={close}
            className="rounded-full px-7 py-3 text-base font-bold text-white bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] shadow-[0_4px_20px_rgba(2,132,199,0.35)]"
          >
            Empezar gratis →
          </Link>
        </div>
      )}

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#02050b] border-t border-white/5 px-[5%] pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 max-w-[1100px] mx-auto mb-10">
          <div>
            <Link href="/" className="inline-flex bg-white rounded-[9px] px-[9px] py-1 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              <Image src="/logo.png" alt="Avax Health" width={120} height={34} className="h-[34px] w-auto" />
            </Link>
            <p className="text-[0.83rem] text-white/30 leading-[1.7] max-w-[240px] mt-3">
              La plataforma inteligente que libera a los profesionales de la salud del caos administrativo.
            </p>
          </div>
          <div>
            <div className="text-[0.7rem] font-bold text-white/40 uppercase tracking-[0.1em] mb-3 font-display">Producto</div>
            <ul className="flex flex-col gap-2 list-none">
              <li><Link href="/#funcionalidades" className="text-[0.83rem] text-white/35 hover:text-[var(--ht-primary-light)] transition-colors">Funcionalidades</Link></li>
              <li><Link href="/#agente" className="text-[0.83rem] text-white/35 hover:text-[var(--ht-primary-light)] transition-colors">Agente Avax IA</Link></li>
              <li><Link href="/planes" className="text-[0.83rem] text-white/35 hover:text-[var(--ht-primary-light)] transition-colors">Precios</Link></li>
              <li><Link href="/login" className="text-[0.83rem] text-white/35 hover:text-[var(--ht-primary-light)] transition-colors">Iniciar sesión</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[0.7rem] font-bold text-white/40 uppercase tracking-[0.1em] mb-3 font-display">Integraciones</div>
            <ul className="flex flex-col gap-2 list-none">
              <li><span className="text-[0.83rem] text-white/35">WhatsApp</span></li>
              <li><span className="text-[0.83rem] text-white/35">Mercado Pago</span></li>
              <li><span className="text-[0.83rem] text-white/35">Google Calendar</span></li>
              <li><span className="text-[0.83rem] text-white/35">n8n / Zapier</span></li>
            </ul>
          </div>
          <div>
            <div className="text-[0.7rem] font-bold text-white/40 uppercase tracking-[0.1em] mb-3 font-display">Empresa</div>
            <ul className="flex flex-col gap-2 list-none">
              <li><a href="mailto:ventas@avaxhealth.com" className="text-[0.83rem] text-white/35 hover:text-[var(--ht-primary-light)] transition-colors">Contacto</a></li>
              <li><a href="mailto:soporte@avaxhealth.com" className="text-[0.83rem] text-white/35 hover:text-[var(--ht-primary-light)] transition-colors">Soporte</a></li>
              <li><span className="text-[0.83rem] text-white/35">Términos</span></li>
              <li><span className="text-[0.83rem] text-white/35">Privacidad</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1100px] mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <div className="text-xs text-white/[0.22]">© 2026 Avax Health. Todos los derechos reservados.</div>
          <div className="text-[0.7rem] text-white/[0.18]">Desarrollado por DevWolf Soluciones IT</div>
        </div>
      </footer>
    </div>
  );
}
