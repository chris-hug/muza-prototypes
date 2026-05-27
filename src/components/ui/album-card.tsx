"use client"

/*
 * AlbumCard — square cover image + title + artist subtitle, with
 * hover-revealed action buttons on the cover (mouse) and long-press
 * to open the same actions on touch.
 *
 * Interactions:
 *   · Tap cover (or hover-Play button) → onPlay
 *   · Long-press cover                 → onMore (parent renders Sheet)
 *   · Click title text                 → onTitleClick (album detail)
 *   · Click artist text                → onArtistClick (artist page)
 *
 * Figma source: file L9yw4Yaec9YtAXGxP8q4fu › Component "Record Cover"
 *   · 19272:1570 / 1543 (Album default / hover)
 *   · 19272:1556 / 1530 (My Album — Edit instead of Add)
 *
 * The dark gradient overlay is theme-agnostic (always black) so the
 * cover buttons stay readable in either light or dark mode.
 */

import { Plus, Pencil, Download } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PlayFilledAlt } from "@/components/ui/transport-icons"
import { AlbumCardMenu } from "@/components/ui/cover-card-menu"
import { PurchasedBadge } from "@/components/ui/purchased-badge"
import { useLongPress } from "@/lib/use-long-press"

// Cover-button base — translucent muted fill + light backdrop blur,
// border-0 to avoid a ghost edge from `bg-clip-padding`. Size
// overrides per usage: 24px secondary cluster, 40px lead Play.
const COVER_BTN =
  "border-0 bg-neutral-100/50 text-neutral-900 backdrop-blur-xs hover:bg-neutral-100"
const COVER_BTN_SM = `${COVER_BTN} size-6 [&_svg]:size-3`
const COVER_BTN_LG = `${COVER_BTN} size-10 [&_svg]:size-4`

export interface AlbumCardProps {
  cover:          string
  title:          string
  artist:         string
  /** Recording / release year. Rendered after the artist in the
   *  second text line, separated by a `·`. */
  year?:          number | string
  owned?:         boolean
  /** True when this album was paid for. Surfaces the "Owned" pill in
   *  the pricing row at the bottom of the card. Independent of
   *  `owned` (owned = uploaded by this user; purchased = bought). */
  purchased?:     boolean
  /** Stream-unlock price (e.g. "$2.99"). When set, the album requires
   *  purchase to stream — the pricing row shows the prices instead of
   *  "Free". Omit when the album streams freely under the Muza
   *  subscription. */
  streamPrice?:   string
  /** Download-license price (e.g. "$4.99"). Only meaningful when
   *  `streamPrice` is also set. Pricing row renders as
   *  `streamPrice stream · downloadPrice download`. */
  downloadPrice?: string
  /** Cover area: tap to play, long-press to call `onMore` (touch). */
  onPlay?:          () => void
  onMore?:          () => void
  /** Hover cluster + menu actions. */
  onAdd?:           () => void
  onEdit?:          () => void
  onShare?:         () => void
  onAddToPlaylist?: () => void
  onGoToArtist?:    () => void
  onGoToAlbum?:     () => void
  onRemove?:        () => void
  onReport?:        () => void
  onShowInfo?:      () => void
  /** Text labels — separate destinations from the cover. */
  onTitleClick?:  () => void
  onArtistClick?: () => void
  className?: string
}

