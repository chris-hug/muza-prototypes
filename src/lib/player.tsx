"use client"

/*
 * Global player store — the single source of truth for "what's playing".
 *
 * Holds the current track + play/pause state + the "playing from" label,
 * so any Play affordance in the app (song row, album/playlist card,
 * MediaHeader Play button, MediaListItem) can load a track into the one
 * persistent PlayerBar mounted in the shell.
 *
 * This is intentionally lightweight: a single current track (no real
 * queue yet) + a `playing` flag. The PlayerBar / PlayerOverlay read from
 * here instead of their hardcoded demo defaults.
 */

import * as React from "react"

export interface PlayerTrack {
  title:  string
  artist: string
  album:  string
  image:  string
  url?:   string
  /** Optional total-time label ("5:12"); falls back to a default. */
  totalTime?: string
  /** Optional artist avatar for the full-screen overlay. */
  artistAvatar?: string
}

interface PlayerState {
  /** Currently loaded track, or null when nothing has been played yet. */
  track:   PlayerTrack | null
  playing: boolean
  /** Context label — "Blue Train", "Top Songs", a playlist name, etc. */
  playingFrom: string
  /** Simulated playback position, in seconds (no real audio yet). */
  elapsed: number
  /** Track length in seconds, parsed from the track's `totalTime`. */
  duration: number
  /** Load a track and start playing. `from` sets the context label. */
  play: (track: PlayerTrack, from?: string) => void
  /** Toggle play/pause of the current track (no-op if nothing loaded). */
  toggle: () => void
  setPlaying: (playing: boolean) => void
  /** Seek to a position in seconds (clamped to the track length). */
  seek: (seconds: number) => void
  /** Global shuffle mode — shared by every shuffle control (player bars,
   *  overlay, and the detail-page MediaHeaders) so they stay in sync. */
  shuffle: boolean
  toggleShuffle: () => void
}

const PlayerContext = React.createContext<PlayerState | null>(null)

/** "m:ss" / "h:mm:ss" → seconds. */
function parseTime(label?: string): number {
  if (!label) return 0
  const parts = label.split(":").map(Number)
  if (parts.some(Number.isNaN)) return 0
  return parts.reduce((acc, n) => acc * 60 + n, 0)
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = React.useState<PlayerTrack | null>(null)
  const [playing, setPlaying] = React.useState(false)
  const [playingFrom, setPlayingFrom] = React.useState("")
  // Simulated transport — advances `elapsed` once per second while
  // playing (we have no real <audio> yet; this drives the visible
  // progress on the waveform / mini-bar arc consistently everywhere).
  const [elapsed, setElapsed] = React.useState(0)
  const [shuffle, setShuffle] = React.useState(false)
  const duration = parseTime(track?.totalTime) || 0

  const play = React.useCallback((next: PlayerTrack, from = "") => {
    setTrack(next)
    setPlayingFrom(from)
    setElapsed(0)               // new track → restart from the top
    setPlaying(true)
  }, [])

  const toggle = React.useCallback(() => {
    setPlaying(p => !p)
  }, [])

  const seek = React.useCallback((seconds: number) => {
    setElapsed(Math.max(0, seconds))
  }, [])

  const toggleShuffle = React.useCallback(() => {
    setShuffle(s => !s)
  }, [])

  // Tick the simulated clock while playing. Stops at the track end.
  React.useEffect(() => {
    if (!playing || !track) return
    const id = setInterval(() => {
      setElapsed(e => {
        const dur = parseTime(track.totalTime) || 0
        if (dur && e >= dur) { setPlaying(false); return dur }
        return e + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [playing, track])

  const value = React.useMemo<PlayerState>(
    () => ({ track, playing, playingFrom, elapsed, duration, play, toggle, setPlaying, seek, shuffle, toggleShuffle }),
    [track, playing, playingFrom, elapsed, duration, play, toggle, seek, shuffle, toggleShuffle],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

/** Read/control the global player. Safe to call anywhere under the
 *  provider; throws only if the provider is missing (a wiring bug). */
export function usePlayer(): PlayerState {
  const ctx = React.useContext(PlayerContext)
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider")
  return ctx
}

/** Convenience: has anything ever been loaded? Drives whether the
 *  persistent player chrome should render at all. */
export function useHasActiveTrack(): boolean {
  return usePlayer().track !== null
}
