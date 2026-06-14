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

import { cn } from "@/lib/utils"

export interface ArtistCardProps {
  name:    string
  image?:  string
  onClick?: () => void
  /** Extra utility classes for the outer button (e.g. width override). */
  className?: string
}

export function ArtistCard({ name, image, onClick, className }: ArtistCardProps) {
  const initials = name.split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase()
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Card stretches to its container — consumers control width
        // via grid cell / parent sizing. Figma natural size 192px.
        // `gap-0` matches AlbumCard / PlaylistCard so the name sits
        // at the same vertical position as their titles when these
        // cards share a row.
        "group/artist flex flex-col gap-0 text-center outline-none",
        "rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50",
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
        {image ? (
          // `brightness` filter darkens the portrait on hover so the
          // card reads as actionable. Same hover convention as the
          // dark gradient overlay on AlbumCard/PlaylistCard (the
          // image gets darker, not lighter, on interaction).
          <img
            src={image}
            alt={name}
            draggable={false}
            className="aspect-square w-full rounded-full object-cover transition-[filter] group-hover/artist:brightness-75"
          />
        ) : (
          <div className="aspect-square w-full rounded-full bg-muted flex items-center justify-center text-large font-medium text-muted-foreground transition-colors group-hover/artist:bg-accent">
            {initials || "?"}
          </div>
        )}
      </div>
      <p className="text-xsmall font-normal leading-5 text-foreground truncate group-hover/artist:underline group-focus-visible/artist:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto]">{name}</p>
    </button>
  )
}
