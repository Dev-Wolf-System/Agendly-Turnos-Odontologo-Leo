"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, XCircle, ShieldAlert, X } from "lucide-react";
import clinicaService, { SubscriptionStatus } from "@/services/clinica.service";

const SEVERITY_CONFIG = {
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  error: {
    bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
    text: "text-orange-800 dark:text-orange-200",
    icon: XCircle,
    iconColor: "text-orange-500",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
    icon: ShieldAlert,
    iconColor: "text-red-500",
  },
};

export function SubscriptionBanner() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    clinicaService.getSubscriptionStatus()
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status || !status.severity || !status.mensaje || dismissed) {
    return null;
  }

  const config = SEVERITY_CONFIG[status.severity];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 border-b px-4 py-2.5 ${config.bg}`}>
      <Icon className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${config.text}`}>
        {status.mensaje}
      </p>
      {status.severity === "warning" && (
        <button
          onClick={() => setDismissed(true)}
          className={`flex-shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${config.text}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
