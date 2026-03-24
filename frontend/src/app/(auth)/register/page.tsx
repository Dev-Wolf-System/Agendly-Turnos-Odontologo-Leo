"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authService } from "@/services/auth.service";

export default function RegisterPage() {
  const [form, setForm] = useState({
    clinica_nombre: "",
    nombre_propietario: "",
    clinica_cel: "",
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        clinica_nombre: form.clinica_nombre,
        nombre_propietario: form.nombre_propietario || undefined,
        clinica_cel: form.clinica_cel || undefined,
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
      });
      if (response.access_token) {
        window.location.href = "/dashboard";
        return;
      }
      setError("Error inesperado en el registro");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Error al registrar la cuenta";
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
          A
        </div>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>
          Registrá tu clínica y empezá a gestionar tus turnos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Datos de la clínica */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Datos de la Clínica
            </p>
            <div className="space-y-2">
              <Label htmlFor="clinica_nombre">Nombre de la Clínica *</Label>
              <Input
                id="clinica_nombre"
                value={form.clinica_nombre}
                onChange={(e) => updateField("clinica_nombre", e.target.value)}
                placeholder="Clínica Dental Sonrisa"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_propietario">Propietario</Label>
                <Input
                  id="nombre_propietario"
                  value={form.nombre_propietario}
                  onChange={(e) =>
                    updateField("nombre_propietario", e.target.value)
                  }
                  placeholder="Dr. García"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinica_cel">Teléfono Clínica</Label>
                <Input
                  id="clinica_cel"
                  value={form.clinica_cel}
                  onChange={(e) => updateField("clinica_cel", e.target.value)}
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Datos del usuario admin */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Tu Cuenta (Administrador)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => updateField("nombre", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={form.apellido}
                  onChange={(e) => updateField("apellido", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registrando..." : "Crear Cuenta"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Iniciar Sesión
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
