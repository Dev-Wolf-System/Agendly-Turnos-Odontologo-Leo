"use client";

import { ThemeToggle } from "./theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationBell } from "./notification-bell";
import { useSidebar } from "./sidebar";

export function Header() {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border-light)] px-4 sm:px-6 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors lg:hidden"
          aria-label="Abrir menú"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
