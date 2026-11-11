"use client"

/*
 * CreditsDialog — release metadata surfaced by every "Show credits"
 * action (and the MediaHeader "i" button). A compact header (thumb, title,
 * main artist, year · label · catalogue number) over Overview (recording
 * session facts), Credits (one row per person, roles merged, grouped into
 * Personnel · Composition · Production & Engineering · Artwork & Notes) and
 * Notes. As tabs, or stacked (`?credits=page`) while the two are compared.
 * Every name links to its artist and carries the library heart.
 *
 * Mounted once via `CreditsProvider`; any descendant opens it with
 * `useCredits().open(albumKey)`. Outside a provider (e.g. DS showcase)
 * `open` is a no-op, so the menus that bake it in never crash.
 *
 * Data: `getCredits` in `album-catalog`, with full records for three albums
 * in `album-credits.ts`. Production fills the same shape from iTunes,
 * MusicBrainz and Discogs.
 */

import { useCallback, useState } from "react"

import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog"
import { X as XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/use-media-query"
import { getCredits, hasAlbumDetail, type Credits, type CreditGroup, type CreditPerson } from "@/lib/album-catalog"
import { artistImage } from "@/lib/artist-data"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CreditsContext } from "@/lib/credits-context"
import { useMediaNav, slugify } from "@/lib/media-nav"

export { useCredits } from "@/lib/credits-context"

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<string | null>(null)
  const open = useCallback((albumKey: string) => setKey(albumKey), [])
  const credits = key ? getCredits(key) : null

  return (
    <CreditsContext.Provider value={{ open }}>
      {children}
      <Dialog open={!!credits} onOpenChange={o => { if (!o) setKey(null) }}>
        {credits && <CreditsDialogContent credits={credits} onClose={() => setKey(null)} />}
      </Dialog>
    </CreditsContext.Provider>
  )
}

// A value that may be a navigable link. `onClick` makes it a button with
// hover-underline; without it, plain text. `className` sets the type, so the
// header's title and artist use the same rule as a person's name.
function Value({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  if (!onClick) return <p className={className}>{children}</p>
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("text-left w-fit max-w-full link-underline outline-none cursor-pointer", className)}
    >
      {children}
    </button>
  )
}

/** `"tabs"` — Overview · Credits · Notes, as Qobuz does it; `"page"` — the
 *  same sections stacked in one scroll. Both are live so they can be judged
 *  side by side; the dialog reads `?credits=page` from the URL. */
export type CreditsLayout = "tabs" | "page"

const GROUP_LABEL: Record<CreditGroup, string> = {
  personnel:   "Personnel",
  composition: "Composition",
  production:  "Production & Engineering",
  artwork:     "Artwork & Notes",
}
const GROUP_ORDER: CreditGroup[] = ["personnel", "composition", "production", "artwork"]

/* Initials from the FIRST and LAST name — "Mark Ernestus" → ME,
   "A. B. Spellman" → AS. Qobuz split a stored "Ernestus, Mark" at the comma
   and showed "E" over a role of "Composer, Mark"; names here are stored the
   way they are read, so the first and last words are the right two. */
function initials(name: string) {
  const words = name.replace(/\./g, " ").split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? ""
  const last  = words.length > 1 ? words[words.length - 1][0] : ""
  return (first + last).toUpperCase()
}

/* A photo where the catalogue has one, initials otherwise. Sidemen rarely
   have a photo, so the initials are the common case and get the same circle,
   size and edge as a portrait — the row must not look broken without one. */
function PersonAvatar({ name }: { name: string }) {
  const src = artistImage(name)
  return src ? (
    <img src={src} alt="" draggable={false} className="size-10 shrink-0 rounded-full object-cover art-edge" />
  ) : (
    <div aria-hidden="true" className="size-10 shrink-0 rounded-full bg-muted art-edge flex items-center justify-center text-2xsmall font-medium text-muted-foreground">
      {initials(name)}
    </div>
  )
}

/* "Bass clarinet (1, 2), Flute (3), Composer" — the liner-note convention.
   Track numbers say where a role applies in a few characters, instead of a
   credits block per track that repeats the same five names. */
function rolesLine(roles: CreditPerson["roles"]) {
  return roles.map(r => r.tracks?.length ? `${r.role} (${r.tracks.join(", ")})` : r.role).join(", ")
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-small font-medium text-foreground leading-none">{children}</p>
}

/*
 * CreditsContent — the body (compact header + Overview / Credits / Notes),
 * reused by the live dialog, the player and the static DS preview. `heading`
 * is slotted so the live dialog can pass an `sr-only` `DialogTitle` (a11y);
 * the others pass `null`. `onArtist`/`onAlbum` make names navigable; omit
 * them for a static render.
 */
