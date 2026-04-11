"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown, Disc3, Globe, ListMusic, Lock, Mic, Music2, Check } from "lucide-react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

// ─── Base Badge ───────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 26:169
//
// All variants carry `border` in the base so box-sizing is identical across
// all variants — bordered and non-bordered badges are always the same height.
// Non-bordered variants use `border-transparent`.
//
// Specs:
//   rounded-sm · pt-[4px] pb-[6px] px-[6px] · gap-1
//   text-xxs font-normal leading-none · icon slot: size-3 (12px)
// ─────────────────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center gap-1",
    "rounded-sm",
    "border border-transparent",           // always present — keeps height consistent
    "pt-[4px] pb-[6px] px-[6px]",
    "text-xxs font-normal leading-none whitespace-nowrap",
    "transition-colors",
    "[&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:size-3",
  ],
  {
    variants: {
      variant: {
        // Accent fill (node 26:170) — used for content-type labels
        secondary:
          "bg-muted text-foreground border-border",
        // Glassmorphism outline (node 26:181) — used for status labels
        outline:
          "backdrop-blur-[8px] bg-background/50 border-border text-muted-foreground",
        // Destructive (node 26:185)
        destructive:
          "bg-destructive text-white",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// ─── ContentTypeBadge ─────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 21368:27118
//
// Content-type labels shown on tracks, releases, playlists.
// Always: bg-accent + left Lucide icon (12px) + label text.
// ─────────────────────────────────────────────────────────────────────────────

type ContentType = "song" | "album" | "single" | "ep" | "artist" | "playlist"

const contentTypeConfig: Record<ContentType, { label: string; icon: React.ElementType }> = {
  song:     { label: "Song",     icon: Music2 },
  album:    { label: "Album",    icon: Disc3 },
  single:   { label: "Single",   icon: Disc3 },
  ep:       { label: "EP",       icon: Disc3 },
  artist:   { label: "Artist",   icon: Mic },
  playlist: { label: "Playlist", icon: ListMusic },
}

interface ContentTypeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: ContentType
}

function ContentTypeBadge({ type, className, ...props }: ContentTypeBadgeProps) {
  const { label, icon: Icon } = contentTypeConfig[type]
  return (
    <span
      data-slot="content-type-badge"
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1",
        "rounded-sm border border-border",
        "bg-muted text-foreground",
        "pt-[4px] pb-[6px] px-[6px]",
        "text-xxs font-normal leading-none whitespace-nowrap",
        "[&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:size-3",
        className,
      )}
      {...props}
    >
      <Icon />
      {label}
    </span>
  )
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 21368:27118
//
// Track/release visibility status. Self-contained — clicking opens a dropdown
// to switch between public / private. Pass `onStatusChange` to be notified.
//   public  → Globe icon
//   private → Lock icon
// ─────────────────────────────────────────────────────────────────────────────

type StatusBadgeStatus = "public" | "private"

const statusConfig: Record<StatusBadgeStatus, { label: string; icon: React.ElementType }> = {
  public:  { label: "Public",  icon: Globe },
  private: { label: "Private", icon: Lock },
}

interface StatusBadgeProps {
  status: StatusBadgeStatus
  onStatusChange?: (status: StatusBadgeStatus) => void
  className?: string
}

const STATUS_TRIGGER_CLS = cn(
  "inline-flex w-fit shrink-0 items-center gap-1",
  "rounded-sm border border-border",
  "backdrop-blur-[8px] bg-background/50 text-muted-foreground",
  "pt-[4px] pb-[6px] px-[6px]",
  "text-xxs font-normal leading-none whitespace-nowrap",
  "transition-colors hover:border-foreground/40 hover:bg-muted hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  "[&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:size-3",
  "cursor-pointer select-none",
)

function StatusBadge({ status, onStatusChange, className }: StatusBadgeProps) {
  const { label, icon: Icon } = statusConfig[status]
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        data-slot="status-badge"
        className={cn(STATUS_TRIGGER_CLS, className)}
      >
        <Icon aria-hidden />
        {label}
        <ChevronDown className="opacity-80 transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" aria-hidden />
      </MenuPrimitive.Trigger>

      <MenuPrimitive.Portal keepMounted>
        <MenuPrimitive.Positioner side="bottom" align="start" sideOffset={4}>
          <MenuPrimitive.Popup className={cn(
            "z-50 min-w-[7rem] rounded-xl border border-border bg-popover p-1 shadow-md outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          )}>
            {(Object.entries(statusConfig) as [StatusBadgeStatus, { label: string; icon: React.ElementType }][]).map(
              ([key, { label: itemLabel, icon: ItemIcon }]) => (
                <MenuPrimitive.Item
                  key={key}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5",
                    "text-xs outline-none transition-colors",
                    "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                    "data-disabled:pointer-events-none data-disabled:opacity-50",
                  )}
                  onClick={() => onStatusChange?.(key)}
                >
                  <ItemIcon className="size-3 shrink-0" aria-hidden />
                  {itemLabel}
                  {key === status && <Check className="ml-auto size-3 text-primary" aria-hidden />}
                </MenuPrimitive.Item>
              )
            )}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

export { Badge, badgeVariants, ContentTypeBadge, StatusBadge }
export type { ContentType, StatusBadgeStatus }
