"use client"

/*
 * Purchase Album Dialog, LIVE — the real `PurchaseAlbumDialog` behind a
 * trigger, the way the album page mounts it: portal, focus trap, and the
 * processing and success steps the static preview does not show. Below a
 * 768 window chip it opens as a bottom sheet.
 */

import { useState } from "react"

import { PurchaseAlbumDialog } from "@/components/app/purchase-album-dialog"
import { Button } from "@/components/ui/button"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail("a07")

export default function PurchaseAlbumDialogLiveExample() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Open as modal</Button>
      <PurchaseAlbumDialog
        open={open}
        onOpenChange={setOpen}
        album={{ cover: ALBUM.cover, title: ALBUM.title, artist: ALBUM.artist, year: ALBUM.year, format: ALBUM.format }}
        streamPrice={ALBUM.buyingPrice ?? ""}
        downloadPrice={ALBUM.downloadPrice}
      />
    </>
  )
}
