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
 * Prototype: the "My library" browse rows are structural (no drill-in yet) and
 * Done only toasts; wire `onAdd` to a real playlist-tracks mutation.
 */

import { useEffect, useMemo, useState } from "react"
import { Search, Mic, Disc3, Music2, ListMusic, Clock, ChevronLeft, Plus, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectTrackButton } from "@/components/ui/select-track-button"
import { AddMusicIcon } from "@/components/ui/media-icons"
import { NavRow } from "@/components/ui/nav-row"
import { MobilePillTabs } from "@/components/ui/mobile-header"
import { useToast, TOAST_CONFIRM_MS } from "@/components/ui/toast"
import { MediaListItem } from "@/components/ui/media-list-item"
import { SAVED_SONGS_SEED } from "@/components/app/library-songs-view"
import { getAlbumDetail, hasAlbumDetail } from "@/lib/album-catalog"
import { searchCatalog, type SearchResult } from "@/lib/search-catalog"
import { slugify } from "@/lib/media-nav"
import type { SavedSong } from "@/lib/user-library"

const BROWSE = [
  { icon: <Mic />,       label: "Artists" },
  { icon: <Disc3 />,     label: "Albums" },
  { icon: <Music2 />,    label: "Songs" },
  { icon: <ListMusic />, label: "Playlists" },
]

/* A song is the same song wherever it was picked from — a search hit, a
 * suggestion, or a track inside an album. Identity is title+artist rather than
 * the source row's id, so adding an album and then the same track from search
 * can't produce a duplicate. */
const songKey = (s: SavedSong) => `${slugify(s.title)}|${slugify(s.artist ?? "")}`

export function AddMusicDialog({
  open, onOpenChange, playlistName, onAdd,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Shown in the description so the user knows what they're filling. */
  playlistName?: string
  /** Called with the chosen tracks when Done is pressed. */
  onAdd?: (songs: SavedSong[]) => void
}) {
  const { add: toast } = useToast()
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<"results" | "selection">("results")
  /** Album opened from the results list — its own screen inside the sheet. */
  const [drill, setDrill] = useState<string | null>(null)
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

  // Nothing left to select? The Selection tab goes with it.
  useEffect(() => {
    if (tab === "selection" && picked.length === 0) setTab("results")
  }, [tab, picked.length])

  const reset = () => {
    setQuery(""); setTab("results"); setDrill(null); setPicked([]); setFlashed(null)
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

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o) }}>
      {/* Desktop: at least half the viewport (with a floor so it never gets
          cramped on small laptops). Mobile is unaffected — still a sheet. */}
      <DialogContent className="sm:max-w-[max(32rem,50vw)]">
        <DialogHeader>
          <DialogTitle className="text-large">Add music</DialogTitle>
          <DialogDescription>
            {playlistName ? `Pick tracks for “${playlistName}”.` : "Pick tracks for your playlist."}
          </DialogDescription>
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

            <div className="flex flex-col gap-2 min-w-0 overflow-y-auto max-h-[60vh] sm:max-h-[52vh] -mx-2 px-2">
              {albumSongs.map(s => trackRow(s, s.id))}
            </div>
          </>
        ) : (
          <>
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              // The rows below are the user's OWN library, so the placeholder
              // carries the scope: this searches everything, not just those.
              placeholder="Search all of muza"
              aria-label="Search all of muza for songs or albums"
              startIcon={<Search />}
              onClear={() => setQuery("")}
            />

            {/* Two tabs, not a content-type strip: everything here is either a
                candidate or already chosen. Selection appears with the first
                pick and leads, so it's never scrolled off. */}
            {picked.length > 0 && (
              <div className="min-w-0">
                <MobilePillTabs
                  value={tab}
                  onChange={v => setTab(v as "results" | "selection")}
                  // Match the dialog's own p-6 gutter so scrolled pills run to
                  // the sheet edge instead of being cropped 12px inside it.
                  className="-mx-6 px-6"
                  tabs={[
                    { value: "selection", label: "Selection", icon: <AddMusicIcon />, count: picked.length },
                    { value: "results",   label: searching ? "Results" : "Browse" },
                  ]}
                />
              </div>
            )}

            <div className="flex flex-col gap-4 min-w-0 overflow-y-auto max-h-[60vh] sm:max-h-[52vh] -mx-2 px-2">
              {tab === "selection" ? (
                // Everything picked so far, regardless of the query it came from.
                <section className="flex flex-col gap-2">
                  {picked.map(s => trackRow(s, songKey(s)))}
                </section>
              ) : searching ? (
                <>
                  {songHits.length > 0 && (
                    <section className="flex flex-col gap-2">
                      <SectionLabel>Songs</SectionLabel>
                      {songHits.map(r => trackRow(asSong(r), r.id))}
                    </section>
                  )}

                  {/* Albums aren't tickable — you open one and add it from
                      inside, so the row reads as navigation (chevron). */}
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
                        />
                      ))}
                    </section>
                  )}

                  {songHits.length === 0 && albumHits.length === 0 && (
                    <p className="px-2 py-6 text-small text-muted-foreground">
                      No songs or albums for “{query}”.
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Browse — structural entry points into the user's own library. */}
                  <section className="flex flex-col gap-2">
                    <SectionLabel>My library</SectionLabel>
                    {BROWSE.map(b => (
                      <NavRow key={b.label} icon={b.icon} label={b.label} />
                    ))}
                    <NavRow icon={<Clock />} label="Recently added music" />
                  </section>

                  {/* Suggested tracks — the multi-select list. */}
                  <section className="flex flex-col gap-2">
                    <SectionLabel>Suggested tracks</SectionLabel>
                    {SAVED_SONGS_SEED.map(s => trackRow(s, s.id))}
                  </section>
                </>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button onClick={done} disabled={picked.length === 0}>
            {picked.length > 0 ? `Add ${picked.length}` : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-2 pt-1 text-xsmall text-muted-foreground">{children}</p>
}
