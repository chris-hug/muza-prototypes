"use client"

/*
 * Media Header for an album the user has BOUGHT at the download tier: the
 * buy CTA is gone, the inline Purchased badge sits in the meta line, and
 * "Download MP3" takes the slot the CTA used to occupy. The streaming tier
 * shows the badge only — pass `purchased` without `downloadable`.
 *
 * This file is a CALL SITE, not a copy: the real `MediaHeader`, the real
 * catalog (Cool Struttin'), the same props the Album page passes once
 * `isPurchased` / `isDownloadable` are true.
 */

import { MediaHeader } from "@/components/ui/media-header"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail("a04")

export default function MediaHeaderPurchasedExample() {
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
      purchased
      downloadable
      onDownload={() => {}}
      onPlay={() => {}}
      onShuffle={() => {}}
      onOwnerClick={() => {}}
    />
  )
}
