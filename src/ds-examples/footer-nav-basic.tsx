"use client"

/*
 * Footer Nav — the phone tab bar, pinned to the bottom of a scroll box
 * with real library rows scrolling under its glass. Home · Library · Search
 * navigate; Studio opens a bottom sheet listing its four surfaces.
 *
 * This file is a CALL SITE, not a copy: the real `FooterNav` with the two
 * props the app shell passes (`activeNav`, `onNavChange`) — local state
 * here, the router's in the app — and the real `MediaListItem` off the real
 * catalog. The bar is `absolute inset-x-0 bottom-0`, so it pins to whatever
 * positioned box it sits in: the shell's content area in the app, this box
 * here. Tap a tab: Library stays lit for its deep pages too.
 */

import { useState } from "react"

import { FooterNav } from "@/components/app/footer-nav"
import { MediaListItem } from "@/components/ui/media-list-item"
import { getRichAlbums } from "@/lib/album-catalog"

const ALBUMS = getRichAlbums()

export default function FooterNavBasicExample() {
  const [nav, setNav] = useState("Albums")

  return (
    <div className="relative w-full h-[280px] overflow-hidden bg-background">
      <ul className="h-full overflow-y-auto px-3 py-3 pb-24 flex flex-col gap-1">
        {ALBUMS.map(a => (
          <li key={a.id}>
            <MediaListItem type="album" title={a.title} cover={a.cover} subtitle={a.artist} meta={String(a.year)} />
          </li>
        ))}
      </ul>
      <FooterNav activeNav={nav} onNavChange={setNav} />
    </div>
  )
}
