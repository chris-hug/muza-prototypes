"use client"

/*
 * AlbumCard — square cover image + title + artist subtitle, with
 * hover-revealed action buttons on the cover (mouse) and long-press
 * to open the actions on touch.
 *
 * The card is a NAV surface; playing and saving are their own buttons:
 *   · Tap cover / click title          → OPEN the album detail page
 *   · Click hover Play button          → PLAY (first track, self-contained)
 *   · Click hover Heart                → SAVE to library (store-bound)
 *   · Long-press cover                 → onMore (parent renders Sheet)
 *   · Click artist text                → onArtistClick (artist page)
 *
 * Play / Save never navigate — the action cluster stops the cover's
 * useLongPress pointer gesture so a button press can't also open the page.
 * The legacy `onPlay`/`onAdd` props are no longer used for the cover Play /
 * Heart (the card handles both itself); `onAdd` still feeds the ⋯ menu.
 *
 * Figma source: file L9yw4Yaec9YtAXGxP8q4fu › Component "Record Cover"
 *   · 19272:1570 / 1543 (Album default / hover)
 *   · 19272:1556 / 1530 (My Album — Edit instead of Add)
 *
 * The dark gradient overlay is theme-agnostic (always black) so the
 * cover buttons stay readable in either light or dark mode.
 */

import { useEffect, useState } from "react"
import { Pencil, Download } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PlayFilledAlt, PauseFilledAlt } from "@/components/ui/transport-icons"
import { CoverArt } from "@/components/ui/cover-art"
import { AlbumCardMenu } from "@/components/ui/cover-card-menu"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
import { PurchasedBadge } from "@/components/ui/purchased-badge"
import { useLongPress } from "@/lib/use-long-press"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { DetailMenuSheetBody } from "@/components/ui/detail-more-button"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { libraryIdForTitle } from "@/lib/album-meta"
import { usePlayer } from "@/lib/player"
import { registerAlbums, getAlbumDetail } from "@/lib/album-catalog"

// Cover-button base — translucent muted fill + light backdrop blur,
// border-0 to avoid a ghost edge from `bg-clip-padding`. Size
// overrides per usage: 24px secondary cluster, 40px lead Play.
const COVER_BTN =
  // `--hover-fill: transparent` OPTS OUT of the growing hover circle. These
  // sit on artwork, not on a page surface: the Button variant underneath
  // carries `--hover-fill: var(--muted)`, a neutral meant for rows and menus,
  // and over a cover it grew as a grey wash that had nothing to do with the
  // image. The chip's own answer is the flat step from `bg-neutral-100/50` to
  // `bg-neutral-100` — a translucent plate getting more opaque, which is what
  // reads over a photograph.
  "border-0 bg-neutral-100/50 text-neutral-900 backdrop-blur-xs hover:bg-neutral-100 [--hover-fill:transparent]"
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
  onAddToPlaylist?: () => void
  onGoToArtist?:    () => void
  onGoToAlbum?:     () => void
  onRemove?:        () => void
  onReport?:        () => void
  onShowInfo?:      () => void
  /** Text labels — separate destinations from the cover. */
  onTitleClick?:  () => void
  onArtistClick?: () => void
  /** Context-awareness for the "…" menu — hide a nav row when the user
   *  is already there (e.g. `hideGoToArtist` on the artist page). */
  hideGoToArtist?: boolean
  hideGoToAlbum?:  boolean
  /** The album is already in the user's library — drops "Save to library"
   *  (menu + hover quick-add) and surfaces "Remove from library" instead. */
  inLibrary?: boolean
  className?: string
}

