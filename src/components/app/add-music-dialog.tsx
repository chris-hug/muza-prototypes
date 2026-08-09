"use client"

/*
 * AddMusicDialog — the "Add music" step of the playlist flow.
 *
 * Structure follows the Figma flow (5953:181957), mirroring Apple Music:
 *   search field → "My library" browse rows (Artists / Albums / Songs /
 *   Playlists) → "Suggested tracks" as a MULTI-SELECT list, with the count
 *   confirmed in the footer.
 *
 * Built on the base Dialog (bottom sheet on mobile, centred modal on desktop)
 * and existing DS parts only — Input, Checkbox, Button, toast.
 *
 * Prototype: the browse rows are structural (no drill-in yet) and Done only
 * toasts; wire `onAdd` to a real playlist-tracks mutation when one exists.
 */

import { useEffect, useMemo, useState } from "react"
import { Search, Mic, Disc3, Music2, ListMusic, Clock } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { NavRow } from "@/components/ui/nav-row"
import { MobilePillTabs } from "@/components/ui/mobile-header"
import { useToast } from "@/components/ui/toast"
import { MediaListItem } from "@/components/ui/media-list-item"
import { SAVED_SONGS_SEED } from "@/components/app/library-songs-view"
import { searchCatalog, type SearchKind, type SearchResult } from "@/lib/search-catalog"
import type { SavedSong } from "@/lib/user-library"

const BROWSE = [
  { icon: <Mic />,       label: "Artists" },
  { icon: <Disc3 />,     label: "Albums" },
  { icon: <Music2 />,    label: "Songs" },
  { icon: <ListMusic />, label: "Playlists" },
]

// Same content-type tabs as the main search results.
type TabKey = "all" | SearchKind
const TABS: { key: TabKey; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "song",     label: "Songs" },
  { key: "artist",   label: "Artists" },
  { key: "album",    label: "Albums" },
  { key: "playlist", label: "Playlists" },
  { key: "label",    label: "Labels" },
]

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
  const [tab, setTab] = useState<TabKey>("all")
  const [picked, setPicked] = useState<Set<string>>(new Set())

  // Typing runs the app's GLOBAL search (the same `searchCatalog` the Explore
  // results use), and the sheet switches to the standard search-results
  // pattern: content-type tabs over the matches.
  const searching = query.trim().length > 0
  const results = useMemo(() => (searching ? searchCatalog(query.trim()) : []), [query, searching])

  // Only offer tabs that actually have results (All always shown) — same rule
  // as SearchResultsView, so users never land on an empty tab.
  const counts = results.reduce((c, r) => { c[r.kind] = (c[r.kind] ?? 0) + 1; return c }, {} as Record<SearchKind, number>)
  const visibleTabs = TABS.filter(t => t.key === "all" || (counts[t.key as SearchKind] ?? 0) > 0)
  const visible = tab === "all" ? results : results.filter(r => r.kind === tab)

  // Fall back to All when the active tab empties out as the query narrows.
  useEffect(() => {
    if (tab !== "all" && !results.some(r => r.kind === tab)) setTab("all")
  }, [tab, results])

  // Songs are the selectable rows — in results and in the idle suggestions.
  const asSong = (r: SearchResult): SavedSong => ({
    id:       r.libraryId ?? r.id,
    title:    r.title,
    artist:   r.artist,
    album:    r.album,
    cover:    r.cover,
    duration: r.duration,
  })
  // Everything the user could have picked, for resolving the selection.
  const selectable: SavedSong[] = searching
    ? results.filter(r => r.kind === "song").map(asSong)
    : SAVED_SONGS_SEED

  const toggle = (id: string) => setPicked(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const reset = () => { setQuery(""); setTab("all"); setPicked(new Set()) }

  const done = () => {
    // Resolve against what's on screen — picks can come from global search
    // results, not just the suggestion seed.
    const chosen = selectable.filter(s => picked.has(s.id))
    onAdd?.(chosen)
    toast({
      title: `${chosen.length} ${chosen.length === 1 ? "song" : "songs"} added`,
      description: playlistName ? `Added to “${playlistName}”.` : undefined,
      type: "success",
    })
    reset()
    onOpenChange(false)
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

        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for tracks, artists or albums"
          aria-label="Search for music"
          startIcon={<Search />}
          onClear={() => setQuery("")}
        />

        {/* Searching → the standard results pattern (content-type tabs over
            the matches). Idle → browse entry points + suggestions. */}
        {searching && (
          // Scrollable pills — the same filter control the mobile search
          // results use (this sheet is a bottom sheet on phones).
          <div className="min-w-0">
            <MobilePillTabs
              value={tab}
              onChange={v => setTab(v as TabKey)}
              tabs={visibleTabs.map(t => ({ value: t.key, label: t.label }))}
            />
          </div>
        )}

        <div className="flex flex-col gap-4 min-w-0 overflow-y-auto max-h-[52vh] -mx-2 px-2">
          {searching ? (
            <section className="flex flex-col gap-1">
              {visible.map(r => {
                // Songs are selectable; other types are nav rows (the same
                // MediaListItem the main search results use).
                if (r.kind === "song") {
                  const s = asSong(r)
                  const on = picked.has(s.id)
                  return (
                    <MediaListItem
                      key={r.id}
                      type="song"
                      cover={s.cover}
                      title={s.title}
                      subtitle={s.artist}
                      meta={s.album}
                      onOpen={() => toggle(s.id)}
                      trailing={
                        <Checkbox checked={on} tabIndex={-1} className="pointer-events-none after:hidden" />
                      }
                    />
                  )
                }
                return (
                  <MediaListItem
                    key={r.id}
                    type={r.kind}
                    cover={r.cover}
                    covers={r.covers}
                    title={r.title}
                    subtitle={r.subtitle}
                    meta={r.meta}
                  />
                )
              })}
              {visible.length === 0 && (
                <p className="px-2 py-6 text-small text-muted-foreground">No results for “{query}”.</p>
              )}
            </section>
          ) : (
            <>
              {/* Browse — structural entry points into the user's own library. */}
              <section className="flex flex-col gap-1">
                <SectionLabel>My library</SectionLabel>
                {BROWSE.map(b => (
                  <NavRow key={b.label} icon={b.icon} label={b.label} />
                ))}
                <NavRow icon={<Clock />} label="Recently added music" />
              </section>

              {/* Suggested tracks — the multi-select list. */}
              <section className="flex flex-col gap-1">
                <SectionLabel>Suggested tracks</SectionLabel>
                {SAVED_SONGS_SEED.map(s => (
                  <MediaListItem
                    key={s.id}
                    type="song"
                    cover={s.cover}
                    title={s.title}
                    subtitle={s.artist}
                    meta={s.album}
                    onOpen={() => toggle(s.id)}
                    trailing={
                      <Checkbox checked={picked.has(s.id)} tabIndex={-1} className="pointer-events-none after:hidden" />
                    }
                  />
                ))}
              </section>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button onClick={done} disabled={picked.size === 0}>
            {picked.size > 0 ? `Add ${picked.size}` : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-2 pt-1 text-xsmall text-muted-foreground">{children}</p>
}
