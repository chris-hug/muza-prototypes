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

/** The Mint pair from the avatar palette (`src/lib/avatar.ts`): the system's
 *  one soft green. Exported because every "good" state uses it — the `new`
 *  variant, a sale on a product, an order marked Delivered, a full match in
 *  the upload dialog — and they used Tailwind's `green-*` before, a second
 *  green with no place in the palette. One constant, so the greens cannot
 *  drift apart again. */
export const BADGE_MINT =
  "bg-[#F4FAF6] text-[#27563F] border-[#27563F]/15 " +
  "dark:bg-[#27563F] dark:text-[#F4FAF6] dark:border-[#F4FAF6]/15"

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
        new: BADGE_MINT,
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
        // A count that asks for attention on its own: unread orders on a tab,
        // the cart's items, active filters. Foreground on background, so it
        // reads in both modes. Three call sites drew this by hand, each with
        // its own size and its own guess at the optical nudge.
        inverse:
          "bg-foreground text-background font-medium tabular-nums",
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
        // Tiny inline badge for use INSIDE other text rows: "Owned" and
        // "Local" in a card's last line, the album header's meta line, the
        // library table. 18px tall, so it doesn't push the line box and
        // stays optically right-sized next to body text. Word only — at
        // this size an icon is detail nobody can read.
        // `rounded-[4px]`: the 1px corner it was drawn with read as a
        // square cut-out next to the app's soft shapes; 4 is the sm corner
        // scaled to 18px of height. `px-1.5` gives a one-word label room.
        // No `pb-px`, unlike the larger shapes. Measured on "Owned" (cap and
        // ascender to baseline, no descender — what these labels are): with
        // the nudge the ink sat 3.6px from the top and 4.6 from the bottom,
        // half a pixel high; without it, 4.1 and 4.1.
        // `leading-[18px]` (= its height) because the badge otherwise
        // inherits the line height of wherever it sits: under a card
        // (leading-[18px]) the ink sat 4.4 / 3.8, in the album page's meta
        // line (leading-none) 4.9 / 3.3 — the same badge, visibly two.
        // Owning its line height makes it one thing on every surface. It
        // must come after `text-2xsmall`: tailwind-merge drops a leading
        // that a later text size would reset.
        "square-xs": "rounded-[4px] border-0 h-[18px] px-1.5 text-2xsmall leading-[18px] gap-0.5 [&>svg]:size-2.5",
        // The count pill — ONE size. There used to be two, `pill` (20px,
        // 17px numeral) for a 40px Chip and `pill-sm` (18px, 15px) for a
        // 32px one; in the product only the small one was ever reached (the
        // 40px chip with a count exists on the design-system page alone),
        // and the large one's single call site was a menu row where 17px
        // put the number a size above its label. A count is a footnote to a
        // label, so it sits under it; 15px is the floor for anything read as
        // language, so it goes no lower.
        // `pb-px` mirrors the optical-center nudge Button/Tabs use —
        // Founders Grotesk numerals sit low in a flex-centered box.
        // `border-transparent` overrides the base border so the pill reads
        // as a fill, not a stroked badge. `px-1` so a single digit lands
        // inside `min-w-[18px]` as a true circle; two digits widen it.
        pill: "rounded-full justify-center h-[18px] min-w-[18px] px-1 pb-px text-2xsmall border-transparent",
      },
    },
    // Measured, not guessed. The inverse count is medium weight, and with the
    // pill's `pb-px` its numeral sat 0.47px HIGH; without it, 0.03px. The
    // hand-built copies it replaced sat 0.78px low. `px-0.5` because a medium
    // digit plus `px-1` came out 19 wide on an 18 height: an oval, which reads
    // as a numeral off centre, the very thing this was reported for.
    compoundVariants: [
      { variant: "inverse", shape: "pill", class: "pb-0 px-0.5" },
      // The inline label's fill is the count's (`bg-accent`), not
      // secondary's `bg-muted`: on the near-white page `muted` all but
      // vanished at 18px, and `accent` is the one step up that still reads
      // as quiet. Only at xs — the 26px secondary badge keeps its own fill.
      { variant: "secondary", shape: "square-xs", class: "bg-accent" },
      // `square-xs` drops the border for the filled label, which left the
      // outline variant at this size with no outline at all — a word on a
      // faint wash. The outline IS that variant, so it comes back here.
      { variant: "outline", shape: "square-xs", class: "border" },
    ],
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
