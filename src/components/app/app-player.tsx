"use client"

/*
 * AppPlayer — the single persistent player chrome mounted in the shell.
 * Reads the global player store and renders:
 *   · Desktop (≥ footer-nav breakpoint): the glass PlayerBar pinned to
 *     the bottom-centre of the content area.
 *   · Mobile: the mini PlayerBar above the FooterNav; tapping it slides
 *     up the full-screen PlayerOverlay.
 *
 * Renders nothing until a track has actually been played (no empty
 * chrome on a fresh session).
 */

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PlayerBarB as PlayerBar } from "@/components/ui/player-bar-b"
import { PlayerOverlay, type QueueTrack } from "@/components/ui/player-overlay"
import { usePlayer } from "@/lib/player"
import { useUserLibrary } from "@/lib/user-library"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { hasAlbumDetail, getAlbumDetail } from "@/lib/album-catalog"
import { hasPlaylistDetail, getPlaylistDetail } from "@/lib/playlist-catalog"

/** seconds → "m:ss" (mirrors the parseTime helpers in the player chrome). */
function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export function AppPlayer({ footerNav }: { footerNav: boolean }) {
  const { track, playing, playingFrom, toggle, play, elapsed, duration, seek, shuffle, toggleShuffle } = usePlayer()
  const { openArtist, openAlbum, openPlaylist } = useMediaNav()
  const library = useUserLibrary()
  const [overlayOpen, setOverlayOpen] = useState(false)

  // Nothing loaded yet → no player chrome.
  if (!track) return null

  const bound = { playing, onToggle: toggle }
  const shuffleBound = { active: shuffle, onToggle: toggleShuffle }
  // Simulated transport position → drives the waveform / mini-bar arc even
  // though there's no real <audio> wired up yet.
  const currentTime = fmtTime(elapsed)
  const progress = duration > 0 ? Math.min(1, elapsed / duration) : 0
  const onSeek = (seconds: number) => seek(seconds)

  // Subtitle links — artist always resolves (single profile page); album
  // only links when a detail record exists. Tapping closes the overlay so
  // the destination page is visible.
  const albumKey = slugify(track.album)
  const onArtistClick = () => { setOverlayOpen(false); openArtist(slugify(track.artist)) }
  const onAlbumClick = hasAlbumDetail(albumKey)
    ? () => { setOverlayOpen(false); openAlbum(albumKey) }
    : undefined

  // "Playing from" → the actual source. It's a playlist when the context
  // label resolves to one, otherwise the album (the label, or failing that
  // the track's own album).
  const fromKey = slugify(playingFrom)
  const onPlayingFromClick =
    hasPlaylistDetail(fromKey) ? () => { setOverlayOpen(false); openPlaylist(fromKey) }
    : hasAlbumDetail(fromKey)  ? () => { setOverlayOpen(false); openAlbum(fromKey) }
    : onAlbumClick

  // "Up next" = the rest of the SOURCE you're playing from. Playing a
  // playlist → the playlist's other tracks; an album → the album's other
  // tracks; otherwise (artist top-songs, the Library › Songs page, …) →
  // your saved songs. The list wraps past the current track so it cycles.
  const sourceTracks: QueueTrack[] =
    hasPlaylistDetail(fromKey)
      ? getPlaylistDetail(fromKey).tracks.map(t => ({ title: t.title, artist: t.artist, album: t.album, image: t.cover, duration: t.duration }))
    : hasAlbumDetail(fromKey)
      ? (() => { const a = getAlbumDetail(fromKey); return a.tracks.map(t => ({ title: t.title, artist: a.artist, album: a.title, image: a.cover, duration: t.duration })) })()
    : library.songs().map(s => ({ title: s.title, artist: s.artist ?? "", album: s.album, image: s.cover ?? "", duration: s.duration }))

  const curIdx = sourceTracks.findIndex(t => t.title === track.title)
  const queue = curIdx >= 0
    ? [...sourceTracks.slice(curIdx + 1), ...sourceTracks.slice(0, curIdx)]
    : sourceTracks.filter(t => t.title !== track.title)
  // Tapping a queue row keeps the SAME source context so the queue just
  // advances (rather than collapsing to a generic "Up next").
  const onPlayQueueTrack = (q: QueueTrack) =>
    play({ title: q.title, artist: q.artist, album: q.album ?? "", image: q.image, totalTime: q.duration }, playingFrom)

  const barTrack = {
    title:  track.title,
    artist: track.artist,
    album:  track.album,
    image:  track.image,
    url:    track.url,
  }

  if (footerNav) {
    return (
      <>
        {/* Mini bar — rests flush on top of the footer tab bar (0 gap).
             Its bottom edge is pinned to the footer's exact height
             (pt-2 8px + h-12 48px + pb safe-area) so the two surfaces
             touch. `z-40` puts it ABOVE the footer (z-30) so the record
             sits ON the footer rather than being clipped behind it. */}
        <div className="absolute inset-x-3 bottom-[calc(56px+max(10px,env(safe-area-inset-bottom)))] z-40">
          <PlayerBar
            track={barTrack}
            currentTime={currentTime}
            totalTime={track.totalTime}
            progress={progress}
            bound={bound}
            shuffle={shuffleBound}
            onSeek={onSeek}
            onArtistClick={onArtistClick}
            onAlbumClick={onAlbumClick}
            onExpand={() => setOverlayOpen(true)}
          />
        </div>

        {/* Full-screen overlay — slides up from the bottom.
             CRITICAL: when closed it must be `invisible`, not merely
             translated off-screen. The overlay's `.frosted-glass`
             backdrop-filter IGNORES this container's `translate` transform
             (a browser limitation) and would otherwise keep painting a
             full-screen glass over the footer + mini-bar — hiding the
             footer and swallowing taps. `visibility:hidden` stops the
             backdrop-filter from rendering; the `visibility` transition
             keeps it visible through the slide-out so the animation still
             plays. */}
        <div
          className={cn(
            "absolute inset-0 z-50 transition-[transform,visibility] duration-300 ease-out",
            overlayOpen ? "translate-y-0 visible" : "translate-y-full invisible pointer-events-none",
          )}
          aria-hidden={!overlayOpen}
        >
          <PlayerOverlay
            track={barTrack}
            playingFrom={playingFrom || track.album}
            currentTime={currentTime}
            totalTime={track.totalTime}
            artistAvatar={track.artistAvatar}
            bound={bound}
            shuffle={shuffleBound}
            onSeek={onSeek}
            onArtistClick={onArtistClick}
            onPlayingFromClick={onPlayingFromClick}
            queue={queue}
            onPlayQueueTrack={onPlayQueueTrack}
            onClose={() => setOverlayOpen(false)}
          />
        </div>
      </>
    )
  }

  // Desktop — full-width glass pill spanning the content area (within the
  // page gutter), pinned near the bottom above any in-page floating UI.
  return (
    <div className="absolute inset-x-0 bottom-5 z-30 px-page pointer-events-none">
      <PlayerBar
        track={barTrack}
        currentTime={currentTime}
        totalTime={track.totalTime}
        progress={progress}
        bound={bound}
        shuffle={shuffleBound}
        onSeek={onSeek}
        onArtistClick={onArtistClick}
        onAlbumClick={onAlbumClick}
        className="pointer-events-auto w-full"
      />
    </div>
  )
}
