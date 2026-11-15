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

import { Fragment, useCallback, useEffect, useRef, useState } from "react"

import {
  Dialog, DialogContent, DialogTitle, dialogPreviewPhoneClass,
} from "@/components/ui/dialog"
import { X as XIcon, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SheetGrabber } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/use-media-query"
import { getCredits, hasAlbumDetail, findTrack, peopleOnTrack, type Credits, type CreditGroup, type CreditPerson } from "@/lib/album-catalog"
import { usePlayerOptional } from "@/lib/player"
import { TrackNumberPlayButton } from "@/components/ui/song-list-item"
import { artistImage } from "@/lib/artist-data"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
import { MediaListItem } from "@/components/ui/media-list-item"
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

/** Two versions of one record, both kept while they are compared.
 *  `"draft"` — the earlier version: compact head, the album's lineup (roles merged), the
 *  release facts, and a song's credits read TRACK BY TRACK through the whole
 *  album (Qobuz / Tidal). Built as muza's edge: the catalogue is rich, so show
 *  it. `"current"` — the version in use (Nov 2026): only what was asked — an album
 *  under its floating cover (musicians with their instruments, production,
 *  the sleeve, the release card), or ONE song (title, composer, album, who
 *  plays on it). Every app gets you there
 *  from where you came, nothing to switch between (Spotify / YouTube Music).
 *  The app opens "current"; `?credits=draft` (or `?credits=page`, the
 *  draft stacked) brings the draft back. The design system shows both. */
export type CreditsVariant = "current" | "draft"

/** The version (and the draft's layout) the URL asks for. Read where the credits
 *  are mounted — the dialog and the player — so one switch flips both. */
export function creditsMode(): { variant: CreditsVariant; layout: CreditsLayout } {
  const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("credits") : null
  if (q === "page") return { variant: "draft", layout: "page" }
  if (q === "draft") return { variant: "draft", layout: "tabs" }
  return { variant: "current", layout: "tabs" }
}

const GROUP_LABEL: Record<CreditGroup, string> = {
  personnel:   "Personnel",
  composition: "Composition",
  production:  "Production & Engineering",
  artwork:     "Artwork & Notes",
}
const GROUP_ORDER: CreditGroup[] = ["personnel", "composition", "production", "artwork"]

/* Initials and the portrait-or-initials circle now live in `MediaListItem`
   (its artist slot), which draws every person row here. */

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
export function CreditsContent({ variant = "draft", songCover, ...props }: CreditsContentProps & { variant?: CreditsVariant; songCover?: boolean }) {
  return variant === "current" ? <CreditsCurrent {...props} songCover={songCover} /> : <CreditsDraft {...props} />
}

type CreditsContentProps = Parameters<typeof CreditsDraft>[0]


/*
 * CreditsCurrent — the version in use. One scroller. From an album: the
 * cover floating over a blurred band and hanging into the sheet, album name,
 * main artist · year, every musician with what they play, production and the
 * sleeve, the release card. From a song (`focusTrack`): only THAT song —
 * the floating cover (or text only, `songCover={false}`) with the song's
 * title and artist, then its Musicians, its Composer(s) and its Album as a
 * row; no facts, no track list, no switching to the album. It answers the
 * question the button asked and stops.
 */