export function AlbumCard({
  cover, title, artist, year, owned, purchased, streamPrice, downloadPrice,
  onPlay, onMore, onAdd, onEdit, onShare, onAddToPlaylist,
  onGoToArtist, onGoToAlbum, onRemove, onReport, onShowInfo,
  onTitleClick, onArtistClick, className,
}: AlbumCardProps) {
  // Buttons stop propagation so clicking them doesn't also fire the
  // cover's tap-to-play (which would steal the action).
  const stop = <T,>(fn?: (e: T) => void) => (e: T) => {
    ;(e as unknown as { stopPropagation: () => void }).stopPropagation()
    fn?.(e)
  }

  // Cover-area gestures: single tap → play, long-hold → more menu.
  const coverGestures = useLongPress({
    onClick:     () => onPlay?.(),
    onLongPress: () => onMore?.(),
  })

  return (
    <div
      className={cn(
        "group/album flex flex-col gap-1 text-left w-full min-w-0",
        className,
      )}
    >
      <div
        {...coverGestures}
        className="relative aspect-square w-full overflow-hidden cursor-pointer select-none touch-none"
      >
        <img
          src={cover}
          alt={title}
          draggable={false}
          className="size-full object-cover"
        />

        {/* Dark linear gradient (bottom → top), theme-agnostic.
             Softer than before (`/45` cap) so cover details stay
             readable when the action cluster fades in. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-0 transition-opacity group-hover/album:opacity-100 group-focus-within/album:opacity-100"
        />

        {/* Mouse-only hover cluster (Add/Edit + More + Play). Hidden
             on touch — touch users get the same actions via the
             long-press → bottom-sheet path. */}
        <div className="absolute inset-x-0 bottom-0 p-1.5 flex items-end justify-between opacity-0 transition-opacity group-hover/album:opacity-100 group-focus-within/album:opacity-100">
          <div className="flex items-center gap-1.5">
            {owned ? (
              <Button
                variant="outline"
                size="icon-sm"
                className={COVER_BTN_SM}
                onClick={stop(onEdit)}
                aria-label="Edit album"
              >
                <Pencil />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon-sm"
                className={COVER_BTN_SM}
                onClick={stop(onAdd)}
                aria-label="Add to library"
              >
                <Plus />
              </Button>
            )}
            <AlbumCardMenu
              owned={owned}
              onShare={onShare}
              onAdd={onAdd}
              onEdit={onEdit}
              onAddToPlaylist={onAddToPlaylist}
              onGoToArtist={onGoToArtist}
              onGoToAlbum={onGoToAlbum}
              onRemove={onRemove}
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
        {/* Title — clean text row, 2-line clamp (Spotify-style) so
             longer release names wrap instead of getting truncated
             mid-word. The "Owned" pill / pricing meta both live in
             the third row below, not here. */}
        <button
          type="button"
          onClick={onTitleClick}
          className="text-small font-normal leading-5 text-foreground text-left line-clamp-2 hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] pb-[6px] -mb-[6px] outline-none cursor-pointer"
        >
          {title}
        </button>
        {/* Artist row — artist + optional year, on one line with the
             artist text taking the underline-on-hover affordance
             (independent click target) and the year as plain meta
             after a `·` separator. */}
        <div className="flex items-center gap-1.5 min-w-0 text-small font-normal leading-5 text-muted-foreground">
          <button
            type="button"
            onClick={onArtistClick}
            className="truncate hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] pb-[6px] -mb-[6px] outline-none cursor-pointer text-left"
          >
            {artist}
          </button>
          {year !== undefined && (
            <>
              <span aria-hidden="true" className="shrink-0">·</span>
              <span className="shrink-0">{year}</span>
            </>
          )}
        </div>
        {/* Status / pricing row. Mirrors the Studio music table's
             monetisation cell: prices in tabular nums, faded `·`
             separator, download icon glyph next to the download
             price. Fixed 18px height so the pill-rendering case and
             the text-rendering case occupy identical vertical space —
             without the lock, the pill's bg fill makes the Owned
             row "feel" different from the Free / priced rows. */}
        <div className="flex items-center h-[18px]">
          {purchased ? (
            <PurchasedBadge className="text-2xsmall [&_svg]:size-3" />
          ) : streamPrice ? (
            <span className="flex items-center gap-1.5 text-2xsmall text-muted-foreground tabular-nums">
              <span>{streamPrice}</span>
              {downloadPrice && (
                <>
                  <span className="opacity-30" aria-hidden>·</span>
                  <span className="flex items-center gap-0.5">
                    <span>{downloadPrice}</span>
                    <Download className="size-3 shrink-0" aria-hidden />
                  </span>
                </>
              )}
            </span>
          ) : (
            <p className="text-2xsmall text-muted-foreground">Free</p>
          )}
        </div>
      </div>
    </div>
  )
}
