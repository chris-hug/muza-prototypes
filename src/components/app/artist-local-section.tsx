"use client"

/*
 * "In your local files" — the one part of an artist page that is yours.
 *
 * Everything else on the page is the artist's or label's: they decide which
 * rows exist and what is in them (Top songs, albums, products, playlists).
 * Your files cannot go into those rows — that would be you editing their
 * page — so they get a section of their own at the very bottom, after
 * everything the artist made.
 *
 * It has to read as a different kind of thing at a glance, not as one more
 * rail: so it is a tinted band across the full width, below the page, says who sees it
 * ("Only you see this"), carries the Local badge in its heading, and every
 * card is a local card (Local badge, local menu). Only files matched to this
 * artist appear (the match is what ties a folder to an artist page at all);
 * with none, or with local files switched off, the section is not drawn.
 *
 * It stays one row however much you own: eight cards that scroll sideways,
 * the count beside the heading, and "Show all" to the library (below).
 */

import { useSearchParams } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlbumCard } from "@/components/ui/album-card"
import { useLocalAlbums, useLocalState } from "@/lib/local-library"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { useLibraryStatus } from "@/lib/use-library-status"
import { useLibraryFilter } from "@/lib/use-library-filter"

/** Cards before the row hands over to the library. Someone with 35 albums
 *  of one artist on disk would otherwise get a wall of 35 cards under the
 *  artist's own page — more of the page than the artist's part. */
const PREVIEW = 8

export function ArtistLocalSection({ artistName }: { artistName: string }) {
  const { matching } = useLocalState()
  const albums = useLocalAlbums().filter(a => matching && a.match && slugify(a.artist) === slugify(artistName))
  const { openLocalSettings } = useMediaNav()
  const [, setParams] = useSearchParams()
  const [, setAlbumStatus] = useLibraryStatus<string>("albums")
  const [, setQuery] = useLibraryFilter()
  if (albums.length === 0) return null

  // "Show all": the whole set is a library question, so it opens Library ›
  // Albums › Local narrowed to this artist — sortable, searchable, in the
  // view the listener chose — rather than growing this panel.
  const showAll = () => {
    setAlbumStatus("local")
    setQuery(artistName)
    setParams(() => new URLSearchParams({ page: "Albums" }))
  }

  return (
    // A full-width band, edge to edge under the artist's page, its content
    // on the page's own column: set apart as a different kind of thing,
    // not a card floating inside the artist's layout.
    <section className="w-full bg-muted">
      <div className="mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-page pt-8 pb-24 flex flex-col gap-4 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-medium text-foreground truncate">In your local files</h2>
          <Badge variant="secondary" shape="square-xs" className="shrink-0 bg-background">Local</Badge>
          <span className="text-xsmall text-muted-foreground tabular-nums shrink-0">{albums.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xsmall text-muted-foreground">
            Only you see this.{" "}
            <button type="button" onClick={() => openLocalSettings()} className="link-underline text-foreground cursor-pointer outline-none">
              Local music settings
            </button>
          </p>
          {albums.length > PREVIEW && (
            <Button variant="ghost" size="sm" onClick={showAll}>Show all {albums.length}</Button>
          )}
        </div>
      </div>
      {/* One row that scrolls sideways, never a growing grid: however many
           albums you have, the panel keeps its height. */}
      <ul className="flex gap-4 overflow-x-auto snap-x snap-mandatory rail-bleed pb-1 [scrollbar-width:none]">
        {albums.slice(0, PREVIEW).map(a => (
          <li key={a.id} className="snap-start shrink-0 w-[clamp(143px,42vw,220px)]">
            <AlbumCard local={a} cover={a.cover} title={a.title} artist={a.artist} year={a.year} hideGoToArtist className="w-full" />
          </li>
        ))}
      </ul>
      </div>
    </section>
  )
}
