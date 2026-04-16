"use client";

import { useEffect, useState, useCallback } from "react";
import sucursalesService, {
  Sucursal,
  SucursalResumen,
} from "@/services/sucursales.service";
import { toast } from "sonner";
import { FeatureGate } from "@/components/ui/feature-gate";

export default function SucursalesPage() {
  const [resumen, setResumen] = useState<SucursalResumen | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Sucursal | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Create form
  const [formNombre, setFormNombre] = useState("");
  const [formDireccion, setFormDireccion] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formEspecialidad, setFormEspecialidad] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await sucursalesService.getResumen();
      setResumen(data);
    } catch {
      toast.error("Error al cargar sucursales");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!formNombre.trim()) return;
    setSaving(true);
    try {
      await sucursalesService.create({
        nombre: formNombre,
        direccion: formDireccion || undefined,
        telefono: formTelefono || undefined,
        especialidad: formEspecialidad || undefined,
        email: formEmail || undefined,
      });
      toast.success("Sucursal creada");
      setShowCreate(false);
      setFormNombre("");
      setFormDireccion("");
      setFormTelefono("");
      setFormEspecialidad("");
      setFormEmail("");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al crear sucursal");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: Sucursal) => {
    try {
      await sucursalesService.update(s.id, { is_active: !s.is_active });
      toast.success(s.is_active ? "Sucursal desactivada" : "Sucursal activada");
      load();
      if (selected?.id === s.id) setSelected({ ...s, is_active: !s.is_active });
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await sucursalesService.remove(id);
      toast.success("Sucursal eliminada");
      if (selected?.id === id) setSelected(null);
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await sucursalesService.update(selected.id, {
        nombre: formNombre,
        direccion: formDireccion || undefined,
        telefono: formTelefono || undefined,
        especialidad: formEspecialidad || undefined,
        email: formEmail || undefined,
      });
      toast.success("Sucursal actualizada");
      setSelected(updated);
      setEditMode(false);
      load();
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s: Sucursal) => {
    setFormNombre(s.nombre);
    setFormDireccion(s.direccion || "");
    setFormTelefono(s.telefono || "");
    setFormEspecialidad(s.especialidad || "");
    setFormEmail(s.email || "");
    setEditMode(true);
  };

  if (isLoading) {
    return (
      <div className="animate-page-in space-y-6">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl border bg-card animate-pulse" />
      </div>
    );
  }

  return (
    <FeatureGate
      feature="multi_sucursal"
      planRequired="Avax Clínica Standard"
      mode="replace"
      description="Gestioná múltiples sedes desde un único panel centralizado."
    >
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sucursales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestioná las sedes de tu red de clínicas
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            setFormNombre("");
            setFormDireccion("");
            setFormTelefono("");
            setFormEspecialidad("");
            setFormEmail("");
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-[var(--ht-primary)] hover:to-[var(--ht-accent)] transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5v14" />
          </svg>
          Nueva Sucursal
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Sucursales", value: resumen?.total ?? 0, gradient: "from-blue-500 to-[var(--ht-primary)]" },
          { label: "Activas", value: resumen?.activas ?? 0, gradient: "from-emerald-500 to-teal-600" },
          { label: "Inactivas", value: resumen?.inactivas ?? 0, gradient: "from-amber-500 to-orange-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 bg-gradient-to-r ${kpi.gradient} bg-clip-text text-transparent`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 space-y-3">
          {(!resumen?.sucursales || resumen.sucursales.length === 0) ? (
            <div className="rounded-xl border bg-card p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="20" x="4" y="2" rx="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
              </svg>
              <p className="text-muted-foreground text-sm">No hay sucursales registradas</p>
              <p className="text-muted-foreground text-xs mt-1">Crea tu primera sucursal para empezar</p>
            </div>
          ) : (
            resumen.sucursales.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelected(s); setEditMode(false); }}
                className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-md ${
                  selected?.id === s.id
                    ? "border-[var(--ht-accent)] bg-[var(--ht-accent-dark)]/5 shadow-sm"
                    : "bg-card hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{s.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.direccion || "Sin direccion"} {s.especialidad ? `— ${s.especialidad}` : ""}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    s.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {s.is_active ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="hidden lg:block w-96 shrink-0">
            <div className="sticky top-6 rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{selected.nombre}</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {editMode ? (
                <div className="space-y-3">
                  <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <input value={formDireccion} onChange={(e) => setFormDireccion(e.target.value)} placeholder="Direccion" className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <input value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} placeholder="Telefono" className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <input value={formEspecialidad} onChange={(e) => setFormEspecialidad(e.target.value)} placeholder="Especialidad" className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSaveEdit} disabled={saving} className="flex-1 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button onClick={() => setEditMode(false)} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Direccion", value: selected.direccion },
                      { label: "Telefono", value: selected.telefono },
                      { label: "Email", value: selected.email },
                      { label: "Especialidad", value: selected.especialidad },
                    ].map((field) => (
                      <div key={field.label} className="flex justify-between">
                        <span className="text-muted-foreground">{field.label}</span>
                        <span className="font-medium">{field.value || "—"}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado</span>
                      <span className={`font-medium ${selected.is_active ? "text-emerald-600" : "text-red-500"}`}>
                        {selected.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creada</span>
                      <span className="font-medium">{new Date(selected.created_at).toLocaleDateString("es-AR")}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => startEdit(selected)}
                      className="flex-1 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(selected)}
                      className="flex-1 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      {selected.is_active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="rounded-xl border border-red-200 dark:border-red-900/30 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Nueva Sucursal</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre *</label>
                <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Sucursal Centro" className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direccion</label>
                <input value={formDireccion} onChange={(e) => setFormDireccion(e.target.value)} placeholder="Av. Corrientes 1234" className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefono</label>
                  <input value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} placeholder="+54 11..." className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                  <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="contacto@..." className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Especialidad</label>
                <input value={formEspecialidad} onChange={(e) => setFormEspecialidad(e.target.value)} placeholder="Odontologia" className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={saving || !formNombre.trim()} className="flex-1 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all">
                {saving ? "Creando..." : "Crear Sucursal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
