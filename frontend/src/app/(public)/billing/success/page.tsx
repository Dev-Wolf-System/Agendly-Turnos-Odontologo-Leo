"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push("/dashboard/suscripcion");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  const paymentId = searchParams.get("payment_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4">
      <div className="max-w-md w-full bg-white dark:bg-card rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ¡Pago aprobado!
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground">
            Tu suscripción ha sido renovada exitosamente.
          </p>
          {paymentId && (
            <p className="text-xs text-muted-foreground font-mono">
              ID de pago: {paymentId}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Serás redirigido en{" "}
            <span className="font-bold">{countdown}</span> segundos...
          </p>
        </div>

        <Button
          onClick={() => router.push("/dashboard/suscripcion")}
          className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white border-0"
        >
          Ir a Mi Suscripción
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
