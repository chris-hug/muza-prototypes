"use client"

/*
 * PlaylistCard — 2×2 composite cover + title + subtitle. Same
 * interaction model as AlbumCard:
 *   · Tap cover (or hover-Play button) → onPlay
 *   · Long-press cover                 → onMore (parent renders Sheet)
 *   · Click title                      → onTitleClick (playlist page)
 *   · Click owner (if shown)           → onOwnerClick (owner profile)
 *
 * Figma source: file L9yw4Yaec9YtAXGxP8q4fu › Component "Record Cover"
 *   · 19272:1584 / 1639 (Playlist default / hover)
 *   · 19272:1606 / 1658 (My Playlist — Edit instead of Add)
 *
 * Subtitle convention (per Figma):
 *   · Another user's playlist — "1234 Songs • Owner Name"
 *   · Own playlist            — "1234 Songs" (no owner line)
 */

import { Plus, Pencil } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PlayFilledAlt } from "@/components/ui/transport-icons"
import { PlaylistCardMenu } from "@/components/ui/cover-card-menu"
import { useLongPress } from "@/lib/use-long-press"

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
  onPlay?:         () => void
  onMore?:         () => void
  onAdd?:          () => void
  onEdit?:         () => void
  onShare?:        () => void
  onGoToOwner?:    () => void
  onGoToPlaylist?: () => void
  onDelete?:       () => void
  onReport?:       () => void
  onShowInfo?:     () => void
  onTitleClick?:  () => void
  onOwnerClick?:  () => void
  className?: string
}

export function PlaylistCard({
  title, covers, songCount, owner, owned,
  onPlay, onMore, onAdd, onEdit, onShare, onGoToOwner, onGoToPlaylist,
  onDelete, onReport, onShowInfo, onTitleClick, onOwnerClick, className,
}: PlaylistCardProps) {
  const songsLabel = `${songCount.toLocaleString()} ${songCount === 1 ? "Song" : "Songs"}`
  const showOwner  = !owned && !!owner

  const stop = <T,>(fn?: (e: T) => void) => (e: T) => {
    ;(e as unknown as { stopPropagation: () => void }).stopPropagation()
    fn?.(e)
  }

  const coverGestures = useLongPress({
    onClick:     () => onPlay?.(),
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

        <div className="absolute inset-x-0 bottom-0 p-1.5 flex items-end justify-between opacity-0 transition-opacity group-hover/playlist:opacity-100 group-focus-within/playlist:opacity-100">
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
            ) : (
              <Button
                variant="outline"
                size="icon-sm"
                className={COVER_BTN_SM}
                onClick={stop(onAdd)}
                aria-label="Save playlist"
              >
                <Plus />
              </Button>
            )}
            <PlaylistCardMenu
              owned={owned}
              onShare={onShare}
              onAdd={onAdd}
              onEdit={onEdit}
              onGoToOwner={onGoToOwner}
              onGoToPlaylist={onGoToPlaylist}
              onDelete={onDelete}
              onReport={onReport}
              onShowInfo={onShowInfo}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={COVER_BTN_LG}
            onClick={stop(onPlay)}
            aria-label="Play"
          >
            <PlayFilledAlt />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        <button
          type="button"
          onClick={onTitleClick}
          className="text-small font-normal leading-5 text-foreground text-left line-clamp-2 hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] pb-[6px] -mb-[6px] outline-none cursor-pointer"
        >
          {title}
        </button>
        <div className="flex items-baseline gap-1 min-w-0 text-small font-normal leading-5 text-muted-foreground">
          <span className="shrink-0">{songsLabel}</span>
          {showOwner && (
            <>
              <span className="shrink-0" aria-hidden="true">•</span>
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
