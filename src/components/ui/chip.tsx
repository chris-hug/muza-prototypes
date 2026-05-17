"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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
    // Common: rounded pill, single-line, gap between label and any
    // inner adornment (count badge, leading icon). Size-specific
    // metrics live in the `size` variant below.
    "group/chip inline-flex items-center gap-2",
    "rounded-full border pb-px",
    "font-normal whitespace-nowrap",
    "transition-[colors,box-shadow] cursor-pointer select-none outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        // Filter chip unselected — outline button style (node 4971:83324)
        default:
          "border-border bg-background text-foreground hover:bg-muted",
        // Dismissable chip — muted fill, hover stays muted
        secondary:
          "border-border bg-muted text-foreground hover:bg-muted",
        // Selected state — primary fill
        selected:
          "border-primary bg-primary text-primary-foreground",
        // Selected state — dark outline only (secondary toggle)
        "selected-outline":
          "border-foreground bg-muted text-foreground",
        // Ghost — no border/fill, just text. Used in header filter
        // bars (Discography) where the bar itself is visual chrome
        // and individual chips should read as lightweight nav.
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-muted",
      },
      size: {
        // sm — compact filter chip (default genres, tags). Figma: h-8 · px-3 · text-2xsmall.
        sm: "h-8 px-3 text-2xsmall",
        // md — header filter chip with count badge (Artist Discography,
        //      Library filter bars). h-10 matches Button `default`
        //      so it can sit in a toolbar next to a sort button +
        //      view toggle and read as one row.
        md: "h-10 px-4 text-small",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "sm",
    },
  }
)

interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  selected?: boolean
  activeStyle?: "fill" | "outline"
  /** Optional count rendered as a pill `Badge` after the label. */
  count?: number | string
}

function Chip({
  className, variant, size, selected, activeStyle = "fill",
  count, children, ...props
}: ChipProps) {
  const resolvedVariant = selected
    ? (activeStyle === "outline" ? "selected-outline" : "selected")
    : (variant ?? "default")

  return (
    <button
      type="button"
      data-slot="chip"
      data-selected={selected || undefined}
      className={cn(chipVariants({ variant: resolvedVariant, size }), className)}
      {...props}
    >
      {children}
      {count !== undefined && (
        // Default + hover: `bg-accent` — the chip's hover bg (muted)
        // wraps a slightly darker accent badge, so the count always
        // reads above the chip surface without shifting under the
        // cursor.
        // Selected: borderless `bg-background` pill so the count
        // stands out against the primary backdrop.
        <Badge
          shape="pill"
          variant="secondary"
          className="bg-accent group-data-[selected]/chip:bg-background/20 group-data-[selected]/chip:text-primary-foreground"
        >
          {count}
        </Badge>
      )}
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
