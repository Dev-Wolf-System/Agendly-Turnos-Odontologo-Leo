"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Ticket,
  Users,
  Building2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import adminNotificacionesService, {
  AdminNotificacion,
} from "@/services/admin-notificaciones.service";
import { getSupabaseClient } from "@/lib/supabase-client";

const TIPO_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bg: string; href: string }
> = {
  ticket_nuevo: {
    icon: Ticket,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    href: "/admin/soporte",
  },
  ticket_urgente: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/40",
    href: "/admin/soporte",
  },
  lead_nuevo: {
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    href: "/admin/prospectos",
  },
  clinica_nueva: {
    icon: Building2,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    href: "/admin/clinicas",
  },
  info: {
    icon: Info,
    color: "text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-950/40",
    href: "/admin",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function AdminNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<AdminNotificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const count = await adminNotificacionesService.getCount();
      setUnreadCount(count);
    } catch {
      // silently fail
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminNotificacionesService.getAll();
      setNotificaciones(data);
      setUnreadCount(data.filter((n) => !n.leida).length);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial del contador + Supabase Realtime en admin_notificaciones
  useEffect(() => {
    fetchCount();
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("admin-notificaciones")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notificaciones" },
        (payload) => {
          const nueva = payload.new as AdminNotificacion;
          setUnreadCount((c) => c + 1);
          setNotificaciones((prev) => [nueva, ...prev]);
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    await adminNotificacionesService.markAsRead(id);
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllAsRead = async () => {
    await adminNotificacionesService.markAllAsRead();
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string) => {
    const notif = notificaciones.find((n) => n.id === id);
    await adminNotificacionesService.remove(id);
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    if (notif && !notif.leida) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleClick = (notif: AdminNotificacion) => {
    if (!notif.leida) handleMarkAsRead(notif.id);
    const config = TIPO_CONFIG[notif.tipo] ?? TIPO_CONFIG.info;
    router.push(config.href);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all duration-150"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-[var(--border-light)] bg-background shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-light)] px-4 py-3">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas como leídas
              </Button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && notificaciones.length === 0 && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Cargando...
              </div>
            )}

            {!loading && notificaciones.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-sm">Sin notificaciones</span>
              </div>
            )}

            {notificaciones.map((notif) => {
              const config = TIPO_CONFIG[notif.tipo] ?? TIPO_CONFIG.info;
              const Icon = config.icon;

              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notif.leida ? "bg-muted/30" : ""
                  }`}
                  onClick={() => handleClick(notif)}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {notif.titulo}
                      </span>
                      {!notif.leida && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.mensaje}
                    </p>
                    <span className="text-[11px] text-muted-foreground/70 mt-1 block">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>

                  <div className="flex shrink-0 gap-0.5 mt-0.5">
                    {!notif.leida && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-green-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                        title="Marcar como leída"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
