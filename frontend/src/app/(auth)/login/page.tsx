"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import Image from "next/image";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const loggedUser = await login({ email, password });
      router.push(loggedUser.role === "superadmin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Email o contraseña incorrectos";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Image
          src="/logo.png"
          alt="Agendly"
          width={64}
          height={64}
          className="mx-auto mb-4 rounded-xl"
        />
        <CardTitle className="text-2xl">Agendly</CardTitle>
        <CardDescription>
          Ingresá a tu cuenta para gestionar tu clínica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Ingresando..." : "Ingresar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Registrate
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
