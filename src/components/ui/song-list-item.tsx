"use client"

/*
 * SongListItem — single row in a song list (Artist profile "Top
 * Songs", playlist detail, search results, etc.).
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 8971:98256 →
 * `list-element/song-with-cover`.
 *
 * Layout:
 *   ┌──────────┐  Title                            [+] [duration]
 *   │  cover   │  Demo · album · year              [+] [ⓘ] [⋯] [duration]   ← hover
 *   └──────────┘
 *
 * State / interaction:
 *   · Row: `bg-background` at rest, `bg-muted` on hover (no zebra).
 *   · Plus (Add to playlist): always visible.
 *   · Info + More: faded in only on hover.
 *   · Duration: always visible; same `text-small text-muted-foreground`
 *     style as the meta line — no special tabular sizing.
 *   · Cover hover overlay (mouse only): dark wash + Play icon.
 *
 * The right cluster has a small left-side gradient veil so meta text
 * fades cleanly into the row bg right before the action icons,
 * preventing visible overlap when titles or album lines wrap close.
 */

import * as React from "react"
import { useState } from "react"
import { Plus, Info, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlayFilledAlt, PauseFilledAlt } from "@/components/ui/transport-icons"

export interface SongListItemProps {
  cover:    string
  title:    string
  artist?:  string
  album?:   string
  year?:    string | number
  /** Optional small chip shown before the album/year line (e.g. "Demo"). */
  badge?:   string
  /** Formatted duration like "3:42". Same style as the meta line. */
  duration?: string
  onPlay?:          () => void
  onAddToPlaylist?: () => void
  onMore?:          () => void
  /** Optional menu rendered when the kebab is clicked. When provided,
   *  the kebab becomes a DropdownMenuTrigger and `onMore` is ignored.
   *  Pass an `AlbumCardMenuItems` (or any DropdownMenu*-compatible
   *  children) so the row can carry the same context menu as its
   *  album card. */
  menuItems?:       React.ReactNode
  onInfo?:          () => void
  /** Click target for the title text (navigates to song detail). */
  onTitleClick?:    () => void
  /** Click target for the album text in the meta line. */
  onAlbumClick?:    () => void
  /** Click target for the artist text in the meta line. */
  onArtistClick?:   () => void
  className?: string
}

export function SongListItem({
  cover, title, artist, album, year, badge, duration,
  onPlay, onAddToPlaylist, onMore, menuItems, onInfo,
  onTitleClick, onAlbumClick, onArtistClick, className,
}: SongListItemProps) {
  // Local playback state — `idle` or `playing`. Real wiring would
  // lift this to a global player store. Hovering a playing row
  // surfaces the pause icon (preview of the click action); clicking
  // returns the row to idle.
  const [playing, setPlaying] = useState(false)

  // Row-wide click toggles play/pause. Clicks on interactive
  // children (buttons / anchors) are ignored so the title / album /
  // artist text buttons and the cluster icons never trigger play.
  const onRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element
    if (target.closest("button, a")) return
    setPlaying(p => !p)
    onPlay?.()
  }

  return (
    <div
      onClick={onRowClick}
      className={cn(
        "group/song relative flex items-center gap-3 rounded-md pl-2 pr-2 py-1.5 overflow-clip cursor-pointer",
        // Idle rows: bg-background with bg-muted on hover.
        // Playing rows: always bg-muted — marks this row as the
        // current item even at rest.
        "transition-colors",
        playing ? "bg-muted" : "bg-background hover:bg-muted",
        className,
      )}
    >
      {/* Cover thumb — 48px. Cover button toggles play directly; the
           wrapping row also responds to clicks elsewhere (see
           `onRowClick`). The cover overlay shows the animated muza
           wave when `playing`, otherwise the static play icon on
           desktop hover. */}
      <button
        type="button"
        onClick={() => { setPlaying(p => !p); onPlay?.() }}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="relative size-12 shrink-0 overflow-hidden rounded-xs shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 outline-none cursor-pointer"
      >
        <img
          src={cover}
          alt=""
          draggable={false}
          className="size-full object-cover"
        />
        {/* Theme-agnostic cover overlay — `bg-black/40` + `text-white`
             so the wash stays dark and the icon stays light in dark
             mode too.
             · Idle, hovered (desktop)  → Play icon.
             · Playing, NOT hovered     → animated wave.
             · Playing, hovered         → Pause icon (preview of the
                                          action a click will trigger). */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
            playing
              ? "opacity-100"
              : "hidden md:flex opacity-0 group-hover/song:opacity-100",
          )}
        >
          {playing ? (
            <>
              {/* Wave shows when playing & not hovered; fades out on hover. */}
              <PlayingWave className="absolute size-7 text-white transition-opacity group-hover/song:opacity-0" />
              {/* Pause icon shows on hover only. */}
              <PauseFilledAlt className="absolute size-4 text-white opacity-0 transition-opacity group-hover/song:opacity-100" />
            </>
          ) : (
            <PlayFilledAlt className="size-4 text-white" />
          )}
        </span>
      </button>

      {/* Info — title row + meta row. min-w-0 so long titles can
           truncate inside flex. */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onTitleClick}
          className="text-small font-normal leading-5 text-foreground text-left truncate hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] outline-none cursor-pointer"
        >
          {title}
        </button>
        <div className="flex items-center gap-1.5 min-w-0 text-small text-muted-foreground leading-5">
          {badge && (
            <Badge variant="secondary" className="shrink-0">
              {badge}
            </Badge>
          )}
          {artist && (
            <button
              type="button"
              onClick={onArtistClick}
              className="truncate hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] outline-none cursor-pointer"
            >
              {artist}
            </button>
          )}
          {artist && album && <span aria-hidden="true" className="shrink-0">·</span>}
          {album && (
            <button
              type="button"
              onClick={onAlbumClick}
              className="truncate hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] outline-none cursor-pointer"
            >
              {album}
            </button>
          )}
          {(artist || album) && year && <span aria-hidden="true" className="shrink-0">·</span>}
          {year && <span className="shrink-0">{year}</span>}
        </div>
      </div>

      {/* Right cluster — at rest: ONLY [Plus] [Duration], so the
           title/meta on the left get every pixel of leftover space
           (no premature truncation). On hover: a hover-only overlay
           docks against the cluster's left edge, carrying More + Info
           inside its own `bg-muted` panel — the panel masks whatever
           meta text it covers, so the icons stay legible without
           pushing layout around. */}
      <div className="flex items-center gap-0.5 shrink-0 relative px-2 py-1.5">
        {/* Hover-only icon panel — absolute, with `right` tuned so
             the Info button's right edge sits exactly 2px left of
             Plus's left edge (the cluster's `pl-2` is 8px, so we
             nudge the overlay 6px back into the cluster: 8 − 6 = 2).
             Result: every icon (More → Info → Plus) is separated by
             the same 2px gap (`gap-0.5`).
             Background is a linear-gradient with absolute stops:
             0 → 32px fades transparent → muted (soft lead-in over
             the meta text), and from 32px onward the bg holds at
             solid muted so every icon sits on fully opaque ground. */}
        <div
          className="absolute right-[calc(100%-6px)] top-1/2 -translate-y-1/2 flex items-center gap-0.5 py-1.5 pl-8 pr-0 bg-[linear-gradient(to_right,transparent_0px,var(--muted)_32px)] opacity-0 pointer-events-none transition-opacity group-hover/song:opacity-100 group-hover/song:pointer-events-auto"
        >
          {menuItems ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6}>
                {menuItems}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onMore}
              aria-label="More options"
            >
              <MoreHorizontal />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onInfo}
            aria-label="Song info"
          >
            <Info />
          </Button>
        </div>

        {/* Plus — always visible, sits right next to the duration. */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onAddToPlaylist}
          aria-label="Add to playlist"
        >
          <Plus />
        </Button>

        {/* Duration — text-xsmall (next smaller than meta) with a
             min-width track ("12:34" at ~40px). Right-aligned so the
             Plus icon's neighbour edge stays put across rows. */}
        {duration && (
          <span className="text-right min-w-10 text-xsmall text-muted-foreground leading-4">
            {duration}
          </span>
        )}
      </div>
    </div>
  )
}

