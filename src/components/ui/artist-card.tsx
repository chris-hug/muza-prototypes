"use client"

/*
 * ArtistCard — circular avatar image + name centered below.
 *
 * Figma source: file L9yw4Yaec9YtAXGxP8q4fu › Component "Record Cover"
 *   · 20157:4701 — Type=Artist, State=Default
 *   · 20157:4733 — Type=Artist, State=Hover  (note: no overlay buttons
 *                                              — hover is visually
 *                                              identical to default,
 *                                              by design)
 *
 * Per Figma, the Artist variant deliberately omits the play/add/more
 * cluster that Album and Playlist have on hover. Tapping the card
 * navigates to the artist profile — that's the only action.
 *
 * Frame metadata: 192×216 — image is 192×192, text area 24px (single
 * line of name, no subtitle).
 *
 * Reused everywhere an artist surfaces as a tile: Library / Artists,
 * Explore / Artists, search results, "fans also liked" rails.
 */

import { useState } from "react"
import { useLongPress } from "@/lib/use-long-press"
import { slugify } from "@/lib/media-nav"
import { usePlayer } from "@/lib/player"
import { getAllAlbums, getRichAlbums } from "@/lib/album-catalog"
import { searchCatalog } from "@/lib/search-catalog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { DetailMenuSheetBody } from "@/components/ui/detail-more-button"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/ui/logo"

export interface ArtistCardProps {
  name:    string
  image?:  string
  onClick?: () => void
  /** Extra utility classes for the outer button (e.g. width override). */
  className?: string
}

