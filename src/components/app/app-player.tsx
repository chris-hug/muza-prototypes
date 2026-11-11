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
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { PlayerBarB as PlayerBar } from "@/components/ui/player-bar-b"
import { PlayerOverlay, type QueueTrack } from "@/components/ui/player-overlay"
import { usePlayer } from "@/lib/player"
import { useUserLibrary } from "@/lib/user-library"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { hasAlbumDetail, getAlbumDetail, getCredits, findTrack } from "@/lib/album-catalog"
import { hasPlaylistDetail, getPlaylistDetail } from "@/lib/playlist-catalog"
import { getArtistProfile } from "@/lib/artist-catalog"
import { CreditsBrowser } from "@/components/app/credits-dialog"
import { SongMenuItems } from "@/components/ui/song-list-item"

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
  // A radio plays the artist's own songs from the catalog. Only artists the
  // catalog knows get one; `getArtistProfile` falls back to Sun Ra for
  // anyone else, which would be a radio of the wrong person.
  const radioArtist = playingFrom.endsWith(" Radio") ? playingFrom.slice(0, -" Radio".length) : null
  const radioSongs = (name: string): QueueTrack[] => {
    const p = getArtistProfile(slugify(name))
    return p.name === name ? p.topSongs.map(s => ({ title: s.title, artist: name, album: s.album, image: s.cover, duration: s.duration })) : []
  }
  const sourceTracks: QueueTrack[] =
    radioArtist ? radioSongs(radioArtist)
    : hasPlaylistDetail(fromKey)
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

  // Skips walk the same source the queue shows, wrapping at either end.
  // Previous restarts the track first when it is more than 3s in, as every
  // player does, so a second tap is the one that goes back.
  const step = (dir: 1 | -1) => {
    if (sourceTracks.length < 2) return
    const at = curIdx < 0 ? (dir === 1 ? -1 : 0) : curIdx
    onPlayQueueTrack(sourceTracks[(at + dir + sourceTracks.length) % sourceTracks.length])
  }
  const canSkip = sourceTracks.length > 1
  const onNext = canSkip ? () => step(1) : undefined
  const onPrevious = canSkip ? () => (elapsed > 3 ? seek(0) : step(-1)) : undefined

  const creditsBody = hasAlbumDetail(albumKey) ? (
    /* The player opens on the SONG playing, not on its album: that is the
       question "who plays on this?" asks. Keyed by the title, so the next
       track opens on its own credits. */
    <CreditsBrowser
      key={track.title}
      credits={getCredits(albumKey)}
      initialTrack={findTrack(getCredits(albumKey), track.title)}
      showCover={false}
      heading={null}
      onArtist={name => { setOverlayOpen(false); openArtist(slugify(name)) }}
      onAlbum={() => { setOverlayOpen(false); openAlbum(albumKey) }}
      bodyClassName="min-h-0"
    />
  ) : undefined
  const ownRadio = radioSongs(track.artist).filter(s => s.title !== track.title)
  const onRadio = ownRadio.length
    ? () => { const s = ownRadio[0]; play({ title: s.title, artist: s.artist, album: s.album ?? "", image: s.image, totalTime: s.duration }, `${track.artist} Radio`) }
    : undefined
  const menuItems = (
    <SongMenuItems
      title={track.title} artist={track.artist} album={track.album} cover={track.image} duration={track.totalTime}
      onArtistClick={onArtistClick}
      onAlbumClick={onAlbumClick}
    />
  )

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
            onPrevious={onPrevious}
            onNext={onNext}
          />
        </div>

        {/* The player is a bottom Sheet like every other: pulled down to close,
            with the same grabber, backdrop and Escape. It used to be its own
            sliding layer whose handle was a button you had to tap. A closed Sheet
            unmounts, which also retires the old trap: `.frosted-glass` ignores a
            translate, so a layer parked off-screen kept painting glass over the
            footer. 8px of the page shows above it, so it reads as a sheet. */}
        <Sheet open={overlayOpen} onOpenChange={setOverlayOpen}>
          <SheetContent side="bottom" showCloseButton={false} aria-label="Now playing" className="h-[calc(100svh-8px)] overflow-hidden border-0 p-0">
            {/* `rounded-[inherit]`: the corner is the sheet side's, not written twice. */}
            <div className="absolute inset-0 z-10 overflow-hidden rounded-[inherit]">
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
                inSheet
                onPrevious={onPrevious}
                onNext={onNext}
                credits={creditsBody}
                onRadio={onRadio}
                menuItems={menuItems}
              />
            </div>
          </SheetContent>
        </Sheet>
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
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  )
}
