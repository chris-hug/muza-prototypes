"use client"

/*
 * AddMusicDialog — the "Add music" step of the playlist flow.
 *
 * Structure follows the Figma flow (5953:181957) and the pattern every major
 * player converges on:
 *
 *   · SEARCH returns SONGS only. Artists / playlists / labels aren't addable,
 *     so a tab strip over them would offer dead ends. Albums appear as a
 *     separate section of drill-in rows, never as tickable results.
 *   · ALBUMS drill in (Apple Music's browse half): open one and you can add
 *     the whole record in a tap, or pick individual tracks off it.
 *   · SELECTION is its own tab, so picks made under one query stay visible
 *     after the query changes.
 *
 * Built on the base Dialog (bottom sheet on mobile, centred modal on desktop)
 * and existing DS parts only — Input, Button, Chip tabs, MediaListItem, toast.
 *
 *   · SOURCES are tabs, not nav rows: Recently played · My songs · My albums.
 *     The old Artists/Albums/Songs/Playlists nav rows put five taps of chrome
 *     in front of the tracks and drilled nowhere.
 *
 * Prototype: Done only toasts; wire `onAdd` to a real playlist-tracks mutation.
 */

import { useEffect, useMemo, useState } from "react"
import { Search, ChevronLeft, ChevronRight, Plus, Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose, DialogActionBar, dialogListClass,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectTrackButton } from "@/components/ui/select-track-button"
import { AddMusicIcon } from "@/components/ui/media-icons"
import { MobilePillTabs } from "@/components/ui/mobile-header"
import { useToast, TOAST_CONFIRM_MS } from "@/components/ui/toast"
import { MediaListItem } from "@/components/ui/media-list-item"
import { getAlbumDetail, getAllAlbums, getRichAlbums, hasAlbumDetail } from "@/lib/album-catalog"
import { searchCatalog, type SearchResult } from "@/lib/search-catalog"
import { slugify } from "@/lib/media-nav"
import { useUserLibrary, type SavedSong } from "@/lib/user-library"
import { useIsMobile } from "@/lib/use-media-query"

/* A song is the same song wherever it was picked from — a search hit, a
 * suggestion, or a track inside an album. Identity is title+artist rather than
 * the source row's id, so adding an album and then the same track from search
 * can't produce a duplicate. */
const songKey = (s: SavedSong) => `${slugify(s.title)}|${slugify(s.artist ?? "")}`

/** Which source of tracks is showing. `results` replaces the idle pair while
 *  a query is active; `selection` is always available once something is picked. */
type TabKey = "recent" | "songs" | "albums" | "results" | "selection"