export function ArtistCard({ name, image, onClick, className }: ArtistCardProps) {
  const [failed, setFailed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const showImg = !!image && !failed
  const player = usePlayer()

  /* Play radio — the artist's own catalogue, starting at their first track,
   * with the player's "playing from" line naming the station. There is no
   * queue in the player yet, so a station is one track and a label rather
   * than a generated run; when a queue lands, this is where it feeds from.
   * Wired here because the menu drops any action whose handler is missing,
   * and an artist's sheet was offering Share and Report alone. */
  /* What the catalogue holds for this artist — the substance of Artist info.
     From the WIDE catalogue (`getAllAlbums`), not the rich one: only a handful
     of records carry full track lists, so counting those reported "nothing by
     this artist in muza yet" for most of the library. Tracks are counted from
     the rich set, where they exist, and the line omits what it cannot say. */
  const catalogue = (() => {
    const releases = getAllAlbums().filter(a => a.artist === name)
    const rich = getRichAlbums().filter(a => a.artist === name)
    return {
      albums: releases.length,
      tracks: rich.reduce((n, a) => n + a.tracks.length, 0),
      titles: releases.slice(0, 4).map(a => (a.year ? `${a.title} · ${a.year}` : a.title)),
    }
  })()

  /* The station's first track: the app's own search index, filtered to this
     artist's songs — the same index the Add-music sheet picks from. Resolved
     UP FRONT rather than on tap, because the menu drops an action whose
     handler is missing, and that is the right answer for an artist whose
     records carry no track list yet: no Play radio row at all, rather than a
     row that apologises when you press it. */
  const radioTrack = searchCatalog(name).find(r => r.kind === "song" && r.artist === name)

  const playRadio = () => {
    const song = radioTrack
    if (!song) return
    player.play(
      {
        title: song.title,
        artist: name,
        // The search index leaves both optional; the player needs strings.
        album: song.album ?? "",
        image: song.cover ?? image ?? "",
        totalTime: song.duration,
      },
      `${name} radio`,
    )
  }
  /* Hold the card, get its menu — the same gesture the album and playlist
     cards answer to. An artist card has no kebab at all (not even on hover),
     so before this it was the one card on the page with no way to reach
     Share / Save / Go to artist on a phone. */
  const gestures = useLongPress({
    onClick:     () => onClick?.(),
    onLongPress: () => setMenuOpen(true),
  })
  return (
    <>
    <button
      type="button"
      {...gestures}
      className={cn(
        // Card stretches to its container — consumers control width
        // via grid cell / parent sizing. Figma natural size 192px.
        // `gap-0` matches AlbumCard / PlaylistCard so the name sits
        // at the same vertical position as their titles when these
        // cards share a row.
        "group/artist link-underline-group flex flex-col gap-0 text-center outline-none",
        "rounded-lg focus-ring",
        "w-full min-w-0",
        className,
      )}
    >
      {/* Square track matches the AlbumCard/PlaylistCard geometry so
           the row's columns line up. The circle inside is inset via
           padding rather than a percentage width — that way the img
           always fills its container exactly (no oval rendering for
           portrait-aspect Wikipedia thumbnails) and the inset stays
           consistent across rows. */}
      <div className="aspect-square w-full p-[5%]">
        {showImg ? (
          // `brightness` filter darkens the portrait on hover so the
          // card reads as actionable. Same hover convention as the
          // dark gradient overlay on AlbumCard/PlaylistCard (the
          // image gets darker, not lighter, on interaction).
          <img
            src={image}
            alt={name}
            draggable={false}
            onError={() => setFailed(true)}
            className="aspect-square w-full rounded-full object-cover transition-[filter] group-hover/artist:brightness-75 art-edge"
          />
        ) : (
          // Branded placeholder — muted circle with a soft muza mark
          // (used when there's no real portrait, or one fails to load).
          <div className="aspect-square w-full rounded-full bg-muted flex items-center justify-center transition-colors group-hover/artist:bg-accent">
            {/* Solid secondary fill (no alpha) so the 3 overlapping circles
                read as one flat mark instead of darkening where they cross. */}
            <LogoMark className="w-2/5 h-auto text-secondary" />
          </div>
        )}
      </div>
      <p className="text-xsmall font-normal leading-5 text-foreground truncate link-underline mx-auto">{name}</p>
    </button>

    {/* Artist info — what the catalogue knows about them, which on a card is
        the honest answer: the portrait, and what of theirs is here. The
        artist PAGE carries the prose bio; this is the glance you get without
        leaving the row you are browsing. */}
    <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
      <DialogContent className="md:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {showImg ? (
              <img src={image} alt="" draggable={false} className="size-16 shrink-0 rounded-full object-cover art-edge" />
            ) : (
              <div className="size-16 shrink-0 rounded-full bg-muted" />
            )}
            <div className="min-w-0">
              <DialogTitle className="truncate">{name}</DialogTitle>
              <DialogDescription>Artist</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <p className="text-small text-muted-foreground">
            {catalogue.albums === 0
              ? "Nothing by this artist in muza yet."
              : [
                  `${catalogue.albums} ${catalogue.albums === 1 ? "release" : "releases"}`,
                  // Only where the track list is actually known — a "0 tracks"
                  // line is a statement about our data, not about the artist.
                  catalogue.tracks > 0
                    ? `${catalogue.tracks} ${catalogue.tracks === 1 ? "track" : "tracks"}`
                    : null,
                ].filter(Boolean).join(" · ") + " in muza"}
          </p>
          {catalogue.titles.length > 0 && (
            <ul className="flex flex-col gap-1 text-small text-foreground">
              {catalogue.titles.map(t => <li key={t} className="truncate">{t}</li>)}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* The same sheet the detail pages raise, so an artist's actions read the
        same wherever they are reached from. Controlled, because the trigger
        is the card itself rather than a button. */}
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetContent side="bottom" className="rounded-t-[28px]">
        <DetailMenuSheetBody
          kind="artist"
          title={name}
          cover={image}
          subtitle="Artist"
          /* Save, bound to the library store — the same binding the artist
             page's own heart uses, so the sheet reads the real state and
             flips in place. Without it the tile has no handler and the sheet
             offers Share and Report only.
             Play radio and Artist info stay unwired ON PURPOSE: neither has
             an implementation anywhere in the app, and the menu drops a row
             whose handler is missing rather than showing a dead one. */
          libraryType="artist"
          libraryId={slugify(name)}
          libraryName={name}
          onPlayRadio={radioTrack ? playRadio : undefined}
          onArtistInfo={() => setInfoOpen(true)}
        />
      </SheetContent>
    </Sheet>
    </>
  )
}
