"use client"

/*
 * Media Header WITH its chrome — and the point of this frame is that below the
 * chrome gate the header is only half of what a detail page shows.
 *
 * The back chevron and the "…" that flank the cover are not `MediaHeader`'s.
 * They belong to `DetailHeader` inside `MobileAppHeader`, and the page reaches
 * them through a context rather than a prop:
 *
 *     page  →  usePublishDetailHeader({ title, menu })
 *                  ↓  DetailActionsProvider (home.tsx)
 *     chrome  →  MobileAppHeader  →  DetailHeader
 *
 * So a frame that renders `MediaHeader` alone shows a cover with two empty
 * corners — which is what this section did, and is a screen the app never
 * produces. This one publishes a config and renders the chrome above the
 * header, exactly as `playlist-detail-view` does.
 *
 * A call site, not a copy: both components are the real ones, off the real
 * playlist catalog, with the props the page passes when `owned` is true.
 *
 * Two things this frame CANNOT show, and neither is a fault in the frame:
 *   · the bar fades to frosted glass with a small centred title once the page
 *     is ~300px down. It measures the nearest scrollable ancestor, and the
 *     `max-h` scroll box below is a stand-in for a full page — the collapse
 *     fires, but against a much shorter run;
 *   · the icons flip light-on-dark by sampling the cover's top strip
 *     (`useImageLuminance`), which playlists opt out of — see the note in
 *     `playlist-detail-view`. Artist pages are where that shows.
 */

import { useState } from "react"

import { MediaHeader } from "@/components/ui/media-header"
import { MobileAppHeader } from "@/components/app/mobile-app-header"
import { DetailMoreButton } from "@/components/ui/detail-more-button"
import type { StatusBadgeStatus } from "@/components/ui/status-badge"
import { DetailActionsProvider, usePublishDetailHeader } from "@/lib/detail-actions"
import { getPlaylistDetail } from "@/lib/playlist-catalog"
import { slugify } from "@/lib/media-nav"
import { useFooterNav } from "@/lib/use-media-query"

const PLAYLIST = getPlaylistDetail()

/* The frame brings its OWN provider. The design-system page is rendered at
   `home.tsx:2835`, above the app shell's `DetailActionsProvider` at 2855 — so
   inside here `setConfig` was the no-op default from `createContext` and the
   published menu went nowhere. The back chevron still appeared (it is not
   gated on the config), which is exactly what made the gap look like a
   styling problem rather than a missing provider. */
export default function MediaHeaderMobileExample() {
  return (
    <DetailActionsProvider>
      <Body />
    </DetailActionsProvider>
  )
}

function Body() {
  const [visibility, setVisibility] = useState<StatusBadgeStatus>("public")
  const footerNav = useFooterNav()

  /* The same object `playlist-detail-view` publishes for an owned playlist.
     No `coverSrc`: playlist covers are framed on the page, so the chrome keeps
     its dark icons instead of adapting to the artwork. */
  usePublishDetailHeader({
    title: PLAYLIST.title,
    menu: {
      kind: "playlist",
      title: PLAYLIST.title,
      subtitle: "You",
      cover: PLAYLIST.cover ?? PLAYLIST.covers?.[0],
      covers: PLAYLIST.covers,
      meta: `${PLAYLIST.tracks.length} tracks`,
      owned: true,
      libraryType: "playlist",
      libraryId: slugify(PLAYLIST.title),
      libraryName: PLAYLIST.title,
      onEdit: () => {},
      onAddMusic: () => {},
    },
  })

  return (
    /* `overflow-y-auto` is not decoration: `DetailHeader` walks up for the
       nearest scrollable ancestor to track, and sticks inside it. Without a
       scroller here it would attach to the design-system page itself and
       collapse while you scrolled past this frame. */
    <div className="relative max-h-[520px] overflow-y-auto bg-background">
      {/* Gated exactly as the app gates it: `useFooterNav()` (608). Below the
          gate the chrome is there and flanks the cover; from 608 up it is gone
          and `MediaHeader` carries its own actions. The hook reads
          `WindowWidthContext`, so the frame's chip really does drive it —
          which is what makes every width on the ladder safe to offer here
          instead of hiding the ones where the pair stops being a pair. */}
      {footerNav && <MobileAppHeader activeNav="Album" onNavChange={() => {}} onBack={() => {}} />}
      <div className="px-3 pb-8 relative">
        {/* The THIRD owner of a corner, and the reason 608 looked bare.
            Between the chrome gate (608) and the header's own horizontal tier
            (560 of COLUMN, ~608 of window) the slim mobile bar is gone while
            the header is still stacked — so neither of the two above puts
            anything in the top-right. The page fills that band itself, and
            `playlist-detail-view` does exactly this: a `DetailMoreButton`
            positioned over the cover, shown only while stacked and only off
            the phone. Without it the frame had a hole the app does not. */}
        {!footerNav && (
          <DetailMoreButton
            kind="playlist"
            title={PLAYLIST.title}
            subtitle="You"
            cover={PLAYLIST.cover ?? PLAYLIST.covers?.[0]}
            covers={PLAYLIST.covers}
            meta={`${PLAYLIST.tracks.length} tracks`}
            owned
            libraryType="playlist"
            libraryId={slugify(PLAYLIST.title)}
            libraryName={PLAYLIST.title}
            onEdit={() => {}}
            onAddMusic={() => {}}
            className="absolute top-6 right-1 z-10 @min-[560px]:hidden"
          />
        )}
        <MediaHeader
          variant="my-playlist"
          cover={PLAYLIST.cover}
          covers={PLAYLIST.covers}
          title={PLAYLIST.title}
          owner={PLAYLIST.owner}
          ownerAvatar={PLAYLIST.ownerAvatar}
          year={PLAYLIST.trackMeta}
          visibility={visibility}
          onVisibilityChange={setVisibility}
          libraryType="playlist"
          libraryId={slugify(PLAYLIST.title)}
          libraryName={PLAYLIST.title}
          onEdit={() => {}}
          onAddMusic={() => {}}
          onPlay={() => {}}
          onShuffle={() => {}}
          onOwnerClick={() => {}}
        />
      </div>
    </div>
  )
}