/*
 * PlayingWave — miniature 3D carousel that echoes the home page's
 * `AnimatedLogo`: four dots arranged around a Y-axis (90° apart) on
 * a `transform-style: preserve-3d` stage. The outer wrapper sets the
 * perspective; the inner stage rotates Y on a linear loop. From the
 * camera's POV each dot orbits front → side → back → side, so the
 * trio reads as motion-through-depth rather than a flat circle
 * spinning.
 *
 * Sized via percentages so the same component works at any caller
 * box size — dots scale with the wrapper.
 */
export function PlayingWave({ className }: { className?: string }) {
  // Three layers of motion:
  //   1. Outer wrapper — subtle Y-float (`muzaCarouselFloat`).
  //   2. Inner stage  — rotates Y around the perspective axis
  //                     (`muzaCarousel`), holding the dots on their
  //                     orbit positions.
  //   3. Per-dot snap — each dot wrapped in an `orbitPos` span that
  //                     pins the orbit transform, then an inner
  //                     `<span>` runs `muzaDotSnap` to pop briefly.
  //                     Staggered delays so the pops roll round.
  // Perspective 36 / translateZ 12 / dot 42% tuned together so the
  // front-position dot reads notably larger than the back without
  // overflowing the 40px wrapper.
  // Four solid dots positioned around a 3D Y-axis. No per-dot
  // snaps — just steady carousel rotation plus the outer wrapper's
  // subtle float.
  const dot = "absolute top-1/2 left-1/2 size-[42%] -mt-[21%] -ml-[21%] rounded-full bg-current"
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-block [perspective:25px] [transform-style:preserve-3d]",
        "[animation:muzaCarouselFloat_3.5s_ease-in-out_infinite]",
        className,
      )}
    >
      <span className="absolute inset-0 [transform-style:preserve-3d] [animation:muzaCarousel_8s_linear_infinite]">
        <span className={`${dot} [transform:rotateY(0deg)_translateZ(8px)]`} />
        <span className={`${dot} [transform:rotateY(90deg)_translateZ(8px)]`} />
        <span className={`${dot} [transform:rotateY(180deg)_translateZ(8px)]`} />
        <span className={`${dot} [transform:rotateY(270deg)_translateZ(8px)]`} />
      </span>
    </span>
  )
}
