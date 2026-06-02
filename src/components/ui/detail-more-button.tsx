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
  MoreHorizontal, Share, Plus, Heart, Pencil, Radio, Lock,
  ListPlus, ListStart, ListEnd, Mic, Building2, Info, Flag, Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ContentTypeBadge, type ContentType } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { useShare } from "@/lib/use-share"
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
  onClick?:    () => void
  destructive?: boolean
}

// ─── Sheet pieces ─────────────────────────────────────────────────────────────

// Rich list row (icon + label, 44px+ tap target). Closes the sheet on tap.
function SheetRow({ icon, label, destructive, onClick }: Action) {
  return (
    <SheetClose
      render={
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base text-left transition-colors",
            "hover:bg-muted active:bg-muted outline-none focus-visible:bg-muted",
            "[&_svg]:size-5 [&_svg]:shrink-0",
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

// Prominent quick-action button (icon over label, soft pill). Closes on tap.
function QuickAction({ icon, label, onClick }: Action) {
  return (
    <SheetClose
      render={
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "flex-1 min-w-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-secondary px-2 py-3.5",
            "text-foreground transition-colors hover:bg-secondary-hover active:bg-secondary-hover",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-5",
          )}
        />
      }
    >
      {icon}
      <span className="text-xsmall">{label}</span>
    </SheetClose>
  )
}

// Header cover — square (album/track), 2×2 collage (playlist), circle (artist).
function MenuCover({ kind, cover, covers, title }: {
  kind: "album" | "playlist" | "artist"; cover?: string; covers?: string[]; title: string
}) {
  // 72px ≈ the height of the three header text lines (title + subtitle + badge).
  if (kind === "artist") {
    return <img src={cover} alt="" draggable={false} className="size-18 shrink-0 rounded-full object-cover bg-secondary" />
  }
  if (kind === "playlist" && covers && covers.length >= 4) {
    return (
      <div className="size-18 shrink-0 grid grid-cols-2 grid-rows-2 overflow-hidden rounded-xs">
        {covers.slice(0, 4).map((src, i) => (
          <img key={i} src={src} alt="" draggable={false} className="size-full object-cover" />
        ))}
      </div>
    )
  }
  return <img src={cover ?? covers?.[0]} alt={title} draggable={false} className="size-18 shrink-0 rounded-xs object-cover bg-secondary" />
}

// ─── DetailMoreButton ─────────────────────────────────────────────────────────

export function DetailMoreButton({
  title, subtitle, cover, covers, meta, owned, inLibrary, isPrivate, kind = "album",
  libraryType, libraryId, libraryName, librarySong,
  onAdd, onAddMusic, onEdit, onPlayRadio, onAddToPlaylist, onPlayNext, onAddToQueue,
  onMakePrivate, onGoToArtist, onGoToLabel, onArtistInfo, onRemove, onReport,
  className, triggerVariant = "ghost", triggerSize = "icon-sm", triggerIcon,
}: DetailMoreButtonProps) {
  const icon = triggerIcon ?? <MoreHorizontal />
  const isMobile = useIsMobile()
  const { canNativeShare, copyLink, nativeShare } = useShare({
    title, text: subtitle ? `${title} — ${subtitle}` : title,
  })
  const credits = useCredits()

  // Save-to-library state. When bound to the store (libraryType + libraryId)
  // it reads live and toggles there — so the Save action flips to Remove the
  // moment the item is saved, in sync with the header / card hearts. Falls
  // back to the passed `inLibrary` + `onAdd`/`onRemove` otherwise.
  const library = useUserLibrary()
  const toggleLibrary = useLibraryToggle()
  const storeBound = !!(libraryType && libraryId)
  const saved = storeBound ? library.inLibrary(libraryType, libraryId) : !!inLibrary
  const onSave = storeBound
    ? () => toggleLibrary(libraryType, libraryId, libraryName ?? title, librarySong)
    : (saved ? onRemove : onAdd)

  const isAlbum    = kind === "album"
  const isPlaylist = kind === "playlist"
  const isArtist   = kind === "artist"

  // ── Quick actions (prominent button row) ──────────────────────────────
  const share: Action = { icon: <Share />, label: "Share", onClick: canNativeShare ? nativeShare : copyLink }
  // "Save" (♥ → library) is distinct from "Add music" (＋ tracks to an
  // owned playlist) — only the former carries the heart. Once saved it
  // flips to a filled-heart "Remove".
  const save: Action = {
    icon: <Heart className={saved ? "fill-current" : undefined} />,
    label: saved ? "Remove" : "Save",
    onClick: onSave,
  }
  const quick: Action[] = isPlaylist
    ? (owned
        ? [share, { icon: <Plus />, label: "Add music", onClick: onAddMusic }, { icon: <Pencil />, label: "Edit info", onClick: onEdit }]
        : [share, save])
    : isAlbum
      ? [share, save,
         owned ? { icon: <Pencil />, label: "Edit", onClick: onEdit } : { icon: <Radio />, label: "Play radio", onClick: onPlayRadio }]
      : [share, save, { icon: <Radio />, label: "Play radio", onClick: onPlayRadio }]

  // ── List groups (separated by dividers) ───────────────────────────────
  const g1: Action[] = []
  if (isPlaylist && owned) g1.push({ icon: <Lock />, label: isPrivate ? "Make public" : "Make private", onClick: onMakePrivate })
  if (!isArtist)           g1.push({ icon: <ListPlus />, label: "Add to a playlist", onClick: onAddToPlaylist })
  g1.push({ icon: <ListStart />, label: "Play next",    onClick: onPlayNext })
  g1.push({ icon: <ListEnd />,   label: "Add to queue", onClick: onAddToQueue })

  const g2: Action[] = []
  if (isAlbum) {
    g2.push({ icon: <Info />,      label: "Credits",     onClick: () => credits.open(slugify(title)) })
    g2.push({ icon: <Mic />,       label: "Go to artist", onClick: onGoToArtist })
    g2.push({ icon: <Building2 />, label: "Go to label",  onClick: onGoToLabel })
  }
  if (isArtist) g2.push({ icon: <Info />, label: "Artist info", onClick: onArtistInfo })

  const g3: Action[] = []
  if (isPlaylist && owned)        g3.push({ icon: <Trash2 />, label: "Delete playlist", onClick: onRemove, destructive: true })
  else if (!owned && onReport)    g3.push({ icon: <Flag />,   label: "Report",          onClick: onReport })

  const groups = [g1, g2, g3].filter(g => g.length > 0)
  const flat = [...quick, ...groups.flat()]   // desktop dropdown order

  const badgeType = (isAlbum ? "album" : "playlist") as ContentType

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
          {/* Header — entity identity. No divider; breathing room below. */}
          <SheetHeader className="flex-row items-center gap-3 border-b-0 pb-6">
            <MenuCover kind={kind} cover={cover} covers={covers} title={title} />
            <div className="min-w-0 text-left flex flex-col gap-1">
              <SheetTitle className="truncate text-base leading-tight">{title}</SheetTitle>
              {subtitle && <p className="truncate text-small text-muted-foreground leading-none">{subtitle}</p>}
              {(!isArtist || meta) && (
                <div className="flex items-center gap-2 min-w-0">
                  {!isArtist && <ContentTypeBadge type={badgeType} />}
                  {meta && <span className="text-xsmall text-muted-foreground truncate">{meta}</span>}
                </div>
              )}
            </div>
          </SheetHeader>

          {/* Quick actions. */}
          <div className="flex items-stretch gap-2 px-1 pb-2">
            {quick.map((a, i) => <QuickAction key={`${a.label}-${i}`} {...a} />)}
          </div>

          {/* Grouped list, dividers between groups. */}
          <div className="flex flex-col px-1 pb-2">
            {groups.map((group, gi) => (
              <div key={gi} className="flex flex-col">
                {gi > 0 && <div className="mx-2 my-1 h-px bg-border" />}
                {group.map((a, i) => <SheetRow key={`${a.label}-${i}`} {...a} />)}
              </div>
            ))}
          </div>
      </SheetContent>
    </Sheet>
  )
}
