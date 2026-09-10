"use client"

/*
 * DetailMoreButton — the "…" overflow affordance for media detail pages
 * (Album / Playlist / Artist). Viewport-aware (useIsMobile, < 768):
 *   · Desktop → a dropdown MENU anchored to the button.
 *   · Mobile → an ADVANCED bottom SHEET: a rich header (cover/collage/
 *     avatar + title + type badge + meta), a row of quick-action buttons
 *     (Share / Save / Edit·Play radio), then grouped action rows (Add to a
 *     playlist · Play next · Add to queue · …).
 * Both surfaces are driven by ONE action model. Figma: 8231:455838 et al.
 *
 * NB: gate on viewport, NOT `hover:` media queries — the headless preview
 * reports `hover: hover` even at phone width, so a hover-gated sheet never
 * shows there. useIsMobile keys off width and is reliable on real devices.
 */

import {
  MoreHorizontal, Share, Link2, Plus, Heart, Pencil, Radio, Lock,
  ListPlus, ListStart, ListEnd, Mic, Building2, Info, Flag, Trash2,
  Disc3, ListMusic,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { MenuHeart } from "@/components/ui/library-heart-button"
import { Button } from "@/components/ui/button"
import { AddMusicIcon } from "@/components/ui/media-icons"
import { ContentTypeBadge, type ContentType } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
  dropdownMenuSurfaceClass, dropdownMenuItemClass,
} from "@/components/ui/dropdown-menu"
import {
  Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { useShare } from "@/lib/use-share"
import { useToast } from "@/components/ui/toast"
import { useCredits } from "@/lib/credits-context"
import { useIsMobile } from "@/lib/use-media-query"
import { slugify } from "@/lib/media-nav"
import { useUserLibrary, type LibraryItemType, type SavedSong } from "@/lib/user-library"
import { useLibraryToggle } from "@/lib/use-library-toggle"

export interface DetailMoreButtonProps {
  title:     string
  subtitle?: string
  /** Square cover (album / artist) or fallback playlist tile. */
  cover?:    string
  /** Playlist collage tiles (uses up to 4); falls back to `cover`. */
  covers?:   string[]
  /** Right of the badge — "23 tracks" (playlist) or year (album). */
  meta?:     string
  /** Owned (my-album / my-playlist) swaps Add→Edit·Add music and adds the
   *  owner-only actions (Make private, Delete). */
  owned?:    boolean
  /** Saved to library (not self-owned). Only used as a fallback when the
   *  store binding (`libraryType` + `libraryId`) is NOT supplied. */
  inLibrary?: boolean
  /** Bind the Save quick action to the global user-library store. When set,
   *  the action reads its saved state live and flips Save ⇄ Remove, staying
   *  in sync with the header / card hearts (same store + keys). */
  libraryType?: LibraryItemType
  libraryId?:   string
  libraryName?: string
  /** For `libraryType="song"` — row metadata stored on save. */
  librarySong?: SavedSong
  /** Private playlist (owner only) — flips the Make private/public row. */
  isPrivate?: boolean
  kind?:     "album" | "playlist" | "artist"
  onAdd?:           () => void
  onAddMusic?:      () => void
  onEdit?:          () => void
  onPlayRadio?:     () => void
  onAddToPlaylist?: () => void
  onPlayNext?:      () => void
  onAddToQueue?:    () => void
  onMakePrivate?:   () => void
  onGoToArtist?:    () => void
  onGoToLabel?:     () => void
  /** Playlist owner nav — "Go to owner" (playlists have an owner, not a
   *  single artist). */
  onGoToOwner?:     () => void
  /** "Go to this item" — navigate to the album / playlist detail. Only
   *  wired from a CARD or list row; on the item's own detail page it's
   *  omitted (you're already there). Artists have no self-nav — you click
   *  the artist itself. */
  onGoToSelf?:      () => void
  onArtistInfo?:    () => void
  onRemove?:        () => void
  onReport?:        () => void
  onShowInfo?:      () => void
  className?: string
  triggerVariant?: "ghost" | "outline"
  triggerSize?:    "icon-sm" | "icon" | "icon-lg"
  triggerIcon?:    React.ReactNode
}

interface Action {
  icon:        React.ReactNode
  label:       string
  /** Shorter label for the compact quick-action TILES (mobile sheet) where
   *  the full `label` would wrap — e.g. "Save" instead of "Save to library".
   *  Menu rows + the desktop dropdown always use the full `label`. */
  shortLabel?: string
  onClick?:    () => void
  destructive?: boolean
  /** Keep the sheet open after tapping (e.g. Save, which toggles in place
   *  so the user sees it flip to "Remove from library"). */
  keepOpen?:   boolean
}

// ─── Sheet pieces ─────────────────────────────────────────────────────────────

// Rich list row (icon + label, 44px+ tap target). Closes the sheet on tap
// unless `keepOpen` (Save toggles in place).
// `dismiss` — wrap in SheetClose. Off when the body renders OUTSIDE a Sheet
// (the design system's open, inline surface), where SheetClose has no root.
function SheetRow({ icon, label, destructive, onClick, keepOpen, dismiss = true }: Action & { dismiss?: boolean }) {
  const cls = cn(
    "press-ripple relative [--press-fill:var(--press-on-muted)]",
    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base text-left transition-colors",
    "hover:bg-muted outline-none focus-visible:bg-muted",
    "[&_svg]:size-5 [&_svg]:shrink-0",
    destructive
      ? "text-destructive [&_svg]:text-destructive"
      : "text-foreground [&_svg]:text-muted-foreground",
  )
  if (keepOpen || !dismiss) {
    return <button type="button" onClick={onClick} className={cls}>{icon}{label}</button>
  }
  return (
    <SheetClose render={<button type="button" onClick={onClick} className={cls} />}>
      {icon}
      {label}
    </SheetClose>
  )
}

// Prominent quick-action button (icon over label, soft pill). Closes on tap
// unless `keepOpen` (Save toggles in place).
function QuickAction({ icon, label, shortLabel, onClick, keepOpen, dismiss = true }: Action & { dismiss?: boolean }) {
  const cls = cn(
    "press-ripple relative [--press-fill:var(--press-on-secondary)]",
    "flex-1 min-w-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-secondary px-2 py-3.5",
    "text-foreground transition-colors hover:bg-secondary-hover",
    "outline-none focus-ring [&_svg]:size-5",
  )
  const inner = <>{icon}<span className="text-xsmall">{shortLabel ?? label}</span></>
  if (keepOpen || !dismiss) {
    return <button type="button" onClick={onClick} className={cls}>{inner}</button>
  }
  return (
    <SheetClose render={<button type="button" onClick={onClick} className={cls} />}>
      {inner}
    </SheetClose>
  )
}

// Header cover — square (album/track), 2×2 collage (playlist), circle (artist).
function MenuCover({ kind, cover, covers, title }: {
  kind: "album" | "playlist" | "artist"; cover?: string; covers?: string[]; title: string
}) {
  // 72px ≈ the height of the three header text lines (title + subtitle + badge).
  if (kind === "artist") {
    return <img src={cover} alt="" draggable={false} className="size-18 shrink-0 rounded-full object-cover bg-secondary art-edge" />
  }
  if (kind === "playlist" && covers && covers.length >= 4) {
    return (
      <div className="size-18 shrink-0 grid grid-cols-2 grid-rows-2 overflow-hidden rounded-xs art-edge">
        {covers.slice(0, 4).map((src, i) => (
          <img key={i} src={src} alt="" draggable={false} className="size-full object-cover" />
        ))}
      </div>
    )
  }
  return <img src={cover ?? covers?.[0]} alt={title} draggable={false} className="size-18 shrink-0 rounded-xs object-cover bg-secondary art-edge" />
}

// ─── DetailMoreButton ─────────────────────────────────────────────────────────

// ─── Shared action builder ────────────────────────────────────────────────────
//
// The single source of truth for the menu's items — consumed by BOTH
// `DetailMoreButton` (trigger + dropdown / sheet) and `DetailMenuItems`
// (items-only, dropped into another menu's content: card kebab, list-row
// kebab, search row). Building the actions in one place is what makes "the card
// menu" and "the detail menu" the SAME menu, just triggered from elsewhere.
//
// Navigation is context-aware: "Go to <this item>" (`onGoToSelf`) shows only
// where wired (a card / row, not the item's own page); "Go to artist / label /
// owner" show only when their handler is passed. Play next / Add to queue show
// only where playback handlers are wired.
function useDetailActions({
  title, subtitle, owned, inLibrary, isPrivate, kind = "album",
  libraryType, libraryId, libraryName, librarySong,
  onAdd, onAddMusic, onEdit, onPlayRadio, onAddToPlaylist, onPlayNext, onAddToQueue,
  onMakePrivate, onGoToArtist, onGoToLabel, onGoToOwner, onGoToSelf, onArtistInfo,
  onRemove, onReport,
}: DetailMoreButtonProps): { quick: Action[]; groups: Action[][]; flat: Action[]; badgeType: ContentType } {
  const { canNativeShare, copyLink, nativeShare } = useShare({
    title, text: subtitle ? `${title} — ${subtitle}` : title,
  })
  const credits = useCredits()
  // Report — baked default (toast) so every non-owned album / playlist offers
  // it without the caller wiring a handler, exactly like the song menu.
  const { add: toast } = useToast()
  const reportHandler = onReport ?? (() => toast({
    title: "Reported",
    description: `Thanks — we'll take a look at “${title}”.`,
  }))

  // Save-to-library state. Store-bound (libraryType + libraryId) reads live and
  // toggles there — in sync with the header / card hearts. Otherwise falls back
  // to the passed `inLibrary` + `onAdd` / `onRemove`.
  const library = useUserLibrary()
  const toggleLibrary = useLibraryToggle()
  // A playlist you OWN is in your library by definition — never offer to save
  // (or un-save) it; owners get Edit / Delete instead.
  const ownPlaylist = kind === "playlist" && owned
  const storeBound = !!(libraryType && libraryId) && !ownPlaylist
  const saved = storeBound ? library.inLibrary(libraryType, libraryId) : !!inLibrary
  const onSave = storeBound
    ? () => toggleLibrary(libraryType, libraryId, libraryName ?? title, librarySong)
    : (saved ? onRemove : onAdd)

  const isAlbum    = kind === "album"
  const isPlaylist = kind === "playlist"
  const isArtist   = kind === "artist"

  // ── Quick actions (sheet tiles; lead the dropdown) ──────────────────────
  // One adaptive share row: native sheet where available, else copy link.
  // Label + icon reflect the actual action — identical to ShareMenuItems /
  // the song menu.
  const share: Action = canNativeShare
    ? { icon: <Share />, label: "Share…",    onClick: nativeShare }
    : { icon: <Link2 />, label: "Copy link", onClick: copyLink }
  const save: Action = {
    icon: <MenuHeart filled={saved} />,
    label: saved ? "Remove from library" : "Save to library",
    shortLabel: saved ? "Remove" : "Save",
    onClick: onSave,
    keepOpen: true,
  }
  // Credits — promoted to a top quick action for every album / single / EP
  // (in place of Play radio). Owned albums keep Edit as the third tile, so
  // Credits lives in the list below for them.
  const showCredits: Action = { icon: <Info />, label: "Credits", onClick: () => credits.open(slugify(title)) }
  const quick: Action[] = isPlaylist
    ? (owned
        // Same glyph as the header's Add-music button — one action, one mark.
        ? [share, { icon: <AddMusicIcon />, label: "Add music", onClick: onAddMusic }, { icon: <Pencil />, label: "Edit info", onClick: onEdit }]
        : [share, save])
    : isAlbum
      ? [share, save,
         owned ? { icon: <Pencil />, label: "Edit", onClick: onEdit } : showCredits]
      : [share, save, { icon: <Radio />, label: "Play radio", onClick: onPlayRadio }]

  // ── Manage + queue ──────────────────────────────────────────────────────
  const g1: Action[] = []
  if (isPlaylist && owned) g1.push({ icon: <Lock />, label: isPrivate ? "Make public" : "Make private", onClick: onMakePrivate })
  // Albums only — you add an album's tracks TO a playlist. A playlist can't be
  // added to a playlist, and an artist isn't addable at all.
  if (isAlbum)             g1.push({ icon: <AddMusicIcon />, label: "Add to a playlist", onClick: onAddToPlaylist })
  if (onPlayNext)          g1.push({ icon: <ListStart />, label: "Play next",    onClick: onPlayNext })
  if (onAddToQueue)        g1.push({ icon: <ListEnd />,   label: "Add to queue", onClick: onAddToQueue })

  // ── Navigation (context-aware) ──────────────────────────────────────────
  const g2: Action[] = []
  if (onGoToSelf && isAlbum)    g2.push({ icon: <Disc3 />,     label: "Go to album",    onClick: onGoToSelf })
  if (onGoToSelf && isPlaylist) g2.push({ icon: <ListMusic />, label: "Go to playlist", onClick: onGoToSelf })
  if (isAlbum) {
    if (owned) g2.push(showCredits)            // credits in-list for owned (tile is Edit)
    if (onGoToArtist) g2.push({ icon: <Mic />,       label: "Go to artist", onClick: onGoToArtist })
    if (onGoToLabel)  g2.push({ icon: <Building2 />, label: "Go to label",  onClick: onGoToLabel })
  }
  if (isPlaylist && onGoToOwner) g2.push({ icon: <Mic />, label: "Go to owner", onClick: onGoToOwner })
  if (isArtist)                  g2.push({ icon: <Info />, label: "Artist info", onClick: onArtistInfo })

  // ── Destructive / report ────────────────────────────────────────────────
  const g3: Action[] = []
  if (isPlaylist && owned) g3.push({ icon: <Trash2 />, label: "Delete playlist", onClick: onRemove, destructive: true })
  else if (!owned)         g3.push({ icon: <Flag />,   label: "Report",          onClick: reportHandler })

  // Drop any action whose handler isn't wired in this context, so no menu ever
  // shows a dead row (e.g. a card that doesn't provide Play next / queue, or a
  // playlist with no "Add to a playlist"). This is what makes the shared menu
  // adapt per surface without per-call-site conditionals.
  const live = (arr: Action[]) => arr.filter(a => a.onClick)
  const quickLive = live(quick)
  const groups = [g1, g2, g3].map(live).filter(g => g.length > 0)
  const flat = [...quickLive, ...groups.flat()]   // dropdown / list-items order
  const badgeType = (isArtist ? "artist" : isAlbum ? "album" : "playlist") as ContentType
  return { quick: quickLive, groups, flat, badgeType }
}

// ─── DetailMenuItems ──────────────────────────────────────────────────────────
//
// Items-only: the shared action set rendered as <DropdownMenuItem>s, for use as
// another menu's `menuItems` (card kebab, list-row kebab, search row). Identical
// items + behavior to DetailMoreButton — only the trigger differs.
export function DetailMenuItems(props: DetailMoreButtonProps) {
  const { flat } = useDetailActions(props)
  return (
    <>
      {flat.map((a, i) => (
        <DropdownMenuItem key={`${a.label}-${i}`} onClick={a.onClick} variant={a.destructive ? "destructive" : "default"}>
          {a.icon}
          {a.label}
        </DropdownMenuItem>
      ))}
    </>
  )
}

// ─── The sheet's body, on its own ─────────────────────────────────────────────
//
// Header · quick actions · grouped rows — everything inside the phone sheet.
// `DetailMoreButton` renders it inside a `Sheet`; `DetailMenuSurface` renders
// it `standalone` (no SheetClose, plain buttons, no Dialog title) so the
// design system can show the sheet OPEN and inline instead of behind a trigger.
export function DetailMenuSheetBody({ standalone = false, ...props }: DetailMoreButtonProps & { standalone?: boolean }) {
  const { title, subtitle, cover, covers, meta, kind = "album" } = props
  const { quick, groups, badgeType } = useDetailActions(props)
  return (
    <>
      {/* Header — entity identity. No divider; breathing room below. */}
      <div className="flex flex-row items-center gap-3 px-3 pt-3 pb-6">
        <MenuCover kind={kind} cover={cover} covers={covers} title={title} />
        <div className="min-w-0 text-left flex flex-col gap-1">
          {standalone
            ? <p className="truncate text-base font-medium leading-tight text-foreground">{title}</p>
            : <SheetTitle className="truncate text-base leading-tight">{title}</SheetTitle>}
          {subtitle && <p className="truncate text-small text-muted-foreground leading-none">{subtitle}</p>}
          <div className="flex items-center gap-2 min-w-0">
            <ContentTypeBadge type={badgeType} />
            {meta && <span className="text-xsmall text-muted-foreground truncate">{meta}</span>}
          </div>
        </div>
      </div>

      {/* Quick actions. */}
      <div className="flex items-stretch gap-2 px-1 pb-2">
        {quick.map((a, i) => <QuickAction key={`${a.label}-${i}`} {...a} dismiss={!standalone} />)}
      </div>

      {/* Grouped list, dividers between groups. */}
      <div className="flex flex-col px-1 pb-2">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col">
            {gi > 0 && <div className="mx-2 my-1 h-px bg-border" />}
            {group.map((a, i) => <SheetRow key={`${a.label}-${i}`} {...a} dismiss={!standalone} />)}
          </div>
        ))}
      </div>
    </>
  )
}

