"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Disc3, ListMusic, Mic, Music2, Building2 } from "lucide-react"

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
//   text-2xsmall font-normal leading-none · icon slot: size-3 (12px)
// ─────────────────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center gap-1",
    "border border-transparent",           // always present — keeps height consistent
    "font-normal leading-none whitespace-nowrap",
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
        // Primary fill — uses the brand colour. Used for "active"
        // pill chrome (e.g. selected Chip). Strong, but loud, so
        // prefer `success` for low-stakes "new / beta" labels.
        primary:
          "bg-primary text-primary-foreground border-primary",
        // Success — saturated mint fill (#00D5A3). Strong attention
        // signal at a glance ("Beta", "Recommended") without using
        // brand-primary blue. Dark text + matching border.
        success:
          "bg-[#00D5A3] text-black border-[#00b889]",
        // New / Updated — soft tinted pills borrowed from the
        // user-avatar palette (`src/lib/avatar.ts`) so the DS status
        // flags feel part of the same warm family. `new` = Mint,
        // `updated` = Honey. Mode-aware: pale bg + dark fg in light
        // mode, flipped (dark bg + pale fg) in dark mode. Both ways
        // clear ≥4.5:1.
        new:
          "bg-[#F4FAF6] text-[#27563F] border-[#27563F]/15 " +
          "dark:bg-[#27563F] dark:text-[#F4FAF6] dark:border-[#F4FAF6]/15",
        updated:
          "bg-[#FEF8E0] text-[#5C4612] border-[#5C4612]/15 " +
          "dark:bg-[#5C4612] dark:text-[#FEF8E0] dark:border-[#FEF8E0]/15",
        // Count inside another control (a Chip / filter pill). Sits one step
        // above the host's surface so it stays legible on both the chip's
        // resting and hover fills, and flips to a translucent light pill when
        // the parent chip is selected. Owning both states here is the point:
        // call sites used to patch this in with `className`, which is exactly
        // the hand-crafted badge colour the rules forbid.
        count:
          "bg-accent text-foreground " +
          "group-data-[selected]/chip:bg-background/20 group-data-[selected]/chip:text-primary-foreground",
        // Destructive (node 26:185)
        destructive:
          "bg-destructive text-white",
      },
      // Shape: default square chip-style, or pill (rounded-full)
      // count badge for filters / nav. The pill shape is intentionally
      // tighter (h-5 · min-w-5 · 6px x-padding) so it sits inside
      // another control (a Chip) without inflating the row height.
      shape: {
        // Default label badge — matches the icon-bearing variants
        // (ContentTypeBadge / StatusBadge) exactly so badges read at
        // one uniform height across the app whether or not they have
        // an icon.
        square: "rounded-sm h-[26px] px-[6px] pb-px text-2xsmall",
        // Tiny inline badge for use INSIDE other text rows (e.g. an
        // album card title line). 18px tall · 4px x-padding · tighter
        // icon. Drops below the 26px chip height so it doesn't push
        // the surrounding line-box and stays optically right-sized
        // next to body text.
        "square-xs": "rounded-[1px] border-0 h-[18px] px-1 pb-px text-2xsmall gap-0.5 [&>svg]:size-2.5",
        // `pb-px` mirrors the optical-center nudge Button/Tabs use —
        // Founders Grotesk numerals sit low in a flex-centered box.
        // `border-transparent` overrides the base border so the pill
        // (typically a count inside another chip) reads as a fill,
        // not a stroked badge.
        // `px-1` (not 1.5) so a SINGLE digit lands inside `min-w-5` and the
        // pill renders as a true 20×20 circle; two digits push it wider on
        // their own. At 1.5 even a "3" came out 22.8×20 — a slight oval that
        // reads as a mis-centred number rather than a round count.
        pill:   "rounded-full justify-center h-5 min-w-5 px-1 pb-px text-xsmall border-transparent",
        // The same pill inside a `sm` Chip (32px, 15px label). At 20px with a
        // 17px numeral the count read as the loudest thing in the pill — it
        // was a size ABOVE the label it belongs to. 18px with a 15px numeral
        // sits under the label instead, which is what a count is. 15px is the
        // floor for anything a person reads as language, and a count is a
        // word here, so it does not go lower.
        "pill-sm": "rounded-full justify-center h-[18px] min-w-[18px] px-1 pb-px text-2xsmall border-transparent",
      },
    },
    defaultVariants: {
      variant: "secondary",
      shape:   "square",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shape, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, shape }), className)}
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

type ContentType = "song" | "album" | "single" | "ep" | "artist" | "playlist" | "label"

/** Exported so a narrow layout can fold a badge's LABEL into a text line —
 *  the discography table does this when its Type column is dropped. */
export const contentTypeConfig: Record<ContentType, { label: string; icon: React.ElementType }> = {
  song:     { label: "Song",     icon: Music2 },
  album:    { label: "Album",    icon: Disc3 },
  single:   { label: "Single",   icon: Disc3 },
  ep:       { label: "EP",       icon: Disc3 },
  artist:   { label: "Artist",   icon: Mic },
  playlist: { label: "Playlist", icon: ListMusic },
  label:    { label: "Label",    icon: Building2 },
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
        "h-[26px] px-[6px] pb-px",
        "text-2xsmall font-normal leading-none whitespace-nowrap",
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

export { Badge, badgeVariants, ContentTypeBadge }
export type { ContentType }

// StatusBadge (privacy) moved to `./status-badge`. Re-exported here for
// backward-compat with existing import sites.
export { StatusBadge } from "./status-badge"
export type { StatusBadgeStatus } from "./status-badge"
