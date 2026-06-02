"use client"

import { useRef, useMemo, useEffect, useState } from "react"
import { useWavesurfer } from "@wavesurfer/react"
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════════════════════
// Demo peaks — pre-rendered amplitudes used when no real audio URL or peaks
// array is provided (keeps the design-system preview looking realistic).
// In production, pass `url` (client-side decode) or a custom `peaks` array.
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_PEAKS = Array.from({ length: 512 }, (_, i) => {
  const t      = i / 512
  const env    = 0.35 + 0.55 * Math.sin(t * Math.PI)                       // overall fade in/out
  const slow   = 0.6  + 0.4  * Math.sin(t * Math.PI * 6)                   // big swells
  const fast   = 0.4  + 0.6  * Math.abs(Math.sin(t * Math.PI * 48))
  const jitter = 0.85 + 0.3  * ((Math.sin(i * 12.9898) * 43758.5453) % 1)
  return Math.max(0.05, Math.min(1, env * slow * fast * jitter))
})

// ═══════════════════════════════════════════════════════════════════════════
// Colour helper
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolve a `var(--…)` CSS custom property to a concrete OPAQUE `rgb()` string
 * the canvas can always paint — and STRIP any alpha.
 *
 * Two reasons this must end as plain `rgb()`:
 *  1. `getComputedStyle().color` preserves the source colour space, so a token
 *     authored in `oklch()` (e.g. `--muza-neutrals-400`) comes back as
 *     `oklch(…)`. Canvas `fillStyle` silently rejects values it can't parse and
 *     keeps its default — BLACK — so we must hand it `rgb()`. A 1×1 canvas
 *     round-trip (`fillRect` → `getImageData`) converts ANY CSS colour the
 *     browser understands into concrete sRGB bytes.
 *  2. WaveSurfer paints the progress canvas by cloning the wave canvas with
 *     `globalCompositeOperation = 'source-in'` then filling with progressColor;
 *     alpha on `waveColor` bleeds into the progress layer and dims both. We
 *     restore the unplayed opacity separately via `[part="canvases"]{opacity:.5}`.
 *
 * NB: resolve against `document.documentElement` (where the waveform tokens
 * live) and feed the result straight to WaveSurfer as a PROP — never the raw
 * `var(--…)` string, which `@wavesurfer/react` would re-sync onto the canvas on
 * every render (each time-tick), repainting it black.
 */
function toOpaqueRgb(color: string): string {
  try {
    const ctx = document.createElement("canvas").getContext("2d")
    if (!ctx) return color
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `rgb(${r}, ${g}, ${b})`
  } catch {
    return color
  }
}

function resolveCssColor(input: string): string {
  if (typeof document === "undefined") return input
  let raw = input
  if (input.includes("var(")) {
    const probe = document.createElement("span")
    probe.style.color    = input
    probe.style.position = "absolute"
    probe.style.visibility = "hidden"
    document.documentElement.appendChild(probe)
    raw = getComputedStyle(probe).color
    probe.remove()
  }
  return toOpaqueRgb(raw)
}

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface WaveformProps {
  /** Raw audio URL — WaveSurfer will decode it client-side (slow for big files). */
  url?:           string
  /** Pre-computed peaks (normalised 0–1 or -1..1). Skip decoding if provided.   */
  peaks?:         number[] | number[][]
  /** Total track duration in seconds. Required when using `peaks` without `url`. */
  duration?:      number
  /** Current playback position in seconds — drives the played portion.          */
  currentTime?:   number
  /** When true, tells WaveSurfer to play the attached audio. Requires `url`.    */
  playing?:       boolean
  /** Fires every animation frame during playback. Receives the current time
   *  and the decoded duration (both in seconds).                                */
  onTimeUpdate?:  (seconds: number, duration: number) => void
  /** Fires when the user clicks/drags the waveform to seek (seconds).            */
  onSeek?:        (seconds: number) => void
  /** Played-portion colour (default: --muza-blue-200).                           */
  progressColor?: string
  /** Unplayed-portion colour (default: --muted-foreground).                      */
  waveColor?:     string
  /** Bar dimensions.                                                             */
  barWidth?:      number
  barGap?:        number
  barRadius?:     number
  /** Display height in px.                                                       */
  height?:        number
  /** Total height (in px) of the hover-cursor line. If larger than `height`, the
   *  line extends above/below the waveform (e.g. full player-bar height).       */
  hoverLineHeight?: number
  className?:     string
}

