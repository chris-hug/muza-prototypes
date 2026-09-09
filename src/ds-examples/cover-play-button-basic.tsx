"use client"

/*
 * Cover Play Button on its own — the 48px cover-as-play-button every song
 * row carries in its leading slot, here hovering itself (`hoverGroup`
 * defaults to `self`).
 *
 * This file is a CALL SITE, not a copy: it renders the real
 * `CoverPlayButton` off the real catalog. `playing` is controlled, so the
 * example keeps it in local state; in the app the global player owns it.
 *
 * Hover for the dark wash and Play; click to play — the wave shows at
 * rest, Pause on hover. On a touch screen only the playing states show.
 */

import { useState } from "react"

import { CoverPlayButton } from "@/components/ui/cover-play-button"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()
const TRACK = ALBUM.tracks[0]

export default function CoverPlayButtonBasicExample() {
  const [playing, setPlaying] = useState(false)
  return (
    <CoverPlayButton
      src={ALBUM.cover}
      title={TRACK.title}
      playing={playing}
      onToggle={() => setPlaying(p => !p)}
    />
  )
}
