"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, MoreVertical, Info, Share, Radio, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Waveform } from "@/components/ui/waveform"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkipBackFilled, PlayFilledAlt, SkipForwardFilled } from "@/components/ui/transport-icons"
import { ShuffleToggle, RepeatToggle } from "@/components/ui/transport-toggles"
import { MarqueeText } from "@/components/ui/marquee-text"
import { ShareButton } from "@/components/ui/share-button"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
import { CoverPlayButton } from "@/components/ui/cover-play-button"
import { slugify } from "@/lib/media-nav"

// ═══════════════════════════════════════════════════════════════════════════
// Queue row — used by the "Up next" tab. Same anatomy as MediaListItem
// (play-thumb · title · "artist · album" · ⋯) reusing CoverPlayButton. The
// now-playing row passes `progress` (0–1) to paint a Tidal-style solid fill
// behind it marking how far through the track we are.
// ═══════════════════════════════════════════════════════════════════════════

export interface QueueTrack {
  title:    string
  artist:   string
  album?:   string
  image:    string
  duration?: string
}

function QueueRow({
  track, playing = false, progress, onToggle, dragHandle, dragging = false,
}: {
  track:     QueueTrack
  playing?:  boolean
  /** 0–1 — when set, paints the solid progress fill (now-playing row). */
  progress?: number
  onToggle?: () => void
  /** Reorder grip (Up next queue only) — rendered at the right edge. */
  dragHandle?: React.ReactNode
  /** This row is being dragged — lift it above the rest. */
  dragging?: boolean
}) {
  const meta = [track.artist, track.album].filter(Boolean).join(" · ")
  const pct = progress == null ? null : Math.max(0, Math.min(1, progress)) * 100
  return (
    <div
      className={cn(
        "group/row relative flex items-center gap-3 overflow-hidden rounded-xl transition-colors",
        // The now-playing row (has a progress fill) is a touch larger so it
        // reads as the anchor of the queue.
        pct == null
          ? "pl-2 pr-1 py-1.5 hover:bg-foreground/5"
          : "pl-2.5 pr-2 py-2.5 bg-background/40 ring-1 ring-inset ring-border/40",
        // While dragging, lift the row off the list (frosted fill + shadow).
        dragging && "bg-background/90 ring-1 ring-inset ring-border/60 shadow-lg",
      )}
    >
      {/* Tidal-style played-portion fill — more solid than the row base. */}
      {pct != null && (
        <div aria-hidden className="absolute inset-y-0 left-0 bg-background/85 pointer-events-none" style={{ width: `${pct}%` }} />
      )}
      <CoverPlayButton
        src={track.image}
        title={track.title}
        playing={playing}
        onToggle={onToggle}
        hoverGroup="row"
        className="relative"
      />
      <div className="relative flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="text-small leading-5 text-foreground truncate">{track.title}</p>
        {meta && <p className="text-small leading-5 text-muted-foreground truncate">{meta}</p>}
      </div>
      {dragHandle}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// UpNextQueue — the reorderable "Up next" list. Press-and-drag the grip on a
// row to change playback order. Pointer-based (works on touch + mouse); the
// grip carries `touch-none` so a vertical drag reorders instead of scrolling
// the list. Order is local state (prototype) seeded from the `queue` prop.
// ═══════════════════════════════════════════════════════════════════════════

function UpNextQueue({
  queue, onPlayQueueTrack,
}: {
  queue: QueueTrack[]
  onPlayQueueTrack?: (q: QueueTrack) => void
}) {
  const [order, setOrder] = useState<QueueTrack[]>(queue)
  // The parent rebuilds `queue` every render (the time ticks), so syncing on
  // the array reference would wipe a user's reorder each second. Re-seed only
  // when the queue's CONTENTS actually change (e.g. the track advances).
  const queueKey = queue.map(q => q.title).join("")
  useEffect(() => { setOrder(queue) }, [queueKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const listRef = useRef<HTMLUListElement>(null)
  const rowH    = useRef(60)
  // Live drag state kept in a ref (avoids stale closures across fast moves);
  // `dragIndex` + `dragY` mirror it in state to drive the render.
  const dragRef = useRef<{ index: number; pointerId: number; startY: number } | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragY, setDragY] = useState(0)

  const startDrag = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const li = listRef.current?.children[index] as HTMLElement | undefined
    if (li) rowH.current = li.offsetHeight || 60
    dragRef.current = { index, pointerId: e.pointerId, startY: e.clientY }
    setDragIndex(index)
    setDragY(e.clientY)
    // Keep receiving moves even if the finger slips off the grip. Guarded —
    // some environments throw for an inactive pointer id.
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* noop */ }
  }

  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    setDragY(e.clientY)
    const delta = e.clientY - d.startY
    // Step one slot at a time once the finger has crossed a full row height.
    if (Math.abs(delta) >= rowH.current) {
      const dir = delta > 0 ? 1 : -1
      // Capture from/to NOW — the functional updater must not read the ref
      // (which mutates again before React flushes a batch of moves).
      const from = d.index
      const to   = from + dir
      if (to >= 0 && to < order.length) {
        setOrder(prev => {
          const arr = prev.slice()
          const [item] = arr.splice(from, 1)
          arr.splice(to, 0, item)
          return arr
        })
        d.index = to
        d.startY = d.startY + dir * rowH.current
        setDragIndex(to)
      }
    }
  }

  const endDrag = (e: React.PointerEvent) => {
    if (dragRef.current && e.pointerId !== dragRef.current.pointerId) return
    dragRef.current = null
    setDragIndex(null)
  }

  return (
    <ul
      ref={listRef}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="flex flex-col"
    >
      {order.map((q, i) => {
        const isDragging = dragIndex === i
        return (
          <li
            key={`${q.title}-${q.image}`}
            className={cn("touch-pan-y", isDragging ? "relative z-10" : "transition-transform")}
            style={isDragging && dragRef.current ? { transform: `translateY(${dragY - dragRef.current.startY}px)` } : undefined}
          >
            <QueueRow
              track={q}
              dragging={isDragging}
              onToggle={() => onPlayQueueTrack?.(q)}
              dragHandle={
                <button
                  type="button"
                  aria-label={`Reorder ${q.title}`}
                  onPointerDown={startDrag(i)}
                  className="relative shrink-0 flex size-8 items-center justify-center rounded-md text-muted-foreground touch-none cursor-grab active:cursor-grabbing hover:text-foreground hover:bg-foreground/5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <GripVertical strokeWidth={1.5} className="size-4" />
                </button>
              }
            />
          </li>
        )
      })}
    </ul>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared utilities
// ═══════════════════════════════════════════════════════════════════════════

const parseTime = (s: string) => {
  const [m, sec] = s.split(":").map(Number)
  return (m || 0) * 60 + (sec || 0)
}

// Soft top + bottom fade for the scrollable Up-next / Lyrics regions, so
// rows / lines dissolve into the chrome instead of hard-cutting — and the
// bottom fade lands right above the (pinned) transport controls.
const SCROLL_FADE =
  "[mask-image:linear-gradient(to_bottom,transparent_0,#000_18px,#000_calc(100%-28px),transparent_100%)] " +
  "[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,#000_18px,#000_calc(100%-28px),transparent_100%)]"

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
  /** Fired when the user scrubs the waveform (seconds). */
  onSeek?:      (seconds: number) => void
  /** Navigate to the track's artist / album (the artist row + "playing
   *  from" header become links when supplied). */
  onArtistClick?: () => void
  /** Navigate to the source shown in the "Playing from" header (the album
   *  or playlist the track is playing from). When set, that line links. */
  onPlayingFromClick?: () => void
  /** Drive play/pause from the global player store (see PlayerBar). */
  bound?: { playing: boolean; onToggle: () => void }
  /** Drive Shuffle from the global store so it stays in sync everywhere. */
  shuffle?: { active: boolean; onToggle: () => void }
  /** Upcoming tracks shown in the "Up next" tab. */
  queue?: QueueTrack[]
  /** Play a queue track (tapping its row in "Up next"). */
  onPlayQueueTrack?: (track: QueueTrack) => void
  /** Lyric lines shown in the "Lyrics" tab ("" = a stanza break). */
  lyrics?: string[]
}

// Demo queue — used when no real queue is supplied (DS showcase). Real
// usage passes the player's actual up-next list.
const DEMO_QUEUE: QueueTrack[] = Array.from({ length: 8 }, (_, i) => ({
  title:  "Song Title goes here",
  artist: "Artist Name",
  album:  "Album Name",
  image:  `https://picsum.photos/seed/queue${i}/80/80`,
}))

// Demo lyrics — no real lyric provider yet, so these stand in. "" marks a
// stanza break. The active line is derived from playback progress so it
// reads as a live, karaoke-style scroll.
const DEMO_LYRICS: string[] = [
  "Lover, one lovely day,",
  "Love came, planning to stay",
  "",
  "Green Dolphin Street",
  "supplied the setting,",
  "The setting for nights",
  "beyond forgetting;",
  "",
  "And through these",
  "moments apart,",
  "Memories live in my heart.",
  "When I recall the love I",
  "found on,",
  "I could kiss the ground on",
  "Green Dolphin Street.",
  "",
  "How could we help but fall?",
  "Spell-bound and held in thrall,",
  "Down by the quay we lingered,",
  "Lost in a kiss, and then",
  "We had to say goodbye,",
  "There by the harbour wall,",
  "And as the ship sailed on,",
  "I knew I'd love you still.",
  "",
  "And through these",
  "moments apart,",
  "Memories live in my heart.",
  "When I recall the love I",
  "found on,",
  "I could kiss the ground on",
  "Green Dolphin Street.",
  "",
  "Now the years have flown,",
  "And still I dream alone,",
  "Of one enchanted evening",
  "Lit by a wandering moon,",
  "Of waves against the shore,",
  "Of all we were before —",
  "The tide may turn forever,",
  "But I'll remember soon.",
  "",
  "And through these",
  "moments apart,",
  "Memories live in my heart.",
  "When I recall the love I",
  "found on,",
  "I could kiss the ground on",
  "Green Dolphin Street.",
]

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
  onSeek,
  onArtistClick,
  onPlayingFromClick,
  bound,
  shuffle: shuffleBound,
  queue = DEMO_QUEUE,
  onPlayQueueTrack,
  lyrics = DEMO_LYRICS,
}: PlayerOverlayProps) {
  const [localPlaying, setLocalPlaying] = useState(false)
  const playing = bound ? bound.playing : localPlaying
  const setPlaying = (next: boolean | ((p: boolean) => boolean)) => {
    if (bound) { bound.onToggle(); return }
    setLocalPlaying(next)
  }
  // No real audio (no `url`) → keep the waveform "paused" so the
  // `currentTime` prop drives the played portion instead of wavesurfer.
  const waveformPlaying = track.url ? playing : false
  const [localShuffle, setLocalShuffle] = useState(false)
  const shuffle      = shuffleBound ? shuffleBound.active : localShuffle
  const toggleShuffle = () => { if (shuffleBound) shuffleBound.onToggle(); else setLocalShuffle(s => !s) }
  const [repeat,  setRepeat]  = useState(false)
  const [tab,     setTab]     = useState<PlayerOverlayTab>("now-listening")

  // ── Swipe between tabs ────────────────────────────────────────────────
  //  Horizontal swipe across the sheet flips Lyrics ↔ Now listening ↔ Up
  //  next (in their visual order). Vertical gestures fall through to the
  //  scrollable lists; swipes that start on `[data-swipe-ignore]` (the
  //  waveform, which has its own horizontal drag-to-seek) are ignored.
  const TAB_ORDER: PlayerOverlayTab[] = ["lyrics", "now-listening", "up-next"]
  const swipeStart = useRef<{ x: number; y: number; blocked: boolean } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    swipeStart.current = {
      x: t.clientX, y: t.clientY,
      blocked: !!(e.target as Element).closest("[data-swipe-ignore]"),
    }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start || start.blocked) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    // Must be a deliberate, mostly-horizontal flick.
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) return
    const i = TAB_ORDER.indexOf(tab)
    const next = i + (dx < 0 ? 1 : -1)   // swipe left → next tab
    if (next >= 0 && next < TAB_ORDER.length) setTab(TAB_ORDER[next])
  }

  // Direction of the last tab change → drives the slide-in animation. The
  // ref holds the PREVIOUS index during the render where `tab` just changed
  // (it's updated in an effect afterwards), so comparing gives the direction.
  const tabIndex = TAB_ORDER.indexOf(tab)
  const prevTabIndex = useRef(tabIndex)
  const tabDir = tabIndex >= prevTabIndex.current ? "next" : "prev"
  useEffect(() => { prevTabIndex.current = tabIndex }, [tabIndex])

  // Fraction through the current track (drives the Up-next now-playing fill).
  const progress = parseTime(totalTime) > 0 ? parseTime(currentTime) / parseTime(totalTime) : 0

  // Lyrics: derive the "active" line from progress so it scrolls karaoke
  // style, and keep it centred in view.
  const activeLine = Math.max(0, Math.min(lyrics.length - 1, Math.floor(progress * lyrics.length)))
  const activeLineRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (tab !== "lyrics") return
    activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [activeLine, tab])

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
           atmospheric background yet is still clearly the album art. The
           same `.frosted-glass` material the FooterNav uses sits on top —
           backdrop blur + saturate, a translucent tint, plus the faint
           sheen + grain — so the overlay reads as one continuous glass
           surface with the rest of the chrome. */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: `url(${track.image})`, filter: "blur(32px)" }}
        />
        {/* Glass material — identical to the footer nav / mobile header. */}
        <div className="absolute inset-0 frosted-glass" />
      </div>

      {/* Foreground content — centred column of the mobile sheet.
           Horizontal swipes here flip between tabs (see onTouch*). */}
      <div
        className="relative z-10 h-full flex flex-col items-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >

        {/* Drag handle — tap or swipe down dismisses the sheet. */}
        <Button
          variant="ghost"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 w-full py-4 h-auto rounded-none"
        >
          <div className="h-1 w-8 rounded-full bg-foreground/80" />
        </Button>

        {/* Swappable tab content — keyed by `tab` so it remounts (and the
             directional slide replays) on every change, tap or swipe. */}
        <div
          key={tab}
          className={cn(
            "flex-1 min-h-0 w-full flex flex-col items-center",
            tabDir === "next" ? "animate-tab-next" : "animate-tab-prev",
          )}
        >
        {tab === "up-next" ? (
          /* ── UP NEXT ──────────────────────────────────────────────────
             The now-playing track as a Tidal-style progress-fill row,
             then the scrollable queue. Transport + tabs (below) stay. */
          <div className="flex-1 min-h-0 w-full flex flex-col px-2">
            <div className="shrink-0 px-2 pb-2">
              <QueueRow
                track={{ title: track.title, artist: track.artist, album: track.album, image: track.image, duration: totalTime }}
                playing={playing}
                progress={progress}
                onToggle={() => setPlaying(p => !p)}
              />
            </div>
            <div className={cn("flex-1 min-h-0 overflow-y-auto px-2 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", SCROLL_FADE)}>
              <UpNextQueue queue={queue} onPlayQueueTrack={onPlayQueueTrack} />
            </div>
          </div>
        ) : tab === "lyrics" ? (
          /* ── LYRICS ───────────────────────────────────────────────────
             The now-playing row (no progress fill), then karaoke-style
             lyrics — the active line in foreground, the rest muted. */
          <div className="flex-1 min-h-0 w-full flex flex-col px-2">
            <div className="shrink-0 px-2 pb-3">
              <QueueRow
                track={{ title: track.title, artist: track.artist, album: track.album, image: track.image, duration: totalTime }}
                playing={playing}
                progress={progress}
                onToggle={() => setPlaying(p => !p)}
              />
            </div>
            <div className={cn("flex-1 min-h-0 overflow-y-auto px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", SCROLL_FADE)}>
              <div className="flex flex-col gap-0.5">
                {lyrics.map((line, i) => (
                  <p
                    key={i}
                    ref={i === activeLine ? activeLineRef : undefined}
                    className={cn(
                      "text-large @min-[380px]:text-xlarge font-medium leading-snug transition-colors duration-300",
                      line === "" && "h-3",
                      i === activeLine ? "text-foreground" : "text-muted-foreground/60",
                    )}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : (
        <>
        {/* "Playing from" header — both lines left-aligned. The source line
             links to the album when a detail page exists. */}
        <div className="shrink-0 w-full px-4 pb-4 flex flex-col items-start gap-1 text-left">
          <p className="text-xsmall leading-none font-normal text-muted-foreground">Playing from:</p>
          {onPlayingFromClick ? (
            <button
              type="button"
              onClick={onPlayingFromClick}
              className="group w-full text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            >
              <MarqueeText
                containerClassName="leading-none"
                className="text-xsmall leading-none font-normal text-foreground group-hover:underline underline-offset-2"
              >
                {playingFrom}
              </MarqueeText>
            </button>
          ) : (
            <MarqueeText
              as="p"
              containerClassName="leading-none"
              className="text-xsmall leading-none font-normal text-foreground"
            >
              {playingFrom}
            </MarqueeText>
          )}
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
              <LibraryHeartButton
                type="song"
                id={slugify(track.title)}
                name={track.title}
                song={{ id: slugify(track.title), title: track.title, artist: track.artist, album: track.album, cover: track.image, duration: totalTime }}
                variant="outline"
                size="icon"
              />
              <Button variant="outline" size="icon" aria-label="More options">
                <MoreVertical strokeWidth={1.5} />
              </Button>
            </div>

            {/* Artist row — avatar + name. Becomes a link to the artist
                 profile when `onArtistClick` is supplied; otherwise a plain
                 caption. */}
            {onArtistClick ? (
              <button
                type="button"
                onClick={onArtistClick}
                className="self-start flex items-center gap-1.5 min-w-0 max-w-full rounded-full hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                <img
                  src={artistAvatar}
                  alt=""
                  className="size-6 min-w-6 shrink-0 rounded-full object-cover ring-1 ring-border"
                />
                <span className="text-xsmall font-medium text-muted-foreground truncate min-w-0 hover:text-foreground hover:underline underline-offset-2">
                  {track.artist}
                </span>
              </button>
            ) : (
              <div className="self-start flex items-center gap-1.5 min-w-0 max-w-full">
                {/* `shrink-0 min-w-6` keeps the avatar a perfect circle even
                     when a long artist name fills the row; the name yields. */}
                <img
                  src={artistAvatar}
                  alt=""
                  className="size-6 min-w-6 shrink-0 rounded-full object-cover ring-1 ring-border"
                />
                <span className="text-xsmall font-medium text-muted-foreground truncate min-w-0">
                  {track.artist}
                </span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-3 w-full">
              <span className="text-2xsmall leading-none text-muted-foreground tabular-nums">
                {currentTime}
              </span>
              {/* `data-swipe-ignore`: the waveform owns its own horizontal
                   drag (seek), so tab-swipes must not start here. */}
              <div className="flex-1 min-w-0 flex items-center" data-swipe-ignore>
                <Waveform
                  url={track.url}
                  playing={waveformPlaying}
                  currentTime={parseTime(currentTime)}
                  duration={track.url ? undefined : parseTime(totalTime)}
                  height={waveformHeight}
                  onSeek={(t) => { onSeek?.(t); if (!bound) setPlaying(true) }}
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
            <ShareButton
              variant="ghost"
              size="icon-sm"
              title={track?.title}
              text={track ? `${track.title} — ${track.artist}` : undefined}
              icon={<Share className="size-5" strokeWidth={1.5} />}
            />
            <Button variant="ghost" size="icon-sm" aria-label="Start radio">
              <Radio className="size-5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
        </>
        )}
        </div>

        {/* Transport row — Shuffle · Back · Play/Pause (big) · Forward · Repeat.
            `shrink-0` (not flex-1) so it pins to a CONSTANT position — just
            above the tabs — in EVERY tab. The swappable content above fills
            all the space down to here, so the controls never move when you
            switch Now-listening / Up-next / Lyrics. */}
        <div className="shrink-0 w-full flex items-center justify-center px-4 py-3">
          <div className="flex items-center gap-3">
            <ShuffleToggle
              active={shuffle}
              onToggle={toggleShuffle}
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
