"use client"

/*
 * LibraryArtistsView — the user's saved artists.
 *
 * Grid of <ArtistCard>s, one per saved artist. Same component that
 * shows up on Explore, search results, "fans also liked" rails.
 *
 * Figma: 8950:97861 (Artists Feed) — 5-column grid on desktop,
 * circular avatars, name only (no subtitle).
 */

import { useSearchParams } from "react-router"
import { ArtistCard } from "@/components/ui/artist-card"
import { LibrarySortMenu, LibraryViewToggle, ArtistMobileList } from "@/components/app/media-list-table"
import { useUserLibrary } from "@/lib/user-library"
import { slugify } from "@/lib/media-nav"
import { useFooterNav } from "@/lib/use-media-query"
import { useLibrarySort, compareLibrary } from "@/lib/use-library-sort"
import { useLibraryView } from "@/lib/use-library-view"

// Artist data moved to a pure leaf module (`@/lib/artist-data`) so search
// and other consumers can read it without pulling this view's
// media-list-table graph into an import cycle. Re-exported here for
// backward-compatible imports.
export { SAVED_ARTISTS, type SavedArtist } from "@/lib/artist-data"
import { SAVED_ARTISTS } from "@/lib/artist-data"

export function LibraryArtistsView() {
  const [, setParams] = useSearchParams()
  const footerNav = useFooterNav()
  const [sort] = useLibrarySort()
  const [view, setView] = useLibraryView()
  const library = useUserLibrary()
  // Only artists currently in the library (seeded with the demo set;
  // toggling an artist's heart adds / removes it here).
  const saved = SAVED_ARTISTS.filter(a => library.inLibrary("artist", slugify(a.name)))
  const artists = footerNav
    ? [...saved].sort(compareLibrary(sort, a => a.name))
    : saved

  // Sun Ra is the only artist with a profile page wired up right now
  // (the prototype's demo target). Real routing would pass an artist
  // id; this just toggles `?page=Artist` on the Sun Ra card click.
  const openSunRaProfile = () => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set("page", "Artist")
      return next
    })
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="@container mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-page pt-8 pb-12">
        {/* Mobile: header already shows "Library" + active pill, so the
             page heading is dropped and the toolbar carries sort + view
             switch. Desktop keeps the heading + grid. */}
        {footerNav ? (
          <div className="flex items-center justify-between gap-4 mb-6">
            <LibrarySortMenu />
            <LibraryViewToggle value={view} onChange={setView} />
          </div>
        ) : (
          <h1 className="text-2xlarge font-medium text-foreground tracking-tight mb-6">
            Artists
          </h1>
        )}

        {footerNav && view === "list" ? (
          <ArtistMobileList artists={artists} />
        ) : (
          <ul className="grid-cards">
            {artists.map(a => (
              <li key={a.id}>
                <ArtistCard
                  name={a.name}
                  image={a.image}
                  onClick={a.id === "ar05" ? openSunRaProfile : undefined}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
