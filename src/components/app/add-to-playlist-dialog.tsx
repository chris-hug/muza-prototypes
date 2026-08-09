"use client"

/*
 * AddToPlaylistDialog — the "Add to playlist" flow, modelled on Tidal:
 *
 *   Track "…" → Add to playlist → a dialog listing YOUR playlists, with a
 *   pinned "New playlist" row on top. Tap a playlist to add the track (toast
 *   + close); tap "New playlist" to name and create one (which the track goes
 *   straight into). A filter field trims a long list. Built on the base
 *   Dialog, so it's a centered modal on desktop and a bottom sheet on mobile.
 *
 * Mounted once via `AddToPlaylistProvider`; any descendant opens it with
 * `useAddToPlaylist().open(song)`. Outside a provider `open` is a no-op.
 *
 * Prototype: playlists are the static catalog and add/create only toast (no
 * membership store yet) — wire to a real playlist-tracks store when it lands.
 */

import { useCallback, useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { MediaListItem } from "@/components/ui/media-list-item"
import { getAllPlaylists } from "@/lib/playlist-catalog"
import { AddToPlaylistContext } from "@/lib/add-to-playlist-context"
import type { SavedSong } from "@/lib/user-library"

export { useAddToPlaylist } from "@/lib/add-to-playlist-context"

export function AddToPlaylistProvider({ children }: { children: React.ReactNode }) {
  const [song, setSong] = useState<SavedSong | null>(null)
  const open = useCallback((s: SavedSong) => setSong(s), [])

  return (
    <AddToPlaylistContext.Provider value={{ open }}>
      {children}
      <Dialog open={!!song} onOpenChange={o => { if (!o) setSong(null) }}>
        {song && (
          // key by the song so the dialog's mode / filter state resets each
          // time it's reopened for a different track.
          <AddToPlaylistContent key={song.id} song={song} onClose={() => setSong(null)} />
        )}
      </Dialog>
    </AddToPlaylistContext.Provider>
  )
}

function AddToPlaylistContent({ song, onClose }: { song: SavedSong; onClose: () => void }) {
  const { add: toast } = useToast()
  const [mode, setMode] = useState<"list" | "create">("list")
  const [query, setQuery] = useState("")
  const [name, setName] = useState("")

  // You add to playlists you OWN. Newest-feeling first would need dates; the
  // catalog order is fine for the prototype.
  const owned = useMemo(() => getAllPlaylists().filter(p => p.owned), [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? owned.filter(p => p.title.toLowerCase().includes(q)) : owned
  }, [owned, query])

  const done = (playlistTitle: string) => {
    toast({
      title: "Added to playlist",
      description: `“${song.title}” → ${playlistTitle}`,
      type: "success",
    })
    onClose()
  }

  const addTo = (playlistTitle: string) => done(playlistTitle)
  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    done(trimmed)
  }

  if (mode === "create") {
    return (
      <DialogContent className="sm:max-w-[max(32rem,50vw)]">
        <DialogHeader>
          <DialogTitle className="text-large">New playlist</DialogTitle>
          <DialogDescription>
            “{song.title}” will be added to it.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") create() }}
          placeholder="Playlist name"
          aria-label="Playlist name"
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setMode("list")}>Back</Button>
          <Button onClick={create} disabled={!name.trim()}>Create playlist</Button>
        </DialogFooter>
      </DialogContent>
    )
  }

  return (
    <DialogContent className="sm:max-w-[max(32rem,50vw)]">
      <DialogHeader>
        <DialogTitle className="text-large">Add to playlist</DialogTitle>
        <DialogDescription>
          {song.title}{song.artist ? ` · ${song.artist}` : ""}
        </DialogDescription>
      </DialogHeader>

      {owned.length > 6 && (
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Find a playlist"
          aria-label="Find a playlist"
          startIcon={<Search />}
          onClear={() => setQuery("")}
        />
      )}

      <div className="flex flex-col gap-1 overflow-y-auto max-h-[52vh] -mx-2 px-2">
        {/* New playlist — pinned on top (Tidal). */}
        <Row onClick={() => setMode("create")}>
          <span className="grid size-12 shrink-0 place-items-center rounded-xs bg-secondary text-foreground [&_svg]:size-5">
            <Plus />
          </span>
          <span className="text-small font-medium text-foreground">New playlist</span>
        </Row>

        {/* The shared media row — same component the search / library lists
            use, so the 2×2 collage + title/meta treatment is identical. */}
        {filtered.map(p => (
          <MediaListItem
            key={p.id}
            type="playlist"
            covers={p.covers}
            title={p.title}
            meta={`${p.songCount} songs`}
            onOpen={() => addTo(p.title)}
          />
        ))}

        {filtered.length === 0 && (
          <p className="px-3 py-6 text-small text-muted-foreground">No playlists match “{query}”.</p>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

// One tappable row (New-playlist / a playlist). 44px+ target, hover fill.
function Row({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
        "hover:bg-muted active:bg-muted outline-none focus-visible:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

