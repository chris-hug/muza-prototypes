"use client"

/*
 * SongListItem — single row in a song list (Artist profile "Top
 * Songs", playlist detail, search results, etc.).
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 8971:98256 →
 * `list-element/song-with-cover`.
 *
 * Layout:
 *   ┌──────────┐  Title                            [+] [duration]
 *   │  cover   │  Demo · album · year              [+] [ⓘ] [⋯] [duration]   ← hover
 *   └──────────┘
 *
 * State / interaction:
 *   · Row: `bg-background` at rest, `bg-muted` on hover (no zebra).
 *   · Heart (Save to library): always visible.
 *   · Info + More: faded in only on hover.
 *   · Duration: always visible; same `text-small text-muted-foreground`
 *     style as the meta line — no special tabular sizing.
 *   · Cover hover overlay (mouse only): dark wash + Play icon.
 *
 * The right cluster has a small left-side gradient veil so meta text
 * fades cleanly into the row bg right before the action icons,
 * preventing visible overlap when titles or album lines wrap close.
 */

import * as React from "react"
import { useState } from "react"
import { Heart, Info, MoreHorizontal, ListPlus, Mic, Disc3, Share, Link2, Flag } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { PlayingWave } from "@/components/ui/playing-wave"
import { CoverPlayButton } from "@/components/ui/cover-play-button"
import { PlayFilledAlt, PauseFilledAlt } from "@/components/ui/transport-icons"
import { useShare } from "@/lib/use-share"
import { useCredits } from "@/lib/credits-context"
import { slugify } from "@/lib/media-nav"
import { useUserLibrary } from "@/lib/user-library"
import { useLibraryToggle } from "@/lib/use-library-toggle"
import { useAddToPlaylist } from "@/lib/add-to-playlist-context"
import { SONG_DRAG_TYPE } from "@/lib/playlist-editor-context"
import { useToast } from "@/components/ui/toast"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"

// Re-export for callers still importing PlayingWave from the row
// module (e.g. discography list view).
export { PlayingWave }

export interface SongListItemProps {
  /** Either pass `cover` (Artist › Top Songs context — shows the
   *  album art per row) OR `trackNumber` (album detail context —
   *  the row is one track on a single album, so the cover is
   *  redundant and a track number reads better). One or the other
   *  must be provided. */
  cover?:   string
  /** Album-track variant — 1-based track number rendered in the
   *  leading slot instead of a cover thumb. Same play/pause/wave
   *  hover behaviour as the cover variant. */
  trackNumber?: number
  title:    string
  artist?:  string
  album?:   string
  year?:    string | number
  /** Optional small chip shown before the album/year line (e.g. "Demo"). */
  badge?:   string
  /** Formatted duration like "3:42". Same style as the meta line. */
  duration?: string
  /** Compact / dense variant for swipeable list rails (Artist › Top
   *  Songs, "Swipable Lists Section"). Drops the duration and lets the
   *  trailing action float over the meta on a left-fading gradient
   *  panel, so long titles/artists release behind it instead of
   *  hard-truncating. Used where row width is tight. */
  compact?: boolean
  onPlay?:          () => void
  /** Controlled playing state. When provided, the row reflects this
   *  instead of its own local toggle — so a host backed by a global
   *  player can guarantee only ONE row shows the playing wave at a time
   *  (and pressing play on another row stops this one). Omit for the
   *  self-contained DS showcase. */
  playing?:         boolean
  /** Always-visible quick action — saves the song to the library
   *  (Heart). The overflow menu carries "Add to playlist" separately. */
  onAddToLibrary?:  () => void
  onAddToPlaylist?: () => void
  /** The "…" opens ONE shared song menu (desktop dropdown / touch sheet),
   *  built from the row's own handlers + context. Every song row — playlist,
   *  album, artist Top Songs, search, library — gets the SAME items; a
   *  surface hides only what's redundant there via the `hide…` flags below.
   *  `menuItems` is a legacy escape hatch to override the whole set; prefer
   *  the flags so the menu stays consistent. */
  menuItems?:       React.ReactNode
  onInfo?:          () => void
  /** Report the track. Defaults to a "Reported" toast when omitted, so the
   *  row always offers it. */
  onReport?:        () => void
  /** Hide "Add to playlist" — set when the row is inside the user's OWN
   *  playlist (adding it to the playlist it's already in is meaningless). */
  hideAddToPlaylist?: boolean
  /** Hide "Go to artist" — set on the artist page's own Top Songs (you're
   *  already there). */
  hideGoToArtist?:  boolean
  /** Hide "Go to album" — set on an album page / album track list. */
  hideGoToAlbum?:   boolean
  /** Click target for the title text (navigates to song detail). */
  onTitleClick?:    () => void
  /** Click target for the album text in the meta line. Also drives the
   *  menu's "Go to album". */
  onAlbumClick?:    () => void
  /** Click target for the artist text in the meta line. Also drives the
   *  menu's "Go to artist". */
  onArtistClick?:   () => void
  className?: string
}

