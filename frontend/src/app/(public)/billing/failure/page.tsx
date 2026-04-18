"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingFailurePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-4">
      <div className="max-w-md w-full bg-white dark:bg-card rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pago no completado
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground">
            El pago no fue procesado. Podés intentarlo de nuevo o contactar con soporte.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push("/dashboard/suscripcion")}
            className="w-full gap-2 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white border-0"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/soporte")}
            className="w-full gap-2"
          >
            Contactar soporte
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
