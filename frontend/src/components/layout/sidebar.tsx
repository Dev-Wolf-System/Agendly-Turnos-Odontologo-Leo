"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  CreditCard,
  Package,
  Truck,
  Building2,
  LifeBuoy,
  BadgeCheck,
  Settings,
  LogOut,
  ChevronsLeft,
  BarChart2,
  Shield,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useClinica } from "@/components/providers/clinica-provider";
import { ClinicLogo } from "@/components/ui/clinic-logo";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

/* ─── Sidebar Context ─── */

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/* ─── Navigation ─── */

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
  feature?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
      { name: "Turnos", href: "/dashboard/turnos", icon: Calendar },
      { name: "Lista de Espera", href: "/dashboard/lista-espera", icon: Clock, roles: ["admin", "assistant"] },
      { name: "Historial", href: "/dashboard/historial-medico", icon: ClipboardList, roles: ["admin", "professional"] },
      { name: "Pagos", href: "/dashboard/pagos", icon: CreditCard, roles: ["admin", "assistant"] },
    ],
  },
  {
    label: "Gestión",
    items: [
      { name: "Reportes", href: "/dashboard/reportes", icon: BarChart2, roles: ["admin"] },
      { name: "Obras Sociales", href: "/dashboard/obras-sociales", icon: Shield, roles: ["admin"] },
      { name: "Inventario", href: "/dashboard/inventario", icon: Package, roles: ["admin"] },
      { name: "Proveedores", href: "/dashboard/proveedores", icon: Truck, roles: ["admin"] },
      { name: "Sucursales", href: "/dashboard/sucursales", icon: Building2, roles: ["admin"], feature: "multi_sucursal" },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { name: "Soporte", href: "/dashboard/soporte", icon: LifeBuoy, roles: ["professional", "assistant", "turnos_only"] },
      { name: "Mi Suscripción", href: "/dashboard/suscripcion", icon: BadgeCheck, roles: ["admin", "turnos_only"] },
      { name: "Configuración", href: "/dashboard/configuracion", icon: Settings, roles: ["admin", "turnos_only"] },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Administrador",
  professional: "Profesional",
  assistant: "Secretaría",
  turnos_only: "Agenda",
};

/* ─── Sidebar Component ─── */

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { clinica } = useClinica();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { isEnabled } = useFeatureFlags();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen, setMobileOpen]);

  const initials = `${user?.nombre?.charAt(0) ?? ""}${user?.apellido?.charAt(0) ?? ""}`;
  const roleLabel = user?.role ? ROLE_LABEL[user.role] ?? user.role : "";

  const sidebarContent = (
    <aside
      className={cn(
        "flex h-full flex-col text-sidebar-foreground transition-[width] duration-300 ease-out overflow-hidden",
        collapsed ? "w-[72px]" : "w-64"
      )}
      style={{ background: "var(--gradient-sidebar)" }}
      aria-label="Navegación principal"
    >
      {/* Logo + Clinic name */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-white/[0.06] shrink-0 transition-all duration-300",
          collapsed ? "justify-center px-2" : "gap-3 px-4"
        )}
      >
        <div className="shrink-0">
          <ClinicLogo
            logoUrl={clinica?.logo_url ?? null}
            especialidad={clinica?.especialidad ?? null}
            size={collapsed ? 32 : 36}
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <p
              className={cn(
                "font-semibold leading-tight truncate text-white",
                (clinica?.nombre || "").length > 18 ? "text-sm" : "text-base"
              )}
              title={clinica?.nombre || "Avax Health"}
            >
              {clinica?.nombre || "Avax Health"}
            </p>
            {clinica?.especialidad && (
              <p className="text-[11px] text-white/40 truncate capitalize mt-0.5">
                {clinica.especialidad}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle — desktop only */}
      <div className="hidden lg:flex justify-end px-2 pt-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/50 transition-colors"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <ChevronsLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 px-2 py-3 scrollbar-none",
          collapsed ? "overflow-hidden" : "overflow-y-auto"
        )}
      >
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) =>
              (!item.roles || item.roles.includes(user?.role ?? "")) &&
              (!item.feature || isEnabled(item.feature))
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30 px-3 mb-2">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="border-t border-white/[0.06] mx-2 mb-2" />}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <div key={item.name} className="relative group">
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center rounded-lg text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/50",
                          collapsed
                            ? "justify-center px-0 py-2.5 mx-1"
                            : "gap-3 px-3 py-2",
                          isActive
                            ? "bg-[var(--ht-primary)]/10 text-[var(--ht-primary-light)] border-l-2 border-[var(--ht-primary)] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.08)]"
                            : "text-white/60 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                        )}
                      >
                        <Icon
                          className={cn(
                            "shrink-0 transition-transform duration-200",
                            collapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                            isActive && "text-[var(--ht-primary-light)]"
                          )}
                          aria-hidden="true"
                        />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </Link>

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <div
                          role="tooltip"
                          className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-[#0F172A] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg border border-white/10"
                        >
                          {item.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/[0.06] p-3 shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent)] flex items-center justify-center text-white text-sm font-semibold shadow-[var(--shadow-primary)]"
              aria-label={`${user?.nombre} ${user?.apellido}`}
            >
              {initials}
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/40 hover:text-[var(--ht-danger)] hover:bg-[var(--ht-danger)]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-danger)]/50"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent)] flex items-center justify-center text-white text-sm font-semibold shadow-[var(--shadow-primary)]">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">
                {user?.nombre} {user?.apellido}
              </p>
              {roleLabel && (
                <p className="text-[11px] text-white/50 truncate font-medium">
                  {roleLabel}
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/40 hover:text-[var(--ht-danger)] hover:bg-[var(--ht-danger)]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-danger)]/50"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F172A]/65 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
