"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── Chip ─────────────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 21232:6353 (filter) · 21232:6420 (dismissable)
//
// Chips are interactive filter/selection pills. Used for:
//   - Genre filters ("Hip-Hop", "Electronic")
//   - Tag selectors in music uploads
//   - Multi-select values in form fields
//
// Variants (from Figma):
//   default   — filter chip unselected: outline button style (bg-background, border-border, hover:bg-secondary)
//   secondary — dismissable chip: secondary fill (bg-secondary, border-border, hover:bg-accent) · node 21232:6353
//   selected  — active/selected: primary fill, border-primary
//
// Anatomy:
//   <Chip>           — filter chip (toggle), defaults to "default" variant
//   <ChipDismiss>    — dismissable chip with X button, defaults to "secondary" variant
// ─────────────────────────────────────────────────────────────────────────────

const chipVariants = cva(
  [
    // Figma: h-8 (32px) · px-3 (12px) · gap-2 (8px) · text-xxs (14px) · font-normal · rounded-full
    "inline-flex items-center gap-2",
    "rounded-full border px-3 h-8 pb-px",
    "text-xxs font-normal whitespace-nowrap",
    "transition-all cursor-pointer select-none outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        // Filter chip unselected — outline button style (node 4971:83324)
        default:
          "border-border bg-background text-foreground hover:bg-secondary",
        // Dismissable chip — muted fill, accent hover
        secondary:
          "border-border bg-muted text-foreground hover:bg-accent",
        // Selected state — primary fill
        selected:
          "border-primary bg-primary text-primary-foreground",
        // Selected state — dark outline only (secondary toggle)
        "selected-outline":
          "border-foreground bg-muted text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  selected?: boolean
  activeStyle?: "fill" | "outline"
}

function Chip({ className, variant, selected, activeStyle = "fill", children, ...props }: ChipProps) {
  const resolvedVariant = selected
    ? (activeStyle === "outline" ? "selected-outline" : "selected")
    : (variant ?? "default")

  return (
    <button
      type="button"
      data-slot="chip"
      data-selected={selected || undefined}
      className={cn(chipVariants({ variant: resolvedVariant }), className)}
      {...props}
    >
      {children}
    </button>
  )
}

// ── ChipDismiss — chip with X remove button ───────────────────────────────────

interface ChipDismissProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  onDismiss?: () => void
  selected?: boolean
}

function ChipDismiss({
  className,
  variant,
  selected,
  onDismiss,
  children,
  ...props
}: ChipDismissProps) {
  const resolvedVariant = selected ? "selected" : (variant ?? "secondary")

  return (
    <span
      data-slot="chip-dismiss"
      className={cn(chipVariants({ variant: resolvedVariant }), "pr-1.5", className)}
      {...props}
    >
      <span className="truncate">{children}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss?.()
        }}
        aria-label={`Remove ${children}`}
        className={cn(
          "flex size-3.5 shrink-0 items-center justify-center rounded-full",
          "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
          selected
            ? "hover:bg-primary-foreground/20 text-primary-foreground/80"
            : "hover:bg-foreground/10 text-muted-foreground",
        )}
      >
        <XIcon className="size-2.5" />
      </button>
    </span>
  )
}

// ── ChipGroup — wraps chips in a flex row ─────────────────────────────────────

function ChipGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="chip-group"
      className={cn("flex flex-wrap gap-1.5", className)}
      {...props}
    />
  )
}

export { Chip, ChipDismiss, ChipGroup, chipVariants }
