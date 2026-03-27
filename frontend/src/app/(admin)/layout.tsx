"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { HealthLoader } from "@/components/ui/health-loader";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/* ─── Admin Navigation ─── */

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: ChartIcon },
  { name: "Clínicas", href: "/admin/clinicas", icon: BuildingIcon },
  { name: "Planes", href: "/admin/planes", icon: CrownIcon },
  { name: "Suscripciones", href: "/admin/suscripciones", icon: RepeatIcon },
];

/* ─── Layout ─── */

function AdminContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "superadmin")) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isLoading) return <HealthLoader />;
  if (!user || user.role !== "superadmin") return null;

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-slate-100">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-sm">
          A
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Agendly</p>
          <p className="text-[11px] text-slate-400">Panel Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {adminNav.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              {isActive && (
                <span className="absolute left-0 h-6 w-1 rounded-r-full bg-indigo-400" />
              )}
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-700/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-indigo-300 text-sm font-semibold">
            {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-200">
              {user.nombre} {user.apellido}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Cerrar sesión"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">{sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebar}
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors lg:hidden"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">Panel de Administración</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
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

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