/*
 * SongMenuItems — the shared song "…" menu, as dropdown items, so the SAME
 * menu sits behind BOTH the SongListItem overflow button AND a table row's
 * kebab (SongListTable): every song, every surface, one menu. Renders only
 * the items — the host wraps them in a DropdownMenuContent.
 *
 * Full set: Share…/Copy link · Save ⇄ Remove from library · Add to playlist
 * · Go to artist · Go to album · Show credits · Report. Each surface hides
 * only what's redundant there via the `hide…` flags; nav rows also need
 * their click handler. Library / share / credits / report are self-wired
 * (store + toast), keyed by (title, artist) so the saved state matches the
 * row's heart.
 */
export function SongMenuItems({
  title, artist, album, cover, duration,
  onAddToPlaylist, onArtistClick, onAlbumClick, onInfo, onReport,
  hideAddToPlaylist, hideGoToArtist, hideGoToAlbum,
}: {
  title:    string
  artist?:  string
  album?:   string
  cover?:   string
  duration?: string
  onAddToPlaylist?: () => void
  onArtistClick?:   () => void
  onAlbumClick?:    () => void
  onInfo?:          () => void
  onReport?:        () => void
  hideAddToPlaylist?: boolean
  hideGoToArtist?:  boolean
  hideGoToAlbum?:   boolean
}) {
  const { canNativeShare, copyLink, nativeShare } = useShare({ title, text: artist ? `${title} — ${artist}` : title })
  const credits = useCredits()
  const showCredits = album ? () => credits.open(slugify(album)) : onInfo

  const library = useUserLibrary()
  const toggleLibrary = useLibraryToggle()
  const songId = slugify(artist ? `${title}-${artist}` : title)
  const inLibrary = library.inLibrary("song", songId)
  const libraryLabel = inLibrary ? "Remove from library" : "Save to library"
  const handleSongLibrary = () => toggleLibrary("song", songId, title, { id: songId, title, artist, album, cover, duration })

  const { add: toast } = useToast()
  const handleReport = onReport ?? (() => toast({
    title: "Reported",
    description: `Thanks — we'll take a look at “${title}”.`,
  }))

  // "Add to playlist" opens the shared Tidal-style dialog by default (keyed
  // by this song); a host may override with its own `onAddToPlaylist`.
  const addToPlaylist = useAddToPlaylist()
  const handleAddToPlaylist = onAddToPlaylist ?? (() =>
    addToPlaylist.open({ id: songId, title, artist, album, cover, duration }))

  return (
    <>
      <DropdownMenuItem onClick={canNativeShare ? nativeShare : copyLink}>
        {canNativeShare ? <Share /> : <Link2 />}
        {canNativeShare ? "Share…" : "Copy link"}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleSongLibrary}><Heart className={cn(inLibrary && "fill-current")} />{libraryLabel}</DropdownMenuItem>
      {!hideAddToPlaylist && <DropdownMenuItem onClick={handleAddToPlaylist}><ListPlus />Add to playlist</DropdownMenuItem>}
      <DropdownMenuSeparator />
      {onArtistClick && !hideGoToArtist && <DropdownMenuItem onClick={onArtistClick}><Mic />Go to artist</DropdownMenuItem>}
      {onAlbumClick && !hideGoToAlbum && <DropdownMenuItem onClick={onAlbumClick}><Disc3 />Go to album</DropdownMenuItem>}
      <DropdownMenuItem onClick={showCredits}><Info />Show credits</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onClick={handleReport}><Flag />Report</DropdownMenuItem>
    </>
  )
}

