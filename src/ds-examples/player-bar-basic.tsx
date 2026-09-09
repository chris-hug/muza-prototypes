"use client"

/*
 * Player Bar — the persistent transport, laid over a cover so the glass
 * has something to blur. Below 640px of its OWN width it is the 56px mini
 * pill (disc · title · play · skip); from 640 the 80px desktop bar with the
 * waveform, and the chips above are those box steps.
 *
 * This file is a CALL SITE, not a copy: the real `PlayerBarB` — the one
 * `AppPlayer` mounts — off the real catalog. No `bound` / `shuffle`, so
 * play and shuffle are the bar's own local state; the app binds both to
 * the player store. No `url` either: with no audio to decode the waveform
 * paints the played portion from `currentTime` / `totalTime`.
 *
 * The `p-3` around the bar is room for the disc, which overhangs the pill
 * by up to 8px — the frame's chips add it back so a chip names the BAR's
 * width. Needs a `UserLibraryProvider` above it for the heart.
 */

import { PlayerBarB } from "@/components/ui/player-bar-b"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()
const TRACK = ALBUM.tracks[0]

export default function PlayerBarBasicExample() {
  return (
    /* The cover fills the whole frame, not a box inside it. In the app the
       bar floats over a scrolling page, so a demo that framed the artwork in
       a panel of its own would show the one thing the bar never sits on: an
       edge. `min-h-56` gives the image room to read as a backdrop rather than
       a strip behind the pill.

       Vertical padding only. Horizontal padding here would make the bar
       narrower than the column it is handed, and then a window chip would be
       naming a width the bar does not have — the demo carried a private
       "+26px" scale for exactly that reason. The disc overhangs the pill on
       the left; in the app it overhangs into the page gutter, so nothing
       clips it here either. */
    <div
      className="relative min-h-56 py-3 flex items-center"
      style={{ backgroundImage: `url(${ALBUM.cover})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Darken the busy cover so the bar and its labels read on top. */}
      <div aria-hidden className="absolute inset-0 bg-black/40" />
      {/* `w-full`: the wrapper above is a flex row, so without it this becomes
          a flex item sized to its content and the bar collapses out of its own
          layout. */}
      <div className="relative w-full">
        <PlayerBarB
          track={{ title: TRACK.title, artist: ALBUM.artist, album: ALBUM.title, image: ALBUM.cover }}
          currentTime="2:24"
          totalTime={TRACK.duration}
          onArtistClick={() => {}}
          onAlbumClick={() => {}}
          className="w-full"
        />
      </div>
    </div>
  )
}
