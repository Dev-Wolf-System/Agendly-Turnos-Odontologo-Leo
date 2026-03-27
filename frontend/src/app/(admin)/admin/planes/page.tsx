"use client";

import { useState, useEffect } from "react";
import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
} from "@/services/admin.service";
import type { Plan } from "@/types";

const FEATURE_OPTIONS = [
  { key: "whatsapp", label: "WhatsApp Bot" },
  { key: "reportes_avanzados", label: "Reportes Avanzados" },
  { key: "inventario", label: "Inventario" },
  { key: "pagos", label: "Gestión de Pagos" },
  { key: "recordatorios", label: "Recordatorios Automáticos" },
  { key: "multi_usuario", label: "Multi-usuario" },
];

const emptyForm = {
  nombre: "",
  precio_mensual: 0,
  max_usuarios: 1,
  max_pacientes: null as number | null,
  features: {} as Record<string, boolean>,
  is_active: true,
};

export default function AdminPlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    getAdminPlans()
      .then(setPlanes)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (plan: Plan) => {
    setForm({
      nombre: plan.nombre,
      precio_mensual: Number(plan.precio_mensual),
      max_usuarios: plan.max_usuarios,
      max_pacientes: plan.max_pacientes,
      features: plan.features ?? {},
      is_active: plan.is_active,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAdminPlan(editingId, form as any);
      } else {
        await createAdminPlan(form as any);
      }
      resetForm();
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("¿Desactivar este plan?")) return;
    try {
      await deleteAdminPlan(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFeature = (key: string) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administrá los planes disponibles para las clínicas
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
        >
          + Nuevo Plan
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">
            {editingId ? "Editar Plan" : "Nuevo Plan"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Precio Mensual ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_mensual}
                  onChange={(e) =>
                    setForm({ ...form, precio_mensual: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Máx. Usuarios</label>
                <input
                  type="number"
                  min="1"
                  value={form.max_usuarios}
                  onChange={(e) =>
                    setForm({ ...form, max_usuarios: parseInt(e.target.value) || 1 })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Máx. Pacientes{" "}
                  <span className="text-xs text-muted-foreground">(vacío = ilimitado)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.max_pacientes ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_pacientes: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Features</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEATURE_OPTIONS.map((feat) => (
                  <label
                    key={feat.key}
                    className="flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!form.features[feat.key]}
                      onChange={() => toggleFeature(feat.key)}
                      className="rounded accent-indigo-500"
                    />
                    <span className="text-sm">{feat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
              >
                {editingId ? "Guardar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plan cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : planes.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No hay planes creados aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border bg-card p-5 shadow-sm relative ${
                !plan.is_active ? "opacity-60" : ""
              }`}
            >
              {!plan.is_active && (
                <span className="absolute top-3 right-3 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
                  Inactivo
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.nombre}</h3>
              <p className="mt-1 text-3xl font-bold text-indigo-500">
                ${Number(plan.precio_mensual).toLocaleString("es-AR")}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuarios</span>
                  <span className="font-medium">{plan.max_usuarios}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pacientes</span>
                  <span className="font-medium">{plan.max_pacientes ?? "Ilimitado"}</span>
                </div>
              </div>

              {/* Features */}
              {plan.features && Object.keys(plan.features).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {Object.entries(plan.features)
                    .filter(([, v]) => v)
                    .map(([key]) => {
                      const feat = FEATURE_OPTIONS.find((f) => f.key === key);
                      return (
                        <span
                          key={key}
                          className="inline-flex rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-500"
                        >
                          {feat?.label ?? key}
                        </span>
                      );
                    })}
                </div>
              )}

              <div className="mt-4 flex gap-2 border-t pt-3">
                <button
                  onClick={() => startEdit(plan)}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Editar
                </button>
                {plan.is_active && (
                  <button
                    onClick={() => handleDeactivate(plan.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
