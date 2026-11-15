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

import { Badge } from "@/components/ui/badge"
import { OfflineMark } from "@/components/ui/local-badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ContentTypeBadge, type ContentType } from "@/components/ui/badge"
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
   *  (playlist). An artist has none in search and the library; the credits
   *  pass the roles ("Piano, Rhodes piano"). */
  subtitle?: string
  /** Second line, after the dot — year (album/track) or "123 Songs"
   *  (playlist). */
  meta?:     string
  /** A one-word label leading the second line: "Owned", "Imported". The
   *  square-xs badge the album cards and song rows carry, so every list
   *  says it the same way. */
  badge?:    string
  /** Plays offline on this device: the offline mark after the badge
   *  (offline.ts). */
  offline?:  boolean
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
  /** Bespoke trailing content instead of the ⋯ menu — e.g. `SelectTrackButton`
   *  in the Add-music picker. Takes precedence over `menuItems`. */
  trailing?: React.ReactNode
  /** Show the ContentTypeBadge at the row's right edge. Only where nothing
   *  else names the type, i.e. a list that really mixes them. */
  showType?: boolean
  /** `"lg"` — the title one step up, `text-small` (19px), for a row that is
   *  read rather than scanned: the credits dialog, where the names are the
   *  content. Everywhere else the dense `"default"` (17px), so it stays the
   *  size of a Song List Item's title. */
  size?:     "default" | "lg"
  className?: string
}

export function MediaListItem({
  type, title, cover, covers, subtitle, meta, badge, offline = false, playing = false,
  onOpen, onPlay, onSubtitleClick, menuItems, trailing, showType = false, size = "default", className,
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
        /* No `@container` here, deliberately. The row carried one, together
           with a 240px hide step on the meta span — and an audit of
           every placement showed 240 is never reached: 296 in page lists
           (a 320px phone leaves a 296px column), 312 in the bottom sheets,
           324 in the playlist drawer's drop zone, 480 in desktop dialogs.
           The query had never fired. `min-w-0 truncate` on the meta span
           handles the overflow it was meant to prevent. Unlike SongListItem,
           this row is never placed in a rail cell, so it has no narrow
           context that the page column does not already describe. */
        "group/row press-ripple relative flex items-center gap-3 rounded-md pl-2 pr-1.5 py-1.5 cursor-pointer state-fade-quick",
        playing ? "bg-muted" : "bg-background [--hover-fill:var(--muted)]",
        className,
      )}
    >
      {/* Leading slot — adapts to the content type. */}
      <Leading type={type} title={title} cover={cover} covers={covers} playing={playing} onPlay={onPlay} />

      {/* Title + meta. */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className={cn(
          "font-normal text-foreground truncate",
          size === "lg" ? "text-small leading-6" : "text-xsmall leading-5",
        )}>{title}</p>
        {/* An artist shows a second line only when one is given — the
            credits' roles ("Piano, Rhodes piano"). Search and the library
            pass none, so their artist rows stay one line. */}
        {(badge || subtitle || meta) && (
          /* `lg` WRAPS its second line instead of truncating it: in the
             credits it is a person's roles, and "Piano, Rhodes piano (1, 2,
             3 …), Synthesizer (10), Arranger …" cut to "…" hid exactly the
             information the row is for. The dense lists keep truncating. */
          <div className={cn(
            "flex items-center gap-1.5 min-w-0 text-xsmall font-light tracking-[0.02em] text-muted-foreground leading-5",
            size === "lg" && "[&_.truncate]:whitespace-normal [&_.truncate]:overflow-visible",
          )}>
            {badge && <Badge variant="secondary" shape="square-xs" className="shrink-0">{badge}</Badge>}
            {offline && <OfflineMark />}
            {subtitle && (
              onSubtitleClick ? (
                <button
                  type="button"
                  onClick={onSubtitleClick}
                  className="truncate min-w-0 link-underline outline-none cursor-pointer"
                >
                  {subtitle}
                </button>
              ) : (
                <span className="truncate min-w-0">{subtitle}</span>
              )
            )}
            {meta && (
              // `min-w-0` + `truncate`, NOT `shrink-0`: a long album title
              // ("The Black Saint and the Sinner Lady") could not shrink and
              // ran on under the trailing button instead of ellipsing.
              <span className="inline-flex items-center gap-1.5 min-w-0">
                {subtitle && <span aria-hidden="true" className="shrink-0">·</span>}
                <span className="truncate">{meta}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right-aligned, not on the second line: there the badge starts wherever
           the name happens to end and the column of types reads as noise. */}
      {showType && <ContentTypeBadge type={type} />}

      {/* Trailing — either bespoke content (e.g. the pick affordance in the
           Add-music picker) or the ⋯ menu. `trailing` wins when both are
           passed, since a row is one or the other.
           It sits close to the row's right edge: the row's own `pr` is the
           only inset. A deeper one wasted horizontal space on phones, where
           the row is already the full sheet width. */}
      {trailing ? (
        <div className="shrink-0">{trailing}</div>
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

  // Artist / label — circle. A label is drawn exactly like an artist: round
  // avatar + name. Nothing distinguishes the two visually — this comment
  // used to claim a "Label" badge, which the row has never rendered.
  if (type === "artist" || type === "label") {
    /* No photo — most sidemen have none — initials in the same circle, so
       the row reads as credited, not broken. */
    if (!cover) {
      return (
        <div aria-hidden="true" className="size-12 shrink-0 rounded-full bg-muted art-edge flex items-center justify-center text-xsmall font-medium text-muted-foreground">
          {initials(title)}
        </div>
      )
    }
    return (
      <img
        src={cover}
        alt=""
        draggable={false}
        className="size-12 shrink-0 rounded-full object-cover bg-secondary art-edge"
      />
    )
  }

  // Playlist — 2×2 collage when there are ≥4 tiles, else single image.
  if (type === "playlist" && covers && covers.length >= 4) {
    return (
      // Edge on the collage, not the four tiles — one sleeve, one hairline.
      <div className="size-12 shrink-0 overflow-hidden rounded-xs grid grid-cols-2 grid-rows-2 art-edge">
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
      className="size-12 shrink-0 rounded-xs object-cover bg-secondary art-edge"
    />
  )
}

/* "Mark Ernestus" → ME, "A. B. Spellman" → AS: the first and the last word,
   dots dropped. Names are stored as read, never "Ernestus, Mark". */
function initials(name: string) {
  const words = name.replace(/\./g, " ").split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? ""
  const last  = words.length > 1 ? words[words.length - 1][0] : ""
  return (first + last).toUpperCase()
}
