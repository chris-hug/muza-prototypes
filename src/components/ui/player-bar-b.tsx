"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, Plus, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Waveform } from "@/components/ui/waveform"
import { Slider } from "@/components/ui/slider"
import { SkipBackFilled, PlayFilledAlt, SkipForwardFilled } from "@/components/ui/transport-icons"
import { ShuffleToggle, RepeatToggle } from "@/components/ui/transport-toggles"

// ═══════════════════════════════════════════════════════════════════════════
// Shared constants
// ═══════════════════════════════════════════════════════════════════════════

/** Parse "m:ss" → seconds (used as a fallback when there's no decoded audio). */
const parseTime = (s: string) => {
  const [m, sec] = s.split(":").map(Number)
  return (m || 0) * 60 + (sec || 0)
}

/** Common focus-ring utility (matches the global design system). */
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"

/** Ghost icon button — same hover/active/focus as the project-wide Button[variant=ghost]. */
const ghostIconBtn = cn(
  "flex items-center justify-center p-1.5 rounded-full cursor-pointer shrink-0",
  "hover:bg-accent active:bg-accent/80 active:scale-90 transition-all duration-150",
  focusRing,
)

/** Transport button (skip/play) — opacity-based hover, no fill. */
const transportBtn = cn(
  "flex items-center justify-center text-foreground rounded-full cursor-pointer",
  "hover:opacity-70 active:scale-90 transition-all duration-150",
  focusRing,
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
)

// ═══════════════════════════════════════════════════════════════════════════
// Vinyl disc — spinning album art with a centre spindle hole
// ═══════════════════════════════════════════════════════════════════════════

