"use client"

/*
 * FilesPurchaseProvider — one mounted checkout for "Download files – $x", so
 * the album menu can offer it from every card and list row. The album page
 * keeps its own dialog for the header button.
 */

import { useMemo, useState, type ReactNode } from "react"

import { PurchaseAlbumDialog } from "@/components/app/purchase-album-dialog"
import { getAlbumDetail, hasAlbumDetail, filesPurchasePrice } from "@/lib/album-catalog"
import { FilesPurchaseContext } from "@/lib/files-purchase-context"
import { useUserLibrary } from "@/lib/user-library"

export function FilesPurchaseProvider({ children }: { children: ReactNode }) {
  const library = useUserLibrary()
  const [albumId, setAlbumId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const value = useMemo(() => ({
    priceFor: (id: string) => hasAlbumDetail(id) ? filesPurchasePrice(getAlbumDetail(id)) : undefined,
    open: (id: string) => { setAlbumId(id); setOpen(true) },
  }), [])

  const album = albumId ? getAlbumDetail(albumId) : null

  return (
    <FilesPurchaseContext.Provider value={value}>
      {children}
      {album && albumId && (
        <PurchaseAlbumDialog
          open={open}
          onOpenChange={setOpen}
          album={{
            cover:  album.cover,
            title:  album.title,
            artist: album.artist,
            year:   album.year,
            format: album.format,
          }}
          streamPrice={album.buyingPrice ?? ""}
          downloadPrice={album.downloadPrice}
          upgradeMode
          upgradePrice={filesPurchasePrice(album)}
          onUpgraded={() => library.upgradeToDownload(albumId)}
          onGoToLibrary={() => {
            setOpen(false)
            const url = new URL(window.location.href)
            url.searchParams.set("page", "Albums")
            window.history.replaceState(null, "", url.toString())
            window.dispatchEvent(new PopStateEvent("popstate"))
          }}
        />
      )}
    </FilesPurchaseContext.Provider>
  )
}
