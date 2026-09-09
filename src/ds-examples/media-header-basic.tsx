"use client"

/*
 * Media Header for an album — cover, title, the owner · format · year meta
 * line, then Play / Shuffle and the action cluster, exactly as the Album
 * page renders it.
 *
 * This file is a CALL SITE, not a copy: it renders the real `MediaHeader`
 * off the real catalog with the same props `album-detail-view.tsx` passes —
 * the library binding makes the heart (and the "…" menu's Save) read the
 * live store. Play and Shuffle are local here; in the app the player store
 * owns them.
 *
 * Resize the frame with the chips above: the header measures the COLUMN —
 * stacked below 560, horizontal from 560, the full Add / Share / Info
 * cluster from 780. Needs a `UserLibraryProvider` above it (the app shell
 * mounts one; so does the design-system page).
 */

import { useState } from "react"

import { MediaHeader } from "@/components/ui/media-header"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()

export default function MediaHeaderBasicExample() {
  const [playing, setPlaying] = useState(false)
  const [shuffle, setShuffle] = useState(false)

  return (
    <MediaHeader
      variant="album"
      cover={ALBUM.cover}
      title={ALBUM.title}
      owner={ALBUM.artist}
      ownerAvatar={ALBUM.artistAvatar}
      format={ALBUM.format}
      year={ALBUM.year}
      libraryType="album"
      libraryId={ALBUM.id}
      libraryName={ALBUM.title}
      hasBuyingOption={!!ALBUM.buyingPrice}
      buyingPrice={ALBUM.buyingPrice}
      playing={playing}
      shuffleActive={shuffle}
      onPlay={() => setPlaying(p => !p)}
      onShuffle={() => setShuffle(s => !s)}
      onOwnerClick={() => {}}
      onBuy={() => {}}
    />
  )
}
