"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, Plus, MoreVertical, Info, Share, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import { Waveform } from "@/components/ui/waveform"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkipBackFilled, PlayFilledAlt, SkipForwardFilled } from "@/components/ui/transport-icons"
import { ShuffleToggle, RepeatToggle } from "@/components/ui/transport-toggles"

// ═══════════════════════════════════════════════════════════════════════════
// Shared utilities
// ═══════════════════════════════════════════════════════════════════════════

const parseTime = (s: string) => {
  const [m, sec] = s.split(":").map(Number)
  return (m || 0) * 60 + (sec || 0)
}

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

export type PlayerOverlayTab = "lyrics" | "now-listening" | "up-next"

interface PlayerOverlayProps {
  className?:    string
  track?: {
    title:  string
    artist: string
    album:  string
    image:  string
    url?:   string
  }
  /** Artist avatar URL (small circle next to the artist name). */
  artistAvatar?: string
  /** Source the track is playing from — shown in the top header. */
  playingFrom?: string
  currentTime?: string
  totalTime?:   string
  /** Optional close / swipe-down callback triggered by the drag handle. */
  onClose?:     () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// MarqueeText — when the text overflows its container, gently scrolls back
// and forth so the user can read it in full. When it fits, behaves like a
// regular truncating element.
// ═══════════════════════════════════════════════════════════════════════════

function MarqueeText({ children, className }: { children: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef      = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(0)

  useEffect(() => {
    const cont = containerRef.current
    const text = textRef.current
    if (!cont || !text) return
    const measure = () => {
      const o = text.scrollWidth - cont.clientWidth
      setOverflow(o > 0 ? o : 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(cont)
    ro.observe(text)
    return () => ro.disconnect()
  }, [children])

  // Slow scroll so users can read — ~80px per second, with pauses at each end.
  const duration = Math.max(8, overflow / 40 + 4)

  return (
    <div ref={containerRef} className="overflow-hidden w-full">
      <span
        ref={textRef}
        className={cn("inline-block whitespace-nowrap will-change-transform", className)}
        style={overflow > 0 ? {
          animation: `player-overlay-marquee ${duration}s ease-in-out infinite`,
          ['--marquee-end' as string]: `-${overflow}px`,
        } : undefined}
      >
        {children}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PlayerOverlay — full-screen "Now Listening" sheet for mobile
// ═══════════════════════════════════════════════════════════════════════════

export function PlayerOverlay({
  className,
  track = {
    title:  "On Green Dolphin Street",
    artist: "Sonny Rollins",
    album:  "Sonny Rollins - There Will Never Be Another You",
    image:  "/images/baby-chris.jpg",
    url:    "/audio/chris-test-song.m4a",
  },
  artistAvatar = "https://picsum.photos/seed/sonny/48/48",
  playingFrom  = "There Will Never Be Another You (Live At The Museum Of Modern Art, New York, 1965)",
  currentTime  = "2:24",
  totalTime    = "5:12",
  onClose,
}: PlayerOverlayProps) {
  const [playing, setPlaying] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat,  setRepeat]  = useState(false)
  const [tab,     setTab]     = useState<PlayerOverlayTab>("now-listening")

  // ── Adaptive sizing ──────────────────────────────────────────────────
  //  Priority: every element stays visible in the viewport, no scrolling.
  //  Only once all fixed sections fit, any leftover vertical space is split
  //  between the cover (grows towards MAX_COVER) and the waveform (grows
  //  towards MAX_WAVEFORM). Transport controls also scale up on bigger
  //  devices via `t` (same 0→1 lerp the waveform uses).
  const rootRef = useRef<HTMLDivElement>(null)
  const [coverSize,      setCoverSize]      = useState(240)
  const [waveformHeight, setWaveformHeight] = useState(40)
  const [scale,          setScale]          = useState(0)   // 0 (SE 1st gen) → 1 (Pro Max)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    // Sum of non-dynamic heights: drag (~36) + "Playing from" (~50) +
    // cover-to-meta gap (8) + title+artist+mt-3 (~76) + secondary icons
    // region floor (py-2 + 32 = 48) + transport region floor (py-2 + ~64 max
    // play button = 80) + tabs (~80) = 378. Both flex-1 regions can grow
    // beyond their floor when there's spare height; the cover and waveform
    // grow into whatever's left.
    const FIXED_SECTIONS = 378
    const MIN_COVER     = 140
    // Sized so the cover fills the available width on the largest current
    // iPhone (Pro Max ≈ 440pt minus 32px horizontal padding = 408 max). On
    // smaller devices the width cap kicks in first.
    const MAX_COVER     = 440
    const MIN_WAVEFORM  = 40
    const MAX_WAVEFORM  = 160
    const HORIZ_PADDING = 32  // px-4 left + right

    const compute = () => {
      const H = el.clientHeight
      const W = el.clientWidth
      const available = Math.max(0, H - FIXED_SECTIONS)

      // Cover is square: its size is capped by both vertical budget and width.
      const maxCoverByHeight = available - MIN_WAVEFORM
      const maxCoverByWidth  = W - HORIZ_PADDING
      const cover = Math.max(MIN_COVER, Math.min(MAX_COVER, maxCoverByHeight, maxCoverByWidth))

      // Waveform takes what's left, capped + floored.
      const wave = Math.max(MIN_WAVEFORM, Math.min(MAX_WAVEFORM, available - cover))

      // Linear 0→1 from SE 1st gen height (568) up to Pro Max (956). Used by
      // the transport-control sizing below.
      const t = Math.max(0, Math.min(1, (H - 568) / (956 - 568)))

      setCoverSize(cover)
      setWaveformHeight(wave)
      setScale(t)
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Transport-control sizes interpolated by `scale` (0 = small device,
  // 1 = Pro Max). Linear lerp between sensible min / max values.
  const lerp        = (lo: number, hi: number) => Math.round(lo + (hi - lo) * scale)
  const playSize    = lerp(48, 64)   // play / pause container
  const playIcon    = lerp(36, 48)
  const skipIcon    = lerp(20, 28)   // skip-back / forward
  // Shuffle / Repeat — promoted to "first-class transport control" footprint
  // (closer to skip-icon size) so they read as primary, not secondary.
  const toggleW     = lerp(48, 64)   // shuffle / repeat ellipse width
  const toggleH     = lerp(40, 56)   // shuffle / repeat ellipse height
  const toggleIcon  = lerp(20, 28)

  return (
    <div ref={rootRef} className={cn("relative w-full h-full overflow-hidden bg-background", className)}>
      {/* Full-bleed cover as the backdrop, gently blurred so it reads as an
           atmospheric background yet is still clearly the album art. A light
           theme tint sits on top to keep foreground text legible, and the
           outline buttons in the sheet use this layer as their "glass". */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: `url(${track.image})`, filter: "blur(32px)" }}
        />
        {/* Light tint in light mode, stronger darkening in dark mode so the
             glass feels appropriately moody against a dark UI. */}
        <div className="absolute inset-0 bg-background/40 dark:bg-background/70" />
      </div>

      {/* Foreground content — centred column of the mobile sheet. */}
      <div className="relative z-10 h-full flex flex-col items-center">

        {/* Drag handle — tap or swipe down dismisses the sheet. */}
        <Button
          variant="ghost"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 w-full py-4 h-auto rounded-none"
        >
          <div className="h-1 w-8 rounded-full bg-foreground/80" />
        </Button>

        {/* "Playing from" header — both lines left-aligned. */}
        <div className="shrink-0 w-full px-4 pb-4 flex flex-col items-start gap-1 text-left">
          <p className="text-2xsmall leading-none text-muted-foreground">Playing from:</p>
          <p className="text-xsmall leading-none font-medium text-muted-foreground truncate w-full">
            {playingFrom}
          </p>
        </div>

        {/* Main content — cover + title + artist + waveform.
             Shrink-0 so it takes exactly its content height; the secondary
             icons row below gets the leftover vertical space to centre into. */}
        <div className="shrink-0 w-full px-4 flex flex-col items-center gap-2">

          {/* Cover art — square, size computed from available height + width.
              `rounded-xs` (2px) matches the design system's image-corner spec. */}
          <div
            className="rounded-xs overflow-hidden shadow-md"
            style={{ width: coverSize, height: coverSize }}
          >
            <img src={track.image} alt={track.title} className="size-full object-cover" draggable={false} />
          </div>

          {/* Title + artist + waveform. Artist badge sits flush under the
              title (0 gap); the waveform gets its own mt-3. */}
          <div className="w-full flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="flex-1 min-w-0 text-large font-medium leading-tight text-foreground">
                <MarqueeText>{track.title}</MarqueeText>
              </h2>
              <Button variant="outline" size="icon" aria-label="Add to library">
                <Plus strokeWidth={1.5} />
              </Button>
              <Button variant="outline" size="icon" aria-label="More options">
                <MoreVertical strokeWidth={1.5} />
              </Button>
            </div>

            {/* Artist label — reads as a caption, not a button. No hover
                 state; the avatar + name simply sit flush under the title. */}
            <div className="self-start flex items-center gap-1.5">
              <img
                src={artistAvatar}
                alt=""
                className="size-6 rounded-full object-cover ring-1 ring-border"
              />
              <span className="text-xsmall font-medium text-muted-foreground">
                {track.artist}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3 w-full">
              <span className="text-2xsmall leading-none text-muted-foreground tabular-nums">
                {currentTime}
              </span>
              <div className="flex-1 min-w-0 flex items-center">
                <Waveform
                  url={track.url}
                  playing={playing}
                  currentTime={parseTime(currentTime)}
                  duration={track.url ? undefined : parseTime(totalTime)}
                  height={waveformHeight}
                  onSeek={() => setPlaying(true)}
                />
              </div>
              <span className="text-2xsmall leading-none text-muted-foreground tabular-nums">
                {totalTime}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary icons — Info / Share / Radio.
            Lives in a flex-1 region between the waveform area (above) and
            the transport (below). `items-center justify-center` centres the
            row in that leftover space; `py-2` enforces an 8px minimum top
            and bottom padding so the icons never touch the neighbouring
            sections even when the region shrinks on small screens. */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center py-2">
          <div className="flex items-center justify-center gap-8">
            <Button variant="ghost" size="icon-sm" aria-label="Info / credits">
              <Info className="size-5" strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Share">
              <Share className="size-5" strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Start radio">
              <Radio className="size-5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Transport row — Shuffle · Back · Play/Pause (big) · Forward · Repeat.
            Wrapped in its own `flex-1 items-center` region so the transport
            sits visually centred between the secondary-icons row above and
            the tabs row below — both regions get an equal share of the
            leftover vertical space. */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center px-4 py-2">
          <div className="flex items-center gap-3">
            <ShuffleToggle
              active={shuffle}
              onToggle={() => setShuffle(s => !s)}
              w={toggleW}
              h={toggleH}
              iconSize={toggleIcon}
            />

            <Button variant="ghost" size="icon-sm" aria-label="Previous track" className="hover:bg-transparent">
              <SkipBackFilled style={{ width: skipIcon, height: skipIcon }} />
            </Button>

            <Button
              variant="ghost"
              onClick={() => setPlaying(p => !p)}
              aria-label={playing ? "Pause" : "Play"}
              aria-pressed={playing}
              className="p-0 hover:bg-transparent"
              style={{ width: playSize, height: playSize }}
            >
              {playing
                ? <Pause         className="fill-current stroke-none" style={{ width: playIcon, height: playIcon }} />
                : <PlayFilledAlt style={{ width: playIcon, height: playIcon }} />
              }
            </Button>

            <Button variant="ghost" size="icon-sm" aria-label="Next track" className="hover:bg-transparent">
              <SkipForwardFilled style={{ width: skipIcon, height: skipIcon }} />
            </Button>

            <RepeatToggle
              active={repeat}
              onToggle={() => setRepeat(r => !r)}
              w={toggleW}
              h={toggleH}
              iconSize={toggleIcon}
            />
          </div>
        </div>

        {/* Tab switcher — Lyrics / Now listening / Up next.
            Uses the design-system Tabs (Pill variant). */}
        <div className="shrink-0 w-full flex items-center justify-center px-4 pt-5 pb-6">
          <Tabs value={tab} onValueChange={v => setTab(v as PlayerOverlayTab)}>
            <TabsList variant="pill">
              {/* font-normal! (important) — needed because the Pill variant's
                  `group-data-[variant=pill]/tabs-list:font-medium` has the
                  same specificity and wins by source order without `!`. */}
              <TabsTrigger value="lyrics"        className="font-normal!">Lyrics</TabsTrigger>
              <TabsTrigger value="now-listening" className="font-normal!">Now listening</TabsTrigger>
              <TabsTrigger value="up-next"       className="font-normal!">Up next</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
