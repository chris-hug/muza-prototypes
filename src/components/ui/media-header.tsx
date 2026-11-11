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

import { Heart, Info, MoreHorizontal, Disc3, ListMusic, Pencil, Download, ExternalLink, RefreshCw, FolderOpen, ChevronRight } from "lucide-react"
import { PurchasedBadge } from "@/components/ui/purchased-badge"
import { LocalBadge } from "@/components/ui/local-badge"
import type { DetailMoreButtonProps } from "@/components/ui/detail-more-button"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, type StatusBadgeStatus } from "@/components/ui/status-badge"
import { DetailMoreButton } from "@/components/ui/detail-more-button"
import { ShareButton } from "@/components/ui/share-button"
import { AddMusicIcon } from "@/components/ui/media-icons"
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
  /** Toggles the "Buy — $X" outline-primary CTA above the Play /
   *  Shuffle row. One buy action on the page; "check out now" vs "add to
   *  cart" is decided in the purchase dialog it opens. */
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
  /** Owner-only "Add music" — takes the third mobile action slot on your own
   *  playlist (Edit moves into the "…" sheet). */
  onAddMusic?:    () => void
  onBuy?:         () => void
  onOwnerClick?:  () => void
  /** A local album — the listener's own files (see local-library). The meta
   *  line carries the LocalBadge in place of a purchase state; the CTA slot
   *  links to muza when the files match a release there ("Also on muza"
   *  opens it to buy, "Owned on muza" when it is already yours); the heart,
   *  Share and Info drop (nothing to save, share or credit), leaving Play,
   *  Shuffle and the "…" with the local menu. */
  local?: {
    /** The format, or why the source cannot play. */
    detail:       string
    unavailable?: boolean
    match:        "none" | "also" | "owned"
    onOpenOnMuza?: () => void
    menu:         Pick<DetailMoreButtonProps, "local" | "onGoToArtist">
  }
  /** A catalog album the listener also has in their own files: a link to
   *  that local copy on its own line under the meta. The
   *  mirror of a local album's "Also on muza": from either page the other
   *  version is one tap away. Where you are is the Local badge: the local
   *  page carries it, this page does not — so the link is words, not the
   *  badge, which here would read as "this page is local". */
  localCopy?: { detail: string; onOpen: () => void }
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
  onInfo, onMore, onEdit, onAddMusic, onBuy, onOwnerClick,
  local, localCopy, className,
}: MediaHeaderProps) {
  const isOwned     = variant === "my-album" || variant === "my-playlist"
  const isPlaylist  = variant === "playlist" || variant === "my-playlist"
  // Share copy — passed to every share affordance; URL defaults to the
  // current page inside ShareButton / DetailMoreButton.
  const shareText   = owner ? `${title} — ${owner}` : title
  // The "i" button opens the release credits dialog on album surfaces
  // (playlists have no release credits — they fall back to onInfo).
  const credits     = useCredits()
  // A local album has credits only through its match: the matched
  // release's (useLocalActions). Unmatched files have none, and no button.
  const showInfo    = local
    ? local.menu.local?.onShowCredits
    : isPlaylist ? onInfo : () => credits.open(slugify(title))
  // 2×2 composite cover when 4 images are supplied (playlists);
  // otherwise the single `cover` image fills the frame.
  const hasComposite = !!covers && covers.length >= 4
  const composite = hasComposite ? covers!.slice(0, 4) : null

  // ── Shared pieces (identical across mobile/desktop layouts) ──────
  const coverInner = hasComposite ? (
    // The edge goes on the COLLAGE, not the four tiles — one sleeve, one
    // hairline, rather than a grid of them.
    <div className="grid grid-cols-2 grid-rows-2 size-full rounded-xs overflow-hidden shadow-sm art-edge">
      {composite!.map((src, i) => (
        <img key={i} src={src} alt="" draggable={false} className="size-full object-cover" />
      ))}
    </div>
  ) : (
    <img src={cover} alt="" draggable={false} className="size-full object-cover rounded-xs shadow-sm art-edge" />
  )

  const metaLine = (
    // Single line, never wraps. Priority-ordered progressive disclosure,
    // measured against the meta line's OWN width (`@container/meta`) so it
    // reacts to the real space it has in either layout — which is NOT the
    // page column: in the horizontal tier the fixed 268px cover and the
    // gaps beside it take 300px, so this line is always `container − 300`.
    // Lowest priority drops first; the owner only truncates as a last
    // resort:
    //   year / track-count·duration  → drops below 320px
    //   owner (highest)              → always shown; truncates once the
    //                                   year is gone.
    //
    // A second step used to sit between them — the type chip dropped below
    // 240px — and it could never fire: this line's narrowest real width is
    // 260 (horizontal tier at its 560 container floor: 560 − 300) and 296
    // in the stacked tier (a 320px phone). Reaching 240 would need a 264px
    // viewport, below anything the app supports.
    <div className="@container/meta flex items-center gap-3 min-w-0 text-small font-normal leading-none text-muted-foreground">
      {/* No handler, no control: a local album whose files matched nothing
          has no artist page, so its name is text, not a dead button. */}
      {owner && !onOwnerClick && (
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium truncate min-w-0">{owner}</span>
        </span>
      )}
      {owner && onOwnerClick && (
        <button
          type="button"
          onClick={onOwnerClick}
          className="relative touch-target flex items-center gap-1.5 min-w-0 hover:text-foreground transition-colors cursor-pointer"
        >
          {ownerAvatar && (
            // `min-w-6` floors the width so the circle can never be
            // squeezed into an oval when the row is tight; the name
            // (`min-w-0` + truncate) is what yields instead.
            <img src={ownerAvatar} alt="" draggable={false} className="size-6 min-w-6 rounded-full object-cover shrink-0 art-edge" />
          )}
          <span className="font-medium truncate min-w-0">{owner}</span>
        </button>
      )}
      {/* Type — always shown; see the head of this block for why its old
          240px drop step was removed. */}
      {isPlaylist ? (
        <span className="flex items-center gap-1 shrink-0"><ListMusic className="size-3.5 shrink-0" />Playlist</span>
      ) : format && (
        <span className="flex items-center gap-1 shrink-0"><Disc3 className="size-3.5 shrink-0" />{format}</span>
      )}
      {/* Lowest priority — drops first (below 320px) so the owner + type
          keep their room instead of the owner truncating away. Fires on the
          smallest phones (viewport 320–343, stacked) and in the icon-rail
          band where the container sits at 560–619 (viewport 660–719). */}
      {year && <span className="pb-px shrink-0 @max-[320px]/meta:hidden">{year}</span>}
      {isOwned && visibility && (
        <StatusBadge status={visibility} onStatusChange={onVisibilityChange} />
      )}
      {purchased && <PurchasedBadge />}
      {local && <LocalBadge detail={local.detail} unavailable={local.unavailable} className="shrink-0" />}
    </div>
  )

  // Its own line under the meta, a step smaller and muted: it is not a fact
  // about this release (as owner, year and "Owned" are) but a pointer to
  // another copy of it, so it must not read as part of that line. In the
  // meta line, in foreground ink, it was the loudest thing in it.
  // Short, and the whole line is the link: the sentence version ("You also
  // have this in your local files (MP3). Go to local copy") truncated on a
  // phone before the link, leaving a line that said nothing you could tap.
  const localCopyLine = localCopy && (
    <button
      type="button"
      onClick={localCopy.onOpen}
      className="self-start inline-flex items-center gap-1.5 min-w-0 max-w-full text-xsmall text-muted-foreground hover:text-foreground state-fade cursor-pointer outline-none focus-ring rounded-xs"
    >
      <FolderOpen className="size-3.5 shrink-0" />
      <span className="truncate link-underline">Go to local copy</span>
      <span className="shrink-0">· {localCopy.detail}</span>
      <ChevronRight className="size-3.5 shrink-0" />
    </button>
  )

  // Buy / download / upgrade CTA — same element both layouts; full
  // width in each (mobile: full row; desktop: the 234px column).
  //
  // ONE buy action on the page, labelled "Buy – $x". Batch buy (staging's
  // cart button beside the CTA) moved into the purchase dialog, where
  // "Add to cart" sits beside "Confirm and pay". Every store checked does
  // it this way — Bandcamp (one "Buy Digital Album", then Check out now /
  // Add to cart in the dialog), Subvert (only Add to cart), Mirlo and the
  // iTunes Store (only Buy) — and two buy buttons here read as two
  // products, and had nowhere to sit beside each other in the 234 column.
  // "Buy", not "Unlock All Songs": the button names the act; what
  // unlocking means is the dialog's to explain.
  // Local files: the slot is the way back to muza — a link, so `outline`, not
  // the primary buy colour. It names what muza has rather than pushing:
  // "Also on muza" when the release is there to buy or stream, "Owned on
  // muza" when you bought it. Unmatched files get no CTA at all. A source
  // that is not connected puts "Reconnect" there instead: until it is back,
  // that is the one thing worth doing on this page.
  const localReconnect = local?.unavailable ? local.menu.local?.onReconnect : undefined
  const ctaButton = local ? (
    localReconnect ? (
      <Button variant="outline" size="lg" onClick={localReconnect} className="w-full">
        <RefreshCw />Reconnect
      </Button>
    ) : local.match !== "none" && local.onOpenOnMuza ? (
      <Button variant="outline" size="lg" onClick={local.onOpenOnMuza} className="w-full">
        <ExternalLink />{local.match === "owned" ? "Owned on muza" : "Also on muza"}
      </Button>
    ) : null
  ) : hasBuyingOption ? (
    <Button variant="outline-primary" size="lg" onClick={onBuy} className="w-full">
      Buy – {buyingPrice}
    </Button>
  ) : downloadable ? (
    <Button variant="outline" size="lg" onClick={onDownload} className="w-full">
      <Download />Download files
    </Button>
  ) : addDownloadPrice ? (
    <Button variant="outline-primary" size="lg" onClick={onAddDownload} className="w-full">
      <Download />Download files – {addDownloadPrice}
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
            {localCopyLine}
          </div>

          {/* ── Mobile actions — single full-width row: Play | Shuffle
               | Add music / Edit / Save | Info. Share and the rest live in
               the top-bar "…" menu (DetailMoreButton), so they're omitted
               here. Playlists have no release credits → no Info, leaving
               just the third slot. */}
          <div className="flex flex-col gap-3 w-full @min-[560px]:hidden">
            {ctaButton}
            <div className="flex items-center gap-2 w-full">
              {playButton("flex-1")}
              {shuffleButton("flex-1")}
              {/* Your OWN playlist: filling it is the job that matters here,
                   so the third slot is "Add music". Edit lives in the "…"
                   sheet (it's already a quick-action tile there) — a pencil
                   competing with Add music would split one intent in two. */}
              {isOwned && onAddMusic ? (
                <Button variant="outline" size="icon-lg" onClick={onAddMusic} aria-label="Add music" className={ACTION_BTN_CLASS}>
                  <AddMusicIcon />
                </Button>
              ) : isOwned ? (
                <Button variant="outline" size="icon-lg" onClick={onEdit} aria-label="Edit" className={ACTION_BTN_CLASS}>
                  <Pencil />
                </Button>
              ) : local ? null : (
                heartButton()
              )}
              {!isPlaylist && showInfo && (
                <Button variant="outline" size="icon-lg" onClick={showInfo} aria-label="Info" className={ACTION_BTN_CLASS}>
                  <Info />
                </Button>
              )}
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
              {local && showInfo && (
                <Button variant="outline" size="icon-lg" onClick={showInfo} aria-label="Info" className={cn(ACTION_BTN_CLASS, "hidden @min-[780px]:inline-flex")}>
                  <Info />
                </Button>
              )}
              {!local && <div className="hidden @min-[780px]:flex items-center gap-2">
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
              </div>}
              <DetailMoreButton
                title={title}
                subtitle={owner}
                cover={cover}
                owned={isOwned}
                kind={isPlaylist ? "playlist" : "album"}
                /* Same library binding as the header heart, so the menu's
                   Save toggles the store — the heart fills and the menu flips
                   to "Remove from library" together. */
                libraryType={libraryType}
                libraryId={libraryId}
                libraryName={libraryName}
                onAdd={onAdd}
                onEdit={onEdit}
                /* Nav routes to the kind's own prop: albums → "Go to artist",
                   playlists → "Go to owner" (useDetailActions reads different
                   keys per kind). `onOwnerClick` is the artist/owner target. */
                onGoToArtist={isPlaylist ? undefined : onOwnerClick}
                onGoToOwner={isPlaylist ? onOwnerClick : undefined}
                onShowInfo={onInfo}
                onOpenLocalCopy={localCopy?.onOpen}
                {...local?.menu}
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
