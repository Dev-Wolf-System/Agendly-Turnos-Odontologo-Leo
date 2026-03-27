"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminClinicaById,
  updateAdminClinica,
} from "@/services/admin.service";
import type { AdminClinica } from "@/types";
import { formatPhone } from "@/lib/utils";

export default function AdminClinicaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [clinica, setClinica] = useState<AdminClinica | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminClinicaById(id)
      .then(setClinica)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggleActive = async () => {
    if (!clinica) return;
    try {
      const updated = await updateAdminClinica(clinica.id, {
        is_active: !clinica.is_active,
      } as any);
      setClinica({ ...clinica, is_active: updated.is_active });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!clinica) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Clínica no encontrada</p>
        <Link href="/admin/clinicas" className="text-indigo-500 hover:underline text-sm mt-2 inline-block">
          Volver a clínicas
        </Link>
      </div>
    );
  }

  const sub = clinica.subscription;
  const stats = clinica._stats;

  const estadoColors: Record<string, string> = {
    trial: "bg-amber-500/10 text-amber-500",
    activa: "bg-emerald-500/10 text-emerald-500",
    suspendida: "bg-red-500/10 text-red-500",
    cancelada: "bg-slate-500/10 text-slate-500",
    vencida: "bg-orange-500/10 text-orange-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/clinicas" className="hover:text-foreground transition-colors">
              Clínicas
            </Link>
            <span>/</span>
            <span className="text-foreground">{clinica.nombre}</span>
          </div>
          <h1 className="text-2xl font-bold">{clinica.nombre}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              clinica.is_active
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {clinica.is_active ? "Activa" : "Inactiva"}
          </span>
          <button
            onClick={toggleActive}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              clinica.is_active
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            }`}
          >
            {clinica.is_active ? "Suspender" : "Activar"}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Usuarios", value: stats?.usuarios ?? 0, icon: "👥" },
          { label: "Pacientes", value: stats?.pacientes ?? 0, icon: "🦷" },
          { label: "Turnos", value: stats?.turnos ?? 0, icon: "📅" },
          {
            label: "Registrada",
            value: new Date(clinica.created_at).toLocaleDateString("es-AR"),
            icon: "📋",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <span>{stat.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Información</h2>
          <dl className="space-y-3 text-sm">
            {[
              { label: "Nombre", value: clinica.nombre },
              { label: "Propietario", value: clinica.nombre_propietario },
              { label: "Teléfono", value: formatPhone(clinica.cel) },
              { label: "Email", value: clinica.email },
              { label: "Dirección", value: clinica.direccion },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="font-medium text-right">{item.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Suscripción */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Suscripción</h2>
          {sub ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium">{sub.plan?.nombre ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Estado</dt>
                <dd>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      estadoColors[sub.estado] ?? ""
                    }`}
                  >
                    {sub.estado}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Inicio</dt>
                <dd className="font-medium">
                  {new Date(sub.fecha_inicio).toLocaleDateString("es-AR")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Vencimiento</dt>
                <dd className="font-medium">
                  {new Date(sub.fecha_fin).toLocaleDateString("es-AR")}
                </dd>
              </div>
              {sub.trial_ends_at && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Fin del trial</dt>
                  <dd className="font-medium">
                    {new Date(sub.trial_ends_at).toLocaleDateString("es-AR")}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Auto-renovación</dt>
                <dd className="font-medium">{sub.auto_renew ? "Sí" : "No"}</dd>
              </div>
              {sub.plan && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Precio</dt>
                  <dd className="font-bold text-indigo-500">
                    ${Number(sub.plan.precio_mensual).toLocaleString("es-AR")}/mes
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin suscripción asignada.{" "}
              <Link href="/admin/suscripciones" className="text-indigo-500 hover:underline">
                Asignar plan
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