export function CreditsContent({
  credits, heading, onArtist, onAlbum, bodyClassName = "max-h-[60vh]",
  showCover = true, layout = "tabs",
}: {
  /** The thumb in the header. Off where the cover is already on screen: the
   *  player shows the credits in place of its artwork, beside a thumb. */
  showCover?: boolean
  credits:   Credits
  /** The dialog's accessible name (`DialogTitle sr-only` in the live dialog);
   *  `null` where the host is already named. Nothing visible. */
  heading:   React.ReactNode
  onArtist?: (name: string) => void
  onAlbum?:  () => void
  /** Height of the whole body. `max-h-[60vh]` for the static preview; the
   *  live sheet passes `min-h-0` so it fills the dialog's own height. */
  bodyClassName?: string
  layout?: CreditsLayout
}) {

  const meta = [credits.year && String(credits.year), credits.label].filter(Boolean).join(" · ")
  /* Whether the visible tab panel is scrolled — the veil under the tab bar
     shows only then (see `veil`). Reset on a tab change: each panel starts at
     its top. */
  const [scrolled, setScrolled] = useState(false)
  const onPanelScroll = (e: React.UIEvent<HTMLDivElement>) => setScrolled(e.currentTarget.scrollTop > 0)

  /* TWO type sizes in the whole dialog: `text-small` (19) for content —
     title, names, section titles, Overview, Notes — and `text-2xsmall` (15)
     for everything secondary — roles, year · label, tabs, initials. Rank comes
     from weight and colour. It had four (21 · 19 · 17 · 15), and the sheet read
     as busy before a single name was read.

     Compact header — the same identity block as the ⋯ sheet
     (`DetailMenuSheetBody`): 72px thumb · title · artist · the
     year · label (the sheet's type badge is left out, see below). The credits are reached from that sheet
     ("Credits" tile), so the two open on one header instead of two. It
     replaced a 3:2 cover that spent a third of a phone on the artwork the
     reader had just come from. The catalogue number is an Overview fact. */
  const header = (
    <div className="flex flex-row items-center gap-3">
      {showCover && (
        <img
          src={credits.cover}
          alt=""
          draggable={false}
          className="size-18 shrink-0 rounded-xs object-cover bg-secondary art-edge"
        />
      )}
      <div className="flex min-w-0 flex-col gap-1 text-left">
        {heading}
        <Value onClick={onAlbum} className="truncate text-small font-medium leading-tight text-foreground">
          {credits.album}
        </Value>
        <Value onClick={onArtist && (() => onArtist(credits.mainArtist))} className="truncate text-small text-muted-foreground leading-none">
          {credits.mainArtist}
        </Value>
        {/* Year · label where the ⋯ sheet has the content-type badge. The
            sources disagree on the type, and for old jazz it is a modern
            label stuck on afterwards: MusicBrainz editors assign today's
            Album / Single / EP to a 1940 set of 78s, Discogs records the
            physical format of each pressing (78 RPM, 10", LP), iTunes mostly
            says "Album" and puts "– EP" in the title. Year and label are
            facts every source agrees on. */}
        {/* The role line's style exactly — the header's secondary line and a
            person's secondary line are one thing. */}
        {meta && <p className="truncate text-2xsmall text-muted-foreground leading-snug">{meta}</p>}
      </div>
    </div>
  )

  const total = (() => {
    const s = credits.tracks.reduce((sum, t) => {
      const [m, sec] = t.duration.split(":").map(Number)
      return sum + (m || 0) * 60 + (sec || 0)
    }, 0)
    return s ? `${Math.round(s / 60)} min` : undefined
  })()
  const facts: [string, React.ReactNode][] = [
    ...(credits.recordingDate || credits.studio
      ? [["Recorded", <>{credits.recordingDate}{credits.recordingDate && credits.studio && <br />}{credits.studio}</>] as [string, React.ReactNode]]
      : []),
    ...(credits.year ? [["Released", String(credits.year)] as [string, React.ReactNode]] : []),
    ...(credits.label ? [["Label", [credits.label, credits.catalogNumber].filter(Boolean).join(" · ")] as [string, React.ReactNode]] : []),
    ["Tracks", [String(credits.tracks.length), total].filter(Boolean).join(" · ")],
  ]

  const overview = (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-small leading-snug">
      {facts.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  )

  const groups = GROUP_ORDER
    .map(g => [g, credits.people.filter(p => p.group === g)] as const)
    .filter(([, list]) => list.length > 0)
  const hasTrackRefs = credits.people.some(p => p.roles.some(r => r.tracks?.length))

  const creditsBody = (
    <div className="flex flex-col gap-6">
      {groups.map(([g, list]) => (
        <section key={g} className="flex flex-col gap-1">
          <SectionTitle>{GROUP_LABEL[g]}</SectionTitle>
          {/* One row per PERSON, every role merged — a name appears once per
              album. Hairlines between rows, as Tidal and Qobuz both draw
              them; they read as a ruled liner-note sheet rather than as
              floating text. */}
          <ul className="divide-y divide-border/60">
            {list.map(p => (
              <li key={p.name} className="flex items-center gap-3 py-3">
                <PersonAvatar name={p.name} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {/* No page, no link and no heart — nothing to open or save.
                      The row keeps its shape (avatar, name, roles), so a
                      person without a page reads as credited, not as broken. */}
                  <Value
                    onClick={p.profile !== false && onArtist ? () => onArtist(p.name) : undefined}
                    className="text-small text-foreground leading-tight truncate"
                  >
                    {p.name}
                  </Value>
                  <p className="text-2xsmall text-muted-foreground leading-snug">{rolesLine(p.roles)}</p>
                </div>
                {p.profile !== false && (
                  <LibraryHeartButton type="artist" id={slugify(p.name)} name={p.name} size="icon-sm" className="touch-target shrink-0" />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {/* The key to the "(1, 2)" after a role — only when a role names
          tracks, so an album with one lineup throughout shows no list it
          does not need. */}
      {hasTrackRefs && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Tracks</SectionTitle>
          <ol className="flex flex-col gap-1.5 text-small leading-snug">
            {credits.tracks.map((t, i) => (
              <li key={t.title} className="flex gap-3">
                <span className="w-5 shrink-0 text-right tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-foreground">{t.title}</span>
                <span className="tabular-nums text-muted-foreground">{t.duration}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )

  const notes = credits.notes && (
    <div className="flex flex-col gap-2">
      <p className="text-small text-foreground leading-relaxed">{credits.notes.text}</p>
      {credits.notes.by && <p className="text-2xsmall text-muted-foreground">— {credits.notes.by}</p>}
    </div>
  )

  /* The dialog's own gutter: 12px on a phone (the ⋯ sheet's `px-3`), 24px
     from `md`. None in the player, which pads its own panel. */
  const pad = showCover ? "px-3 md:px-6" : "px-0"

  if (layout === "page") {
    return (
      <div className={cn("flex flex-col flex-1 min-h-0 overflow-y-auto", bodyClassName)}>
        <div className={cn("flex flex-col gap-8 pt-3 md:pt-6 pb-10", pad)}>
          {header}
          <section className="flex flex-col gap-3">
            <SectionTitle>Overview</SectionTitle>
            {overview}
          </section>
          {creditsBody}
          {notes && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Notes</SectionTitle>
              {notes}
            </section>
          )}
        </div>
      </div>
    )
  }

  /* The panel FADES under the tab bar instead of being cut at its edge: a
     row scrolled half out read as a broken row. The fade is a VEIL in the
     dialog's own colour laid over the content column, not a `mask-image` on
     the scroller: a mask fades everything the element paints, scrollbar
     included, and the bar dissolved into the fade with the rows. The veil
     stops at the gutters, so the scrollbar stays whole beside it.
     Clear for 15px (scrolled content never runs up against the bar), then
     eased out over 35px; a straight 20px ramp read as a hard band, 12 + 28
     as too tight.
     The veil only shows once the panel is scrolled. At rest there is nothing
     under it to fade, and padding the panel by the veil's 50px left a band
     of empty space between the tabs and the first heading; at rest the gap
     is 24px. */
  const panel = cn(
    "flex-1 min-h-0 overflow-y-auto pt-6 pb-10",
    // Thin, in the app's ink, on a clear track — not the browser's grey slab.
    "[scrollbar-width:thin] [scrollbar-color:var(--muted-foreground)_transparent]",
    pad,
  )
  const veil = (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 h-12.5 z-10 transition-opacity duration-200",
        scrolled ? "opacity-100" : "opacity-0",
        showCover ? "inset-x-3 md:inset-x-6" : "inset-x-0",
        "bg-[linear-gradient(to_bottom,var(--popover)_15px,color-mix(in_srgb,var(--popover)_92%,transparent)_25px,color-mix(in_srgb,var(--popover)_70%,transparent)_35px,color-mix(in_srgb,var(--popover)_35%,transparent)_45px,transparent_50px)]",
      )}
    />
  )

  /* Tabs: the header and the tab bar hold, the panel under them scrolls —
     switching tabs never moves the bar out from under the finger. Credits is
     the default tab, because "Show credits" is what was asked for. */
  return (
    <Tabs defaultValue="credits" onValueChange={() => setScrolled(false)} className={cn("flex flex-col flex-1 min-h-0 gap-0", bodyClassName)}>
      <div className={cn("shrink-0 flex flex-col gap-6 pt-3 md:pt-6 pb-0", pad)}>
        {header}
        <TabsList size="sm" className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          {notes && <TabsTrigger value="notes">Notes</TabsTrigger>}
        </TabsList>
      </div>
      <div className="relative flex flex-1 min-h-0 flex-col">
        {veil}
        <TabsContent value="overview" className={panel} onScroll={onPanelScroll}>{overview}</TabsContent>
        <TabsContent value="credits"  className={panel} onScroll={onPanelScroll}>{creditsBody}</TabsContent>
        {notes && <TabsContent value="notes" className={panel} onScroll={onPanelScroll}>{notes}</TabsContent>}
      </div>
    </Tabs>
  )
}

function CreditsDialogContent({ credits, onClose }: { credits: Credits; onClose: () => void }) {
  const { openArtist, openAlbum } = useMediaNav()
  // Navigate, then dismiss the dialog so the destination is visible.
  const go = (fn: () => void) => { fn(); onClose() }
  const albumLinkable = hasAlbumDetail(slugify(credits.album))
  /* Comparison switch while the two layouts are judged: `?credits=page`
     stacks the sections, anything else shows the tabs. */
  const layout: CreditsLayout =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("credits") === "page"
      ? "page" : "tabs"
  return (
    <DialogContent
      className={cn(
        // 576, the purchase / checkout dialogs' width. It was `md:max-w-md`
        // (448), where a role line like Dolphy's wrapped to three lines.
        "md:max-w-xl",
        // `md:p-0` / `md:gap-0` are NOT redundant beside `p-0 gap-0`. The base
        // chrome sets `md:p-6 md:gap-5`, and tailwind-merge keeps a variant
        // and its unprefixed twin side by side — so from 768 up the base won
        // and padded the body twice. Cancel the variant with a variant.
        "p-0 gap-0 md:p-0 md:gap-0 overflow-hidden flex flex-col",
        // Tabs get a FIXED height so switching between a short Overview and a
        // long Credits list does not resize the sheet under the finger; the
        // stacked page grows with its content up to the cap. `svh`, as every
        // sheet height in the app (see Dialog).
        layout === "tabs" ? "h-[88svh] md:h-[min(85vh,44rem)]" : "max-h-[92svh] md:max-h-[85vh]",
      )}
    >
      <CreditsContent
        credits={credits}
        layout={layout}
        /* Named for screen readers, not drawn: the title and the thumb
           already say what this is, and a grey "Album credits" over them was
           a label for the obvious. */
        heading={<DialogTitle className="sr-only">Album credits</DialogTitle>}
        onArtist={name => go(() => openArtist(slugify(name)))}
        onAlbum={albumLinkable ? () => go(() => openAlbum(slugify(credits.album))) : undefined}
        bodyClassName="min-h-0"
      />
    </DialogContent>
  )
}

/*
 * CreditsDialogPreview — static, non-modal render for the design system
 * (no portal / backdrop). Shows the dialog body inside a card.
 *
 * Reads `useIsMobile()` the way `DialogPreview` does: inside the design
 * system's frame that is the window CHIP, so a "375" frame shows the sheet
 * shape — full width, top corners only — instead of the desktop card.
 */
export function CreditsDialogPreview({ albumKey = "a07", layout = "tabs" }: { albumKey?: string; layout?: CreditsLayout }) {
  const phone = useIsMobile()
  return (
    <div
      data-mobile={phone ? "sheet" : undefined}
      className={cn(
        "relative w-full border border-border bg-popover overflow-hidden",
        phone ? "max-w-full" : "max-w-xl rounded-xl md:rounded-2xl",
      )}
    >
      {/* The navigation handlers are passed even though this preview goes
          nowhere. `Value` renders plain text without them and a link with
          them, so leaving them off documented the wrong component: in the
          product the artist, the album and every credited name ARE links, and
          the frame has to show the underline that says so. The handlers are
          no-ops here — a DS frame must not navigate the page out from under
          the person reading it. */}
      <CreditsContent
        credits={getCredits(albumKey)}
        layout={layout}
        heading={null}
        onArtist={() => {}}
        onAlbum={() => {}}
      />
      {/* The real dialog gets its ✕ from `DialogContent`; this preview builds
          its own card, so it has to carry one or the frame documents a dialog
          you cannot close. Same position and size as `DialogPreview`'s, inert
          on purpose — there is nothing to dismiss. */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2"
        aria-label="Close (preview)"
      >
        <XIcon />
      </Button>
    </div>
  )
}
