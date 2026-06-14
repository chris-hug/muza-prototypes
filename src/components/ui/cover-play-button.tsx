"use client"

/*
 * CoverPlayButton — the square cover-as-play-button used in every
 * row that carries a track or release.
 *
 * State table (driven entirely by CSS — no children swap, so every
 * transition crossfades cleanly):
 *
 *   idle,    not hovered  →  cover only (overlay hidden)
 *   idle,    hovered      →  cover + dark wash + Play icon
 *   playing, not hovered  →  cover + dark wash + 3D wave
 *   playing, hovered      →  cover + dark wash + Pause icon (Carbon)
 *
 * `data-playing` toggles on the button; all four states fall out of
 * one stable DOM. Use `hoverGroup="row"` / `"song"` to bind the
 * hover signal to a parent `group/row` or `group/song` (so the
 * overlay only appears when the whole row is hovered, not just the
 * thumb).
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { PlayFilledAlt, PauseFilledAlt } from "@/components/ui/transport-icons"
import { PlayingWave } from "@/components/ui/playing-wave"
import { CoverArt } from "@/components/ui/cover-art"

export interface CoverPlayButtonProps {
  /** Image URL for the cover thumbnail. */
  src: string
  /** Track or release title — fed into the aria-label. */
  title: string
  /** Whether the row is currently playing. */
  playing: boolean
  /** Click handler — should toggle the playing state. */
  onToggle?: () => void
  /** Which parent group the hover-overlay listens to. Defaults to
   *  `self` (the button hovers itself). Use `row` / `song` to wire
   *  the overlay to a parent `group/row` or `group/song`. */
  hoverGroup?: "self" | "row" | "song"
  /** Tailwind size — defaults to `size-12` (48px). Pass any size
   *  class (e.g. `size-10`, `size-14`). */
  sizeClassName?: string
  className?: string
}

// Class maps per hover-group. Tailwind needs these as literal strings
// so the JIT sees them at build time — that's why each mode is
// written out longhand instead of templated.
//
// Selector logic per child:
//   overlay → visible when (playing OR hover)
//   play    → visible when (hover AND NOT playing)
//   wave    → visible when (playing AND NOT hover)
//   pause   → visible when (playing AND hover)
//
// The button carries `data-playing` (when true) AND is itself
// `group/cpb`, so children can read playing state via
// `group-data-[playing]/cpb:`. The hover signal comes from whichever
// group is named in `hoverGroup`.
const CLASSES = {
  self: {
    overlay: "group-data-[playing]/cpb:opacity-100 group-hover/cpb:opacity-100",
    play:    "group-hover/cpb:opacity-100 group-data-[playing]/cpb:opacity-0",
    wave:    "group-data-[playing]/cpb:opacity-100 group-data-[playing]/cpb:group-hover/cpb:opacity-0",
    pause:   "group-data-[playing]/cpb:group-hover/cpb:opacity-100",
  },
  row: {
    overlay: "group-data-[playing]/cpb:opacity-100 group-hover/row:opacity-100",
    play:    "group-hover/row:opacity-100 group-data-[playing]/cpb:opacity-0",
    wave:    "group-data-[playing]/cpb:opacity-100 group-data-[playing]/cpb:group-hover/row:opacity-0",
    pause:   "group-data-[playing]/cpb:group-hover/row:opacity-100",
  },
  song: {
    overlay: "group-data-[playing]/cpb:opacity-100 group-hover/song:opacity-100",
    play:    "group-hover/song:opacity-100 group-data-[playing]/cpb:opacity-0",
    wave:    "group-data-[playing]/cpb:opacity-100 group-data-[playing]/cpb:group-hover/song:opacity-0",
    pause:   "group-data-[playing]/cpb:group-hover/song:opacity-100",
  },
} as const

export function CoverPlayButton({
  src,
  title,
  playing,
  onToggle,
  hoverGroup = "self",
  sizeClassName = "size-12",
  className,
}: CoverPlayButtonProps) {
  const c = CLASSES[hoverGroup]
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? `Pause ${title}` : `Play ${title}`}
      data-playing={playing || undefined}
      className={cn(
        "group/cpb relative shrink-0 rounded-xs shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 outline-none cursor-pointer",
        sizeClassName,
        className,
      )}
    >
      {/* Clipped layer — cover image + dark wash + Play/Pause icons.
           `overflow-hidden` rounds the cover corners. Everything in
           here is flat 2D, so clipping is harmless. */}
      <span className="absolute inset-0 overflow-hidden rounded-xs">
        <CoverArt src={src} />
        {/* Dark-wash overlay — always rendered, opacity-0 at rest,
             fades in when playing OR hovered. `bg-black/40 + text-white`
             keeps the wash theme-agnostic (still dark in dark mode). */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-150",
            c.overlay,
          )}
        >
          {/* Play / Pause crossfade — CSS opacity decides which shows. */}
          <PlayFilledAlt
            className={cn(
              "absolute size-4 text-white opacity-0 transition-opacity duration-150",
              c.play,
            )}
          />
          <PauseFilledAlt
            className={cn(
              "absolute size-4 text-white opacity-0 transition-opacity duration-150",
              c.pause,
            )}
          />
        </span>
      </span>
      {/* 3D wave — rendered OUTSIDE the overflow-hidden clip. A clipping
           (overflow:hidden) ancestor is a grouping context that flattens
           + rasterizes any descendant `preserve-3d` subtree, which
           resampled the dots into a permanent blur. Kept unclipped here
           it renders crisp; it's centered 28px well inside the cover, so
           there's nothing to clip anyway. Opacity/crossfade sit on this
           plain wrapper, never on the PlayingWave's 3D root. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity duration-150",
          c.wave,
        )}
      >
        <PlayingWave size={28} />
      </span>
    </button>
  )
}
