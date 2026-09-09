"use client"

/*
 * Purchase Album Dialog — the summary step, shown inline through
 * `PurchaseAlbumDialogPreview` so the frame needs no click. The real body
 * off the real catalog: A Love Supreme carries both tiers, so the picker
 * shows. Tier and email are live; flip them and the total follows. Below a
 * 768 window chip the preview takes the sheet shape.
 */

import { PurchaseAlbumDialogPreview } from "@/components/app/purchase-album-dialog"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail("a07")

export default function PurchaseAlbumDialogBasicExample() {
  return (
    <PurchaseAlbumDialogPreview
      album={{ cover: ALBUM.cover, title: ALBUM.title, artist: ALBUM.artist, year: ALBUM.year, format: ALBUM.format }}
      streamPrice={ALBUM.buyingPrice ?? ""}
      downloadPrice={ALBUM.downloadPrice}
    />
  )
}
