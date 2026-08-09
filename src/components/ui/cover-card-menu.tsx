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

// (menu items delegate to the shared DetailMenuItems — see below)
import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DetailMenuItems } from "@/components/ui/detail-more-button"
import { slugify } from "@/lib/media-nav"
import { libraryIdForTitle } from "@/lib/album-meta"

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
//
// Delegates to the shared DetailMenuItems — the card kebab IS the detail
// "…" menu, just triggered from a card. Card props map onto the shared
// action model; context (hidden nav, ownership) is expressed by omitting
// the corresponding handler, which the shared builder drops automatically.
export function AlbumCardMenuItems(props: AlbumCardMenuProps) {
  const { owned, onEdit, onAddToPlaylist,
          onGoToArtist, onGoToAlbum, onReport,
          shareTitle, hideGoToArtist, hideGoToAlbum } = props
  // Save-to-library is BAKED store-bound, keyed the SAME as the album detail
  // page (the catalog library id from the title, slug fallback for synthesized
  // albums). So the card menu's "Save / Remove from library" is present and
  // stays in sync with the detail-page menu + heart — no host wiring needed.
  const libraryId = shareTitle ? (libraryIdForTitle(shareTitle) ?? slugify(shareTitle)) : undefined
  return (
    <DetailMenuItems
      kind="album"
      title={shareTitle ?? ""}
      owned={owned}
      libraryType="album"
      libraryId={libraryId}
      libraryName={shareTitle}
      onEdit={onEdit}
      onAddToPlaylist={onAddToPlaylist}
      onGoToArtist={hideGoToArtist ? undefined : onGoToArtist}
      onGoToSelf={hideGoToAlbum ? undefined : onGoToAlbum}
      onReport={onReport}
    />
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
//
// Delegates to the shared DetailMenuItems (see AlbumCardMenuItems). For a
// playlist the shared builder routes `onRemove` to either the save-toggle
// (non-owned "Remove from library") or "Delete playlist" (owned) — so map
// owned → onDelete, non-owned → onRemove. Playlists have "Go to owner"
// (not "Go to artist") and no "Go to artist" row at all.
export function PlaylistCardMenuItems({
  owned, onEdit, onGoToOwner, onGoToPlaylist,
  onDelete, onReport, shareTitle,
  hideGoToOwner, hideGoToPlaylist,
}: PlaylistCardMenuProps) {
  // Save-to-library is BAKED store-bound (playlists are keyed by title slug),
  // so "Save / Remove from library" works on every playlist card without the
  // host wiring onAdd/onRemove — same as the song menu. Owned playlists show
  // "Delete" (onDelete) instead of a save toggle.
  return (
    <DetailMenuItems
      kind="playlist"
      title={shareTitle ?? ""}
      owned={owned}
      libraryType="playlist"
      libraryId={shareTitle ? slugify(shareTitle) : undefined}
      libraryName={shareTitle}
      onRemove={owned ? onDelete : undefined}
      onEdit={onEdit}
      onGoToOwner={hideGoToOwner ? undefined : onGoToOwner}
      onGoToSelf={hideGoToPlaylist ? undefined : onGoToPlaylist}
      onReport={onReport}
    />
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
