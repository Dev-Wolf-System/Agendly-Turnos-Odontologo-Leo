"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { HealthLoader } from "@/components/ui/health-loader";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminNotificationBell } from "@/components/admin/admin-notification-bell";
import adminNotificacionesService from "@/services/admin-notificaciones.service";
import { getSupabaseClient } from "@/lib/supabase-client";

/* ─── Navigation Config ─── */

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: ChartIcon, badge: null },
  { name: "Clinicas", href: "/admin/clinicas", icon: BuildingIcon, badge: null },
  { name: "Planes", href: "/admin/planes", icon: CrownIcon, badge: null },
  { name: "Suscripciones", href: "/admin/suscripciones", icon: RepeatIcon, badge: null },
  { name: "Prospectos", href: "/admin/prospectos", icon: UsersIcon, badge: null },
  { name: "Soporte", href: "/admin/soporte", icon: TicketIcon, badge: null },
];

/* ─── Layout ─── */

function AdminContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [soporteBadge, setSoporteBadge] = useState(0);
  const [prospectosBadge, setProspectosBadge] = useState(0);

  const fetchBadges = useCallback(async () => {
    try {
      const notifs = await adminNotificacionesService.getAll();
      const unread = notifs.filter((n) => !n.leida);
      setSoporteBadge(
        unread.filter((n) => n.tipo === "ticket_nuevo" || n.tipo === "ticket_urgente").length
      );
      setProspectosBadge(unread.filter((n) => n.tipo === "lead_nuevo").length);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user?.role === "superadmin") {
      fetchBadges();
      const supabase = getSupabaseClient();
      const channel = supabase
        .channel("admin-layout-badges")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notificaciones" }, () => {
          fetchBadges();
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admin_notificaciones" }, () => {
          fetchBadges();
        })
        .subscribe();
      return () => {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      };
    }
  }, [isLoading, user, fetchBadges]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "superadmin")) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  if (isLoading) return <HealthLoader />;
  if (!user || user.role !== "superadmin") return null;

  // Current page title
  const currentPage = adminNav.find((n) =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)
  );

  // Nav with dynamic badges
  const navWithBadges = adminNav.map((item) => ({
    ...item,
    badge:
      item.href === "/admin/soporte" && soporteBadge > 0
        ? soporteBadge
        : item.href === "/admin/prospectos" && prospectosBadge > 0
          ? prospectosBadge
          : null,
  }));

  const sidebar = (
    <aside
      className="flex h-full w-[272px] flex-col text-slate-100 border-r border-white/[0.06]"
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3.5 px-6 shrink-0">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-base shadow-lg" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-primary)" }}>
          A
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0F172A]" />
        </div>
        <div>
          <p className="text-[15px] font-bold tracking-tight">Avax Health</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-6 pt-4 pb-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
          Navegacion
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {navWithBadges.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-[var(--ht-primary)]/10 text-[var(--ht-primary-light)] border-l-2 border-[var(--ht-primary)]"
                  : "text-white/55 hover:text-white/90 hover:bg-white/5 border-l-2 border-transparent"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive ? "text-[var(--ht-primary-light)]" : "text-white/40 group-hover:text-white/70"
                )}
              />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ht-primary)]/15 px-1.5 text-[10px] font-bold text-[var(--ht-primary-light)]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0">
        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* System status */}
        <div className="px-5 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--ht-accent)]/[0.08] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ht-accent)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ht-accent)]" />
            </span>
            <span className="text-[11px] font-medium text-[var(--ht-accent)]/80">
              Sistema operativo
            </span>
          </div>
        </div>

        {/* User */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold ring-1 ring-white/10" style={{ background: "var(--gradient-primary)" }}>
              {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate text-white/90">
                {user.nombre} {user.apellido}
              </p>
              <p className="text-[11px] text-white/40 truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              title="Cerrar sesion"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">{sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/65 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-in-out shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebar}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-[var(--border-light)] px-4 sm:px-8 shrink-0 bg-[var(--background)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors lg:hidden"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-muted)]">Admin</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="font-medium text-[var(--ht-primary)]">
                {currentPage?.name ?? "Dashboard"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[var(--border-light)] bg-[var(--ht-primary)]/5 px-3 py-1.5 text-xs font-medium text-[var(--ht-primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ht-primary)]" />
              Superadmin
            </div>
            <AdminNotificationBell />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminContent>{children}</AdminContent>;
}

/* ─── Icons ─── */

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /><path d="M5.5 21h13" />
    </svg>
  );
}

function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
