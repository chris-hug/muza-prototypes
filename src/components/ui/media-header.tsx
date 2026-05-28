"use client"

/*
 * MediaHeader — 256px-tall page header for any media detail surface
 * (album, playlist, owned variants of both). Cover on the left, title
 * + meta + action row on the right. Doubles as the playlist header.
 *
 * Figma source: file L9yw4Yaec9YtAXGxP8q4fu › node 19273:4242
 *   · 19273:4244 — Album
 *   · 19273:4277 — My Album
 *   · 19273:4312 — Playlist
 *   · 19273:4347 — My Playlist
 *
 * Layout:
 *   Cover  Title (36px / 2xlarge / semibold)
 *  268×268 [avatar] Owner · Format · Year [· Public]
 *
 *
 *          [Buying CTA — optional]
 *          [Play] [Shuffle]              [+] [↗] [ⓘ] [⋯]   ← album
 *                                        [Edit] [↗] [⋯]    ← my-album
 *
 * Back navigation lives at the PAGE level, not in this component —
 * each detail page (album, playlist) renders its own back chevron
 * in the gutter to the left of the content. Keeps the header focused
 * on the media identity + actions; the navigation chrome is the
 * page's concern.
 *
 * Lives at 1090px in Figma; in the prototype the parent scroll
 * container constrains width — header just stretches to fill.
 */

import { Plus, Share, Info, MoreHorizontal, Shuffle, Disc3, ListMusic, Pencil, Download } from "lucide-react"
import { PurchasedBadge } from "@/components/ui/purchased-badge"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, type StatusBadgeStatus } from "@/components/ui/status-badge"
import { PlayFilledAlt } from "@/components/ui/transport-icons"

export type MediaHeaderVariant = "album" | "my-album" | "playlist" | "my-playlist"

export interface MediaHeaderProps {
  variant?: MediaHeaderVariant
  /** Square cover URL. Used as-is for album / my-album variants;
   *  for the playlist variants this is the FALLBACK only — playlists
   *  always render the 2×2 composite from `covers`. Pass it even on
   *  playlists so hosts that don't have 4 cover URLs handy can still
   *  render something. */
  cover: string
  /** 4-image array for the 2×2 composite cover. **Always provide
   *  this for playlist / my-playlist variants** — playlists never
   *  show a single image. Order is top-left, top-right, bottom-left,
   *  bottom-right. The album variants ignore this. */
  covers?: ReadonlyArray<string>
  title: string
  /** Artist name (album) or playlist owner. */
  owner?: string
  ownerAvatar?: string
  /** "Album" / "Single" / "EP" / "Compilation". Omit for playlists. */
  format?: string
  /** Album recording year or playlist last-updated year. */
  year?: number | string
  /** Visibility for my-* variants — drives the interactive
   *  `StatusBadge` pill next to the meta line. Omit to hide the
   *  badge entirely. */
  visibility?: StatusBadgeStatus
  /** Fires when the user picks a different value from the
   *  visibility badge's dropdown. */
  onVisibilityChange?: (status: StatusBadgeStatus) => void
  /** Toggles the "Unlock All Songs — $X" outline-primary CTA above
   *  the Play / Shuffle row. */
  hasBuyingOption?: boolean
  buyingPrice?: string
  /** Renders the inline "Purchased" badge in the meta line. The host
   *  should set `hasBuyingOption=false` whenever this is true — no
   *  point offering to buy something the user already owns. */
  purchased?: boolean
  /** True when the user bought the download tier — surfaces a
   *  "Download" button in the slot the buy CTA used to occupy. The
   *  streaming-tier purchase shows no CTA in that slot (the inline
   *  Purchased badge is sufficient). */
  downloadable?: boolean
  onDownload?: () => void
  /** Stream-tier purchases can upgrade to download for the price
   *  delta. When this is set (and the user owns the album but not the
   *  download tier), an "Add download — $X" outline-primary button
   *  takes the freed CTA slot. */
  addDownloadPrice?: string
  onAddDownload?: () => void

