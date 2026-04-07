"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

// ─── Switch ───────────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 60:450
//
// Sizes:
//   default — track 32×18px, thumb 16px
//   sm      — track 24×14px, thumb 12px
//
// Checked:   track = --primary, thumb = --background
// Unchecked: track = --input,   thumb = --foreground (dark: --foreground)
// ─────────────────────────────────────────────────────────────────────────────

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none",
        // Touch target
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        // Focus ring
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        // Sizes
        "data-[size=default]:h-[18px] data-[size=default]:w-[32px]",
        "data-[size=sm]:h-[14px] data-[size=sm]:w-[24px]",
        // State colors
        "data-checked:bg-primary",
        "data-unchecked:bg-input dark:data-unchecked:bg-input/80",
        // Disabled
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background ring-0 transition-transform",
          // Thumb sizes per track size
          "group-data-[size=default]/switch:size-4",
          "group-data-[size=sm]/switch:size-3",
          // Checked position: translate right (track w - thumb w - 2px padding)
          "group-data-[size=default]/switch:data-checked:translate-x-[14px]",
          "group-data-[size=sm]/switch:data-checked:translate-x-[10px]",
          // Unchecked position
          "group-data-[size=default]/switch:data-unchecked:translate-x-[1px]",
          "group-data-[size=sm]/switch:data-unchecked:translate-x-[1px]",
          // Dark mode thumb
          "dark:data-checked:bg-primary-foreground",
          "dark:data-unchecked:bg-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
