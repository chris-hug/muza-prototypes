"use client"

/*
 * ScrollArea both ways: a vertical list — the track list of a real album,
 * in a box shorter than it — and a horizontal strip of covers wider than
 * theirs. Scroll either; the thumb is the component's own.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `ScrollArea`, which mounts both scrollbars itself and shows each only when
 * that axis actually overflows. The height and width are the call site's
 * job (`h-…`, `w-…` on the root) — without a bound there is nothing to
 * scroll inside.
 */

import { ScrollArea } from "@/components/ui/scroll-area"
import { getAlbumDetail, getRichAlbums } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()
const COVERS = getRichAlbums().slice(0, 12)

export default function ScrollAreaBasicExample() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <ScrollArea className="h-[180px] w-[300px] rounded-xl border border-border">
        <ol className="flex flex-col gap-2 p-4 text-small text-foreground tabular-nums">
          {ALBUM.tracks.map((t, i) => (
            <li key={t.id} className="flex gap-3">
              <span className="w-4 text-muted-foreground">{i + 1}</span>
              <span className="flex-1 truncate">{t.title}</span>
              <span className="text-muted-foreground">{t.duration}</span>
            </li>
          ))}
        </ol>
      </ScrollArea>

      <ScrollArea className="w-[320px] rounded-xl border border-border">
        <div className="flex gap-3 p-4">
          {COVERS.map(a => (
            <img key={a.id} src={a.cover} alt={a.title} className="size-16 shrink-0 rounded-xs object-cover" />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
