"use client"

/*
 * Player Overlay — the full-screen "Now listening" sheet, shown open in a
 * phone-shaped box. The chips above are the OVERLAY's own width; its height
 * follows at a phone's proportions, because the overlay sizes its cover,
 * waveform and transport from the height it is given.
 *
 * This file is a CALL SITE, not a copy: the real `PlayerOverlay` with the
 * props `AppPlayer` passes — the track and queue off the real catalog (the
 * album's remaining tracks are "Up next"), `playingFrom` the album. Play,
 * shuffle and the tab are the overlay's own state here; the app binds play
 * and shuffle to the player store. Swipe sideways to change tab; the drag
 * handle calls `onClose`.
 */

import { PlayerOverlay } from "@/components/ui/player-overlay"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()
const [CURRENT, ...REST] = ALBUM.tracks

const TRACK = { title: CURRENT.title, artist: ALBUM.artist, album: ALBUM.title, image: ALBUM.cover }
const QUEUE = REST.map(t => ({
  title: t.title, artist: ALBUM.artist, album: ALBUM.title, image: ALBUM.cover, duration: t.duration,
}))

export default function PlayerOverlayBasicExample() {
  return (
    <div className="w-full max-w-[440px] aspect-[9/19.5] overflow-hidden rounded-[40px] ring-1 ring-border bg-background">
      <PlayerOverlay
        track={TRACK}
        artistAvatar={ALBUM.artistAvatar}
        playingFrom={ALBUM.title}
        currentTime="2:24"
        totalTime={CURRENT.duration}
        queue={QUEUE}
        onClose={() => {}}
        onArtistClick={() => {}}
        onPlayingFromClick={() => {}}
      />
    </div>
  )
}
