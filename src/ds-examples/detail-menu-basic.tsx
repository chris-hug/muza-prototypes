"use client"

/*
 * Detail Menu in its simplest real usage — the "…" on an album detail page,
 * with the Save pill bound to the library store.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `DetailMoreButton` off the real catalog, with the same config the Album
 * page publishes (`album-detail-view.tsx`). It exists only so the design
 * system can render the component AND show the same file under `</>`.
 *
 * The surface is chosen by `useIsMobile()`, which reads the VIEWPORT — the
 * width chips above only cap the frame, so they do not flip it. At 768px and
 * up the trigger opens the anchored dropdown; narrow the browser below 768
 * (or open this on a phone) and the same trigger opens the bottom sheet.
 *
 * Needs a `UserLibraryProvider` above it (the store the Save pill reads) — it
 * is mounted once at the app shell, and the design-system page mounts its
 * own seeded one. Nothing is faked here for that reason.
 */

import { DetailMoreButton } from "@/components/ui/detail-more-button"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()

export default function DetailMenuBasicExample() {
  return (
    <DetailMoreButton
      kind="album"
      title={ALBUM.title}
      subtitle={ALBUM.artist}
      cover={ALBUM.cover}
      meta={String(ALBUM.year)}
      libraryType="album"
      libraryId={ALBUM.id}
      libraryName={ALBUM.title}
      onGoToArtist={() => {}}
      triggerVariant="outline"
      triggerSize="icon"
    />
  )
}
