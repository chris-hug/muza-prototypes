"use client"

/*
 * MediaListItem — one row in a MIXED library / search list, where
 * albums, playlists, tracks and artists sit together. It shares the
 * visual anatomy of `SongListItem` (thumb · title · meta · ⋯) but has a
 * different job: it's a NAV row, not a player row.
 *
 *   · Containers (album / playlist / artist) → tapping OPENS the detail
 *     page (`onOpen`).
 *   · Tracks → tapping the row OPENS the song's release (`onOpen`, when
 *     supplied) while the cover button PLAYS (`onPlay`); the row shows the
 *     now-playing state. If no `onOpen` is given the whole row plays.
 *
 * No heart, no duration — the only trailing control is the ⋯ menu. The
 * leading slot adapts per type: square cover (album/track), 2×2 collage
 * (playlist), circle (artist).
 *
 * Figma: file dbSHgvquI2o4TFie2iAJxv › node 4973:203868.
 */

import * as React from "react"
import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { type ContentType } from "@/components/ui/badge"
import { CoverPlayButton } from "@/components/ui/cover-play-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface MediaListItemProps {
  type:      ContentType
  title:     string
  /** Single image — album / track / artist. */
  cover?:    string
  /** Collage tiles — playlist (uses up to 4). Falls back to `cover`. */
  covers?:   string[]
  /** Second line, before the dot — artist name (album/track) or owner
   *  (playlist). Artists have no subtitle. */
  subtitle?: string
  /** Second line, after the dot — year (album/track) or "123 Songs"
   *  (playlist). */
  meta?:     string
  /** Song only — marks this row as the currently-playing item. */
  playing?:  boolean
  /** Containers (album/playlist/artist) — open the detail page. */
  onOpen?:   () => void
  /** Track — start playback. */
  onPlay?:   () => void
  /** Tap target for the subtitle (e.g. link the artist name). */
  onSubtitleClick?: () => void
  /** ⋯ menu content (e.g. `AlbumCardMenuItems`). Omitted → no menu. */
  menuItems?: React.ReactNode
  /** Bespoke trailing content instead of the ⋯ menu — e.g. a selection
   *  Checkbox in a picker. Takes precedence over `menuItems`. */
  trailing?: React.ReactNode
  className?: string
}

export function MediaListItem({
  type, title, cover, covers, subtitle, meta, playing = false,
  onOpen, onPlay, onSubtitleClick, menuItems, trailing, className,
}: MediaListItemProps) {
  // Primary (row-body) action. Containers always navigate (onOpen). A song
  // navigates to its release when `onOpen` is supplied (so the row opens the
  // album and only the cover button plays); otherwise the whole row plays.
  const activate = type === "song" ? (onOpen ?? onPlay) : onOpen

  // Row-wide click runs the primary action, but never when a nested
  // button / link (subtitle, ⋯) was the real target.
  const onRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("button, a")) return
    activate?.()
  }

  return (
    <div
      onClick={onRowClick}
      className={cn(
        "@container group/row relative flex items-center gap-3 rounded-md pl-2 pr-1 py-1.5 cursor-pointer transition-colors",
        playing ? "bg-muted" : "bg-background hover:bg-muted",
        className,
      )}
    >
      {/* Leading slot — adapts to the content type. */}
      <Leading type={type} title={title} cover={cover} covers={covers} playing={playing} onPlay={onPlay} />

      {/* Title + meta. */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="text-xsmall font-normal leading-5 text-foreground truncate">{title}</p>
        {(type !== "artist" && (subtitle || meta)) && (
          <div className="flex items-center gap-1.5 min-w-0 text-xsmall font-light tracking-[0.02em] text-muted-foreground leading-5">
            {subtitle && (
              onSubtitleClick ? (
                <button
                  type="button"
                  onClick={onSubtitleClick}
                  className="truncate min-w-0 hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] outline-none cursor-pointer"
                >
                  {subtitle}
                </button>
              ) : (
                <span className="truncate min-w-0">{subtitle}</span>
              )
            )}
            {meta && (
              <span className="inline-flex items-center gap-1.5 shrink-0 @max-[240px]:hidden">
                {subtitle && <span aria-hidden="true" className="shrink-0">·</span>}
                <span>{meta}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Trailing — either bespoke content (e.g. a selection Checkbox in the
           Add-music picker) or the ⋯ menu. `trailing` wins when both are
           passed, since a row is one or the other. */}
      {trailing ? (
        <div className="shrink-0 pr-6">{trailing}</div>
      ) : menuItems && (
        <div className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6}>
              {menuItems}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

// ─── Leading slot ─────────────────────────────────────────────────────
function Leading({
  type, title, cover, covers, playing, onPlay,
}: {
  type: ContentType
  title: string
  cover?: string
  covers?: string[]
  playing: boolean
  onPlay?: () => void
}) {
  // Song — playable thumb (play / pause / wave overlay), like the
  // player row but standalone.
  if (type === "song" && cover) {
    return (
      <CoverPlayButton
        src={cover}
        title={title}
        playing={playing}
        onToggle={onPlay}
        hoverGroup="row"
      />
    )
  }

  // Artist / label — circle. (A label is shown like an artist: round
  // avatar + name, distinguished only by its "Label" badge.)
  if (type === "artist" || type === "label") {
    return (
      <img
        src={cover}
        alt=""
        draggable={false}
        className="size-12 shrink-0 rounded-full object-cover bg-secondary"
      />
    )
  }

  // Playlist — 2×2 collage when there are ≥4 tiles, else single image.
  if (type === "playlist" && covers && covers.length >= 4) {
    return (
      <div className="size-12 shrink-0 overflow-hidden rounded-xs grid grid-cols-2 grid-rows-2">
        {covers.slice(0, 4).map((src, i) => (
          <img key={i} src={src} alt="" draggable={false} className="size-full object-cover" />
        ))}
      </div>
    )
  }

  // Album (and playlist / track without their own slot) — square cover.
  return (
    <img
      src={cover ?? covers?.[0]}
      alt=""
      draggable={false}
      className="size-12 shrink-0 rounded-xs object-cover bg-secondary"
    />
  )
}
