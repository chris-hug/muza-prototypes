"use client"

import { useState } from "react"
import { Pause, Plus, Shuffle, Repeat2, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Waveform } from "@/components/ui/waveform"

// Parse a "m:ss" string to seconds — drives the waveform progress.
function parseTime(s: string): number {
  const [m, sec] = s.split(":").map(Number)
  return (m || 0) * 60 + (sec || 0)
}

// ─── Carbon-style transport icons (matching Figma assets exactly) ─────────────

function SkipBackFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path d="M3 3h2.5v18H3z" />
      <path d="M22.5 3v18L7.5 12z" />
    </svg>
  )
}

function PlayFilledAlt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path d="M4.5 3l16 9-16 9z" />
    </svg>
  )
}

function SkipForwardFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path d="M1.5 3v18l15-9z" />
      <path d="M18.5 3H21v18h-2.5z" />
    </svg>
  )
}

// ─── PlayerBar ────────────────────────────────────────────────────────────────

interface PlayerBarProps {
  className?: string
  track?: {
    title:  string
    artist: string
    album:  string
    image:  string
    /** Audio URL — passed to the waveform so WaveSurfer can decode & play it. */
    url?:   string
  }
  currentTime?: string
  totalTime?:   string
}

export function PlayerBar({
  className,
  track = {
    title:  "Chris Test Song",
    artist: "Xeno & Ronan",
    album:  "Modular New Wave Blues",
    image:  "https://picsum.photos/seed/jazzvinyl/80/80",
    url:    "/audio/chris-test-song.m4a",
  },
  currentTime = "2:24",
  totalTime   = "5:12",
}: PlayerBarProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <div
      className={cn(
        "@container",
        "relative rounded-full border border-border bg-background/75 backdrop-blur-md",
        "shadow-[0px_17px_37px_0px_rgba(0,0,0,0.04),0px_67px_67px_0px_rgba(0,0,0,0.04),0px_150px_90px_0px_rgba(0,0,0,0.02),0px_266px_107px_0px_rgba(0,0,0,0.01)]",
        "overflow-visible",
        className,
      )}
    >

      {/* ══════════════════════════════════════════════════════════════════
           DESKTOP LAYOUT (bar ≥ 640px) — pill with disc overhang + controls
           ══════════════════════════════════════════════════════════════════ */}
      <div className="hidden @min-[640px]:flex items-center h-[72px]">
      {/* ── Current track (left) ──────────────────────────────────────────
            Mobile (<640px bar): handled by the mobile layout.
            Desktop (≥640px)   : scales 240→320px between bar widths
                                 of ~688px and ~1000px. Reaches the 240px
                                 floor exactly when the bar hits its absolute
                                 minimum, and hits 320px max by ~1020px so
                                 it's at full size for the most common desktop
                                 widths. ───────────────────────────────────── */}
      <div className="relative flex items-center shrink-0 w-[200px] @min-[640px]:w-[clamp(15rem,calc(24cqw+5rem),20rem)] h-[72px]">

        {/* Background shape — split into:
            (a) stretchable pill (CSS rounded div) — the body grows with width
            (b) fixed-size lens SVG anchored to the right edge — the protruding
                notch keeps its exact Figma curvature regardless of width. */}
        <div className="absolute inset-[0_11px_0_0] rounded-[32px] bg-background pointer-events-none" />
        <svg
          className="absolute right-0 top-[10px] pointer-events-none"
          width="24"
          height="52"
          viewBox="0 0 24 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M11.57 0C17.922 0 23.07 11.6406 23.07 26C23.07 40.3594 17.922 52 11.57 52C5.219 52 0.07 40.3594 0.07 26C0.07 11.6406 5.219 0 11.57 0Z"
            fill="var(--background)"
          />
        </svg>

        {/* Vinyl disc — overhangs: -5px left, -4px top & bottom */}
        <div className="absolute -left-[5px] -top-[4px] -bottom-[4px] w-[80px] shrink-0 z-10 group/disc">
          {/* The disc is 80×80 centred within the -4px/-4px overflow container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-[80px] rounded-full overflow-hidden shadow-md ring-1 ring-black/10 relative shrink-0 transition-shadow duration-200 group-hover/disc:shadow-lg">
              <img
                src={track.image}
                alt={track.title}
                className={cn(
                  "size-full object-cover transition-all",
                  playing && "animate-spin [animation-duration:5s] [animation-timing-function:linear]",
                )}
                draggable={false}
              />
              {/* Centre spindle hole */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-5 rounded-full bg-background ring-1 ring-black/10 shadow-inner" />
            </div>
          </div>
        </div>

        {/* Track info */}
        <div className="absolute inset-[17px_11px_17px_83px] flex items-center gap-1 min-w-0">
          <div className="flex flex-col gap-[3px] min-w-0 flex-1">
            <p className="text-xs font-normal text-foreground truncate leading-none">
              {track.title}
            </p>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted-foreground truncate leading-none">{track.artist}</span>
              {/* Album + separator drop on mobile so the title/artist stay readable */}
              <span className="text-xs text-muted-foreground shrink-0 leading-none @max-[639px]:hidden">·</span>
              <span className="text-xs text-muted-foreground truncate leading-none @max-[639px]:hidden">{track.album}</span>
            </div>
          </div>
          <button
            className={cn(
              "shrink-0 flex items-center justify-center size-7 rounded-full pl-[6px] cursor-pointer",
              "hover:bg-muted active:bg-muted/80 active:scale-90 transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
              // Hide on mobile: less essential
              "@max-[639px]:hidden",
            )}
            aria-label="Add to library"
          >
            <Plus className="size-5 text-foreground" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Right — player controls ───────────────────────────────────── */}
      {/* Four progressively-relaxed tiers as the bar grows:
            Mobile  ( <640 ): just play button. min-w 88, px-3, no gaps matter.
            Compact (640–687): all icons + waveform with tight gaps + reduced
                               padding (px-3, gap-3, transport gap-2). min-w 392.
            Standard (688–799): normal gaps (px-5, gap-6, transport gap-4),
                               no timestamps. min-w 448.
            Full    (≥800)   : timestamps shown. min-w 524.                       */}
      <div className={cn(
        "flex flex-1 items-center h-[72px] overflow-hidden rounded-r-full",
        "justify-end @min-[640px]:justify-between",
        "px-3 @min-[688px]:px-5",
        "gap-3 @min-[688px]:gap-6",
        "min-w-[88px] @min-[640px]:min-w-[392px] @min-[688px]:min-w-[448px] @min-[800px]:min-w-[524px]",
      )}>

        {/* Skip back / Play / Skip forward — transport (gap shrinks in compact) */}
        <div className="flex items-center gap-2 @min-[688px]:gap-4 shrink-0">
          {/* Skip back — hide on mobile */}
          <button
            className={cn(
              "@max-[639px]:hidden text-foreground rounded-full cursor-pointer",
              "hover:opacity-70 active:scale-90 transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label="Previous track"
          >
            <SkipBackFilled className="size-[30px]" />
          </button>

          {/* Play / Pause — primary CTA, slight scale on hover/active */}
          <button
            onClick={() => setPlaying(p => !p)}
            className={cn(
              "flex items-center justify-center size-12 text-foreground shrink-0 rounded-full cursor-pointer",
              "hover:opacity-80 hover:scale-110 active:scale-95 transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label={playing ? "Pause" : "Play"}
            aria-pressed={playing}
          >
            {playing
              ? <Pause className="size-[42px] fill-current stroke-none" />
              : <PlayFilledAlt className="size-[42px]" />
            }
          </button>

          {/* Skip forward — hide on mobile */}
          <button
            className={cn(
              "@max-[639px]:hidden text-foreground rounded-full cursor-pointer",
              "hover:opacity-70 active:scale-90 transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label="Next track"
          >
            <SkipForwardFilled className="size-[30px]" />
          </button>
        </div>

        {/* Timestamp + waveform — hide entire group on mobile */}
        <div className="hidden @min-[640px]:flex flex-1 items-center justify-center gap-2 h-[31px] min-w-0">
          <span className="hidden @min-[800px]:inline text-xxs text-foreground tabular-nums whitespace-nowrap leading-none">{currentTime}</span>

          {/* Waveform — real WaveSurfer.js instance, interactive (click to seek).
              Stretches with the container, never below 120px; when squeezed, the
              current-track panel on the left shrinks first. */}
          <div className="flex flex-1 items-center min-w-[120px] overflow-hidden">
            <Waveform
              url={track.url}
              playing={playing}
              currentTime={parseTime(currentTime)}
              duration={track.url ? undefined : parseTime(totalTime)}
              height={24}
            />
          </div>

          <span className="hidden @min-[800px]:inline text-xxs text-foreground tabular-nums whitespace-nowrap leading-none">{totalTime}</span>
        </div>

        {/* Shuffle / Repeat / Volume — hide on mobile */}
        <div className="hidden @min-[640px]:flex items-center gap-0.5 shrink-0">
          {[
            { Icon: Shuffle, label: "Shuffle" },
            { Icon: Repeat2, label: "Repeat" },
            { Icon: Volume2, label: "Volume" },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              className={cn(
                "flex items-center justify-center p-1.5 rounded-full cursor-pointer",
                "hover:bg-muted active:bg-muted/80 active:scale-90 transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
              )}
            >
              <Icon className="size-5 text-foreground" strokeWidth={1.5} />
            </button>
          ))}
        </div>

      </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
           MOBILE LAYOUT (bar < 640px) — compact row + progress bar
           per Figma node 20673:8274. Solid (non-glass) background.
           ══════════════════════════════════════════════════════════════════ */}
      <div className="@min-[640px]:hidden flex flex-col h-[56px] bg-background rounded-full">

        {/* ─── Main row: disc (absolute) + text + play + skip forward ─── */}
        <div className="relative flex-1 flex items-center justify-between pl-[72px] pr-[3px] py-2 min-h-0">

          {/* Text — flex-1 so it fills remaining space and truncates */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <p className="text-sm leading-none text-foreground truncate">{track.title}</p>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs leading-none text-muted-foreground truncate shrink-0">{track.artist}</span>
              <span className="text-xs leading-none text-muted-foreground shrink-0">·</span>
              <span className="text-xs leading-none text-muted-foreground truncate">{track.album}</span>
            </div>
          </div>

          {/* Actions — play + skip forward */}
          <div className="flex items-center shrink-0 h-full">
            <button
              onClick={() => setPlaying(p => !p)}
              className={cn(
                "flex items-center justify-center h-full px-2 text-foreground cursor-pointer rounded-full",
                "hover:opacity-70 active:scale-90 transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
              )}
              aria-label={playing ? "Pause" : "Play"}
              aria-pressed={playing}
            >
              {playing
                ? <Pause className="size-[24px] fill-current stroke-none" />
                : <PlayFilledAlt className="size-[24px]" />
              }
            </button>

            <button
              className={cn(
                "flex items-center justify-center h-full pl-2 pr-3 py-2 text-foreground cursor-pointer rounded-full",
                "hover:opacity-70 active:scale-90 transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
              )}
              aria-label="Next track"
            >
              <SkipForwardFilled className="size-[24px]" />
            </button>
          </div>

          {/* Vinyl disc — 68px, overhangs top 7px, anchored to left edge */}
          <div className="absolute left-0 -top-[7px] size-[68px] shrink-0 z-10 group/disc-m">
            <div className="size-full rounded-full overflow-hidden shadow-md ring-1 ring-black/10 relative transition-shadow duration-200 group-hover/disc-m:shadow-lg">
              <img
                src={track.image}
                alt={track.title}
                className={cn(
                  "size-full object-cover transition-all",
                  playing && "animate-spin [animation-duration:5s] [animation-timing-function:linear]",
                )}
                draggable={false}
              />
              {/* Centre spindle hole — same ~25% ratio as desktop */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[17px] rounded-full bg-background ring-1 ring-black/10 shadow-inner" />
            </div>
          </div>
        </div>

        {/* ─── Progress bar — thin 2px strip, padded to clear disc ───── */}
        <div className="h-[2px] pl-[71px] pr-[26px] flex shrink-0">
          <div className="flex-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: "35%" }} />
          </div>
        </div>

      </div>

    </div>
  )
}