  onPlay?:        () => void
  onShuffle?:     () => void
  onAdd?:         () => void
  onShare?:       () => void
  onInfo?:        () => void
  onMore?:        () => void
  onEdit?:        () => void
  onBuy?:         () => void
  onOwnerClick?:  () => void
  className?: string
}

// All four glassy action buttons share these props. `variant="outline"`
// already carries the `bg-background/20 backdrop-blur-lg border` chrome
// the Figma calls for; `size="icon-lg"` is the 48px square.
const ACTION_BTN_CLASS = "size-12"

export function MediaHeader({
  variant = "album",
  cover,
  covers,
  title,
  owner,
  ownerAvatar,
  format = "Album",
  year,
  visibility,
  onVisibilityChange,
  hasBuyingOption = false,
  buyingPrice = "$2.99",
  purchased = false,
  downloadable = false,
  onDownload,
  addDownloadPrice,
  onAddDownload,
  onPlay, onShuffle, onAdd, onShare, onInfo, onMore, onEdit, onBuy, onOwnerClick,
  className,
}: MediaHeaderProps) {
  const isOwned     = variant === "my-album" || variant === "my-playlist"
  const isPlaylist  = variant === "playlist" || variant === "my-playlist"
  // 2×2 composite cover when 4 images are supplied (playlists);
  // otherwise the single `cover` image fills the frame.
  const hasComposite = !!covers && covers.length >= 4
  const composite = hasComposite ? covers!.slice(0, 4) : null

  return (
    <header
      className={cn(
        "relative flex items-start gap-4 py-4 w-full h-[300px]",
        className,
      )}
    >
      {/* ── Cover + titles section ─────────────────────────────────── */}
      {/* `items-stretch` (flex default — listed explicitly here so the
           intent is obvious) makes the titles column fill the cover's
           height. That gives `justify-between` inside the titles
           column a real height to distribute against — title at the
           top, action row pinned to the bottom edge of the cover.
           With `items-start` the titles column was content-height,
           so `justify-between` collapsed and the actions sat at the
           mid-height of the cover. */}
      <div className="flex flex-1 items-stretch min-w-0 gap-4">
        {/* Cover — 268×268 (+20% over the Figma's 224). rounded-xs
             (2px) matches the Figma "radius/small" annotation. */}
        <div className="size-[268px] shrink-0">
          {hasComposite ? (
            <div className="grid grid-cols-2 grid-rows-2 size-full rounded-xs overflow-hidden shadow-sm">
              {composite!.map((src, i) => (
                <img key={i} src={src} alt="" draggable={false} className="size-full object-cover" />
              ))}
            </div>
          ) : (
            <img
              src={cover}
              alt=""
              draggable={false}
              className="size-full object-cover rounded-xs shadow-sm"
            />
          )}
        </div>

        {/* Titles section — fills remaining width AND the cover's
             height (via flex `items-stretch` on the parent). No
             `h-full` here: percentage heights need an explicit
             parent height to resolve, and the cover+titles wrapper
             has none — `h-full` was reverting to content height,
             collapsing `justify-between` so the action row sat
             mid-cover. Flex stretch gives us the 268 we need.
             `pl-4` only (no `pr-*`) so the action cluster on the
             bottom-right sits flush with the page's content edge. */}
        <div className="flex flex-1 flex-col self-stretch min-w-0 justify-between pl-4 isolate">
          {/* Top — title + meta line */}
          <div className="flex flex-col gap-3 w-full">
            <h1
              className="text-2xlarge font-semibold leading-8 text-foreground line-clamp-2 break-words"
              title={title}
            >
              {title}
            </h1>
            <div className="flex items-center gap-4 text-small font-normal leading-none text-muted-foreground">
              {owner && (
                <button
                  type="button"
                  onClick={onOwnerClick}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                >
                  {ownerAvatar && (
                    <img
                      src={ownerAvatar}
                      alt=""
                      draggable={false}
                      className="size-6 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium">{owner}</span>
                </button>
              )}
              {/* Format glyph + label — flat inline meta (no pill
                   chrome) so the line reads as one calm rhythm
                   alongside owner / year / Owned. Album uses Disc3 +
                   `format` ("Album" / "Single" / "EP"); playlist
                   uses ListMusic + literal "Playlist". */}
              {isPlaylist ? (
                <span className="flex items-center gap-1">
                  <ListMusic className="size-3.5 shrink-0" />
                  Playlist
                </span>
              ) : format && (
                <span className="flex items-center gap-1">
                  <Disc3 className="size-3.5 shrink-0" />
                  {format}
                </span>
              )}
              {year && <span className="pb-px">{year}</span>}
              {isOwned && visibility && (
                <StatusBadge
                  status={visibility}
                  onStatusChange={onVisibilityChange}
                />
              )}
              {/* Purchased indicator — uses the shared
                   `PurchasedBadge` so any tweak (icon, copy) lands
                   here AND in `AlbumCard` in one edit. */}
              {purchased && <PurchasedBadge />}
            </div>
          </div>

          {/* Bottom — action row: CTAs on the left, action icons on
               the right. `items-end` lines up both sides to the
               header's bottom edge. */}
          <div className="flex items-end justify-between w-full">
            <div className="flex flex-col gap-3 items-stretch w-[234px]">
              {hasBuyingOption && (
                <Button
                  variant="outline-primary"
                  size="lg"
                  onClick={onBuy}
                  className="w-full"
                >
                  Unlock All Songs – {buyingPrice}
                </Button>
              )}
              {/* Download-tier purchase — surface the file action in
                   the slot the buy CTA used to occupy. Streaming-tier
                   purchases leave this slot empty (the inline
                   Purchased badge in the meta line carries the
                   ownership signal). */}
              {downloadable && !hasBuyingOption && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onDownload}
                  className="w-full"
                >
                  <Download />
                  Download MP3
                </Button>
              )}
              {/* Pay-the-difference upgrade — stream-tier owners
                   who can upgrade to download for the price delta.
                   `outline-primary` matches the original "Unlock all
                   songs" CTA chrome so the slot reads as a
                   continuation of the original buy flow, just at the
                   cheaper upgrade price. */}
              {!downloadable && !hasBuyingOption && addDownloadPrice && (
                <Button
                  variant="outline-primary"
                  size="lg"
                  onClick={onAddDownload}
                  className="w-full"
                >
                  <Download />
                  Add download – {addDownloadPrice}
                </Button>
              )}
              <div className="flex gap-3 w-full">
                <Button
                  variant="default"
                  size="lg"
                  onClick={onPlay}
                  aria-label="Play"
                  className="flex-1 px-0"
                >
                  <PlayFilledAlt className="size-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={onShuffle}
                  aria-label="Shuffle"
                  className="flex-1 px-0"
                >
                  <Shuffle />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwned ? (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={onEdit}
                    className="px-4 pb-[10px] pt-2"
                  >
                    <Pencil />
                    Edit
                  </Button>
                  <Button variant="outline" size="icon-lg" onClick={onShare} aria-label="Share" className={ACTION_BTN_CLASS}>
                    <Share />
                  </Button>
                  <Button variant="outline" size="icon-lg" onClick={onMore} aria-label="More options" className={ACTION_BTN_CLASS}>
                    <MoreHorizontal />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="icon-lg" onClick={onAdd} aria-label="Add to library" className={ACTION_BTN_CLASS}>
                    <Plus />
                  </Button>
                  <Button variant="outline" size="icon-lg" onClick={onShare} aria-label="Share" className={ACTION_BTN_CLASS}>
                    <Share />
                  </Button>
                  <Button variant="outline" size="icon-lg" onClick={onInfo} aria-label="Info" className={ACTION_BTN_CLASS}>
                    <Info />
                  </Button>
                  <Button variant="outline" size="icon-lg" onClick={onMore} aria-label="More options" className={ACTION_BTN_CLASS}>
                    <MoreHorizontal />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