function CreditsCurrent({
  credits, heading, onArtist, onAlbum, bodyClassName = "max-h-[60vh]",
  showCover = true, focusTrack, songCover = true,
}: CreditsContentProps & {
  /** A SONG's head: the album's floating cover (`true`, the default) or
   *  text only. Both are live in the design system while they are judged. */
  songCover?: boolean
}) {
  const track = focusTrack ? credits.tracks[focusTrack - 1] : undefined
  const ofTrack = (g: CreditGroup) => {
    const list = credits.people.filter(p => p.group === g)
    return track && focusTrack ? peopleOnTrack(list, focusTrack) : list
  }
  /* What they PLAY, and nothing else: a bandleader's personnel entry also
     carries Composer, Arranger, Producer — the brief is "musicians +
     instrument". Track numbers go too ("Synthesizer (10)" → "Synthesizer"):
     the draft answers "on which track"; this answers "who plays". */
  const NOT_PLAYING = /compos|arrang|produc|engineer|mix|master|liner|design|photo|lyric|writ/i
  const WRITING = /compos|lyric|writ/i
  const musicians = ofTrack("personnel")
    .map(p => ({
      ...p,
      roles: [...new Set(p.roles.map(r => r.role).filter(r => !NOT_PLAYING.test(r)))].map(role => ({ role })),
    }))
    .filter(p => p.roles.length > 0)
  /* Whoever wrote THIS song, from any group — a leader's "Composer" sits in
     his personnel entry (Dolphy on Gazzelloni), not under Composition — as
     its own section, rows like the musicians', only the writing roles. */
  const composers = track && focusTrack
    ? peopleOnTrack(credits.people, focusTrack)
        .map(p => ({ ...p, roles: p.roles.filter(r => WRITING.test(r.role)) }))
        .filter(p => p.roles.length > 0)
    : []

  /* The floating cover: always for an album; for a song unless
     `songCover={false}`. */
  const floatHead = showCover && (!track || songCover)
  const title = track ? track.title : credits.album
  const artistLine = (
    <>
      <Value onClick={onArtist && (() => onArtist(credits.mainArtist))} className="truncate">
        {credits.mainArtist}
      </Value>
      {!track && credits.year ? <span className="shrink-0">· {credits.year}</span> : null}
    </>
  )

  return (
    <div className={cn("flex flex-col flex-1 min-h-0 overflow-y-auto", bodyClassName)}>
      {/* The head: a band of the blurred cover; the cover floats in it and
          hangs into the sheet below, so picture and list read as one object
          rather than a banner on top of a page. The title, larger, centred
          under it — the album's, or the song's. Tried and dropped: the cover
          over a blurred 3:2 copy with the text below (a banner), and the
          cover full-bleed with the title set on it (too loud). */}
      {floatHead && (
        /* Sized from the DIALOG's width, not the window's: `--cover` is
           min(260px, the sheet's width − 64px) via container units, so the
           cover floats with 32px either side on the smallest phone and tops
           out at 260 in the 576 dialog. On a PHONE (sheet under 420px) it is
           200: the musicians should be readable with little or no scrolling,
           and 260 pushed them under the fold. 384, 320 and 280 were tried and
           were too big. With `md:` sizes it went by the window — in a
           phone-sized design-system frame on a wide screen the 384px cover
           filled the whole sheet edge to edge. */
        <div className="@container/credits-head shrink-0">
        <div className="relative [--cover:min(260px,100cqw-64px)] @max-[420px]/credits-head:[--cover:200px]!">
          {/* The band ends with a hard edge, so the cover visibly crosses it:
              the cover 32px down, the band ending at 60% of it, so ~40%
              hangs on the sheet. A band that faded out left nothing to cross.
              192, 240 and 288px were tried for the cover and read as a
              thumbnail. The shadow is lighter in light mode: the dark one sat
              on the pale sheet as a smudge. */}
          {/* The cover blurred 8px (scaled 110% so the blur has no soft
              edge; 16px hid the picture) under a light tint of the sheet.
              Tried and dropped: the player's backdrop exactly (32px under
              `.frosted-glass`) — the glass tints to 80% of the background, so
              the cover was gone, and its `backdrop-filter` escaped the
              dialog's rounded corners in Chrome, leaving them square. No
              backdrop-filter here; the glass's grain and sheen come on their
              own (`.glass-grain`). */}
          <div aria-hidden="true" className="relative h-[calc(32px+var(--cover)*0.6)] w-full overflow-hidden bg-background">
            <div
              className="absolute inset-0 bg-cover bg-center scale-110"
              style={{ backgroundImage: `url(${credits.cover})`, filter: "blur(8px) saturate(1.5)" }}
            />
            {/* The tint only in DARK mode, where it calms a bright cover
                against the near-black sheet. In light mode it was a 25%
                wash of off-white over the picture — a grey veil — so light
                gets none, and the blur is saturated 1.5× in both so the
                cover's colour survives it. */}
            <div className="absolute inset-0 dark:bg-background/25" />
            <div className="absolute inset-0 glass-grain" />
          </div>
          <img
            src={credits.cover}
            alt={credits.album}
            draggable={false}
            className="absolute left-1/2 top-8 size-(--cover) -translate-x-1/2 rounded-sm object-cover art-edge shadow-[0_16px_32px_-12px_rgb(0_0_0/0.22)] dark:shadow-[0_24px_48px_-12px_rgb(0_0_0/0.6)]"
          />
          {/* Sizes and spacing are the ALBUM PAGE's stacked header
              (`MediaHeader` below 560): cover → title 16px, title
              `text-large font-semibold leading-[1.2]`, 12px to the meta
              line (6 in a phone-wide sheet, container under 420px, where 12
              read loose), `text-small leading-none` (the artist regular, not the
              page's `font-medium` — read as bold here),
              16px to what follows. Centred here, as the cover is. It had its
              own scale (30px title, 20/14 gaps) — the same album read
              differently on its page and in its credits. The gap BELOW is
              this block's `pb`; the content under it cancels its own 24px. */}
          <div className="flex flex-col items-center gap-3 px-4 pt-[calc(var(--cover)*0.4+16px)] pb-4 text-center @max-[420px]/credits-head:gap-1.5!">
            {/* Not a link: an album's credits are opened FROM the album
                (its ⓘ, its ⋯), so the title would only lead back. */}
            <p className="text-large font-semibold leading-[1.2] text-foreground text-center">
              {title}
            </p>
            <div className="flex min-w-0 justify-center gap-1.5 text-small leading-none text-muted-foreground">
              {artistLine}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Under the floating head the text block below is empty (only the
          sr-only title); `-mt-6` cancels its 24px gap, so the space to the
          first section is the head's own `pb` (see the head). */}
      <div className={cn(
        // ONE gutter at every size, 16px, as the draft: `md:px-6` gave
        // desktop a wider margin than the phone — and put the release card
        // 16px from the sides but 8 from the bottom, not concentric.
        "flex flex-col gap-6 px-4 pb-[max(16px,env(safe-area-inset-bottom))]",
        floatHead ? "pt-0 -mt-6" : "pt-6",
      )}>
        <div className="flex flex-col gap-1">
          {heading}
          {/* Without the cover: the title and artist as text. `pr-8` keeps
              them clear of the ✕ in the corner. */}
          {/* The song without its cover takes the floating head's title and
              artist exactly (centred, `text-xlarge`), so the two variants
              differ only by the picture. In the player (`showCover` off, its
              own artwork beside) the head stays small and left-aligned.
              `px-8` keeps the centred title clear of the ✕. */}
          {!floatHead && showCover && (
            <div className="flex min-w-0 flex-col items-center gap-3 px-8 pt-4 text-center">
              <p className="text-large font-semibold leading-[1.2] text-foreground">{title}</p>
              <div className="flex min-w-0 justify-center gap-1.5 text-small leading-none text-muted-foreground">
                {artistLine}
              </div>
            </div>
          )}
          {!showCover && (
            <div className="flex min-w-0 flex-col gap-0.5 pr-8">
              <Value onClick={track ? undefined : onAlbum} className={track ? "text-small font-medium text-foreground" : "text-large font-medium leading-tight text-foreground"}>
                {title}
              </Value>
              <div className="flex min-w-0 gap-1.5 text-small text-muted-foreground">
                {artistLine}
              </div>
            </div>
          )}
        </div>

        {/* A SONG's writers come FIRST, before who plays it — the song
            before the performance. Only the writing roles, from any group. */}
        {track && composers.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionTitle>{composers.length > 1 ? "Composers" : "Composer"}</SectionTitle>
            <PersonRows list={composers} onArtist={onArtist} />
          </div>
        )}

        {/* Then the album it is on (before the musicians: song, record,
            players). */}
        {track && (
          <div className="flex flex-col gap-2">
            <SectionTitle>Album</SectionTitle>
            {/* The library's own album row (`MediaListItem`, as in search
                and the library lists): cover, title, artist · year, the row
                opens the album. `-mx-2` puts its cover on the avatars' edge;
                the chevron, as `trailing`, says it goes somewhere — a phone
                has no hover. */}
            <MediaListItem
              type="album"
              title={credits.album}
              cover={credits.cover}
              subtitle={credits.mainArtist}
              meta={credits.year ? String(credits.year) : undefined}
              onOpen={onAlbum}
              size="lg"
              trailing={onAlbum && <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />}
              className="-mx-2 bg-transparent"
            />
          </div>
        )}

        {musicians.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionTitle>Musicians</SectionTitle>
            <PersonRows list={musicians} onArtist={onArtist} />
          </div>
        )}

        {/* An ALBUM also gets who made the record and the sleeve, then the
            release facts (label, catalogue number…) in the draft's album card,
            last. Production and the sleeve belong to the record, not the
            take, so a song has neither. */}
        {!track && (["production", "artwork"] as CreditGroup[]).map(g => {
          const list = credits.people.filter(p => p.group === g)
          return list.length > 0 && (
            <div key={g} className="flex flex-col gap-2">
              <SectionTitle>{GROUP_LABEL[g]}</SectionTitle>
              <PersonRows list={list} onArtist={onArtist} />
            </div>
          )
        })}
        {!track && (
          /* Concentric with the dialog: 8px from its sides AND its bottom
             (`-mx-2 -mb-2` out of the 16px gutter and padding), so its
             radius is the dialog's 18 minus 8 = 10 (`rounded-md`). It was
             `rounded-xl` (12) sitting 16px from the bottom — the curves ran
             out of step with the sheet's. */
          <div className="-mx-2 -mb-2 flex flex-col gap-3 rounded-md bg-muted p-4">
            <span className="truncate text-small font-medium text-foreground">{credits.album}</span>
            <FactList credits={credits} lead={[["Main artist", credits.mainArtist]]} />
          </div>
        )}
      </div>
    </div>
  )
}

