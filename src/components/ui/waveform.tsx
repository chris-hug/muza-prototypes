"use client"

import { useRef, useMemo, useEffect } from "react"
import { useWavesurfer } from "@wavesurfer/react"
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js"
import { cn } from "@/lib/utils"

// ─── Default sample peaks ─────────────────────────────────────────────────────
// Pre-rendered amplitudes (normalised 0–1). When no real `peaks` / `url` is
// provided we fall back to this so the waveform still renders in the demo /
// design system. In production, pass `peaksUrl` (a JSON file from the server)
// or a raw `peaks` array.

// 512 samples of realistic looking amplitude data — multiple sine waves with
// random variation. Mirrors the density a real pre-rendered peaks file would
// have, so the design system preview looks like a real audio track.
const DEMO_PEAKS = Array.from({ length: 512 }, (_, i) => {
  const t = i / 512
  const env  = 0.35 + 0.55 * Math.sin(t * Math.PI)            // overall fade in/out
  const slow = 0.6  + 0.4  * Math.sin(t * Math.PI * 6)         // big swells
  const fast = 0.4  + 0.6  * Math.abs(Math.sin(t * Math.PI * 48))
  const jitter = 0.85 + 0.3 * ((Math.sin(i * 12.9898) * 43758.5453) % 1)
  return Math.max(0.05, Math.min(1, env * slow * fast * jitter))
})

// ─── Waveform ─────────────────────────────────────────────────────────────────

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
  /** Fires every animation frame during playback (seconds).                      */
  onTimeUpdate?:  (seconds: number) => void
  /** Called when the user clicks the waveform to seek (seconds).                */
  onSeek?:        (seconds: number) => void
  /** Played-portion colour. Defaults to the muza blue.                          */
  progressColor?: string
  /** Unplayed-portion colour. Defaults to muted-foreground.                     */
  waveColor?:     string
  /** Bar dimensions — matches the design system pill spec.                      */
  barWidth?:      number
  barGap?:        number
  barRadius?:     number
  /** Display height in px.                                                      */
  height?:        number
  className?:     string
}

export function Waveform({
  url,
  peaks,
  duration,
  currentTime,
  playing,
  onTimeUpdate,
  onSeek,
  progressColor = "#1e34d8",
  waveColor     = "color-mix(in srgb, var(--muted-foreground) 75%, transparent)",
  barWidth      = 1,
  barGap        = 1,
  barRadius     = 1,
  height        = 24,
  className,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Use the explicit peaks if given; otherwise fall back to the demo set so
  // the visualiser always renders in the design system.
  const resolvedPeaks = useMemo<number[][] | undefined>(() => {
    if (peaks)            return Array.isArray(peaks[0]) ? (peaks as number[][]) : [peaks as number[]]
    if (!url)             return [DEMO_PEAKS]
    return undefined
  }, [peaks, url])

  const resolvedDuration = duration ?? (resolvedPeaks ? 100 : undefined)

  // Hover plugin — thin vertical line follows the cursor, labelled with the
  // timestamp. Memoised as a stable array so useWavesurfer doesn't re-instance
  // the player on every parent render (which would cause an infinite loop).
  const plugins = useMemo(
    () => [
      Hover.create({
        lineColor:       "var(--foreground)",
        lineWidth:       1,
        labelBackground: "var(--foreground)",
        labelColor:      "var(--background)",
        labelSize:       "10px",
      }),
    ],
    [],
  )

  const { wavesurfer, isReady } = useWavesurfer({
    container:    containerRef,
    url,
    peaks:        resolvedPeaks,
    duration:     resolvedDuration,
    waveColor,
    progressColor,
    cursorColor:  "transparent",
    barWidth,
    barGap,
    barRadius,
    height,
    normalize:    true,
    interact:     true,
    plugins,
  })

  // Mirror external `currentTime` onto the wavesurfer instance. We only push
  // it while the audio is paused — during playback wavesurfer drives its own
  // time and we report it back via `onTimeUpdate`, which avoids fighting with
  // the native clock and causing scrub-jitter.
  useEffect(() => {
    if (!wavesurfer || !isReady || typeof currentTime !== "number") return
    if (wavesurfer.isPlaying()) return
    const dur = wavesurfer.getDuration()
    if (dur > 0) wavesurfer.setTime(Math.max(0, Math.min(currentTime, dur)))
  }, [wavesurfer, isReady, currentTime])

  // Play/pause the actual audio.
  useEffect(() => {
    if (!wavesurfer || !isReady) return
    if (playing) wavesurfer.play().catch(() => {})
    else         wavesurfer.pause()
  }, [wavesurfer, isReady, playing])

  // Stream the current time back to the parent while playing.
  useEffect(() => {
    if (!wavesurfer || !onTimeUpdate) return
    const handler = (t: number) => onTimeUpdate(t)
    wavesurfer.on("timeupdate", handler)
    return () => { wavesurfer.un("timeupdate", handler) }
  }, [wavesurfer, onTimeUpdate])

  // Seek handler — subscribe once, clean up on change.
  useEffect(() => {
    if (!wavesurfer || !onSeek) return
    const handler = (newTime: number) => onSeek(newTime)
    wavesurfer.on("interaction", handler)
    return () => { wavesurfer.un("interaction", handler) }
  }, [wavesurfer, onSeek])

  return <div ref={containerRef} className={cn("w-full", className)} />
}
