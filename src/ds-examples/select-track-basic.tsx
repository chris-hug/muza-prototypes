"use client"

/*
 * Select Track — the pick affordance on real `MediaListItem` rows, off the
 * catalog's default album. Tap a row: the plus rearranges into a check and
 * the plate fades; tap again and it springs back. The ROW is the target
 * (`onOpen`), the mark is display only — exactly the Add-music row.
 */

import { useState } from "react"

import { MediaListItem } from "@/components/ui/media-list-item"
import { SelectTrackButton } from "@/components/ui/select-track-button"
import { getAlbumDetail } from "@/lib/album-catalog"
import { cn } from "@/lib/utils"

const ALBUM  = getAlbumDetail()
const TRACKS = ALBUM.tracks.slice(0, 3)

export default function SelectTrackBasicExample() {
  const [picked, setPicked] = useState<Set<string>>(() => new Set([TRACKS[0].id]))

  const toggle = (id: string) =>
    setPicked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col">
      {TRACKS.map(t => {
        const on = picked.has(t.id)
        return (
          <MediaListItem
            key={t.id}
            type="song"
            cover={ALBUM.cover}
            title={t.title}
            subtitle={ALBUM.artist}
            meta={ALBUM.title}
            onOpen={() => toggle(t.id)}
            className={cn(on && "bg-muted")}
            trailing={<SelectTrackButton selected={on} />}
          />
        )
      })}
    </div>
  )
}
