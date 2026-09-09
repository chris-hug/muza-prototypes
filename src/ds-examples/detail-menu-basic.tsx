"use client"

/*
 * Detail Menu, OPEN — the surface the "…" on an album detail page opens,
 * shown inline so the frame needs no click: the anchored dropdown at window
 * chips from 768 up, the bottom sheet below. `useIsMobile()` picks, and inside
 * the frame it reads the window chip, so the chips flip it.
 *
 * This file is a CALL SITE, not a copy: it renders the real surface off the
 * real catalog with the same config the Album page passes to
 * `DetailMoreButton` (`album-detail-view.tsx`) — same props, same action
 * model, Save bound to the live library store. In the app you render
 * `<DetailMoreButton {…same props} />` and get the trigger.
 *
 * Needs a `UserLibraryProvider` above it (the store the Save pill reads) — it
 * is mounted once at the app shell, and the design-system page mounts its
 * own seeded one. Nothing is faked here for that reason.
 */

import { DetailMenuSurface } from "@/components/ui/detail-more-button"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()

export default function DetailMenuBasicExample() {
  return (
    <DetailMenuSurface
      kind="album"
      title={ALBUM.title}
      subtitle={ALBUM.artist}
      cover={ALBUM.cover}
      meta={String(ALBUM.year)}
      libraryType="album"
      libraryId={ALBUM.id}
      libraryName={ALBUM.title}
      onGoToArtist={() => {}}
    />
  )
}
