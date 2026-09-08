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
import { Search, ChevronLeft, ChevronRight, Plus, Check, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter,
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
import { useRecentSearches } from "@/lib/use-recent-searches"

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
  const { recent, remember, clear: clearRecent } = useRecentSearches()
  // Picks are kept as full songs, not ids: a track chosen under "blue" must
  // still be listed (and removable) after the query changes to "red", when
  // it's no longer among the results to resolve an id against.
  const [picked, setPicked] = useState<SavedSong[]>([])
  // Row that was just added — drives the one-shot confirmation animation.
  const [flashed, setFlashed] = useState<string | null>(null)
  const pickedKeys = useMemo(() => new Set(picked.map(songKey)), [picked])

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

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o) }}>
      {/* Desktop: at least half the viewport (with a floor so it never gets
          cramped on small laptops). Mobile is unaffected — still a sheet. */}
      <DialogContent className="sm:max-w-[max(32rem,50vw)]">
        <DialogHeader>
          {/* The playlist is named in the TITLE rather than a description
              line — it's the one piece of context that matters, and a
              separate line costs height the keyboard is already taking. It
              does NOT change on the Find screen: what you're filling is the
              same job whether you're browsing or searching, and swapping in
              "Find" would drop the only piece of context on screen. */}
          {finding ? (
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Back to browsing"
                onClick={() => { setFinding(false); setQuery("") }}
                className="-ml-1 shrink-0"
              >
                <ChevronLeft />
              </Button>
              <DialogTitle className="flex-1 text-center truncate">
                {playlistName ? `Add to “${playlistName}”` : "Add music"}
              </DialogTitle>
              {/* Balances the chevron so the title sits optically centred. */}
              <span aria-hidden className="size-8 shrink-0" />
            </div>
          ) : (
            <DialogTitle className="sm:text-large truncate">
              {playlistName ? `Add to “${playlistName}”` : "Add music"}
            </DialogTitle>
          )}
        </DialogHeader>

        {/* An opened album takes over the sheet body; the search field and tabs
            step aside so the screen is about that one record. */}
        {album ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              {/* Not just "Back" — the page chrome already owns that label,
                   so a screen reader would announce two identical controls. */}
              <Button variant="ghost" size="icon-sm" aria-label="Back to search" onClick={() => setDrill(null)}>
                <ChevronLeft />
              </Button>
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

            <div className="flex flex-col gap-2 min-w-0 overflow-y-auto max-h-[min(60vh,calc(100dvh-var(--kb,0px)-14rem))] sm:max-h-[52vh] -mx-2 px-2">
              {albumSongs.map(s => trackRow(s, s.id))}
            </div>
          </>
        ) : finding ? (
          /* Find screen. Nothing but the query and what it returns — with a
             keyboard up there is room for one list, so the tabs and the Add
             action wait until Back. An empty query gets an invitation rather
             than a blank sheet. */
          /* The cap is measured against what the KEYBOARD leaves, not the
             viewport: the field is focused here by definition, so on a 12
             mini the sheet has ~209px, of which the header and the field
             take ~7rem. A flat `60vh` would be taller than the whole sheet
             and push the field out of reach. */
          <div className="flex flex-col gap-4 min-w-0 flex-1 overflow-y-auto max-h-[min(60vh,calc(100dvh-var(--kb,0px)-6rem))] sm:max-h-[52vh] -mx-2 px-2 pb-20">
            {searching ? searchResults : recent.length > 0 ? (
              // What they searched before beats anything we could guess at.
              <section className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 px-2">
                  <SectionLabel>Recent searches</SectionLabel>
                  <Button variant="ghost" size="sm" onClick={clearRecent} className="-mr-2">Clear</Button>
                </div>
                {recent.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuery(q)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left text-xsmall text-foreground transition-colors hover:bg-muted cursor-pointer"
                  >
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{q}</span>
                  </button>
                ))}
              </section>
            ) : (
              // Nothing to recall yet — say what the field reaches instead.
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <p className="text-large font-medium text-foreground">Search all of muza</p>
                <p className="text-small text-muted-foreground">Songs, albums and artists.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Source tabs, not a content-type strip: everything here is
                either a candidate or already chosen. While searching the only
                source is the results; otherwise you pick between Suggested and
                your own library. Selection appears with the first pick and
                LEADS, so it's never scrolled off. */}
            <div className="min-w-0">
              <MobilePillTabs
                value={tab}
                onChange={v => setTab(v as TabKey)}
                // Match the dialog's own gutter so scrolled pills run to the
                // sheet edge instead of being cropped inside it.
                className="-mx-3 px-3 sm:-mx-6 sm:px-6"
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

            <div className="flex flex-col gap-4 min-w-0 overflow-y-auto max-h-[min(60vh,calc(100dvh-var(--kb,0px)-14rem))] sm:max-h-[52vh] -mx-2 px-2">
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

        {/* Search sits at the BOTTOM, directly above the confirming action:
            it's the thumb's half of the sheet on a phone, and the keyboard
            opens against it instead of pushing the list away. Rendered ONCE,
            outside the branches, so entering Find doesn't remount it and
            throw away the focus that got us there. */}
        {!album && (
          <div
            className={cn(
              // On the Find screen the field FLOATS over the results instead
              // of holding a band of its own: the list runs under it (hence
              // the body's `pb-20`), which buys back the ~50px the keyboard
              // took. Browsing, it's an ordinary row above the Add action.
              finding && "absolute inset-x-3 bottom-3 z-10",
            )}
          ><Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFinding(true)}
            // Enter commits the query to the recent list — the same moment
            // the on-screen keyboard's "search" key fires.
            onKeyDown={e => { if (e.key === "Enter") remember(query) }}
            // Browsing, the rows above are the user's OWN library, so the
            // placeholder carries the scope. On the Find screen the header
            // already says it, so one word is enough.
            placeholder={finding ? "Search" : "Search all of muza"}
            aria-label="Search all of muza for songs or albums"
            startIcon={<Search />}
            onClear={() => setQuery("")}
            className={cn(
              // 48px to match the `lg` action below it — the two form one
              // bottom band, so they share a height.
              "h-12",
              // Floating, it needs its own surface and a lift: rows scroll
              // directly beneath it.
              finding && "bg-popover shadow-lg",
            )}
          />
          </div>
        )}

        {/* No Cancel — the sheet's own ✕ closes it, and a second dismissing
            control next to the confirming one just splits the target.
            Hidden while finding: the field is the bottom band there, and the
            picks are still waiting under Selection once Back is pressed. */}
        <DialogFooter className={cn(finding && "hidden")}>
          <Button size="lg" onClick={done} disabled={picked.length === 0}>
            {/* Name the unit, not just the number — "Add 4" reads as an
                ordinal on a row of tracks. Singular when it's one. */}
            {picked.length > 0
              ? `Add ${picked.length} ${picked.length === 1 ? "track" : "tracks"}`
              : "Add"}
          </Button>
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
