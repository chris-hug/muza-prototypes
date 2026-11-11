"use client"

/*
 * CreditsDialog — release metadata surfaced by every "Show credits"
 * action (and the MediaHeader "i" button). A compact header (thumb, title,
 * main artist, year · label) over Credits and Notes. Credits read two ways:
 * the album's (one row per person, roles merged, grouped into Personnel ·
 * Composition · Production & Engineering · Artwork & Notes, then the release
 * facts and the tracks) or track by track (a song's). As tabs, or stacked
 * (`?credits=page`) while the two are compared.
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

import { useCallback, useEffect, useRef, useState } from "react"

import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog"
import { X as XIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/use-media-query"
import { getCredits, hasAlbumDetail, findTrack, peopleOnTrack, type Credits, type CreditGroup, type CreditPerson } from "@/lib/album-catalog"
import { usePlayerOptional } from "@/lib/player"
import { TrackNumberPlayButton } from "@/components/ui/song-list-item"
import { artistImage } from "@/lib/artist-data"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CreditsContext } from "@/lib/credits-context"
import { useMediaNav, slugify } from "@/lib/media-nav"

export { useCredits } from "@/lib/credits-context"

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = useState<{ key: string; title?: string } | null>(null)
  const open = useCallback((albumKey: string, trackTitle?: string) => setReq({ key: albumKey, title: trackTitle }), [])
  const credits = req ? getCredits(req.key) : null
  const setKey = (k: null) => setReq(k)

  return (
    <CreditsContext.Provider value={{ open }}>
      {children}
      <Dialog open={!!credits} onOpenChange={o => { if (!o) setKey(null) }}>
        {/* Keyed by the request: a second "Show credits" while the dialog is
            still open (or closing) starts fresh, at its own song. */}
        {credits && <CreditsDialogContent key={`${req?.key}:${req?.title ?? ""}`} credits={credits} focusTrack={findTrack(credits, req?.title)} onClose={() => setKey(null)} />}
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

/** `"tabs"` — Credits · Notes; `"page"` — the
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
 * CreditsContent — the body (compact header + Credits / Notes),
 * reused by the live dialog, the player and the static DS preview. `heading`
 * is slotted so the live dialog can pass an `sr-only` `DialogTitle` (a11y);
 * the others pass `null`. `onArtist`/`onAlbum` make names navigable; omit
 * them for a static render.
 */
