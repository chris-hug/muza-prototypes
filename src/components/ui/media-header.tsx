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
 *                                        [Edit] [↗] [ⓘ] [⋯] ← my-album
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

import { Heart, Info, MoreHorizontal, Disc3, ListMusic, Pencil, Download } from "lucide-react"
import { PurchasedBadge } from "@/components/ui/purchased-badge"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, type StatusBadgeStatus } from "@/components/ui/status-badge"
import { DetailMoreButton } from "@/components/ui/detail-more-button"
import { ShareButton } from "@/components/ui/share-button"
import { MarqueeText } from "@/components/ui/marquee-text"
import { useCredits } from "@/lib/credits-context"
import { slugify } from "@/lib/media-nav"
import { PlayFilledAlt, PauseFilledAlt } from "@/components/ui/transport-icons"
import { ShuffleToggle } from "@/components/ui/transport-toggles"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
import type { LibraryItemType } from "@/lib/user-library"

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
  /** Global shuffle mode — when true the Shuffle button shows the active
   *  (primary-filled) state. Synced with the player's shuffle control. */
  shuffleActive?: boolean
  /** This album / playlist is the one currently playing — flips the Play
   *  button to a Pause icon (+ aria-label) so the header reflects state. */
  playing?:       boolean
  onAdd?:         () => void
  /** When set, the "Save to library" heart becomes the live, store-backed
   *  animated LibraryHeartButton (filled when saved, toast on toggle).
   *  Falls back to the plain `onAdd` button when omitted. */
  libraryType?:   LibraryItemType
  libraryId?:     string
  libraryName?:   string
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
  onPlay, onShuffle, shuffleActive = false, playing = false, onAdd,
  libraryType, libraryId, libraryName,
  onInfo, onMore, onEdit, onBuy, onOwnerClick,
  className,
}: MediaHeaderProps) {
  const isOwned     = variant === "my-album" || variant === "my-playlist"
  const isPlaylist  = variant === "playlist" || variant === "my-playlist"
  // Share copy — passed to every share affordance; URL defaults to the
  // current page inside ShareButton / DetailMoreButton.
  const shareText   = owner ? `${title} — ${owner}` : title
  // The "i" button opens the release credits dialog on album surfaces
  // (playlists have no release credits — they fall back to onInfo).
  const credits     = useCredits()
  const showInfo    = isPlaylist ? onInfo : () => credits.open(slugify(title))
  // 2×2 composite cover when 4 images are supplied (playlists);
  // otherwise the single `cover` image fills the frame.
  const hasComposite = !!covers && covers.length >= 4
  const composite = hasComposite ? covers!.slice(0, 4) : null

  // ── Shared pieces (identical across mobile/desktop layouts) ──────
  const coverInner = hasComposite ? (
    <div className="grid grid-cols-2 grid-rows-2 size-full rounded-xs overflow-hidden shadow-sm">
      {composite!.map((src, i) => (
        <img key={i} src={src} alt="" draggable={false} className="size-full object-cover" />
      ))}
    </div>
  ) : (
    <img src={cover} alt="" draggable={false} className="size-full object-cover rounded-xs shadow-sm" />
  )

  const metaLine = (
    // Single line, never wraps. Priority-ordered progressive disclosure,
    // measured against the meta line's OWN width (`@container/meta`) so it
    // reacts to the real space it has in either layout. Lowest priority
    // drops first; the owner only truncates as a last resort:
    //   year / track-count·duration  → drops below ~320px
    //   type (Playlist / Album)      → drops below ~240px
    //   owner (highest)              → always shown; truncates only once
    //                                   both of the above are gone.
    <div className="@container/meta flex items-center gap-3 min-w-0 text-small font-normal leading-none text-muted-foreground">
      {owner && (
        <button
          type="button"
          onClick={onOwnerClick}
          className="flex items-center gap-1.5 min-w-0 hover:text-foreground transition-colors cursor-pointer"
        >
          {ownerAvatar && (
            // `min-w-6` floors the width so the circle can never be
            // squeezed into an oval when the row is tight; the name
            // (`min-w-0` + truncate) is what yields instead.
            <img src={ownerAvatar} alt="" draggable={false} className="size-6 min-w-6 rounded-full object-cover shrink-0" />
          )}
          <span className="font-medium truncate min-w-0">{owner}</span>
        </button>
      )}
      {/* Type — second to drop (below ~240px), so the owner keeps its
          room rather than truncating while the type still shows. */}
      {isPlaylist ? (
        <span className="flex items-center gap-1 shrink-0 @max-[239px]/meta:hidden"><ListMusic className="size-3.5 shrink-0" />Playlist</span>
      ) : format && (
        <span className="flex items-center gap-1 shrink-0 @max-[239px]/meta:hidden"><Disc3 className="size-3.5 shrink-0" />{format}</span>
      )}
      {/* Lowest priority — drops first (below ~320px) so the owner + type
          keep their room instead of the owner truncating away. */}
      {year && <span className="pb-px shrink-0 @max-[319px]/meta:hidden">{year}</span>}
      {isOwned && visibility && (
        <StatusBadge status={visibility} onStatusChange={onVisibilityChange} />
      )}
      {purchased && <PurchasedBadge />}
    </div>
  )

  // Buy / download / upgrade CTA — same element both layouts; full
  // width in each (mobile: full row; desktop: the 234px column).
  const ctaButton = hasBuyingOption ? (
    <Button variant="outline-primary" size="lg" onClick={onBuy} className="w-full">
      Unlock All Songs – {buyingPrice}
    </Button>
  ) : downloadable ? (
    <Button variant="outline" size="lg" onClick={onDownload} className="w-full">
      <Download />Download MP3
    </Button>
  ) : addDownloadPrice ? (
    <Button variant="outline-primary" size="lg" onClick={onAddDownload} className="w-full">
      <Download />Add download – {addDownloadPrice}
    </Button>
  ) : null

  // `min-w-12` floors the width at the 48px height so a flex-1 Play /
  // Shuffle never squeezes narrower than a circle on tight rows.
  const playButton = (cls?: string) => (
    <Button
      variant="default"
      size="lg"
      onClick={onPlay}
      aria-label={playing ? "Pause" : "Play"}
      aria-pressed={playing}
      className={cn("px-0 min-w-12", cls)}
    >
      {playing
        ? <PauseFilledAlt className="size-4" />
        : <PlayFilledAlt className="size-4" />}
    </Button>
  )
  // Shuffle uses the shared ShuffleToggle so its active state + pop/halo
  // micro-animation match the player bars exactly; `secondary` keeps the
  // inactive look consistent with this Play/Shuffle CTA row.
  const shuffleButton = (cls?: string) => (
    <ShuffleToggle
      active={shuffleActive}
      onToggle={() => onShuffle?.()}
      variant="secondary"
      iconSize={16}
      className={cn("min-w-12 h-12", cls)}
    />
  )
  // "Save to library" heart. When a library id is supplied it's the live,
  // store-backed animated control; otherwise it falls back to a plain
  // button wired to `onAdd` (keeps owned / studio surfaces working).
  const heartButton = (cls?: string) =>
    libraryId ? (
      <LibraryHeartButton
        type={libraryType ?? "album"}
        id={libraryId}
        name={libraryName}
        variant="outline"
        size="icon-lg"
        className={cn(ACTION_BTN_CLASS, cls)}
      />
    ) : (
      <Button variant="outline" size="icon-lg" onClick={onAdd} aria-label="Save to library" className={cn(ACTION_BTN_CLASS, cls)}>
        <Heart />
      </Button>
    )

  return (
    <header className={cn("@container relative w-full", className)}>
      {/* Layout flips at 560 (container): stacked (cover on top) below,
           horizontal (cover left, content right, actions pinned to cover's
           bottom via justify-between + the 300px height) at and above. */}
      <div className="flex flex-col gap-4 @min-[560px]:flex-row @min-[560px]:items-stretch @min-[560px]:h-[300px] @min-[560px]:py-4">
        {/* Cover — on mobile it's centered and inset (≈76% width) so the
             overlaid detail-header back / "…" buttons sit in the side
             gutters BESIDE its top, not above or on it (Figma 5953:188471).
             Desktop keeps the fixed 268 square, left-aligned. */}
        <div className="aspect-square w-[calc(100%-72px)] max-w-[320px] mx-auto @min-[560px]:w-[268px] @min-[560px]:max-w-none @min-[560px]:mx-0 @min-[560px]:size-[268px] @min-[560px]:aspect-auto shrink-0">
          {coverInner}
        </div>

        {/* Content column — title + meta on top, actions below.
             Desktop: stretch to the cover height and justify-between so
             actions pin to the bottom; pl-4 to clear the cover. */}
        <div className="flex flex-1 flex-col min-w-0 gap-4 @min-[560px]:self-stretch @min-[560px]:justify-between @min-[560px]:gap-0 @min-[560px]:pl-4 isolate">
          {/* Title + meta */}
          <div className="flex flex-col gap-3 w-full">
            {/* Single line — when the title is too long to fit, it
                 slowly scrolls back and forth so the full name stays
                 readable (see MarqueeText). leading + py give descenders
                 room inside the marquee's overflow-clip. */}
            <MarqueeText
              as="h1"
              title={title}
              className="text-large @min-[560px]:text-2xlarge font-semibold leading-[1.2] text-foreground"
            >
              {title}
            </MarqueeText>
            {metaLine}
          </div>

          {/* ── Mobile actions — single full-width row: Play | Shuffle
               | Add/Edit | Share. Info + More live in the page top bar
               on mobile, so they're omitted here. */}
          <div className="flex flex-col gap-3 w-full @min-[560px]:hidden">
            {ctaButton}
            <div className="flex items-center gap-2 w-full">
              {playButton("flex-1")}
              {shuffleButton("flex-1")}
              {isOwned ? (
                <Button variant="outline" size="icon-lg" onClick={onEdit} aria-label="Edit" className={ACTION_BTN_CLASS}>
                  <Pencil />
                </Button>
              ) : (
                heartButton()
              )}
              <ShareButton variant="outline" size="icon-lg" title={title} text={shareText} className={ACTION_BTN_CLASS} />
            </div>
          </div>

          {/* ── Horizontal actions — CTA + Play/Shuffle on the left.
               The "…" (More) button is pinned to the right and STAYS in
               every horizontal tier — it opens the bottom sheet with the
               full action set. Intermediate (560–779): only "…" on the
               right, and Play/Shuffle can shrink toward square (min-w-12)
               as the column tightens. Full (≥780): Add/Edit + Share +
               Info reappear to the left of the persistent "…". The 780
               floor = left column (234) + gap (12) + cluster (216) fit
               inside container − 300 (cover+gaps), plus a small buffer.
               Keep in sync with SIDEBAR_FULL_HEADER in use-media-query. */}
          <div className="hidden @min-[560px]:flex items-end justify-between gap-3 w-full">
            <div className="flex flex-col gap-3 items-stretch min-w-0 w-[234px]">
              {ctaButton}
              <div className="flex gap-3 w-full">
                {playButton("flex-1")}
                {shuffleButton("flex-1")}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden @min-[780px]:flex items-center gap-2">
                {isOwned ? (
                  <Button variant="outline" size="lg" onClick={onEdit} className="px-4 pb-[10px] pt-2">
                    <Pencil />Edit
                  </Button>
                ) : (
                  heartButton()
                )}
                <ShareButton variant="outline" size="icon-lg" title={title} text={shareText} className={ACTION_BTN_CLASS} />
                {/* Credits ("i") — albums only; playlists have no release
                     credits, so the button is omitted there. */}
                {!isPlaylist && (
                  <Button variant="outline" size="icon-lg" onClick={showInfo} aria-label="Info" className={ACTION_BTN_CLASS}>
                    <Info />
                  </Button>
                )}
              </div>
              <DetailMoreButton
                title={title}
                subtitle={owner}
                cover={cover}
                owned={isOwned}
                kind={isPlaylist ? "playlist" : "album"}
                onAdd={onAdd}
                onEdit={onEdit}
                onGoToArtist={onOwnerClick}
                onShowInfo={onInfo}
                triggerVariant="outline"
                triggerSize="icon-lg"
                triggerIcon={<MoreHorizontal />}
                className={ACTION_BTN_CLASS}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
