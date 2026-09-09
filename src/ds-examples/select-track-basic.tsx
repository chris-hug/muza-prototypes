"use client"

/*
 * Select Track — the pick affordance on real `MediaListItem` rows, off the
 * catalog's default album. Tap a row: the plus rearranges into a check and
 * the plate fades; tap again and it springs back. The ROW is the target
 * (`onOpen`), the mark is display only — exactly the Add-music row.
 */

import { useEffect, useState } from "react"

import { MediaListItem } from "@/components/ui/media-list-item"
import { SelectTrackButton } from "@/components/ui/select-track-button"
import { getAlbumDetail } from "@/lib/album-catalog"
import { cn } from "@/lib/utils"

const ALBUM  = getAlbumDetail()
const TRACKS = ALBUM.tracks.slice(0, 3)

export default function SelectTrackBasicExample() {
  const [picked, setPicked] = useState<Set<string>>(() => new Set([TRACKS[0].id]))

  const [flashed, setFlashed] = useState<string | null>(null)

  useEffect(() => {
    if (!flashed) return
    const timer = setTimeout(() => setFlashed(null), 300)
    return () => clearTimeout(timer)
  }, [flashed])

  const toggle = (id: string) => {
    // Off, then on a tick later: re-adding the class within one render does
    // not restart the animation, so picking the same row twice would not
    // sweep the second time. A timer rather than `requestAnimationFrame` —
    // rAF is throttled to nothing in a hidden tab, and the flash then never
    // arrived at all.
    setFlashed(null)
    setTimeout(() => setFlashed(id), 0)
    setPicked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

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
            /* `.muza-row-added` is the app's own confirmation sweep, already
               built for Add music: a soft shade runs left to right across the
               row and settles at the affordance that was just hit, with a 3px
               shake under it. Reused rather than reinvented — it is the same
               gesture, so it is the same motion.

               `flashed` is cleared on a timer so re-picking the same row
               replays it; the class has to outlive the 260ms animation or it
               is pulled mid-run. */
            className={cn(on && "bg-muted", flashed === t.id && "muza-row-added")}
            trailing={<SelectTrackButton selected={on} />}
          />
        )
      })}
    </div>
  )
}