export function CreditsContent({
  credits, heading, onArtist, onAlbum, bodyClassName = "max-h-[60vh]",
  showCover = true, layout = "tabs", focusTrack,
}: {
  /** 1-based track to open on. With it the Credits tab opens TRACK BY
   *  TRACK, scrolled to that song; without it, on the album's one-row-per-
   *  musician overview. A song's "Show credits" and the player pass it; the
   *  album's ⓘ does not. */
  focusTrack?: number
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
  const [tab, setTab] = useState("credits")

  /* The player, when there is one — a track header plays its track and
     shows the one playing. `null` in a static frame: the headers render,
     inert. */
  const player = usePlayerOptional()
  const isCurrent = (title: string) =>
    !!player?.track && player.track.album === credits.album && player.track.title === title
  const playTrack = player && ((t: { title: string; duration: string }) => {
    if (isCurrent(t.title)) { player.toggle(); return }
    player.play(
      { title: t.title, artist: credits.mainArtist, album: credits.album, image: credits.cover, totalTime: t.duration },
      credits.album,
    )
  })

  /* Which reading of the Credits tab is open: the album's (`on: false`) or
     track by track, scrolled to `at`. The album's tracks list switches in,
     "All album credits" switches back. */
  const [byTrack, setByTrack] = useState<{ on: boolean; at?: number }>({ on: !!focusTrack, at: focusTrack })

  /* Scroll to `at`: its section to the top of whatever box scrolls the
     credits (the tab panel, or the whole page layout); back to the top on
     the album's. Measured, not `scrollIntoView`, which would also scroll the
     sheet and the page behind it. */
  const creditsRef = useRef<HTMLDivElement>(null)
  const firstRun = useRef(true)
  useEffect(() => {
    const isFirst = firstRun.current
    firstRun.current = false
    if (!byTrack.on && isFirst) return   // album view on open: already at the top
    const go = () => {
      const root = creditsRef.current
      let box = root?.parentElement ?? null
      while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement
      if (!root || !box) return
      if (!byTrack.on || !byTrack.at) { box.dataset.keepScroll = ""; box.scrollTop = 0; return }
      const el = root.querySelector<HTMLElement>(`[data-track="${byTrack.at}"]`)
      if (!el) return
      // Tells a phone sheet's detent this scroll is a destination (dialog.tsx).
      box.dataset.keepScroll = ""
      // The dialog may be mid scale-in, so rects are scaled; the ratio of
      // the box's drawn to laid-out height undoes that.
      const scale = box.getBoundingClientRect().height / box.offsetHeight || 1
      box.scrollTop += (el.getBoundingClientRect().top - box.getBoundingClientRect().top) / scale
    }
    /* On the first painted frame, and again once the dialog has opened: on
       the mount pass the panel has no height yet, and the open transition can
       reset a scroll set during it. A second call that finds the section in
       place moves nothing. */
    const f = requestAnimationFrame(go)
    const t = setTimeout(go, 250)
    return () => { cancelAnimationFrame(f); clearTimeout(t) }
  }, [byTrack])

  /* TWO type sizes in the whole dialog: `text-small` (19) for content —
     title, names, section titles, release facts, Notes — and `text-2xsmall` (15)
     for everything secondary — roles, year · label, tabs, initials. Rank comes
     from weight and colour. It had four (21 · 19 · 17 · 15), and the sheet read
     as busy before a single name was read.

     Compact header — the same identity block as the ⋯ sheet
     (`DetailMenuSheetBody`): 72px thumb · title · artist · the
     year · label (the sheet's type badge is left out, see below). The credits are reached from that sheet
     ("Credits" tile), so the two open on one header instead of two. It
     replaced a 3:2 cover that spent a third of a phone on the artwork the
     reader had just come from. The catalogue number is a Release fact. */
  const identity = (
    <div className="flex flex-row items-center gap-3">
      {showCover && (
        <img
          src={credits.cover}
          alt=""
          draggable={false}
          className="size-18 shrink-0 rounded-xs object-cover bg-secondary art-edge"
        />
      )}
      {/* Three lines on ONE 24px rhythm, no gaps: 3 × 24 = 72, the thumb's
          height, so the text block sits flush with it top and bottom. They
          had three line heights (24 · 19 · 21) plus 4px gaps, and the space
          between the lines looked uneven although no single value was. */}
      <div className="flex min-w-0 flex-col text-left">
        {heading}
        <Value onClick={onAlbum} className="truncate text-small font-medium leading-6 text-foreground">
          {credits.album}
        </Value>
        <Value onClick={onArtist && (() => onArtist(credits.mainArtist))} className="truncate text-small text-muted-foreground leading-6">
          {credits.mainArtist}
        </Value>
        {/* Year · label where the ⋯ sheet has the content-type badge. The
            sources disagree on the type, and for old jazz it is a modern
            label stuck on afterwards: MusicBrainz editors assign today's
            Album / Single / EP to a 1940 set of 78s, Discogs records the
            physical format of each pressing (78 RPM, 10", LP), iTunes mostly
            says "Album" and puts "– EP" in the title. Year and label are
            facts every source agrees on. */}
        {/* The role line's size and colour — the header's secondary line and a
            person's secondary line are one thing; its height is the header's
            24px rhythm. */}
        {meta && <p className="truncate text-2xsmall text-muted-foreground leading-6">{meta}</p>}
      </div>
    </div>
  )

  /* Track by track, a way back to the album's overview sits ABOVE the
     identity block, on its own line, as a dialog's back control does (see
     `dialogHeaderClass`): inline it would indent the title. The button at the
     end of the list was the only way back, and it is a long scroll away on
     an album of ten tracks. `-ml-2` hangs the 32px button so its chevron
     sits on the thumb's edge. */
  const header = byTrack.on ? (
    <div className="flex flex-col gap-2">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" onClick={() => { setByTrack({ on: false }); setTab("credits") }}>
        <ChevronLeft />
        All album credits
      </Button>
      {identity}
    </div>
  ) : identity

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

  /* Two readings of one record.
     ALBUM (the ⓘ on an album): every musician once, roles merged, track
     numbers where a role is not the whole album — "Bass clarinet (1, 2),
     Flute (3)". The compact overview of who is on the record.
     TRACK BY TRACK (a song's "Show credits", the player): each song a
     section under a sticky bar, as Qobuz lays it out, with the people on
     THAT take — the album's people read for the track (`peopleOnTrack`),
     numbers dropped. Production and the sleeve belong to the record, so
     they follow the tracks once.
     Track by track had replaced the album list outright; the overview of the
     whole lineup was lost, and it is the better answer to "who is on this
     album?". So the album keeps it and a song gets the per-track reading. */
  const PER_TRACK: CreditGroup[] = ["personnel", "composition"]
  const groupsOf = (gs: CreditGroup[]) => gs
    .map(g => [g, credits.people.filter(p => p.group === g)] as const)
    .filter(([, list]) => list.length > 0)
  const albumGroups = groupsOf(GROUP_ORDER.filter(g => !PER_TRACK.includes(g)))

  const personRows = (list: CreditPerson[]) => (
    /* One row per PERSON, every role merged. Hairlines between rows, as
       Tidal and Qobuz both draw them; they read as a ruled liner-note sheet
       rather than as floating text. */
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
  )

  /* The sticky bar every section hangs from. 48px, in the dialog's colour so
     rows pass under it, with a 12px fade below — the same soft edge as the
     veil, here because the bar, not the tab strip, is now the edge rows
     scroll under. `-mx-2` + `pl-1`: the 48px play button's centre lands on
     the 40px avatars' centre and the title on the names' left edge (52px),
     so the bar and the rows share one grid. */
  const stickyBar = () => cn(
    "sticky top-0 z-10 flex h-12 items-center gap-2 rounded-md",
    /* The player has no gutter to bleed into (`showCover` off, `px-0`): a
       `-mx-2` bar was clipped at its right edge. There the bar stays inside
       and the button alone pulls left by 4px onto the same grid. */
    showCover ? "-mx-2 pl-1 pr-2" : "[&>button:first-child]:-ml-1",
    "after:pointer-events-none after:absolute after:inset-x-2 after:top-full after:h-3",
    "after:bg-[linear-gradient(to_bottom,var(--popover),transparent)]",
  )
  /* A TRACK bar is the album page's track row: the whole bar plays, the
     hover fill grows from the pointer (`press-ripple` + `--hover-fill`, not
     `hover:bg-*`, which would arrive twice — see app.css), and a press
     ripples. It had no hover at all and read as a heading, not as something
     to press. Clicks on the button itself are its own, as on the row.
     The SECTION bars (Production, Artwork) play nothing and stay inert. */
  /* A track bar is a FILLED band, a section bar is not. With both in the
     dialog's colour a song title, a section title ("Production &
     Engineering") and a person's name were the same 19px on the same ground,
     told apart only by weight, and a song did not read as the thing the
     list is divided by. A third type size would have broken the two-size
     rule, so the difference is the surface — the LIGHTEST fill there is,
     `bg-muted`, for every song; `bg-secondary` for the one playing, and as
     the hover fill. `secondary` / `secondary-hover` were tried first and
     read as heavy grey slabs stacked down the list. */
  const trackBar = (current: boolean) => cn(
    stickyBar(),
    "group/trackbar",
    current ? "bg-secondary" : "bg-muted",
    // No `overflow-clip` as the row has: the ripple already fills the box and
    // inherits its radius, and clipping would cut the fade hung below it.
    "press-ripple state-fade-quick",
    playTrack && "cursor-pointer",
    !current && playTrack && "[--hover-fill:var(--secondary)]",
  )

  const trackByTrack = (
    <>
      {credits.tracks.map((t, i) => {
        const n = i + 1
        const list = peopleOnTrack(credits.people, n).filter(p => PER_TRACK.includes(p.group))
        const current = isCurrent(t.title)
        return (
          <section key={t.title} data-track={n} className="flex flex-col">
            <div
              className={trackBar(current)}
              onClick={playTrack ? e => { if (!(e.target as Element).closest("button, a")) playTrack(t) } : undefined}
            >
              <TrackNumberPlayButton
                number={n}
                title={t.title}
                playing={current && !!player?.playing}
                onToggle={playTrack ? () => playTrack(t) : undefined}
                // The play icon shows on a hover anywhere on the bar, since a
                // click anywhere plays.
                hoverGroup={playTrack ? "trackbar" : "self"}
              />
              <p className="min-w-0 flex-1 truncate text-small font-medium text-foreground">{t.title}</p>
              <span className="text-small tabular-nums text-muted-foreground">{t.duration}</span>
            </div>
            {personRows(list)}
          </section>
        )
      })}
      {albumGroups.map(([g, list]) => (
        <section key={g} className="flex flex-col">
          <div className={cn(stickyBar(), "bg-popover", showCover && "px-2")}>
            <SectionTitle>{GROUP_LABEL[g]}</SectionTitle>
          </div>
          {personRows(list)}
        </section>
      ))}
      {/* The way back to the overview, where the reader lands once the
          songs are read. */}
      <Button variant="secondary" size="lg" className="self-start" onClick={() => setByTrack({ on: false })}>
        All album credits
      </Button>
    </>
  )

  const albumView = (
    <>
      {groupsOf(GROUP_ORDER).map(([g, list]) => (
        <section key={g} className="flex flex-col gap-1">
          <SectionTitle>{GROUP_LABEL[g]}</SectionTitle>
          {personRows(list)}
        </section>
      ))}
      {/* The release facts, between the people and the tracks: where and
          when it was recorded, when it came out, on which label. They were an
          Overview tab of their own — four lines behind a tab, a tap away from
          the credits they belong with. */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Release</SectionTitle>
        {overview}
      </section>
      {/* The album's tracks, two jobs: the key to the "(1, 2)" after a
          role, and the way into the track-by-track reading — a row opens it
          at that song. On the person row's grid: the number centred in the
          avatar's 40px column, so titles start on the names' line, `py-3`
          like the people, and a chevron that says "opens". */}
      <section className="flex flex-col gap-1">
        <SectionTitle>Tracks</SectionTitle>
        <ol className="divide-y divide-border/60 text-small leading-snug">
          {credits.tracks.map((t, i) => (
            <li key={t.title}>
              <button
                type="button"
                onClick={() => setByTrack({ on: true, at: i + 1 })}
                aria-label={`${t.title} credits`}
                className="link-underline-group flex w-full min-h-11 items-center gap-3 py-3 outline-none cursor-pointer"
              >
                <span className="w-10 shrink-0 text-center tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-left text-foreground"><span className="link-underline">{t.title}</span></span>
                <span className="tabular-nums text-muted-foreground">{t.duration}</span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ol>
      </section>
    </>
  )

  const creditsBody = (
    <div ref={creditsRef} className="flex flex-col gap-6">
      {byTrack.on ? trackByTrack : albumView}
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
    // No top PADDING on the scroller: a sticky bar sticks at the padding
    // edge, 24px down, and rows showed through the band above it. The 24px
    // is the content's own margin (`gap` below) instead.
    "flex-1 min-h-0 overflow-y-auto pb-10",
    // Thin, in the app's ink, on a clear track — not the browser's grey slab.
    "[scrollbar-width:thin] [scrollbar-color:var(--muted-foreground)_transparent]",
    pad,
  )
  const veil = (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 h-12.5 z-10 transition-opacity duration-200",
        // Not over the track-by-track reading: there a sticky bar is always at
        // the top edge and carries its own fade; the veil would wash out its
        // top 15px.
        scrolled && !(tab === "credits" && byTrack.on) ? "opacity-100" : "opacity-0",
        showCover ? "inset-x-3 md:inset-x-6" : "inset-x-0",
        "bg-[linear-gradient(to_bottom,var(--popover)_15px,color-mix(in_srgb,var(--popover)_92%,transparent)_25px,color-mix(in_srgb,var(--popover)_70%,transparent)_35px,color-mix(in_srgb,var(--popover)_35%,transparent)_45px,transparent_50px)]",
      )}
    />
  )

  /* Tabs: the header and the tab bar hold, the panel under them scrolls —
     switching tabs never moves the bar out from under the finger. Credits is
     the default tab, because "Show credits" is what was asked for. */
  return (
    <Tabs value={tab} onValueChange={v => { setTab(String(v)); setScrolled(false) }} className={cn("flex flex-col flex-1 min-h-0 gap-0", bodyClassName)}>
      {/* `pb-3` here + `pt-3` in each panel: 24px to the first line at rest,
          and still 12px between the tab strip and a track bar stuck under it
          — with all 24 in the panel, the stuck bar touched the strip. */}
      <div className={cn("shrink-0 flex flex-col gap-6 pt-3 md:pt-6 pb-3", pad)}>
        {header}
        {/* No strip for ONE tab: a lone "Credits" pill switches nothing. */}
        {notes && (
          <TabsList size="sm" className="w-full">
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        )}
      </div>
      <div className="relative flex flex-1 min-h-0 flex-col">
        {veil}
        <TabsContent value="credits"  className={panel} onScroll={onPanelScroll}><div className="pt-3">{creditsBody}</div></TabsContent>
        {notes && <TabsContent value="notes" className={panel} onScroll={onPanelScroll}><div className="pt-3">{notes}</div></TabsContent>}
      </div>
    </Tabs>
  )
}

function CreditsDialogContent({ credits, focusTrack, onClose }: { credits: Credits; focusTrack?: number; onClose: () => void }) {
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
        // Tabs get a FIXED height so switching between short Notes and a
        // long Credits list does not resize the sheet under the finger; the
        // stacked page grows with its content up to the cap. `svh`, as every
        // sheet height in the app (see Dialog).
        layout === "tabs" ? "h-[88svh] md:h-[min(85vh,44rem)]" : "max-h-[92svh] md:max-h-[85vh]",
      )}
    >
      <CreditsContent
        credits={credits}
        focusTrack={focusTrack}
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