// ─── The surface, open and inline ─────────────────────────────────────────────
//
// What the menu LOOKS like, without a trigger: the dropdown at desktop
// widths, the bottom sheet at phone widths — chosen by `useIsMobile()`, which
// inside the design system's frame reads the window chip. The same action
// model (`useDetailActions`) and, for the dropdown, the same class strings as
// the live `DropdownMenuContent` / `DropdownMenuItem`. Actions run for real
// (Save flips the store); nothing closes, because nothing is open.
export function DetailMenuSurface(props: DetailMoreButtonProps & { className?: string }) {
  const isMobile = useIsMobile()
  const { flat } = useDetailActions(props)
  if (!isMobile) {
    return (
      <div role="menu" className={cn(dropdownMenuSurfaceClass, "min-w-52 animate-none", props.className)}>
        {flat.map((a, i) => (
          <button
            key={`${a.label}-${i}`}
            type="button"
            role="menuitem"
            onClick={a.onClick}
            data-variant={a.destructive ? "destructive" : "default"}
            className={cn(dropdownMenuItemClass, "state-fade w-full text-left cursor-pointer hover:bg-accent hover:text-accent-foreground")}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    )
  }
  return (
    // Same edges as the live sheet (`side="bottom"`: `border-t`, top corners
    // rounded, no side borders — it spans the window). Width comes from the
    // container: the frame's window at a phone chip, or whatever box it sits in.
    <div className={cn("w-full rounded-t-2xl border-t border-border bg-popover shadow-xl overflow-hidden px-2 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]", props.className)}>
      {/* The sheet's drag handle, for the eye — there is nothing to drag. */}
      <div aria-hidden className="mx-auto mb-2 h-1 w-9 shrink-0 rounded-full bg-border" />
      <DetailMenuSheetBody {...props} standalone />
    </div>
  )
}

// ─── DetailMoreButton ─────────────────────────────────────────────────────────

export function DetailMoreButton(props: DetailMoreButtonProps) {
  const { title, subtitle, cover, covers, meta, kind = "album",
          className, triggerVariant = "ghost", triggerSize = "icon-sm", triggerIcon } = props
  const isArtist = kind === "artist"
  const icon = triggerIcon ?? <MoreHorizontal />
  const isMobile = useIsMobile()
  const { quick, groups, flat, badgeType } = useDetailActions(props)

  // Desktop → anchored dropdown; mobile (< 768) → the advanced bottom sheet.
  if (!isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant={triggerVariant} size={triggerSize} aria-label="More options" />}
          className={className}
        >
          {icon}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="min-w-52">
          {flat.map((a, i) => (
            <DropdownMenuItem key={`${a.label}-${i}`} onClick={a.onClick} variant={a.destructive ? "destructive" : "default"}>
              {a.icon}
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant={triggerVariant} size={triggerSize} aria-label="More options" />}
        className={className}
      >
        {icon}
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <DetailMenuSheetBody {...props} />
      </SheetContent>
    </Sheet>
  )
}
