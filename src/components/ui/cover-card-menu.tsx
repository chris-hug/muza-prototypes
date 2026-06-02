"use client"

/*
 * CoverCardMenu — the dropdown menu surfaced by the "More" (kebab)
 * button on AlbumCard and PlaylistCard covers. Variant + ownership
 * choose which items appear, matching the Figma context-menu spec
 * (file dbSHgvquI2o4TFie2iAJxv › node 5325:146088).
 *
 * Item sets:
 *   · Album, not owned  — Share / Save to library / Add to playlist
 *                         ─ Go to artist / Go to album
 *                         ─ Report / Show Info
 *   · Album, owned      — Share / Edit / Add to playlist
 *                         ─ Go to artist / Go to album
 *                         ─ Remove from library / Show Info
 *   · Playlist, not owned — Share / Save to library
 *                         ─ Go to owner / Go to playlist
 *                         ─ Report / Show Info
 *   · Playlist, owned    — Share / Edit
 *                         ─ Go to playlist
 *                         ─ Delete / Show Info
 *
 * Trigger renders as a styled native button rather than delegating to
 * the project's `<Button>` via base-ui's `render` prop — keeps this
 * menu self-contained and sidesteps any nested-<button> edge cases.
 */

import * as React from "react"
import {
  Heart, ListPlus, Mic, Disc3, Flag, Info, Pencil, Trash2, MoreHorizontal,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShareMenuItems } from "@/components/ui/share-button"
import { useCredits } from "@/lib/credits-context"
import { slugify } from "@/lib/media-nav"

// Native-button styling that mirrors the cover-overlay button look
// (translucent muted fill, backdrop blur, foreground icon, 24px) so
// the trigger looks identical to the sibling Add/Edit cover button.
const TRIGGER_CLASS =
  "inline-flex size-6 shrink-0 items-center justify-center rounded-full " +
  "border-0 bg-neutral-100/50 text-neutral-900 backdrop-blur-xs " +
  "transition-colors outline-none cursor-pointer " +
  "hover:bg-neutral-100 focus-visible:ring-3 focus-visible:ring-ring/50 " +
  "[&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:pointer-events-none"

interface CommonProps {
  onShowInfo?:  () => void
  /** Hover-button parity — wrap caller's existing handlers. */
  onAdd?:       () => void
  onEdit?:      () => void
  /** Already in the user's library (saved, but not created by them).
   *  Drops the "Save to library" row and turns the destructive action
   *  into "Remove from library" (`onRemove`). Used by the library
   *  views, where the item is — by definition — already saved. */
  inLibrary?:   boolean
  onRemove?:    () => void
  /** Share target — the card's own detail link + title. Share is baked
   *  in (copy link / native sheet); no `onShare` callback needed. URL
   *  may be relative (resolved to absolute when copied). */
  shareTitle?:  string
  shareUrl?:    string
}

export interface AlbumCardMenuProps extends CommonProps {
  owned?:           boolean
  onAddToPlaylist?: () => void
  onGoToArtist?:    () => void
  onGoToAlbum?:     () => void
  onReport?:        () => void
  /** Context-awareness — hide a nav row when the user is already there
   *  (e.g. on the artist page, hide "Go to artist"; on an album's own
   *  track rows, hide "Go to album"). */
  hideGoToArtist?:  boolean
  hideGoToAlbum?:   boolean
  className?: string
}

// Items-only sub-component so the same menu can sit behind different
// triggers (cover overlay button, table-row kebab, etc.).
export function AlbumCardMenuItems(props: AlbumCardMenuProps) {
  const { owned, inLibrary, onAdd, onEdit, onAddToPlaylist,
          onGoToArtist, onGoToAlbum, onRemove, onReport, onShowInfo,
          shareTitle, shareUrl, hideGoToArtist, hideGoToAlbum } = props
  const showNav = !hideGoToArtist || !hideGoToAlbum
  // In the library, the item is already saved — drop "Save to library".
  const saved = owned || inLibrary
  // "Show credits" opens the release credits dialog for this album.
  const credits = useCredits()
  const showCredits = shareTitle ? () => credits.open(slugify(shareTitle)) : onShowInfo
  return (
    <>
      <ShareMenuItems title={shareTitle} url={shareUrl} />
      {owned ? (
        <DropdownMenuItem onClick={onEdit}><Pencil />Edit</DropdownMenuItem>
      ) : inLibrary ? null : (
        <DropdownMenuItem onClick={onAdd}><Heart />Save to library</DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={onAddToPlaylist}><ListPlus />Add to playlist</DropdownMenuItem>
      {showNav && <DropdownMenuSeparator />}
      {!hideGoToArtist && <DropdownMenuItem onClick={onGoToArtist}><Mic />Go to artist</DropdownMenuItem>}
      {!hideGoToAlbum && <DropdownMenuItem onClick={onGoToAlbum}><Disc3 />Go to album</DropdownMenuItem>}
      <DropdownMenuSeparator />
      {saved ? (
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          <Trash2 />Remove from library
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={onReport}><Flag />Report</DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={showCredits}><Info />Show credits</DropdownMenuItem>
    </>
  )
}

export function AlbumCardMenu(props: AlbumCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More options"
        className={cn(TRIGGER_CLASS, props.className)}
        // Cards underneath listen for pointerdown/up to detect tap-
        // to-play; stop the WHOLE gesture here (incl. pointerup, which
        // is where useLongPress fires its tap → onPlay) so opening the
        // menu doesn't also navigate to the detail page.
        onPointerDown={e => e.stopPropagation()}
        onPointerUp={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <AlbumCardMenuItems {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export interface PlaylistCardMenuProps extends CommonProps {
  owned?:          boolean
  onGoToOwner?:    () => void
  onGoToPlaylist?: () => void
  onDelete?:       () => void
  onReport?:       () => void
  /** Context-awareness — hide a nav row when already there. */
  hideGoToOwner?:    boolean
  hideGoToPlaylist?: boolean
  className?: string
}

// Items-only sub-component so the same menu can sit behind different
// triggers (cover overlay button, list-table kebab, etc.).
export function PlaylistCardMenuItems({
  owned, inLibrary, onAdd, onEdit, onGoToOwner, onGoToPlaylist,
  onDelete, onRemove, onReport, shareTitle, shareUrl,
  hideGoToOwner, hideGoToPlaylist,
}: PlaylistCardMenuProps) {
  return (
    <>
      <ShareMenuItems title={shareTitle} url={shareUrl} />
      {owned ? (
        <DropdownMenuItem onClick={onEdit}><Pencil />Edit</DropdownMenuItem>
      ) : inLibrary ? null : (
        <DropdownMenuItem onClick={onAdd}><Heart />Save to library</DropdownMenuItem>
      )}
      {(!hideGoToOwner && !owned) || !hideGoToPlaylist ? <DropdownMenuSeparator /> : null}
      {!owned && !hideGoToOwner && (
        <DropdownMenuItem onClick={onGoToOwner}><Mic />Go to owner</DropdownMenuItem>
      )}
      {!hideGoToPlaylist && (
        <DropdownMenuItem onClick={onGoToPlaylist}><ListPlus />Go to playlist</DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      {owned ? (
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 />Delete playlist
        </DropdownMenuItem>
      ) : inLibrary ? (
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          <Trash2 />Remove from library
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={onReport}><Flag />Report</DropdownMenuItem>
      )}
    </>
  )
}

export function PlaylistCardMenu({ className, ...props }: PlaylistCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More options"
        className={cn(TRIGGER_CLASS, className)}
        onPointerDown={e => e.stopPropagation()}
        onPointerUp={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <PlaylistCardMenuItems {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
