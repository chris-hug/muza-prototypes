"use client"

/*
 * Mobile Header in its Explore arrangement — title + account avatar on the
 * first row, the pill search field on the second, with real album rows
 * beneath so the glass has something to blur over.
 *
 * This file is a CALL SITE, not a copy: the real `MobileHeader` primitives
 * and the real `MediaListItem`, off the real catalog. `MobileSearchBar`
 * shows its clear ✕ only while it has both an `onClear` and a value — type
 * something to see it. In the app `ExploreHeader` (`mobile-app-header.tsx`)
 * hides the title while the field is focused or a query is active and
 * floats the suggestions panel under the bar.
 */

import { useState } from "react"

import {
  MobileHeader, MobileTitleRow, MobileAvatar, MobileSearchBar,
} from "@/components/ui/mobile-header"
import { MediaListItem } from "@/components/ui/media-list-item"
import { getRichAlbums } from "@/lib/album-catalog"

const ALBUMS = getRichAlbums()

export default function MobileHeaderExploreExample() {
  const [query, setQuery] = useState("")

  return (
    <div className="w-full h-[320px] overflow-y-auto bg-background">
      <MobileHeader>
        <MobileTitleRow
          title="Explore"
          trailing={<MobileAvatar src="https://picsum.photos/seed/muza-you/120/120" />}
        />
        <MobileSearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          placeholder="Search Artists, Albums, Songs or Playlists"
        />
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