// ═══════════════════════════════════════════════════════════════════════════
// Waveform
// ═══════════════════════════════════════════════════════════════════════════

export function Waveform({
  url,
  peaks,
  duration,
  currentTime,
  playing,
  onTimeUpdate,
  onSeek,
  // `--waveform-progress` adapts to the mode: deep blue-200 on light glass,
  // brighter blue-50 on the near-black dark glass (set in app.css). The
  // colour-resolver below already re-applies on theme change.
  progressColor   = "var(--waveform-progress)",
  waveColor       = "var(--waveform-wave)",
  barWidth        = 1,
  barGap          = 1,
  // radius 0 avoids a 50%-alpha anti-aliased pill that washes out the colour
  // at 1px bar widths.
  barRadius       = 0,
  height          = 24,
  hoverLineHeight,
  className,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Concrete, canvas-safe colours. Resolved up-front and passed to wavesurfer
  // as PROPS (never the raw var(), which the hook would re-sync onto the canvas
  // every render — repainting it black). Re-resolves on theme change.
  const [resolvedWave, setResolvedWave]         = useState(() => resolveCssColor(waveColor))
  const [resolvedProgress, setResolvedProgress] = useState(() => resolveCssColor(progressColor))
  useEffect(() => {
    const apply = () => {
      setResolvedWave(resolveCssColor(waveColor))
      setResolvedProgress(resolveCssColor(progressColor))
    }
    apply()
    const obs = new MutationObserver(apply)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    return () => obs.disconnect()
  }, [waveColor, progressColor])

  const resolvedPeaks = useMemo<number[][] | undefined>(() => {
    if (peaks)  return Array.isArray(peaks[0]) ? (peaks as number[][]) : [peaks as number[]]
    if (!url)   return [DEMO_PEAKS]
    return undefined
  }, [peaks, url])

  // When using demo peaks without a real URL, fall back to a placeholder duration.
  const resolvedDuration = duration ?? (resolvedPeaks ? 100 : undefined)

  // Hover plugin — thin vertical line + timestamp label that follow the cursor.
  // Memoised to a stable array so useWavesurfer doesn't re-instance on every
  // parent render (which would cause an infinite setState loop).
  const plugins = useMemo(
    () => [Hover.create({
      lineColor:       "var(--foreground)",
      lineWidth:       1,
      labelBackground: "var(--foreground)",
      labelColor:      "var(--background)",
      labelSize:       "10px",
    })],
    [],
  )

  const { wavesurfer, isReady } = useWavesurfer({
    container:   containerRef,
    url,
    peaks:       resolvedPeaks,
    duration:    resolvedDuration,
    waveColor:     resolvedWave,
    progressColor: resolvedProgress,
    cursorColor: "transparent",
    barWidth,
    barGap,
    barRadius,
    height,
    normalize:   true,
    interact:    true,
    plugins,
  })

  // Mirror external `currentTime` onto the wavesurfer instance while paused.
  // During playback we let wavesurfer drive its own time (and report it back
  // via `onTimeUpdate`) to avoid scrub jitter.
  useEffect(() => {
    if (!wavesurfer || !isReady || typeof currentTime !== "number") return
    if (wavesurfer.isPlaying()) return
    const dur = wavesurfer.getDuration()
    if (dur > 0) wavesurfer.setTime(Math.max(0, Math.min(currentTime, dur)))
  }, [wavesurfer, isReady, currentTime])

  // Play / pause.
  useEffect(() => {
    if (!wavesurfer || !isReady) return
    if (playing) wavesurfer.play().catch(() => {})
    else         wavesurfer.pause()
  }, [wavesurfer, isReady, playing])

  // Emit playback progress back to the parent.
  useEffect(() => {
    if (!wavesurfer || !onTimeUpdate) return
    const emit = () => onTimeUpdate(wavesurfer.getCurrentTime() || 0, wavesurfer.getDuration() || 0)
    wavesurfer.on("timeupdate", emit)
    wavesurfer.on("ready",      emit)   // fire once on load so duration is known immediately
    return () => {
      wavesurfer.un("timeupdate", emit)
      wavesurfer.un("ready",      emit)
    }
  }, [wavesurfer, onTimeUpdate])

  // Seek (fires for both click and drag).
  useEffect(() => {
    if (!wavesurfer || !onSeek) return
    const handler = (t: number) => onSeek(t)
    wavesurfer.on("interaction", handler)
    return () => { wavesurfer.un("interaction", handler) }
  }, [wavesurfer, onSeek])

  // Colour resolution happens up-front (see `resolvedWave`/`resolvedProgress`)
  // and flows in via the wavesurfer props above — no post-init re-push needed.

  // Re-apply the `height` option when the prop changes. `setOptions({ height })`
  // re-renders the canvas at the new size, but wavesurfer hard-codes the
  // `.canvases` min-height into the shadow DOM stylesheet at init, so we also
  // patch that element's inline style to match — otherwise the container
  // height lags behind the canvas and the visual doesn't seem to change.
  useEffect(() => {
    if (!wavesurfer || !isReady) return
    wavesurfer.setOptions({ height })
    const host     = containerRef.current?.firstElementChild as HTMLElement | null
    const canvases = host?.shadowRoot?.querySelector('[part="canvases"]') as HTMLElement | null
    if (canvases) canvases.style.minHeight = `${height}px`
  }, [wavesurfer, isReady, height])

  // Inject shadow-DOM overrides: tall hover line, centred label, and 50%
  // unplayed-canvas opacity (restoring transparency lost when we stripped
  // alpha from the waveColor — see `resolveCssColor`).
  useEffect(() => {
    if (!wavesurfer || !isReady) return
    const host = containerRef.current?.firstElementChild as HTMLElement | null
    const sr   = host?.shadowRoot
    if (!sr) return

    const lineH  = hoverLineHeight && hoverLineHeight > height ? hoverLineHeight : height
    const offset = (lineH - height) / 2

    const style = document.createElement("style")
    style.textContent = `
      /* Use overflow:visible on BOTH axes — the browser promotes mixed
         visible/hidden to auto (which clips). The canvas never overflows
         horizontally, so this is safe. */
      [part="scroll"],
      [part="wrapper"]   { overflow: visible !important; }
      /* Unplayed canvas at 50% — restores visual transparency after we
         stripped alpha from the wave colour. */
      [part="canvases"]  { opacity: 0.5; }
      /* Hover line — extend above/below the waveform when requested. */
      [part="hover"]     { height: ${lineH}px !important; top: -${offset}px !important; }
      /* Timestamp label — vertically centred on the line, 4px to the right,
         no transform (the plugin would otherwise shift it horizontally). */
      [part="hover-label"] {
        position:    absolute !important;
        top:         50%      !important;
        bottom:      auto     !important;
        left:        4px      !important;
        transform:   translateY(-50%) !important;
        white-space: nowrap   !important;
        border-radius: 4px    !important;
      }
    `
    sr.appendChild(style)
    return () => { style.remove() }
  }, [wavesurfer, isReady, hoverLineHeight, height])

  // `cursor-none` hides the OS cursor so the hover plugin's 1px line *is*
  // the seek indicator while hovering the waveform.
  return <div ref={containerRef} className={cn("w-full cursor-none", className)} />
}