function Disc({
  src, alt, playing, size, spindle, className,
}: {
  src:      string
  alt:      string
  playing:  boolean
  size:     number   // disc diameter in px
  spindle:  number   // spindle-hole diameter in px
  className?: string // positioning / extra classes from parent
}) {
  return (
    <div className={cn("group/disc shrink-0 z-10", className)} style={{ width: size, height: size }}>
      <div className="size-full rounded-full overflow-hidden shadow-md ring-1 ring-black/10 relative transition-shadow duration-200 group-hover/disc:shadow-lg">
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={cn(
            "size-full object-cover",
            // Animation is always mounted — only the play-state toggles — so
            // pausing freezes the disc at its current angle instead of snapping
            // back to 0°.
            "animate-spin [animation-duration:5s] [animation-timing-function:linear]",
            !playing && "[animation-play-state:paused]",
          )}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-800 ring-1 ring-black/10 shadow-inner flex items-center justify-center"
          style={{ width: spindle, height: spindle }}
        >
          {/* Tiny bright centre dot */}
          <div
            className="rounded-full bg-neutral-100"
            style={{ width: Math.max(2, Math.round(spindle * 0.15)), height: Math.max(2, Math.round(spindle * 0.15)) }}
          />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Title + "Artist · Album" text stack — shared between desktop & mobile
// ═══════════════════════════════════════════════════════════════════════════

function TrackText({
  title, artist, album, gap = "gap-2",
}: {
  title:  string
  artist: string
  album:  string
  gap?:   string
}) {
  return (
    <div className={cn("flex flex-col min-w-0 flex-1", gap)}>
      <p className="text-small leading-none text-foreground truncate">{title}</p>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xsmall leading-none text-muted-foreground truncate shrink-0">{artist}</span>
        <span className="text-xsmall leading-none text-muted-foreground shrink-0">·</span>
        <span className="text-xsmall leading-none text-muted-foreground truncate">{album}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Mobile progress bar — an SVG arc tracing the pill's bottom outline
// ═══════════════════════════════════════════════════════════════════════════

function MobileProgressOutline({ progress }: { progress: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const R = 28                                          // mobile pill cap radius (56 / 2)
  const H = 56                                          // mobile pill height
  const straight = Math.max(0, width - 2 * R)
  const total    = Math.PI * R + straight               // two quarter-caps + straight middle
  const drawn    = total * Math.max(0, Math.min(1, progress))

  // From left-cap midpoint, around the bottom of the pill, to the right-cap midpoint.
  const d =
    width > 0
      ? `M 0 ${R} A ${R} ${R} 0 0 0 ${R} ${H} L ${width - R} ${H} A ${R} ${R} 0 0 0 ${width} ${R}`
      : ""

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none" aria-hidden>
      <svg
        className="absolute inset-0 overflow-visible"
        width={Math.max(width, 1)}
        height={H}
        viewBox={`0 0 ${Math.max(width, 1)} ${H}`}
      >
        <path
          d={d}
          fill="none"
          stroke="var(--muza-blue-200)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${drawn} ${total}`}
          style={{ transition: "stroke-dasharray 100ms linear" }}
        />
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Volume control — collapses to a 32×32 ghost icon button; on hover grows
// upward into a rounded pill containing a vertical slider above the icon.
// Figma node 20628:13362.
// ═══════════════════════════════════════════════════════════════════════════

function VolumeControl({
  volume, onVolumeChange,
}: {
  volume:          number
  onVolumeChange: (v: number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative size-8">
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={cn(
          "absolute bottom-0 left-0 w-8",
          "flex flex-col items-center justify-end rounded-full",
          "transition-all duration-200 ease-out",
          // Expanded pill. Using `ring` (box-shadow) instead of `border` so the
          // icon's vertical position is identical in both states.
          open && "ring-1 ring-inset ring-border bg-background pt-3 pb-0 gap-2.5 shadow-sm z-20",
        )}
      >
        {open && (
          <Slider
            orientation="vertical"
            value={[volume]}
            onValueChange={v => onVolumeChange(Array.isArray(v) ? v[0] : v)}
            min={0}
            max={100}
            aria-label="Volume level"
            className="h-[75px]! min-h-0! [&_[data-slot=slider-control]]:min-h-0!"
          />
        )}
        <div
          aria-label="Volume"
          aria-expanded={open}
          className={cn(
            "flex items-center justify-center size-8 rounded-full transition-colors duration-150",
            !open && "hover:bg-accent",
          )}
        >
          <Volume2 className="size-5 text-foreground" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PlayerBar
// ═══════════════════════════════════════════════════════════════════════════

interface PlayerBarBProps {
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

export function PlayerBarB({
  className,
  track = {
    title:  "Chris Test Song",
    artist: "Xeno & Ronan",
    album:  "Modular New Wave Blues",
    image:  "/images/baby-chris.jpg",
    url:    "/audio/chris-test-song.m4a",
  },
  currentTime = "2:24",
  totalTime   = "5:12",
}: PlayerBarBProps) {
  // Playback
  const [playing,  setPlaying]   = useState(false)
  const [progress, setProgress]  = useState(0)  // 0–1, drives the mobile progress arc

  // Secondary controls
  const [shuffle, setShuffle]    = useState(false)
  const [repeat,  setRepeat]     = useState(false)
  const [volume,  setVolume]     = useState(75)  // 0–100


  return (
    <div
      className={cn(
        "@container relative rounded-full border border-border bg-background/75 backdrop-blur-md",
        "shadow-[0px_17px_37px_0px_rgba(0,0,0,0.04),0px_67px_67px_0px_rgba(0,0,0,0.04),0px_150px_90px_0px_rgba(0,0,0,0.02),0px_266px_107px_0px_rgba(0,0,0,0.01)]",
        "overflow-visible",
        className,
      )}
    >

      {/* ─────────────────────────────────────────────────────────────────
           DESKTOP (bar ≥ 640px) — glass pill with a protruding disc on
           the left and transport + waveform + secondary controls on the
           right. Three sizing tiers (640→687, 688→799, ≥800) progressively
           relax gaps / padding and add timestamps.
           ───────────────────────────────────────────────────────────── */}
      <div className="hidden @min-[640px]:flex items-center h-[80px]">

        {/* ── Current track (left) ──
             Scales 240→320px between bar widths ~688 and ~1000, hitting
             the 240px floor exactly when the right section reaches its
             minimum, and its 320px cap at common desktop widths. */}
        <div className="relative flex items-center shrink-0 h-[80px] w-[clamp(15rem,calc(24cqw+5rem),20rem)]">
          {/* Background: a stretchable CSS pill + a fixed-size SVG lens on
              the right edge that creates the protruding notch per Figma. */}
          <div className="absolute inset-[0_11px_0_0] rounded-[32px] bg-background pointer-events-none" />
          <svg
            className="absolute right-0 top-[14px] pointer-events-none"
            width="24" height="52" viewBox="0 0 24 52" fill="none"
            xmlns="http://www.w3.org/2000/svg" aria-hidden
          >
            <path
              d="M11.57 0C17.922 0 23.07 11.6406 23.07 26C23.07 40.3594 17.922 52 11.57 52C5.219 52 0.07 40.3594 0.07 26C0.07 11.6406 5.219 0 11.57 0Z"
              fill="var(--background)"
            />
          </svg>

          {/* Disc — overhangs the pill by 5px left and 4px top/bottom. */}
          <Disc
            src={track.image}
            alt={track.title}
            playing={playing}
            size={96}
            spindle={30}
            className="absolute -left-[8px] -top-[8px]"
          />

          {/* Text + Plus button — positioned inside the solid pill. */}
          <div className="absolute inset-[19px_11px_19px_96px] flex items-center gap-1 min-w-0">
            <TrackText title={track.title} artist={track.artist} album={track.album} gap="gap-2" />
            <button className={ghostIconBtn} aria-label="Add to library">
              <Plus className="size-5 text-foreground" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* ── Right — controls ──
             Min-widths are content-driven; they plus the current-track's 240px
             floor equal the bar's absolute minimum, so nothing ever overflows. */}
        <div className={cn(
          "flex flex-1 items-center justify-between h-[80px] rounded-r-full",
          "px-3 @min-[688px]:px-5",
          "gap-3 @min-[688px]:gap-6",
          "min-w-[392px] @min-[688px]:min-w-[448px] @min-[800px]:min-w-[524px]",
        )}>

          {/* Shuffle / Skip back / Play / Skip forward / Repeat — Player B
              folds Shuffle + Repeat into the transport row (outside the back
              and forward buttons) instead of putting them on the far right. */}
          <div className="flex items-center gap-2 @min-[688px]:gap-4 shrink-0">
            <ShuffleToggle
              active={shuffle}
              onToggle={() => setShuffle(s => !s)}
              w={40}
              h={32}
              iconSize={18}
            />

            <button className={transportBtn} aria-label="Previous track">
              <SkipBackFilled className="size-[30px]" />
            </button>
            <button
              onClick={() => setPlaying(p => !p)}
              aria-label={playing ? "Pause" : "Play"}
              aria-pressed={playing}
              // Primary CTA — slight scale-up on hover to differentiate from skip buttons.
              className={cn(transportBtn, "size-12 hover:opacity-80 hover:scale-110 active:scale-95")}
            >
              {playing
                ? <Pause         className="size-[42px] fill-current stroke-none" />
                : <PlayFilledAlt className="size-[42px]" />
              }
            </button>
            <button className={transportBtn} aria-label="Next track">
              <SkipForwardFilled className="size-[30px]" />
            </button>

            <RepeatToggle
              active={repeat}
              onToggle={() => setRepeat(r => !r)}
              w={40}
              h={32}
              iconSize={18}
            />
          </div>

          {/* Timestamp + waveform — timestamps only show at ≥800px so the
              waveform keeps its 120px floor at tighter widths. */}
          <div className="flex flex-1 items-center justify-center gap-2 h-12 min-w-0">
            <span className="hidden @min-[800px]:inline text-2xsmall text-foreground tabular-nums whitespace-nowrap leading-none">
              {currentTime}
            </span>

            <div className="flex flex-1 items-center min-w-[120px]">
              <Waveform
                url={track.url}
                playing={playing}
                currentTime={parseTime(currentTime)}
                duration={track.url ? undefined : parseTime(totalTime)}
                onSeek={() => setPlaying(true)}
                onTimeUpdate={(t, dur) => setProgress(dur > 0 ? t / dur : 0)}
                height={40}
                hoverLineHeight={72}
              />
            </div>

            <span className="hidden @min-[800px]:inline text-2xsmall text-foreground tabular-nums whitespace-nowrap leading-none">
              {totalTime}
            </span>
          </div>

          {/* Volume only — Shuffle and Repeat moved into the transport row above. */}
          <div className="flex items-center shrink-0">
            <VolumeControl volume={volume} onVolumeChange={setVolume} />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
           MOBILE (bar < 640px) — compact pill with a 68px disc, text,
           play + skip-forward, and a progress arc tracing the bottom
           outline. Solid (non-glass) background per Figma node 20673:8274.
           ───────────────────────────────────────────────────────────── */}
      <div className="@min-[640px]:hidden relative flex flex-col h-[56px] bg-background rounded-full">

        <div className="relative flex-1 flex items-center justify-between pl-[72px] pr-[3px] py-2 min-h-0">
          <TrackText title={track.title} artist={track.artist} album={track.album} gap="gap-1" />

          <div className="flex items-center shrink-0 h-full">
            <button
              onClick={() => setPlaying(p => !p)}
              aria-label={playing ? "Pause" : "Play"}
              aria-pressed={playing}
              className={cn(transportBtn, "h-full px-2")}
            >
              {playing
                ? <Pause         className="size-[24px] fill-current stroke-none" />
                : <PlayFilledAlt className="size-[24px]" />
              }
            </button>
            <button aria-label="Next track" className={cn(transportBtn, "h-full pl-2 pr-3 py-2")}>
              <SkipForwardFilled className="size-[24px]" />
            </button>
          </div>

          {/* Disc — overhangs the pill slightly (-4px left, -7px top). */}
          <Disc
            src={track.image}
            alt={track.title}
            playing={playing}
            size={68}
            spindle={23}
            className="absolute -left-[4px] -top-[7px]"
          />
        </div>

        <MobileProgressOutline progress={progress} />
      </div>

    </div>
  )
}
