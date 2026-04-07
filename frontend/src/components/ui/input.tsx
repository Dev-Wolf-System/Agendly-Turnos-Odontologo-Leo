import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-[var(--border)] bg-white dark:bg-transparent px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-[var(--border-focus)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-[var(--text-muted)] disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