export function AddMusicDialog({
  open, onOpenChange, playlistName, onAdd,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Named in the title so the user knows what they're filling. */
  playlistName?: string
  /** Called with the chosen tracks when Done is pressed. */
  onAdd?: (songs: SavedSong[]) => void
}) {
  const { add: toast } = useToast()
  // The header is a BAR on a phone (title between the two controls) and the
  // ordinary left-aligned header on desktop — see the render.
  const isMobile = useIsMobile()
  // "My library" = everything the user has liked, newest first.
  const library = useUserLibrary()
  const librarySongs = library.songs()
  const [query, setQuery] = useState("")
  // Which source is on screen. `results` only exists while searching;
  // `suggested` / `library` are the two idle sources.
  const [tab, setTab] = useState<TabKey>("recent")
  /** Album opened from the results list — its own screen inside the sheet. */
  const [drill, setDrill] = useState<string | null>(null)
  /* Focusing the field turns the sheet into a SEARCH screen ("Find"): the
   * browse chrome — tabs, list, the Add action — steps aside, because with a
   * keyboard up none of it is reachable anyway. Back returns to browsing.
   * Same move TIDAL and Apple Music make on the equivalent step. */
  const [finding, setFinding] = useState(false)
  // Picks are kept as full songs, not ids: a track chosen under "blue" must
  // still be listed (and removable) after the query changes to "red", when
  // it's no longer among the results to resolve an id against.
  const [picked, setPicked] = useState<SavedSong[]>([])
  // Row that was just added — drives the one-shot confirmation animation.
  const [flashed, setFlashed] = useState<string | null>(null)
  const pickedKeys = useMemo(() => new Set(picked.map(songKey)), [picked])
  /* The confirming action belongs to the BROWSE screen's footer. On the Find
   * screen it moves into the header bar instead (see `barAction`): the band
   * there floats over the results, and a second control in it costs a row of
   * a list that is two rows tall with the keyboard up — while the bar is
   * already on screen and costs nothing. It also can't be mistaken for "show
   * me these results", which is what a blue button under the field read as. */
  const showAdd = !finding
  const barAction = finding && picked.length > 0

  // Typing runs the app's GLOBAL search (the same `searchCatalog` the Explore
  // results use), then keeps only what can actually go into a playlist.
  const searching = query.trim().length > 0
  const results = useMemo(() => (searching ? searchCatalog(query.trim()) : []), [query, searching])
  const songHits = results.filter(r => r.kind === "song")
  // Albums are drill-in rows, so only those with a real track list qualify.
  const albumHits = results.filter(r => r.kind === "album" && hasAlbumDetail(r.navKey))

  const asSong = (r: SearchResult): SavedSong => ({
    id:       r.libraryId ?? r.id,
    title:    r.title,
    artist:   r.artist,
    album:    r.album,
    cover:    r.cover,
    duration: r.duration,
  })

  // Recently played — PROTOTYPE DATA. There is no play-history store yet, so
  // this is a deterministic spread from the rich catalog (one track per
  // record) standing in for one. Swap the source when history exists; the tab
  // itself doesn't change.
  const recentlyPlayed = useMemo(() => (
    getRichAlbums().slice(0, 12).map(a => ({
      id: `${a.id}-${a.tracks[0]?.id ?? "t1"}`,
      title: a.tracks[0]?.title ?? a.title,
      artist: a.artist,
      album: a.title,
      cover: a.cover,
      duration: a.tracks[0]?.duration,
    } as SavedSong))
  ), [])

  // My albums — the saved albums, as drill-in rows. An album isn't tickable:
  // you open it and add the whole record or pick tracks off it, the same way
  // album hits behave in search results.
  const libraryAlbums = useMemo(
    () => getAllAlbums().filter(a => library.inLibrary("album", a.id)),
    [library],
  )

  // The opened album, flattened to selectable songs.
  const album = drill ? getAlbumDetail(drill) : null
  const albumSongs: SavedSong[] = album
    ? album.tracks.map(t => ({
        id: `${album.id}-${t.id}`, title: t.title, artist: album.artist,
        album: album.title, cover: album.cover, duration: t.duration,
      }))
    : []
  const albumFullyPicked = albumSongs.length > 0 && albumSongs.every(s => pickedKeys.has(songKey(s)))

  const toggle = (song: SavedSong) => {
    const key = songKey(song)
    const isOn = pickedKeys.has(key)
    setPicked(prev => isOn ? prev.filter(p => songKey(p) !== key) : [...prev, song])
    // Only adding gets the confirmation flash; removing needs no applause.
    if (!isOn) setFlashed(key)
  }

  /** Whole-album add / remove — the reason albums are here at all. */
  const toggleAlbum = () => {
    if (albumFullyPicked) {
      const drop = new Set(albumSongs.map(songKey))
      setPicked(prev => prev.filter(p => !drop.has(songKey(p))))
      return
    }
    setPicked(prev => {
      const have = new Set(prev.map(songKey))
      return [...prev, ...albumSongs.filter(s => !have.has(songKey(s)))]
    })
  }

  // Clear the flash so re-picking the same row replays the animation. Must
  // outlast the sweep in `.muza-row-added`, or the class is pulled mid-run.
  useEffect(() => {
    if (!flashed) return
    const t = setTimeout(() => setFlashed(null), 300)
    return () => clearTimeout(t)
  }, [flashed])

  // Keep the active tab on a tab that still exists: Selection disappears with
  // the last pick, and Results / the idle pair swap as the query comes and goes.
  useEffect(() => {
    if (tab === "selection") {
      if (picked.length === 0) setTab(searching ? "results" : "recent")
      return
    }
    if (searching && tab !== "results") setTab("results")
    if (!searching && tab === "results") setTab("recent")
  }, [tab, picked.length, searching])

  const reset = () => {
    setQuery(""); setTab("recent"); setDrill(null); setPicked([]); setFlashed(null); setFinding(false)
  }

  const done = () => {
    onAdd?.(picked)
    toast({
      title: `${picked.length} ${picked.length === 1 ? "song" : "songs"} added`,
      description: playlistName ? `Added to “${playlistName}”.` : undefined,
      type: "success",
      timeout: TOAST_CONFIRM_MS,
    })
    reset()
    onOpenChange(false)
  }

  /** One selectable track row — same in results, suggestions and Selection. */
  const trackRow = (s: SavedSong, key: string) => {
    const on = pickedKeys.has(songKey(s))
    return (
      <MediaListItem
        key={key}
        type="song"
        cover={s.cover}
        title={s.title}
        subtitle={s.artist}
        meta={s.album}
        onOpen={() => toggle(s)}
        className={cn(
          on && "bg-muted",
          flashed === songKey(s) && "muza-row-added",
        )}
        trailing={<SelectTrackButton selected={on} />}
      />
    )
  }

  /* Hits for the current query. Shared by the browse view's Results tab and
   * the Find screen, so the two can't drift apart. */
  const searchResults = (
    <>
      {songHits.length > 0 && (
        <section className="flex flex-col gap-2">
          {songHits.map(r => trackRow(asSong(r), r.id))}
        </section>
      )}

      {/* Albums aren't tickable — you open one and add it from inside, so the
          row reads as navigation (chevron). */}
      {albumHits.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>Albums</SectionLabel>
          {albumHits.map(r => (
            <MediaListItem
              key={r.id}
              type="album"
              cover={r.cover}
              title={r.title}
              subtitle={r.subtitle}
              meta={r.meta}
              onOpen={() => setDrill(r.navKey!)}
              trailing={<ChevronRight className="size-4 text-muted-foreground mr-2" />}
            />
          ))}
        </section>
      )}

      {songHits.length === 0 && albumHits.length === 0 && (
        <EmptyNote>No songs or albums for “{query}”.</EmptyNote>
      )}
    </>
  )

  /* ONE back control for the whole sheet, whatever it's showing: an opened
     album returns to the list it came from, and the Find screen returns to
     browsing. Nested screens each carrying their own chevron would put two
     identical controls on screen. Undefined on the top-level browse screen —
     on a phone the bar keeps the slot's width so the title doesn't shift. */
  const back = (album || finding) ? (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={album ? "Back to the list" : "Back to browsing"}
      onClick={() => {
        if (album) { setDrill(null); return }
        setFinding(false); setQuery("")
      }}
      // Optical, not box, alignment on desktop: the button is 32px wide
      // around a 16px icon, so its box has to hang 8px left for the CHEVRON
      // to sit on the same line as the covers below.
      className="touch-target shrink-0 md:-ml-2"
    >
      <ChevronLeft />
    </Button>
  ) : undefined

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o) }}>
      {/* Desktop: at least half the viewport (with a floor so it never gets
          cramped on small laptops). Mobile is unaffected — still a sheet. */}
      {/* On a phone this sheet always fills everything the keyboard leaves,
          rather than sizing to its content: it's a picker, so more rows on
          screen is strictly better, and a sheet that changes height as you
          switch tabs or start typing reads as jumping. `h-…` (not just the
          base `max-h-…`) is what pins the top edge. Desktop keeps the
          content-sized modal, capped at 85vh. */}
      {/* `overflow-hidden`: the sheet's bands are fixed and the LIST scrolls,
          never the sheet. Letting the popup scroll cost both of the things a
          find screen needs to hold still — the browser scrolls a focused
          field into view inside whatever box can scroll, so opening the
          keyboard carried the title off the top, and scrolling the results
          then carried the search field off the bottom. */}
      <DialogContent
        showCloseButton={!isMobile}
        /* The bar is absolute, so the sheet reserves its height as padding.
           Every screen clears it that way — the album step's own header sat
           under the title before this — and the ONE screen that wants rows
           passing behind the glass, Find, cancels the padding on its list. */
        className="md:max-w-[max(32rem,50vw)] flex flex-col overflow-hidden max-md:pt-[var(--sheet-bar-h)] h-[calc(100svh-var(--kb,0px)-8px-env(safe-area-inset-top))] md:h-auto md:max-h-[85vh]"
      >
        {/* The playlist is named in the TITLE rather than a description line
            — it's the one piece of context that matters, and a separate line
            costs height the keyboard is already taking. It does NOT change on
            the Find screen: what you're filling is the same job whether
            you're browsing or searching, and swapping in "Find" would drop
            the only piece of context on screen.

            On a phone it is a BAR — back · title · ✕ on one line, the same
            shape as the New Playlist sheet — rather than the header's
            stacked layout. Two reasons: the controls were already on their
            own line above the title, so the title's line was pure cost at a
            keyboard height, and a sheet whose ✕ hangs in the corner reads as
            a different kind of surface from the one it chains into. Gated by
            `useIsMobile` so only ONE `DialogTitle` is ever mounted. */}
        {isMobile ? (
          <DialogActionBar
            /* OUT of the flow, so the list runs full height underneath it and
               you can see what is scrolling behind the title — which is also
               why it keeps its glass. `absolute` and not `sticky`: the popup
               is `overflow-hidden`, so a sticky bar has nothing to stick to,
               while an absolute one is anchored to a box that never scrolls.
               The list pays for it in padding (`--sheet-bar-h`). */
            className="absolute inset-x-0 top-0 z-10 px-1"
            leading={back ?? <span className="size-8 shrink-0" />}
            /* The bar's trailing slot is dismissal — EXCEPT on the Find
               screen with something picked, where it is the confirming
               action. Nothing is lost: ‹ is the way back from Find, and the
               sheet's own ✕ returns the moment the picks are in. */
            trailing={barAction ? (
              <Button size="sm" onClick={done} className="touch-target shrink-0">
                {`Add ${picked.length}`}
              </Button>
            ) : (
              <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="Close" className="touch-target" />}>
                <X />
              </DialogClose>
            )}
          >
            <DialogTitle className="truncate">
              {playlistName ? `Add to “${playlistName}”` : "Add music"}
            </DialogTitle>
          </DialogActionBar>
        ) : (
          <DialogHeader className="shrink-0" leading={back}>
            <DialogTitle className="md:text-large truncate">
              {playlistName ? `Add to “${playlistName}”` : "Add music"}
            </DialogTitle>
          </DialogHeader>
        )}

        {/* An opened album takes over the sheet body; the search field and tabs
            step aside so the screen is about that one record. */}
        {album ? (
          <>
            {/* No back control here — the header's `leading` slot owns it,
                so there is exactly one "back" on screen at a time. */}
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base text-foreground">{album.title}</p>
                <p className="truncate text-xsmall text-muted-foreground">
                  {album.artist} · {album.tracks.length} tracks
                </p>
              </div>
              {/* The whole record in one tap — flips to a remove-all once every
                  track is in, so the button always states the next action. */}
              <Button
                variant={albumFullyPicked ? "secondary" : "outline"}
                size="sm"
                onClick={toggleAlbum}
                className="shrink-0"
              >
                {albumFullyPicked ? <Check /> : <Plus />}
                {albumFullyPicked ? "Added" : "Add album"}
              </Button>
            </div>

            <div className={cn(dialogListClass, "gap-2")}>
              {albumSongs.map(s => trackRow(s, s.id))}
            </div>
          </>
        ) : finding && !searching ? (
          /* No query yet. The screen says what the field reaches and nothing
             else — no recent searches: with a keyboard up this band is ~60px,
             one row, and a history list there is a heading, a Clear and a
             single stale query where the results are about to be. The app's
             own search keeps its history (`SearchPanel`); a sheet you opened
             to add a track does not need one.

             It is NOT rendered inside the list: a `flex-1` box inside a
             scroll container is exactly the case WebKit collapses to zero
             height, which showed as a blank sheet with a field at the bottom.
             As its own band between the two overlaying ones it needs no
             scroll box and no flex bargaining. */
          <div
            data-slot="find-empty"
            className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center -mt-[var(--sheet-bar-h)] pt-[var(--sheet-bar-h)] -mb-3 pb-[var(--sheet-band-h)]"
          >
            <p className="text-large font-medium text-foreground">Search all of muza</p>
            <p className="text-small text-muted-foreground">Songs, albums and artists.</p>
          </div>
        ) : finding ? (
          /* Find screen. Nothing but the query and what it returns — with a
             keyboard up there is room for one list, so the tabs and the Add
             action wait until Back. An empty query gets an invitation rather
             than a blank sheet. */
          /* `flex-1 min-h-0`, never a `vh` cap: the sheet is a flex column
             that already ends at `--kb`, so the list takes exactly what the
             other bands leave. A viewport-relative cap can't know that and
             runs the list under the footer. The floating band overlays this
             list rather than sitting below it — a spacer at the end of the
             content clears it. */
          <div
            className={cn(
              dialogListClass,
              "gap-4",
              // Full height, with the two overlaying bands paid for in
              // padding rather than in layout: rows scroll behind the glass
              // bar and behind the floating field instead of stopping at
              // them.
              // The list box IS the sheet: it bleeds over the sheet's own
              // padding (the reserved bar height at the top, the gutter at
              // the bottom) and puts both back as padding of its own, so
              // rows reach both edges and scroll behind the two bands
              // instead of stopping at them.
              "-mt-[var(--sheet-bar-h)] -mb-3 pt-[var(--sheet-bar-h)] pb-[var(--sheet-band-h)]",
            )}
          >
            {searchResults}
          </div>
        ) : (
          <>
            {/* Source tabs, not a content-type strip: everything here is
                either a candidate or already chosen. While searching the only
                source is the results; otherwise you pick between Suggested and
                your own library. Selection appears with the first pick and
                LEADS, so it's never scrolled off. */}
            <div className="min-w-0 shrink-0">
              <MobilePillTabs
                value={tab}
                onChange={v => setTab(v as TabKey)}
                // Match the dialog's own gutter so scrolled pills run to the
                // sheet edge instead of being cropped inside it.
                className="-mx-3 px-3 md:-mx-6 md:px-6"
                tabs={[
                  ...(picked.length > 0
                    ? [{ value: "selection", label: "Selection", icon: <AddMusicIcon />, count: picked.length }]
                    : []),
                  ...(searching
                    ? [{ value: "results", label: "Results" }]
                    : [
                        { value: "recent", label: "Recently played" },
                        { value: "songs",  label: "My songs",  count: librarySongs.length },
                        { value: "albums", label: "My albums", count: libraryAlbums.length },
                      ]),
                ]}
              />
            </div>

            {/* The only flexible band. `min-h-0` is what lets it SHRINK — a
                flex item defaults to `min-height: auto`, so without it the
                list keeps its content height, overflows the sheet, and the
                last rows are sliced by the footer.
                `-mb-2 md:-mb-5` eats the sheet's own gap so the list runs up to
                the footer: the bar's edge is what cuts the content off, with
                no strip of empty sheet between them. */}
            <div className={cn(dialogListClass, "gap-4 -mb-2 md:-mb-5")}>
              {tab === "selection" ? (
                // Everything picked so far, regardless of the query it came from.
                <section className="flex flex-col gap-2">
                  {picked.map(s => trackRow(s, songKey(s)))}
                </section>
              ) : searching ? (
                searchResults
              ) : tab === "songs" ? (
                // Everything the user has liked — the most direct source, and
                // the one they can act on without drilling anywhere.
                <section className="flex flex-col gap-2">
                  {librarySongs.length > 0 ? librarySongs.map(s => trackRow(s, s.id)) : (
                    <EmptyNote>Nothing saved yet — like a few songs and they'll show up here.</EmptyNote>
                  )}
                </section>
              ) : tab === "albums" ? (
                // Albums are containers, so they're drill-in rows (chevron),
                // never tickable — open one to add the record or pick tracks.
                <section className="flex flex-col gap-2">
                  {libraryAlbums.length > 0 ? libraryAlbums.map(a => (
                    <MediaListItem
                      key={a.id}
                      type="album"
                      cover={a.cover}
                      title={a.title}
                      subtitle={a.artist}
                      meta={String(a.year)}
                      onOpen={() => setDrill(a.id)}
                      // Chevron, not a tick: the row goes somewhere, it
                      // doesn't select. Sits where the tick sits on track
                      // rows, so the two are told apart at a glance.
                      trailing={<ChevronRight className="size-4 text-muted-foreground mr-2" />}
                    />
                  )) : (
                    <EmptyNote>No saved albums yet.</EmptyNote>
                  )}
                </section>
              ) : (
                <section className="flex flex-col gap-2">
                  {recentlyPlayed.map(s => trackRow(s, s.id))}
                </section>
              )}
            </div>
          </>
        )}

        {/* ONE bottom band: the search field and the confirming action share
            the footer, so the sheet has a single edge of chrome rather than a
            field floating just above a bar. `flex-col` (not the footer's
            default `flex-col-reverse`) puts the field on top, where the
            keyboard opens against it.

            No Cancel — the sheet's own ✕ closes it, and a second dismissing
            control next to the confirming one just splits the target. */}
        <DialogFooter
          className={cn(
            "shrink-0 mt-0 flex-col md:flex-row md:items-center",
            /* On the Find screen the band carries the field ALONE, and a
               field is not a bar: no surface, no edge, and out of the flow so
               the results run underneath it. It scrolled away when this was
               tried before — but that was while the POPUP was the scroll box,
               and an absolute box inside a scroll container travels with the
               content. The list is the scroll box now; the band is anchored
               to a popup that never moves.

               `mx-0`/`mb-0` cancel the footer's own full-bleed negative
               margins: on an absolutely positioned box those ADD to the
               insets, so the band would hang 12px outside the sheet. */
            finding && "absolute inset-x-0 bottom-0 z-10 mx-0 mt-0 mb-0 border-t-0 bg-transparent",
          )}
        >
          {/* The album screen is about one record, so there's nothing to
              search from inside it. */}
          {!album && (
            <div className="w-full min-w-0 md:flex-1">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFinding(true)}
                // Browsing, the rows above are the user's OWN library, so the
                // placeholder carries the scope. On the Find screen the header
                // already says it, so one word is enough.
                placeholder={finding ? "Search" : "Search all of muza"}
                aria-label="Search all of muza for songs or albums"
                startIcon={<Search />}
                onClear={() => setQuery("")}
                className={cn(
                  // 48px, matching the `lg` action beside it.
                  "h-12",
                  // Floating over the rows, so it carries its own surface and
                  // a lift — without them the titles scrolling past show
                  // through the input.
                  finding && "bg-popover shadow-lg",
                )}
              />
            </div>
          )}

          {/* On the Find screen the action rides along in the floating band,
              but only once there IS something to add AND the query has been
              submitted — an empty, disabled button would take a second row of
              the little the keyboard leaves, and one sitting under a field the
              user is still typing into gets mistaken for "show results". */}
          {showAdd && (
            <Button size="lg" onClick={done} disabled={picked.length === 0} className="w-full md:w-auto">
              {/* Name the unit, not just the number — "Add 4" reads as an
                  ordinal on a row of tracks. Singular when it's one. */}
              {picked.length > 0
                ? `Add ${picked.length} ${picked.length === 1 ? "track" : "tracks"}`
                : "Add"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-6 text-small text-muted-foreground">{children}</p>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-2 pt-1 text-xsmall text-muted-foreground">{children}</p>
}
