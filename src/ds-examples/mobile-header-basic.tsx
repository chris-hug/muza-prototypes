"use client"

/*
 * Mobile Header in its Library arrangement — a title, two round icon
 * actions and the swipable filter strip, with real library rows beneath so
 * the glass has something to blur over.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `MobileHeader` primitives and the real `MediaListItem`, off the real
 * catalog. It exists only so the design system can render the component AND
 * show the same file under `</>` — a snippet typed beside the demo is a
 * second copy, and drifts.
 *
 * The header is `sticky top-0`, so it needs a scroll container to stick to —
 * in the app that is the shell's scroll area; here it is the short box
 * around the rows. Scroll the rows to see them pass under the glass. Two
 * pills carry the optional `PillTab` extras: a `count` badge and a leading
 * `icon`.
 */

import { useState } from "react"
import { Plus, Search, ListMusic } from "lucide-react"

import {
  MobileHeader, MobileTitleRow, MobileIconButton, MobilePillTabs, type PillTab,
} from "@/components/ui/mobile-header"
import { MediaListItem } from "@/components/ui/media-list-item"
import { getRichAlbums } from "@/lib/album-catalog"

const ALBUMS = getRichAlbums()

const TABS: PillTab[] = [
  { value: "all",       label: "All" },
  { value: "albums",    label: "Albums", count: ALBUMS.length },
  { value: "artists",   label: "Artists" },
  { value: "playlists", label: "Playlists", icon: <ListMusic /> },
  { value: "songs",     label: "Songs" },
]

export default function MobileHeaderBasicExample() {
  const [tab, setTab] = useState("all")

  return (
    <div className="w-full h-[320px] overflow-y-auto bg-background">
      <MobileHeader>
        <MobileTitleRow
          title="Library"
          trailing={<>
            <MobileIconButton label="New playlist"><Plus /></MobileIconButton>
            <MobileIconButton label="Search"><Search /></MobileIconButton>
          </>}
        />
        <MobilePillTabs tabs={TABS} value={tab} onChange={setTab} />
      </MobileHeader>

      <ul className="px-3 py-3 flex flex-col gap-1">
        {ALBUMS.map(a => (
          <li key={a.id}>
            <MediaListItem type="album" title={a.title} cover={a.cover} subtitle={a.artist} meta={String(a.year)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
