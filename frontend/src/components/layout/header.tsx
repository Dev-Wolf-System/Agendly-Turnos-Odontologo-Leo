"use client";

import { Menu, Stethoscope, Shield } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationBell } from "./notification-bell";
import { useSidebar } from "./sidebar";
import { useViewMode } from "@/components/providers/view-mode-provider";

export function Header() {
  const { setMobileOpen } = useSidebar();
  const { canSwitch, viewMode, setViewMode } = useViewMode();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-light)] px-4 sm:px-6 bg-[var(--background)]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--text-primary)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {canSwitch && <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />}
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}

function ViewSwitcher({
  viewMode,
  setViewMode,
}: {
  viewMode: "admin" | "professional";
  setViewMode: (m: "admin" | "professional") => void;
}) {
  return (
    <div
      role="group"
      aria-label="Cambiar vista"
      className="hidden sm:flex items-center gap-0.5 rounded-lg border border-[var(--border-light)] bg-[var(--muted)]/40 p-0.5"
    >
      <button
        type="button"
        onClick={() => setViewMode("admin")}
        aria-pressed={viewMode === "admin"}
        title="Vista administrador"
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          viewMode === "admin"
            ? "bg-card text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Shield className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden md:inline">Admin</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode("professional")}
        aria-pressed={viewMode === "professional"}
        title="Vista profesional"
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          viewMode === "professional"
            ? "bg-card text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden md:inline">Médico</span>
      </button>
    </div>
  );
}
