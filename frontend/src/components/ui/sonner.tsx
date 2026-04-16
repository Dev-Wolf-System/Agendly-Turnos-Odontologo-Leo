"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--status-success-bg)",
          "--success-text": "var(--status-success-fg)",
          "--success-border": "var(--status-success)",
          "--error-bg": "var(--status-error-bg)",
          "--error-text": "var(--status-error-fg)",
          "--error-border": "var(--status-error)",
          "--warning-bg": "var(--status-warning-bg)",
          "--warning-text": "var(--status-warning-fg)",
          "--warning-border": "var(--status-warning)",
          "--info-bg": "color-mix(in srgb, var(--ht-primary) 10%, transparent)",
          "--info-text": "var(--ht-primary)",
          "--info-border": "color-mix(in srgb, var(--ht-primary) 30%, transparent)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
