"use client"

/*
 * PlaylistCard — 2×2 composite cover + title + subtitle. Same nav-surface
 * interaction model as AlbumCard:
 *   · Tap cover / click title          → OPEN the playlist detail page
 *   · Click hover Play button          → PLAY (first track, self-contained)
 *   · Click hover Heart                → SAVE to library (store-bound)
 *   · Long-press cover                 → onMore (parent renders Sheet)
 *   · Click owner (if shown)           → onOwnerClick (owner profile)
 *
 * Play / Save never navigate (the cluster stops the cover's long-press).
 *
 * Figma source: file L9yw4Yaec9YtAXGxP8q4fu › Component "Record Cover"
 *   · 19272:1584 / 1639 (Playlist default / hover)
 *   · 19272:1606 / 1658 (My Playlist — Edit instead of Add)
 *
 * Subtitle convention (per Figma):
 *   · Another user's playlist — "1234 Songs • Owner Name"
 *   · Own playlist            — "1234 Songs" (no owner line)
 */

import { Pencil } from "lucide-react"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PlayFilledAlt } from "@/components/ui/transport-icons"
import { PlaylistCardMenu } from "@/components/ui/cover-card-menu"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
import { useLongPress } from "@/lib/use-long-press"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { usePlayer } from "@/lib/player"
import { registerPlaylists, getPlaylistDetail } from "@/lib/playlist-catalog"

const COVER_BTN =
  "border-0 bg-neutral-100/50 text-neutral-900 backdrop-blur-xs hover:bg-neutral-100"
const COVER_BTN_SM = `${COVER_BTN} size-6 [&_svg]:size-3`
const COVER_BTN_LG = `${COVER_BTN} size-10 [&_svg]:size-4`

export interface PlaylistCardProps {
  title:     string
  /** 1-4 album-cover URLs to assemble into the composite. */
  covers:    string[]
  songCount: number
  /** Owner display name. Omit (or pass `owned`) for the user's own
   *  playlists — the subtitle then reads "N Songs" only. */
  owner?:    string
  /** When true, the leading hover button is Edit (✏️) instead of Add (+),
   *  and the owner name is hidden from the subtitle. */
  owned?:    boolean
  /** The playlist is saved in the user's library — drops "Add to
   *  library" and shows "Remove from library" instead. */
  inLibrary?: boolean
  onPlay?:         () => void
  onMore?:         () => void
  onAdd?:          () => void
  onEdit?:         () => void
  onGoToOwner?:    () => void
  onGoToPlaylist?: () => void
  onDelete?:       () => void
  onRemove?:       () => void
  onReport?:       () => void
  onShowInfo?:     () => void
  onTitleClick?:  () => void
  onOwnerClick?:  () => void
  className?: string
}