/* The release facts — Recorded (date + studio) · Released · Label
   (label · catalogue number) · Songs · Run time — a row left out when the
   catalogue has no value. Shared by both variants' album card. */
function releaseFacts(credits: Credits): [string, React.ReactNode][] {
  const s = credits.tracks.reduce((sum, t) => {
    const [m, sec] = t.duration.split(":").map(Number)
    return sum + (m || 0) * 60 + (sec || 0)
  }, 0)
  const total = s ? `${Math.round(s / 60)} min` : undefined
  return [
    ...(credits.recordingDate || credits.studio
      ? [["Recorded", <>{credits.recordingDate}{credits.recordingDate && credits.studio && <br />}{credits.studio}</>] as [string, React.ReactNode]]
      : []),
    ...(credits.year ? [["Released", String(credits.year)] as [string, React.ReactNode]] : []),
    ...(credits.label ? [["Label", [credits.label, credits.catalogNumber].filter(Boolean).join(" · ")] as [string, React.ReactNode]] : []),
    // Two facts, two rows: "Tracks 5 · 42 min" read as one number in two units.
    ["Songs", String(credits.tracks.length)],
    ...(total ? [["Run time", total] as [string, React.ReactNode]] : []),
  ]
}

function FactList({ credits, lead = [] }: { credits: Credits; lead?: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-small leading-snug">
      {[...lead, ...releaseFacts(credits)].map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* One row per person: avatar, name (a link when they have a page), roles,
   heart. Shared by both variants so a person reads the same in either. */
function PersonRows({ list, onArtist }: { list: CreditPerson[]; onArtist?: (name: string) => void }) {
  /* The library's own row (`MediaListItem type="artist"`, `size="lg"` — the
     name one step up, as the content of this dialog): portrait or initials,
     name, the roles as its second line, the heart as `trailing`, the row
     opens the artist. No page (`profile: false` — sleeve designers, liner
     note writers) → no `onOpen` and no heart: credited, not a link. */
  return (
    <div className="-mx-2 flex flex-col">
      {list.map(p => {
        const linked = p.profile !== false && !!onArtist
        return (
          <MediaListItem
            key={p.name}
            type="artist"
            size="lg"
            title={p.name}
            cover={artistImage(p.name)}
            subtitle={rolesLine(p.roles)}
            onOpen={linked ? () => onArtist!(p.name) : undefined}
            trailing={p.profile !== false && (
              <LibraryHeartButton type="artist" id={slugify(p.name)} name={p.name} size="icon-sm" className="touch-target" />
            )}
            className={cn("bg-transparent", !linked && "cursor-default [--hover-fill:transparent]")}
          />
        )
      })}
    </div>
  )
}

/* CreditsDraft — the earlier version, kept while the current one settles. */
function CreditsDraft({
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
  /* Whether the visible tab panel is scrolled — the head's hairline shows
     only then. Reset on a tab change: each panel starts at
     its top. */
  const [scrolled, setScrolled] = useState(false)
  const onPanelScroll = (e: React.UIEvent<HTMLDivElement>) => setScrolled(e.currentTarget.scrollTop > 0)
  const [tab, setTab] = useState("credits")
  /* The head (identity + tabs) OVERLAYS the scroller as glass, so the panel
     needs its height: as top padding, and as the sticky bars' `top`. Measured,
     because it changes — the track-by-track link line, the tab strip only
     when there are Notes, a title that wraps. */
  const headRef = useRef<HTMLDivElement>(null)
  const [headH, setHeadH] = useState(0)
  useEffect(() => {
    const el = headRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeadH(Math.round(el.offsetHeight)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* The player, when there is one — a track header plays its track and
     shows the one playing. `null` in a static frame: the headers render,
     inert. */
  const player = usePlayerOptional()
  const isCurrent = (title: string) =>
    !!player?.track && player.track.album === credits.album && player.track.title === title
  /* Marked as playing only while it PLAYS, as the album page's rows are: a
     loaded but paused track wore the playing fill and read as selected. */
  const isPlaying = (title: string) => isCurrent(title) && !!player?.playing
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
      if (!byTrack.on || !byTrack.at) { box.scrollTop = 0; return }
      const el = root.querySelector<HTMLElement>(`[data-track="${byTrack.at}"]`)
      if (!el) return
      // The dialog may be mid scale-in, so rects are scaled; the ratio of
      // the box's drawn to laid-out height undoes that.
      const scale = box.getBoundingClientRect().height / box.offsetHeight || 1
      // The head overlays the scroller; land the bar under it, not behind it.
      const head = parseFloat(getComputedStyle(box).getPropertyValue("--head-h")) || 0
      box.scrollTop += (el.getBoundingClientRect().top - box.getBoundingClientRect().top) / scale - head
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
  const showAlbumCredits = () => { setByTrack({ on: false }); setTab("credits") }
  const identity = (
    <div className="flex flex-1 min-w-0 flex-row items-center gap-3">
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

  /* Track by track, "All album credits ›" stands on its own line above the
     head, left-aligned and on the ✕'s centre line: the ✕ is 32px at `top-4`
     (centre 32px down), the head starts at `pt-6`, so the 32px button moves
     up 8px (`-mt-2`); `-ml-2` puts its text on the thumb's edge.
     Tried and dropped: a pill under the head (a second, smaller thing about
     the same album); the whole head as one clickable row with the label at
     its end (its hover fill ran into the ✕, and held clear of it the label
     floated). */
  const header = byTrack.on ? (
    <div className="flex flex-col gap-2">
      <Button variant="ghost" size="sm" className="-ml-2 self-start -mt-2" onClick={showAlbumCredits}>
        All album credits
        <ChevronRight />
      </Button>
      {identity}
    </div>
  ) : identity

  /* `lead` puts facts in front — the album card names the main artist as a
     fact ("Main artist  John Coltrane"); in the album's own reading the head
     already says it. */
  const factList = (lead: [string, React.ReactNode][] = []) => <FactList credits={credits} lead={lead} />
  const overview = factList()

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
    <PersonRows list={list} onArtist={onArtist} />
  )

  /* The sticky bar every section hangs from. 48px, in the dialog's colour so
     rows pass under it. `-mx-2` + `pl-1`: the 48px play button's centre lands on
     the 40px avatars' centre and the title on the names' left edge (52px),
     so the bar and the rows share one grid. */
  /* The STICKY element is a square of the dialog's colour; the rounded band
     sits inside it. With the band itself sticky, rows scrolling under it
     showed through its rounded corners — a flicker at each corner. */
  /* Sticks UNDER the glass head (`--head-h`, measured), not at the
     scroller's top: rows run up under the head and blur there; the bar
     holds just below it. No fade under the bar — Tidal's track headers have
     none, and every gradient tried here read as a smear or a band. */
  /* The sticky bars run the dialog's FULL width (`-mx-4`, the gutter
     cancelled) with NO radius: stuck, a bar is the lower edge of the head,
     a full-width band, not a card floating under it (rounded bottom corners
     were tried, and still read as a card). The padding puts the content back on the grid — `pl-3`: the
     48px play button's centre on the avatars' centre, the title on the
     names' edge; `pr-4`: the duration on the content's right edge. */
  const stickyShell = cn(
    "sticky top-[var(--head-h,0px)] z-10 bg-popover",
    showCover && "-mx-4",
  )
  const stickyBar = (edge = false) => cn(
    "relative flex h-12 items-center gap-2",
    edge ? "rounded-none" : "rounded-md",
    /* The player has no gutter to bleed into (`showCover` off, `px-0`):
       there the bar stays inside and the button alone pulls left by 4px
       onto the same grid. */
    !showCover ? "[&>button:first-child]:-ml-1" : edge ? "pl-3 pr-4" : "pl-1 pr-2",
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
    stickyBar(true),
    "group/trackbar",
    current ? "bg-secondary" : "bg-muted",
    // No `overflow-clip`: the ripple already fills the box and inherits its
    // radius.
    "press-ripple state-fade-quick",
    playTrack && "cursor-pointer",
    !current && playTrack && "[--hover-fill:var(--secondary)]",
  )

  /* ONE container for every bar and list, not a section per track. A sticky
     element only sticks inside its parent: with a section each, the old bar
     was pushed off by its section's end BEFORE the next arrived, and for a
     moment nothing covered the top edge — the last rows of the previous song
     flashed by, cut hard. As siblings, every bar sticks to the same top and
     the next one slides over the last. `mb-6` on each list is the space a
     `gap` gave between sections. */
  /* One card, the album: its name, then the release facts led by the main
     artist — the SAME card in both readings. Track by track it ends the list
     and the whole card opens the album's credits ("All album credits ›" in
     its title row; `role="button"` because a `<button>` may not contain the
     `<dl>`). In the album's reading it sits between the people and the
     tracks and opens nothing — that is where it would lead. It was a titled
     "Release" list there and a card here: one set of facts, two looks.
     `bg-muted` and the album row's hover fill, the track bars' kin. */
  const albumCard = (link: boolean) => {
    const title = (
      <span className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-small font-medium text-foreground">{credits.album}</span>
        {link && (
          <span className="flex shrink-0 items-center gap-1 text-2xsmall text-muted-foreground">
            All album credits
            <ChevronRight aria-hidden="true" className="size-4" />
          </span>
        )}
      </span>
    )
    // Bled 8px past the gutter like the track bars, so card and bars share
    // one width; the text inside then starts on the bars' number column.
    // `rounded-md` (10): 8px in from the dialog's 18px corner — concentric
    // (outer = inner + gap). It was `rounded-xl` (12).
    const card = cn("relative flex flex-col gap-3 rounded-md bg-muted p-4 text-left", showCover && "-mx-2")
    return link ? (
      <div
        role="button"
        tabIndex={0}
        onClick={showAlbumCredits}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showAlbumCredits() } }}
        className={cn(card, "press-ripple state-fade-quick cursor-pointer outline-none focus-ring [--hover-fill:var(--secondary)]")}
      >
        {title}
        {factList([["Main artist", credits.mainArtist]])}
      </div>
    ) : (
      <div className={card}>
        {title}
        {factList([["Main artist", credits.mainArtist]])}
      </div>
    )
  }

  const trackByTrack = (
    <div className="flex flex-col">
      {credits.tracks.map((t, i) => {
        const n = i + 1
        const list = peopleOnTrack(credits.people, n).filter(p => PER_TRACK.includes(p.group))
        const current = isPlaying(t.title)
        return (
          <Fragment key={t.title}>
            <div data-track={n} className={stickyShell}>
              <div
                className={trackBar(current)}
                onClick={playTrack ? e => { if (!(e.target as Element).closest("button, a")) playTrack(t) } : undefined}
              >
                <TrackNumberPlayButton
                  number={n}
                  title={t.title}
                  playing={current}
                  onToggle={playTrack ? () => playTrack(t) : undefined}
                  // The play icon shows on a hover anywhere on the bar, since
                  // a click anywhere plays.
                  hoverGroup={playTrack ? "trackbar" : "self"}
                />
                <p className="min-w-0 flex-1 truncate text-small font-medium text-foreground">{t.title}</p>
                <span className="text-small tabular-nums text-muted-foreground">{t.duration}</span>
              </div>
            </div>
            <div className="mb-6">{personRows(list)}</div>
          </Fragment>
        )
      })}
      {albumGroups.map(([g, list]) => (
        <Fragment key={g}>
          <div className={stickyShell}>
            <div className={cn(stickyBar(true), showCover && "px-4")}>
              <SectionTitle>{GROUP_LABEL[g]}</SectionTitle>
            </div>
          </div>
          <div className="mb-6">{personRows(list)}</div>
        </Fragment>
      ))}
      {/* The end of a song's credits: the release facts (where the album's
          reading has them between people and tracks — here they would split
          the songs from their credits) and where to go next — the album's
          page, or its credits as one list. */}
      {albumCard(true)}
    </div>
  )

  const albumView = (
    <>
      {groupsOf(GROUP_ORDER).map(([g, list]) => (
        <section key={g} className="flex flex-col gap-1">
          <SectionTitle>{GROUP_LABEL[g]}</SectionTitle>
          {personRows(list)}
        </section>
      ))}
      {/* The album's tracks, two jobs: the key to the "(1, 2)" after a
          role, and the way into the track-by-track reading. They wear the
          track-by-track reading's BARS — the same band, number, play button,
          title and duration, the playing one marked — so a song looks like
          one song in both readings; here they are not sticky, stacked 4px
          apart, and ghost — filled only on hover or while playing. The bar opens that song's credits (chevron at its end);
          the number is the play button, as on the album page. It was a ruled
          text list here and a band there: one song, two looks. */}
      <section className="flex flex-col gap-1">
        <SectionTitle>Tracks</SectionTitle>
        <div className="flex flex-col gap-1">
          {credits.tracks.map((t, i) => {
            const current = isPlaying(t.title)
            const open = () => setByTrack({ on: true, at: i + 1 })
            return (
              <div
                key={t.title}
                role="button"
                tabIndex={0}
                aria-label={`${t.title} credits`}
                onClick={e => { if (!(e.target as Element).closest("button, a")) open() }}
                onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open() } }}
                className={cn(
                  stickyBar(), showCover && "-mx-2",
                  // Ghost: no fill at rest, the bars' `muted` on hover. Here
                  // they are a list to pick from, not dividers to hold, and
                  // five filled bands stacked read as a wall.
                  current ? "bg-secondary" : "[--hover-fill:var(--muted)]",
                  "press-ripple state-fade-quick cursor-pointer outline-none focus-ring",
                )}
              >
                <TrackNumberPlayButton
                  number={i + 1}
                  title={t.title}
                  playing={current}
                  onToggle={playTrack ? () => playTrack(t) : undefined}
                />
                <p className="min-w-0 flex-1 truncate text-small font-medium text-foreground">{t.title}</p>
                <span className="text-small tabular-nums text-muted-foreground">{t.duration}</span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </div>
            )
          })}
        </div>
      </section>
      {/* The release facts — where and when it was recorded, when it came
          out, on which label — in the album card, LAST, as in the
          track-by-track reading: both readings end on the album. Inert here.
          They were an Overview tab of their own, four lines a tap away from
          the credits they belong with. */}
      {albumCard(false)}
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

  /* The dialog's own gutter: 16px, at EVERY size — the ✕'s inset, so the
     thumb and the ✕ share an edge. None in the player, which pads its own
     panel. It was 12 on a phone and 24 from `md`: two layouts of one
     dialog, and at 12 the bars and the album card (which bleed 8px past the
     gutter) sat 4px from the sheet's edge. */
  const pad = showCover ? "px-4" : "px-0"

  if (layout === "page") {
    return (
      <div className={cn("flex flex-col flex-1 min-h-0 overflow-y-auto", bodyClassName)}>
        <div className={cn("flex flex-col gap-8 pt-6 pb-10", pad)}>
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

  /* The panel runs the FULL height of the body; the head lies over its top
     as glass. That is how Tidal does it, and the reason it looks calm: rows
     do not fade out at an edge, they slide under a translucent, blurred head
     and stay faintly legible there, and a 1px hairline under the head says
     "there is more above" once the panel has moved.
     Tried and dropped, in order: a hard cut (a row sliced in half); a white
     gradient veil (paled the rows, read as a band); a masked blur under each
     sticky bar (a smear with a visible start). */
  const panel = cn(
    // Bottom: the album card that ends the list sits 8px from the sheet's
    // edge, the same 8px it keeps at the sides (it bleeds 8px past the 16px
    // gutter); 40px left it floating. The home indicator still gets its room.
    "absolute inset-0 overflow-y-auto pb-[max(8px,env(safe-area-inset-bottom))]",
    // Thin, in the app's ink, on a clear track — not the browser's grey slab.
    "[scrollbar-width:thin] [scrollbar-color:var(--muted-foreground)_transparent]",
    pad,
  )
  // 12px between the head and the first line at rest.
  const panelInner = "pt-[calc(var(--head-h,0px)+12px)]"

  /* Tabs: the head and the tab bar hold, the panel under them scrolls —
     switching tabs never moves the bar out from under the finger. Credits is
     the default tab, because "Show credits" is what was asked for. */
  return (
    <Tabs
      value={tab}
      onValueChange={v => { setTab(String(v)); setScrolled(false) }}
      className={cn("relative flex flex-col flex-1 min-h-0 gap-0 rounded-[inherit]", bodyClassName)}
      style={{ "--head-h": `${headH}px` } as React.CSSProperties}
    >
      {/* The head: `.sheet-glass` (the sheet's own glass — its colour at 72%
          over a 12px blur), with Tidal's hairline under it once scrolled.
          `pt-6`, the same at every size: at 12px the thumb sat under the
          sheet's grabber. */}
      <div
        ref={headRef}
        className={cn(
          // `rounded-t-[inherit]`: the head is `backdrop-filter`, and Chrome
          // paints a backdrop-filter past an ancestor's rounded
          // `overflow: hidden` clip — the sheet's top corners showed square
          // (`isolate` on the frame did not help). The head takes the sheet's
          // own corner radius, passed down by `inherit`.
          "sheet-glass absolute inset-x-0 top-0 z-20 rounded-t-[inherit] flex flex-col gap-6 pt-6 pb-3 transition-shadow duration-200",
          scrolled ? "shadow-[0_1px_0_var(--border)]" : "shadow-none",
          pad,
        )}
      >
        {header}
        {/* No strip for ONE tab: a lone "Credits" pill switches nothing. */}
        {notes && (
          <TabsList size="sm" className="w-full">
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        )}
      </div>
      <div className="relative flex-1 min-h-0">
        <TabsContent value="credits" className={panel} onScroll={onPanelScroll}><div className={panelInner}>{creditsBody}</div></TabsContent>
        {notes && <TabsContent value="notes" className={panel} onScroll={onPanelScroll}><div className={panelInner}>{notes}</div></TabsContent>}
      </div>
    </Tabs>
  )
}

function CreditsDialogContent({ credits, focusTrack, onClose }: { credits: Credits; focusTrack?: number; onClose: () => void }) {
  const { openArtist, openAlbum } = useMediaNav()
  // Navigate, then dismiss the dialog so the destination is visible.
  const go = (fn: () => void) => { fn(); onClose() }
  const albumLinkable = hasAlbumDetail(slugify(credits.album))
  /* Comparison switch while the variants are judged — see `creditsMode`. */
  const { variant, layout } = creditsMode()
  return (
    <DialogContent
      fixedHeight
      className={cn(
        // 576, the purchase / checkout dialogs' width. It was `md:max-w-md`
        // (448), where a role line like Dolphy's wrapped to three lines.
        "md:max-w-xl",
        // `md:p-0` / `md:gap-0` are NOT redundant beside `p-0 gap-0`. The base
        // chrome sets `md:p-6 md:gap-5`, and tailwind-merge keeps a variant
        // and its unprefixed twin side by side — so from 768 up the base won
        // and padded the body twice. Cancel the variant with a variant.
        "p-0 gap-0 md:p-0 md:gap-0 overflow-hidden flex flex-col",
        // ONE height, always: 80% of the viewport, phone and desktop, tabs
        // and page alike. A height that followed the content resized the
        // sheet when the tab or the reading changed, and the base sheet's
        // grow-on-first-scroll detent jumped it to nearly full screen the
        // moment the reader scrolled — so `fixedHeight` turns that off.
        // `svh`, as every sheet height in the app (see Dialog).
        // Whole pixels, top and height. 80svh is fractional (960.8px), and
        // the base centring (`top-1/2 -translate-y-1/2`) put the sheet at
        // y = 120.1 — every sticky track bar then snapped between two pixel
        // rows as the panel scrolled, and wobbled 1–2px. `round()` makes the
        // height whole; from `md` the sheet is placed at a whole 10svh
        // (centred, since it is 80 high) instead of translated by half its
        // height.
        // EXCEPT a song in the current version: a few names, and the fixed height left
        // half the sheet empty under them, so it follows its content, capped
        // at the same 80svh. `md:max-h-…!` because the base chrome lifts the
        // cap from `md` (`md:max-h-none`) and its rule comes later in the CSS
        // — unforced, a long list ran off the screen. Its album is always
        // long and keeps the fixed height, as the draft does.
        variant === "current" && focusTrack
          ? "max-h-[round(down,80svh,1px)] md:max-h-[round(down,80svh,1px)]!"
          : "h-[round(down,80svh,1px)] max-h-[round(down,80svh,1px)] md:top-[round(down,10svh,1px)] md:translate-y-0",
      )}
    >
      <CreditsContent
        credits={credits}
        focusTrack={focusTrack}
        layout={layout}
        variant={variant}
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
export function CreditsDialogPreview({ albumKey = "a07", layout = "tabs", variant = "draft", track, songCover }: {
  albumKey?: string; layout?: CreditsLayout; variant?: CreditsVariant; songCover?: boolean
  /** A song's title — previews that song's credits instead of the album's. */
  track?: string
}) {
  const phone = useIsMobile()
  return (
    <div
      data-mobile={phone ? "sheet" : undefined}
      className={cn(
        // A fixed height, as the live dialog has one: the draft's glass head
        // lies OVER a full-height panel (absolute), so a box that only caps
        // its height collapses to nothing around it. 640 ≈ the dialog's 80svh
        // on a laptop.
        // Capped at 640 like the album's fixed frame — the live dialog caps
        // both at the same 80svh, so a song is never taller than its album.
        // Uncapped here, a song with the cover ran past the album beside it.
        "relative w-full max-h-[min(640px,80svh)] flex flex-col border border-border bg-popover overflow-hidden",
        // A song in the current version follows its content, as live.
        !(variant === "current" && track) && "h-[640px]",
        // A phone chip shows the SHEET: the dialog's own phone-preview shape
        // (`dialogPreviewPhoneClass` — full width, the sheet's top corners,
        // square at the bottom; the corner value is owned there, not here),
        // minus its padding, plus the grabber (below). It was a square box,
        // nothing like the sheet that opens.
        phone ? cn(dialogPreviewPhoneClass, "!p-0 !gap-0") : "max-w-xl rounded-xl md:rounded-2xl",
      )}
    >
      {/* The real sheet's grabber hides from `md` by the REAL window; the
          frame only pretends to be narrow, so the preview draws its own. */}
      {phone && <SheetGrabber className="absolute left-1/2 top-1.5 z-30 -translate-x-1/2" />}
      {/* The navigation handlers are passed even though this preview goes
          nowhere. `Value` renders plain text without them and a link with
          them, so leaving them off documented the wrong component: in the
          product the artist, the album and every credited name ARE links, and
          the frame has to show the underline that says so. The handlers are
          no-ops here — a DS frame must not navigate the page out from under
          the person reading it. */}
      <CreditsContent
        credits={getCredits(albumKey)}
        focusTrack={findTrack(getCredits(albumKey), track)}
        layout={layout}
        variant={variant}
        songCover={songCover}
        heading={null}
        bodyClassName="min-h-0"
        onArtist={() => {}}
        onAlbum={() => {}}
      />
      {/* The real dialog gets its ✕ from `DialogContent` (invisible on a
          phone sheet, so the phone preview draws none); this preview builds
          its own card, so it has to carry one or the frame documents a dialog
          you cannot close. Same position and size as `DialogPreview`'s, inert
          on purpose — there is nothing to dismiss. */}
      {!phone && (
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2"
        aria-label="Close (preview)"
      >
        <XIcon />
      </Button>
      )}
    </div>
  )
}
