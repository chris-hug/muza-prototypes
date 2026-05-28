"use client"

/*
 * CoverCardMenu — the dropdown menu surfaced by the "More" (kebab)
 * button on AlbumCard and PlaylistCard covers. Variant + ownership
 * choose which items appear, matching the Figma context-menu spec
 * (file dbSHgvquI2o4TFie2iAJxv › node 5325:146088).
 *
 * Item sets:
 *   · Album, not owned  — Share / Add to library / Add to playlist
 *                         ─ Go to artist / Go to album
 *                         ─ Report / Show Info
 *   · Album, owned      — Share / Edit / Add to playlist
 *                         ─ Go to artist / Go to album
 *                         ─ Remove from library / Show Info
 *   · Playlist, not owned — Share / Save playlist
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
  Share2, Plus, ListPlus, Mic, Disc3, Flag, Info, Pencil, Trash2, MoreHorizontal,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  onShare?:     () => void
  onShowInfo?:  () => void
  /** Hover-button parity — wrap caller's existing handlers. */
  onAdd?:       () => void
  onEdit?:      () => void
}

export interface AlbumCardMenuProps extends CommonProps {
  owned?:           boolean
  onAddToPlaylist?: () => void
  onGoToArtist?:    () => void
  onGoToAlbum?:     () => void
  onRemove?:        () => void
  onReport?:        () => void
  className?: string
}

// Items-only sub-component so the same menu can sit behind different
// triggers (cover overlay button, table-row kebab, etc.).
export function AlbumCardMenuItems(props: AlbumCardMenuProps) {
  const { owned, onShare, onAdd, onEdit, onAddToPlaylist,
          onGoToArtist, onGoToAlbum, onRemove, onReport, onShowInfo } = props
  return (
    <>
      <DropdownMenuItem onClick={onShare}><Share2 />Share</DropdownMenuItem>
      {owned ? (
        <DropdownMenuItem onClick={onEdit}><Pencil />Edit</DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={onAdd}><Plus />Add to library</DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={onAddToPlaylist}><ListPlus />Add to playlist</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onGoToArtist}><Mic />Go to artist</DropdownMenuItem>
      <DropdownMenuItem onClick={onGoToAlbum}><Disc3 />Go to album</DropdownMenuItem>
      <DropdownMenuSeparator />
      {owned ? (
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          <Trash2 />Remove from library
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={onReport}><Flag />Report</DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={onShowInfo}><Info />Show info</DropdownMenuItem>
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
        // to-play; stop the gesture here so opening the menu doesn't
        // also trigger Play.
        onPointerDown={e => e.stopPropagation()}
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
  className?: string
}

export function PlaylistCardMenu({
  owned, onShare, onAdd, onEdit, onGoToOwner, onGoToPlaylist,
  onDelete, onReport, onShowInfo, className,
}: PlaylistCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More options"
        className={cn(TRIGGER_CLASS, className)}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuItem onClick={onShare}><Share2 />Share</DropdownMenuItem>
        {owned ? (
          <DropdownMenuItem onClick={onEdit}><Pencil />Edit</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onAdd}><Plus />Save playlist</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {!owned && (
          <DropdownMenuItem onClick={onGoToOwner}><Mic />Go to owner</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onGoToPlaylist}><ListPlus />Go to playlist</DropdownMenuItem>
        <DropdownMenuSeparator />
        {owned ? (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />Delete playlist
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onReport}><Flag />Report</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onShowInfo}><Info />Show info</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
