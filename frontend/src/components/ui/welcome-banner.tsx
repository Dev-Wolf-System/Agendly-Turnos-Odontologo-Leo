"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useClinica } from "@/components/providers/clinica-provider";
import { X } from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos dias";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getMotivationalQuote(): string {
  const quotes = [
    "La excelencia no es un acto, sino un habito.",
    "Hoy es un gran dia para hacer algo extraordinario.",
    "La salud de tus pacientes esta en las mejores manos.",
    "Pequeños pasos, grandes resultados. Sigue adelante.",
    "Cada dia es una oportunidad para marcar la diferencia.",
    "Tu compromiso con la salud transforma vidas.",
    "La constancia es la clave del exito profesional.",
    "Grandes logros comienzan con una buena organizacion.",
  ];
  // Use day of year as seed for daily rotation
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
}

export function WelcomeBanner() {
  const { user } = useAuth();
  const { clinica } = useClinica();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Small delay for smooth entrance animation
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || dismissed || !user) return null;

  const greeting = getGreeting();
  const quote = getMotivationalQuote();
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 mb-6 animate-in slide-in-from-top-4 fade-in duration-500"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Close button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative">
        {/* Greeting */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl">
            {greeting === "Buenos dias" ? "☀️" : greeting === "Buenas tardes" ? "🌤️" : "🌙"}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {greeting}, {user.nombre}
          </h2>
        </div>

        {/* Clinic info + date */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          {clinica?.nombre && (
            <span className="text-sm font-medium text-primary">
              {clinica.nombre}
            </span>
          )}
          <span className="text-sm text-muted-foreground capitalize">
            {today}
          </span>
        </div>

        {/* Motivational quote */}
        <p className="mt-3 text-sm text-muted-foreground/80 italic max-w-xl">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}
