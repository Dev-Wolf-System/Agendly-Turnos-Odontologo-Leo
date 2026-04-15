"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationBell } from "./notification-bell";
import { useSidebar } from "./sidebar";

export function Header() {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-light)] px-4 sm:px-6 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl">
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
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