export function SongListItem({
  cover, trackNumber, title, artist, album, year, badge, duration,
  compact = false,
  onPlay, playing: playingProp, onAddToLibrary, onAddToPlaylist, menuItems, onInfo,
  onReport, hideAddToPlaylist, hideGoToArtist, hideGoToAlbum,
  onTitleClick, onAlbumClick, onArtistClick, className,
}: SongListItemProps) {
  // Playback state. CONTROLLED when `playing` is passed (a global player
  // owns it — only the active row shows the wave, and playing another row
  // stops this one); otherwise falls back to a local toggle for the
  // self-contained DS showcase. Either way `onPlay` fires on activation.
  const [localPlaying, setLocalPlaying] = useState(false)
  const controlled = playingProp !== undefined
  const playing = controlled ? playingProp : localPlaying
  // Activation = fire `onPlay` (host loads/toggles the global player); in
  // uncontrolled mode also flip the local flag.
  const activate = () => { if (!controlled) setLocalPlaying(p => !p); onPlay?.() }
  // Share is baked in (copy link / native sheet). Songs have no own
  // page, so the link is the current context (album / playlist page).
  const { canNativeShare, copyLink, nativeShare } = useShare({ title, text: artist ? `${title} — ${artist}` : title })
  // "Show credits" opens the release credits for the track's album.
  const credits = useCredits()
  const showCredits = album ? () => credits.open(slugify(album)) : onInfo

  // Add-to-library — store-backed (animated heart + toast), keyed by the
  // song (title + artist so same-titled tracks stay distinct). The legacy
  // `onAddToLibrary` host hook still fires as an optional side-effect.
  const library = useUserLibrary()
  const toggleLibrary = useLibraryToggle()
  const songId = slugify(artist ? `${title}-${artist}` : title)
  const inLibrary = library.inLibrary("song", songId)
  const songMeta = { id: songId, title, artist, album, cover, duration }
  const handleSongLibrary = () => { toggleLibrary("song", songId, title, songMeta); onAddToLibrary?.() }
  const libraryLabel = inLibrary ? "Remove from library" : "Save to library"

  // Report — baked default (toast) so every song row offers it; a host may
  // override with its own `onReport`.
  const { add: toast } = useToast()
  const handleReport = onReport ?? (() => toast({
    title: "Reported",
    description: `Thanks — we'll take a look at “${title}”.`,
  }))

  // "Add to playlist" — opens the shared dialog by default (the touch sheet
  // uses this; the desktop dropdown is SongMenuItems, which bakes its own).
  const addToPlaylist = useAddToPlaylist()
  const handleAddToPlaylist = onAddToPlaylist ?? (() => addToPlaylist.open(songMeta))

  // The ONE shared song menu (desktop dropdown; the touch sheet below mirrors
  // it). Same items everywhere a song is listed; each surface only hides what
  // is redundant there (own-playlist → no "Add to playlist"; artist page → no
  // "Go to artist"; album page → no "Go to album"). Nav rows also require
  // their click handler. `menuItems` stays as a legacy full-override hatch.
  const menuContent = menuItems ?? (
    <SongMenuItems
      title={title} artist={artist} album={album} cover={cover} duration={duration}
      onAddToPlaylist={onAddToPlaylist}
      onArtistClick={onArtistClick}
      onAlbumClick={onAlbumClick}
      onInfo={onInfo}
      onReport={onReport}
      hideAddToPlaylist={hideAddToPlaylist}
      hideGoToArtist={hideGoToArtist}
      hideGoToAlbum={hideGoToAlbum}
    />
  )

  // Row-wide click toggles play/pause. Clicks on interactive
  // children (buttons / anchors) are ignored so the title / album /
  // artist text buttons and the cluster icons never trigger play.
  const onRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element
    if (target.closest("button, a")) return
    activate()
  }

  return (
    <div
      onClick={onRowClick}
      // Draggable so the row can be dropped into the playlist-edit drawer.
      // Carries the song as JSON under our own MIME type, so unrelated drop
      // targets ignore it.
      draggable
      onDragStart={e => {
        e.dataTransfer.setData(SONG_DRAG_TYPE, JSON.stringify(songMeta))
        e.dataTransfer.effectAllowed = "copy"
      }}
      className={cn(
        // `@container` so the meta line can drop fields by the row's
        // OWN width (priority order: keep artist, drop album, drop
        // year first — see the meta line below).
        "@container group/song relative flex items-center gap-3 rounded-md pl-2 pr-2 py-1.5 overflow-clip cursor-pointer",
        // Idle rows: bg-background with bg-muted on hover.
        // Playing rows: always bg-muted — marks this row as the
        // current item even at rest.
        "transition-colors",
        playing ? "bg-muted" : "bg-background hover:bg-muted",
        className,
      )}
    >
      {/* Leading slot — cover thumb (Top Songs / playlist context)
           OR track number (album detail context). Both share the
           same play / pause / wave behavior; only the idle visual
           differs. */}
      {trackNumber != null ? (
        <TrackNumberPlayButton
          number={trackNumber}
          title={title}
          playing={playing}
          onToggle={activate}
        />
      ) : (
        <CoverPlayButton
          src={cover!}
          title={title}
          playing={playing}
          onToggle={activate}
          hoverGroup="song"
        />
      )}

      {/* Info — title row + meta row. min-w-0 so long titles can
           truncate inside flex. The meta line is omitted entirely when
           there's nothing to show (e.g. album-detail rows, where the
           per-track artist/album/year would just repeat the header) so
           the title sits vertically centred as a clean single line. */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onTitleClick}
          className="text-xsmall font-normal leading-5 text-foreground text-left truncate hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] outline-none cursor-pointer"
        >
          {title}
        </button>
        {/* Meta line — priority-ordered: artist > album > year. As the
             row narrows, year drops first (≤380), then album (≤260);
             artist always stays. Album also shrinks 2× faster than
             artist, so when both show the artist truncates last. */}
        {(badge || artist || album || year) && (
        <div className="flex items-center gap-1.5 min-w-0 text-xsmall font-light tracking-[0.02em] text-muted-foreground leading-5">
          {badge && (
            <Badge variant="secondary" className="shrink-0">
              {badge}
            </Badge>
          )}
          {artist && (
            <button
              type="button"
              onClick={onArtistClick}
              className="truncate min-w-0 hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] outline-none cursor-pointer"
            >
              {artist}
            </button>
          )}
          {album && (
            <span className="inline-flex items-center gap-1.5 min-w-0 shrink-[2] @max-[260px]:hidden">
              {artist && <span aria-hidden="true" className="shrink-0">·</span>}
              <button
                type="button"
                onClick={onAlbumClick}
                className="truncate min-w-0 hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] outline-none cursor-pointer"
              >
                {album}
              </button>
            </span>
          )}
          {year && (
            <span className="inline-flex items-center gap-1.5 shrink-0 @max-[380px]:hidden">
              {(artist || album) && <span aria-hidden="true" className="shrink-0">·</span>}
              <span>{year}</span>
            </span>
          )}
        </div>
        )}
      </div>

      {compact ? (
        /* Compact (swipeable list) cluster — pointer-aware:
           · Fine pointer (mouse/desktop): the default 3-icon hover
             behaviour — Heart always, More + Info fade in on hover.
             No duration.
           · Coarse pointer (touch): no hover exists, so a single "…"
             button on a narrow left-fading gradient opens a bottom
             sheet with the full action set. The fade lets the meta
             text release behind the button instead of hard-clipping. */
        <>
          {/* — Mouse / desktop: hover cluster (Heart + hover More/Info).
                Shown by default; force-hidden on touch (no hover). The
                `!` beats Tailwind's base display utility regardless of
                rule order. */}
          <div className="flex [@media(hover:none)]:!hidden items-center gap-0.5 shrink-0 relative px-2 py-1.5">
            <div className="absolute right-[calc(100%-6px)] top-1/2 -translate-y-1/2 flex items-center gap-0.5 py-1.5 pl-8 pr-0 bg-[linear-gradient(to_right,transparent_0px,var(--muted)_32px)] opacity-0 pointer-events-none transition-opacity group-hover/song:opacity-100 group-hover/song:pointer-events-auto">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6}>
                  {menuContent}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon-sm" onClick={onInfo} aria-label="Song info">
                <Info />
              </Button>
            </div>
            <LibraryHeartButton type="song" id={songId} name={title} song={songMeta} variant="ghost" size="icon-sm" />
          </div>

          {/* — Touch: single "…" → bottom sheet, narrow fade. Shown by
                default; force-hidden on hover-capable (desktop) devices. */}
          <div className={cn(
            "flex [@media(hover:hover)]:!hidden absolute inset-y-0 right-0 items-center pl-7 pr-1 pointer-events-none [&_button]:pointer-events-auto",
            playing
              ? "bg-[linear-gradient(to_right,transparent_0px,var(--muted)_28px)]"
              : "bg-[linear-gradient(to_right,transparent_0px,var(--background)_28px)] group-hover/song:bg-[linear-gradient(to_right,transparent_0px,var(--muted)_28px)]",
          )}>
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                <MoreHorizontal />
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader className="flex-row items-center gap-3">
                  {cover && (
                    <img src={cover} alt="" draggable={false} className="size-11 rounded-xs object-cover shrink-0" />
                  )}
                  <div className="min-w-0 text-left">
                    <SheetTitle className="truncate">{title}</SheetTitle>
                    {(artist || album) && (
                      <p className="truncate text-small text-muted-foreground">
                        {[artist, album].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </SheetHeader>
                <div className="flex flex-col px-2 pb-4">
                  <SheetAction icon={<Heart className={cn(inLibrary && "fill-current")} />} label={libraryLabel} onClick={handleSongLibrary} />
                  {!hideAddToPlaylist && <SheetAction icon={<ListPlus />} label="Add to playlist" onClick={handleAddToPlaylist} />}
                  {onArtistClick && !hideGoToArtist && <SheetAction icon={<Mic />}   label="Go to artist" onClick={onArtistClick} />}
                  {onAlbumClick  && !hideGoToAlbum  && <SheetAction icon={<Disc3 />} label="Go to album"  onClick={onAlbumClick} />}
                  <SheetAction
                    icon={canNativeShare ? <Share /> : <Link2 />}
                    label={canNativeShare ? "Share…" : "Copy link"}
                    onClick={canNativeShare ? nativeShare : copyLink}
                  />
                  <SheetAction icon={<Info />}  label="Show credits" onClick={showCredits} />
                  <SheetAction icon={<Flag />}  label="Report"       onClick={handleReport} destructive />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </>
      ) : (
        /* Default cluster — at rest: ONLY [Heart] [Duration], so the
             title/meta on the left get every pixel of leftover space
             (no premature truncation). On hover: a hover-only overlay
             docks against the cluster's left edge, carrying More + Info
             inside its own `bg-muted` panel — the panel masks whatever
             meta text it covers, so the icons stay legible without
             pushing layout around. */
        <div className="flex items-center gap-0.5 shrink-0 relative px-2 py-1.5">
          {/* Always-on left fade veil — sits just left of the cluster
               so the meta text dissolves into the row bg before the
               action icons instead of hard-truncating with an ellipsis.
               Tracks the row bg (background → muted on hover). */}
          <div
            aria-hidden="true"
            className={cn(
              "absolute right-full top-0 bottom-0 w-6 pointer-events-none",
              // Match the row bg exactly: a playing row is already `bg-muted`
              // (even at rest), so the veil must fade to --muted there too —
              // otherwise it paints --background over a muted row (a seam).
              playing
                ? "bg-[linear-gradient(to_right,transparent_0px,var(--muted)_24px)]"
                : "bg-[linear-gradient(to_right,transparent_0px,var(--background)_24px)] group-hover/song:bg-[linear-gradient(to_right,transparent_0px,var(--muted)_24px)]",
            )}
          />
          {/* Hover-only icon panel — absolute, with `right` tuned so
               the Info button's right edge sits exactly 2px left of
               the Heart's left edge. Background gradient: 0 → 32px fades
               transparent → muted, then holds solid muted. */}
          <div
            className="absolute right-[calc(100%-6px)] top-1/2 -translate-y-1/2 flex items-center gap-0.5 py-1.5 pl-8 pr-0 bg-[linear-gradient(to_right,transparent_0px,var(--muted)_32px)] opacity-0 pointer-events-none transition-opacity group-hover/song:opacity-100 group-hover/song:pointer-events-auto"
          >
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6}>
                {menuContent}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onInfo}
              aria-label="Song info"
            >
              <Info />
            </Button>
          </div>

          {/* Heart — always-visible "Save to library" save, sits right
               next to the duration. Store-backed + animated. */}
          <LibraryHeartButton type="song" id={songId} name={title} song={songMeta} variant="ghost" size="icon-sm" />

          {/* Duration — text-xsmall with a min-width track. Dropped on
               very tight rows (≤300) so the title/meta keep the space;
               it's the least critical field after artist/album/year. */}
          {duration && (
            <span className="text-right min-w-10 text-xsmall font-light tracking-[0.02em] text-muted-foreground leading-4 @max-[300px]:hidden">
              {duration}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/*
 * SheetAction — one tappable row in the compact bottom sheet. Wrapped
 * in SheetClose so picking an action dismisses the sheet. Generous
 * 44px+ hit target for touch.
 */
function SheetAction({
  icon, label, onClick, destructive,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  destructive?: boolean
}) {
  return (
    <SheetClose
      render={
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base text-left transition-colors hover:bg-muted active:bg-muted [&_svg]:size-5 [&_svg]:shrink-0 outline-none focus-visible:bg-muted",
            destructive
              ? "text-destructive [&_svg]:text-destructive"
              : "text-foreground [&_svg]:text-muted-foreground",
          )}
        />
      }
    >
      {icon}
      {label}
    </SheetClose>
  )
}

/*
 * TrackNumberPlayButton — inline helper for the album-detail variant.
 * Same hover / playing / hover-while-playing state machine as
 * `CoverPlayButton`, but the idle state shows a track number
 * instead of an image. Always-mounted icons + CSS opacity
 * transitions (no JSX swaps) match the no-flicker pattern from
 * `CoverPlayButton`. Lives here (not in its own file) because it's
 * only ever used by `SongListItem` in the `trackNumber` mode.
 */
function TrackNumberPlayButton({
  number,
  title,
  playing,
  onToggle,
}: {
  number: number
  title: string
  playing: boolean
  onToggle?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? `Pause ${title}` : `Play ${title}`}
      data-playing={playing || undefined}
      className={cn(
        "group/tnpb relative shrink-0 size-12 flex items-center justify-center rounded-md cursor-pointer outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
      )}
    >
      {/* Idle visual — track number. Fades out when playing OR on
           hover (the play/pause/wave overlay takes over). */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute text-base font-normal leading-none text-muted-foreground tabular-nums transition-opacity duration-150",
          "group-hover/tnpb:opacity-0 group-data-[playing]/tnpb:opacity-0",
        )}
      >
        {number}
      </span>
      {/* Idle + hover → Play icon */}
      <PlayFilledAlt
        className={cn(
          "absolute size-4 text-foreground opacity-0 transition-opacity duration-150",
          "group-hover/tnpb:opacity-100 group-data-[playing]/tnpb:opacity-0",
        )}
      />
      {/* Playing + rest → 3D wave. Original pattern: opacity
           transition lives directly on `PlayingWave`'s root. */}
      <PlayingWave
        size={28}
        className={cn(
          "absolute text-foreground opacity-0 transition-opacity duration-150",
          "group-data-[playing]/tnpb:opacity-100 group-data-[playing]/tnpb:group-hover/tnpb:opacity-0",
        )}
      />
      {/* Playing + hover → Pause icon */}
      <PauseFilledAlt
        className={cn(
          "absolute size-4 text-foreground opacity-0 transition-opacity duration-150",
          "group-data-[playing]/tnpb:group-hover/tnpb:opacity-100",
        )}
      />
    </button>
  )
}

