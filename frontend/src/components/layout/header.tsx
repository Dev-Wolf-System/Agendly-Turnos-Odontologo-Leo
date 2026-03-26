"use client";

import { ThemeToggle } from "./theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationBell } from "./notification-bell";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