export function PlaylistCard({
  title, covers, songCount, owner, owned, inLibrary,
  onPlay, onMore, onAdd, onEdit, onGoToOwner, onGoToPlaylist,
  onDelete, onRemove, onReport, onShowInfo, onTitleClick, onOwnerClick, className,
}: PlaylistCardProps) {
  const songsLabel = `${songCount.toLocaleString()} ${songCount === 1 ? "Song" : "Songs"}`
  const showOwner  = !owned && !!owner
  const { openPlaylist } = useMediaNav()
  const player = usePlayer()
  const key = slugify(title)
  // Baked-in share target — link to this playlist's own detail page.
  const shareHref  = `/?page=Playlist&playlist=${key}`

  // Self-register so this card always resolves to a real detail page
  // (with its own covers/owner) — even titles the catalog didn't seed.
  useEffect(() => {
    registerPlaylists([{ id: key, title, covers, songCount, owner, owned }])
  }, [key, title, covers, songCount, owner, owned])

  // The card is a NAV surface: tapping the cover (or title) opens the
  // detail page. Play and save are their own affordances — never navigate.
  const goPlaylist = () => openPlaylist(key)
  // Play the playlist's first track (context = playlist title). The card
  // always plays itself — the legacy `onPlay` prop (historically wired to
  // navigation by hosts) is intentionally NOT used here.
  const playPlaylist = () => {
    const pl = getPlaylistDetail(key)
    const t = pl.tracks[0]
    if (t) player.play({ title: t.title, artist: t.artist, album: t.album, image: t.cover, totalTime: t.duration }, pl.title)
  }

  const stop = <T,>(fn?: (e: T) => void) => (e: T) => {
    ;(e as unknown as { stopPropagation: () => void }).stopPropagation()
    fn?.(e)
  }

  const coverGestures = useLongPress({
    onClick:     goPlaylist,
    onLongPress: () => onMore?.(),
  })

  return (
    <div
      className={cn(
        "group/playlist flex flex-col gap-1 text-left w-full min-w-0",
        className,
      )}
    >
      <div
        {...coverGestures}
        className="relative aspect-square w-full overflow-hidden cursor-pointer select-none touch-none"
      >
        <CompositeCover covers={covers} title={title} />

        {/* Softer dark gradient — cover text/details stay readable
             when the action cluster fades in on hover. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-0 transition-opacity group-hover/playlist:opacity-100 group-focus-within/playlist:opacity-100"
        />

        {/* Stop pointer events so a cluster-button press (play / heart /
            menu) doesn't also fire the cover's useLongPress → open detail. */}
        <div
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 p-1.5 flex items-end justify-between opacity-0 transition-opacity group-hover/playlist:opacity-100 group-focus-within/playlist:opacity-100"
        >
          <div className="flex items-center gap-1.5">
            {owned ? (
              <Button
                variant="outline"
                size="icon-sm"
                className={COVER_BTN_SM}
                onClick={stop(onEdit)}
                aria-label="Edit playlist"
              >
                <Pencil />
              </Button>
            ) : inLibrary ? null : (
              // Store-bound: toggles save/remove + animates + toasts; stops
              // propagation so it never opens the detail page.
              <LibraryHeartButton
                type="playlist"
                id={key}
                name={title}
                variant="outline"
                size="icon-sm"
                className={COVER_BTN_SM}
              />
            )}
            <PlaylistCardMenu
              owned={owned}
              inLibrary={inLibrary}
              shareTitle={title}
              shareUrl={shareHref}
              onAdd={onAdd}
              onEdit={onEdit}
              onGoToOwner={onGoToOwner}
              onGoToPlaylist={onGoToPlaylist}
              onDelete={onDelete}
              onRemove={onRemove}
              onReport={onReport}
              onShowInfo={onShowInfo}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={COVER_BTN_LG}
            onClick={stop(playPlaylist)}
            aria-label="Play"
          >
            <PlayFilledAlt />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        <button
          type="button"
          onClick={onTitleClick ?? goPlaylist}
          className="text-small font-normal leading-5 text-foreground text-left line-clamp-2 hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] pb-[6px] -mb-[6px] outline-none cursor-pointer"
        >
          {title}
        </button>
        <div className="flex items-center gap-1.5 min-w-0 text-small font-normal leading-5 text-muted-foreground">
          <span className="shrink-0">{songsLabel}</span>
          {showOwner && (
            <>
              <span className="shrink-0" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onOwnerClick}
                className="truncate hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] pb-[6px] -mb-[6px] outline-none cursor-pointer"
              >
                {owner}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Composite cover ─────────────────────────────────────────────────────────

function CompositeCover({ covers, title }: { covers: string[]; title: string }) {
  if (covers.length >= 4) {
    return (
      <div className="grid size-full grid-cols-2 grid-rows-2">
        {covers.slice(0, 4).map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        ))}
      </div>
    )
  }
  return (
    <img
      src={covers[0]}
      alt={title}
      draggable={false}
      className="size-full object-cover"
    />
  )
}
