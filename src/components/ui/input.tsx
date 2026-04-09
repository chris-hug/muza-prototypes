import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// ─── Input ────────────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 65:533
//
// Spec:
//   bg-background · border border-border · rounded-xl
//   text-base font-normal · placeholder:text-muted-foreground
//   height: 40px (h-10)
// ─────────────────────────────────────────────────────────────────────────────

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Layout
        "h-10 w-full min-w-0",
        // Shape — rounded-xl = 12px per Muza radius scale
        "rounded-full border border-border",
        // Surface
        "bg-background px-4 pt-[6px] pb-[10px]",
        // Typography
        "text-base font-normal text-foreground",
        "placeholder:text-muted-foreground",
        // Transitions
        "transition-colors outline-none",
        // File input
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Focus
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