export function AlbumCard({
  cover, title, artist, year, owned, purchased, streamPrice, downloadPrice,
  onPlay, onMore, onAdd, onEdit, onAddToPlaylist,
  onGoToArtist, onGoToAlbum, onRemove, onReport, onShowInfo,
  onTitleClick, onArtistClick, hideGoToArtist, hideGoToAlbum, inLibrary,
  className,
}: AlbumCardProps) {
  const { openAlbum, openArtist } = useMediaNav()
  const player = usePlayer()
  const key = slugify(title)
  // Library key: the catalog id (matches the detail page + seed) so the card
  // heart / menu Save stay in sync with the detail; slug fallback for
  // synthesized albums not in the catalog.
  const libId = libraryIdForTitle(title) ?? key
  // Opened by a long press on the cover — see `onLongPress` below.
  const [menuOpen, setMenuOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Media-tile text: title + meta share one size (text-xsmall = 17px). The
  // meta rows (artist · year, price, "Owned") go a lighter 300 weight with a
  // hair of positive tracking to open the thin Light strokes; the title stays
  // normal weight / default tracking.
  const titleSize  = "text-xsmall"
  const metaSize   = "text-xsmall"
  const leadingCls = "leading-[18px]"
  const metaWeight = "font-light"
  const metaTracking = "tracking-[0.02em]"
  // Baked-in share target — link to this album's own detail page.
  const shareHref = `/?page=Album&album=${key}`

  // Self-register so this card always resolves to a real detail page
  // (with its own cover/artist) — even titles the catalog didn't seed.
  // Never overrides a richer/library record (registerAlbums is idempotent).
  useEffect(() => {
    registerAlbums([{ id: key, title, cover, artist, year: typeof year === "number" ? year : undefined, streamPrice, downloadPrice }])
  }, [key, title, cover, artist, year, streamPrice, downloadPrice])

  // The card is a NAV surface: tapping the cover (or title) opens the
  // detail page. Playing and saving are their OWN affordances (the Play
  // button and the heart) — they never navigate.
  const goAlbum = () => openAlbum(key)
  // Start playback from the album's first track (context = album title).
  // The card always plays itself — the legacy `onPlay` prop (which hosts
  // historically wired to navigation) is intentionally NOT used here.
  /* The cover button is a TOGGLE, not a start button.
   *
   * `player.playingFrom` carries the context a track was started from — the
   * album's own title here — so a card can tell whether the thing playing is
   * ITS thing without the player knowing anything about cards. Same test the
   * songs table and the library list already use.
   *
   * Without it every press restarted track 1: the icon said Play while the
   * album was audibly playing, and pressing it did the one thing a Play glyph
   * promises not to do on something already running. */
  const thisAlbumTitle = getAlbumDetail(key).title
  const isThisAlbum    = !!player.track && player.playingFrom === thisAlbumTitle
  const isPlaying      = isThisAlbum && player.playing

  const playAlbum = () => {
    if (isThisAlbum) { player.toggle(); return }
    const al = getAlbumDetail(key)
    const t = al.tracks[0]
    if (t) player.play({ title: t.title, artist: al.artist, album: al.title, image: al.cover, totalTime: t.duration }, al.title)
  }
  // Buttons stop propagation so clicking them doesn't also fire the
  // cover's tap-to-open (which would steal the action).
  const stop = <T,>(fn?: (e: T) => void) => (e: T) => {
    ;(e as unknown as { stopPropagation: () => void }).stopPropagation()
    fn?.(e)
  }

  // Cover-area gestures: single tap → OPEN detail, long-hold → more menu.
  const coverGestures = useLongPress({
    onClick:     goAlbum,
    // Long press opens the card's OWN menu unless the host wants its own
    // surface. Before this, `onMore` had no call site anywhere in the app, so
    // a long press did nothing — while the ⋯ that opens the same menu sits in
    // the pointer-only cluster, out of reach on touch.
    // The sheet, not the dropdown: a phone gets one menu shape for an album —
    // quick actions as tiles, then the rows — wherever it is reached from.
    onLongPress: () => (onMore ? onMore() : setSheetOpen(true)),
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
        // NOT `touch-none`: the cover is most of the card's area, and blocking
        // touch here stopped the browser panning the rail whenever a swipe
        // started on artwork — which is nearly always. The long press is
        // driven by a timer, so it survives leaving the gesture to the browser.
        className="relative aspect-square w-full overflow-hidden cursor-pointer select-none"
      >
        <CoverArt src={cover} alt={title} />

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
        {/* The cover opens the detail page on a real `click`. Stop pointer
            AND click events here so pressing a cluster button (play / heart /
            menu) never bubbles up and also triggers the open — click matters
            now that the cover listens for the browser's click rather than
            synthesising one on pointerup. */}
        <div
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          // `!hidden` on touch, not just `opacity-0`: without hover the cluster
          // never appears, but it still COVERED the bottom strip of the cover
          // and swallowed taps through the three stopPropagation handlers
          // above — a silent dead zone where a tap did nothing at all. The `!`
          // is required; Tailwind v4 sorts the pointer variant before base
          // `flex`, so without it the base wins and the gate is a no-op.
          className="absolute inset-x-0 bottom-0 p-1.5 flex items-end justify-between opacity-0 transition-opacity group-hover/album:opacity-100 group-focus-within/album:opacity-100 [@media(hover:none)]:!hidden"
        >
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
            ) : inLibrary ? null : (
              // Store-bound: toggles save/remove + animates + toasts; stops
              // propagation so it never opens the detail page.
              <LibraryHeartButton
                type="album"
                id={libId}
                name={title}
                variant="outline"
                size="icon-sm"
                className={COVER_BTN_SM}
              />
            )}
            <AlbumCardMenu
              open={menuOpen}
              onOpenChange={setMenuOpen}
              owned={owned}
              inLibrary={inLibrary}
              shareTitle={title}
              shareUrl={shareHref}
              hideGoToArtist={hideGoToArtist}
              hideGoToAlbum={hideGoToAlbum}
              onAdd={onAdd}
              onEdit={onEdit}
              onAddToPlaylist={onAddToPlaylist}
              // "Go to artist" baked from the album's own artist name, so EVERY
              // album card menu offers it (a host can still override). No "Go to
              // album" — the card IS the album, so it'd navigate to itself.
              onGoToArtist={onGoToArtist ?? (() => openArtist(slugify(artist)))}
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
            onClick={stop(playAlbum)}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseFilledAlt /> : <PlayFilledAlt />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        {/* Title — clean text row, 2-line clamp (Spotify-style) so
             longer release names wrap instead of getting truncated
             mid-word. The "Owned" pill / pricing meta both live in
             the third row below, not here. */}
        <button
          type="button"
          onClick={onTitleClick ?? goAlbum}
          className={cn(titleSize, leadingCls, "font-normal text-foreground text-left line-clamp-2 link-underline pb-[6px] -mb-[6px] outline-none cursor-pointer")}
        >
          {title}
        </button>
        {/* Artist row — artist + optional year, on one line with the
             artist text taking the underline-on-hover affordance
             (independent click target) and the year as plain meta
             after a `·` separator. */}
        <div className={cn("flex items-center gap-1.5 min-w-0 text-muted-foreground", metaSize, metaWeight, leadingCls, metaTracking)}>
          <button
            type="button"
            onClick={onArtistClick}
            className="truncate link-underline pb-[6px] -mb-[6px] outline-none cursor-pointer text-left"
          >
            {artist}
          </button>
          {year !== undefined && (
            // `data-card-year` lets dense layouts (e.g. CardRail's
            // mobile swipeable-grid variant) hide the year via CSS
            // without prop-drilling — the cards get too tight for it.
            <span data-card-year className="flex items-center gap-1.5 shrink-0">
              <span aria-hidden="true">·</span>
              <span>{year}</span>
            </span>
          )}
        </div>
        {/* Status / pricing row — only when there's something to say:
             "Owned" once purchased, or the price(s) for paid releases.
             Free albums show nothing (the price's absence IS the signal).
             Both the "Owned" label and the price TEXT are line boxes with the
             same line-height as the meta row, so the artist→status gap matches
             the title→artist gap exactly (no centred fixed-height box, which
             would sit a hair tighter against the meta line). */}
        {purchased ? (
          // Match the meta treatment (weight + tracking) AND its line box, so
          // "Owned" sits on the same rhythm as a price line; it keeps
          // `text-foreground` (slightly more present than the muted price).
          <PurchasedBadge className={cn("flex items-center", metaSize, metaWeight, metaTracking, leadingCls, "[&_svg]:size-3")} />
        ) : streamPrice ? (
          <span className={cn("flex items-center gap-1.5 text-muted-foreground tabular-nums", metaSize, metaWeight, metaTracking, leadingCls)}>
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
        ) : null}
      </div>

      {/* The long press raises the SAME sheet the detail page and the list
          rows raise. The kebab keeps the anchored dropdown, which is the right
          shape for a mouse. */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px]">
          <DetailMenuSheetBody
            kind="album"
            title={title}
            subtitle={artist}
            cover={cover}
            meta={year ? String(year) : undefined}
            owned={owned}
            libraryType="album"
            libraryId={libId}
            libraryName={title}
            onAdd={onAdd}
            onEdit={onEdit}
            onAddToPlaylist={onAddToPlaylist}
            onGoToArtist={onGoToArtist ?? (() => openArtist(slugify(artist)))}
            onGoToSelf={onGoToAlbum ?? goAlbum}
            onRemove={onRemove}
            onReport={onReport}
            onShowInfo={onShowInfo}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
