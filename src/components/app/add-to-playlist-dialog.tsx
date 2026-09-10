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

import { useCallback, useMemo, useRef, useState } from "react"
import { ChevronLeft, Plus, Search, X } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose, DialogActionBar, DialogFormBody, DialogFormActions,
  dialogListClass,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { navRowClass } from "@/components/ui/nav-row"
import { useToast } from "@/components/ui/toast"
import { useIsMobile } from "@/lib/use-media-query"
import { MediaListItem } from "@/components/ui/media-list-item"
import { SelectTrackButton } from "@/components/ui/select-track-button"
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { getAllPlaylists } from "@/lib/playlist-catalog"
import { AddToPlaylistContext } from "@/lib/add-to-playlist-context"
import type { SavedSong } from "@/lib/user-library"

export { useAddToPlaylist } from "@/lib/add-to-playlist-context"

export function AddToPlaylistProvider({ children }: { children: React.ReactNode }) {
  const [song, setSong] = useState<SavedSong | null>(null)
  const open = useCallback((s: SavedSong) => setSong(s), [])
  /* The sheet holds picks, and the dialog that can be flicked away lives out
     here — so the CONTENT registers a veto and the root asks it before every
     close. Returning true means "I have taken over" (a confirmation is up);
     the dialog stays open until the answer comes back. */
  const guard = useRef<() => boolean>(() => false)

  return (
    <AddToPlaylistContext.Provider value={{ open }}>
      {children}
      <Dialog
        open={!!song}
        onOpenChange={o => {
          if (!o && guard.current()) return
          if (!o) setSong(null)
        }}
      >
        {song && (
          // key by the song so the dialog's mode / filter state resets each
          // time it's reopened for a different track.
          <AddToPlaylistContent
            key={song.id}
            song={song}
            guard={guard}
            onClose={() => setSong(null)}
          />
        )}
      </Dialog>
    </AddToPlaylistContext.Provider>
  )
}

function AddToPlaylistContent({ song, guard, onClose }: {
  song: SavedSong
  guard: React.RefObject<() => boolean>
  onClose: () => void
}) {
  const { add: toast } = useToast()
  // The header is a BAR on a phone and the ordinary header on desktop; the
  // create step is a form sheet below `md` and a modal above it.
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<"list" | "create">("list")
  const [query, setQuery] = useState("")
  const [name, setName] = useState("")
  /* One song goes into MANY playlists in one visit — Spotify's model, and the
   * right one: the alternative is reopening the same sheet from the same "…"
   * three times to file a track in three places. So a row PICKS rather than
   * commits, and the bar's action commits the lot. */
  const [picked, setPicked] = useState<string[]>([])
  const [confirmDiscard, setConfirmDiscard] = useState(false)

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

  /** Commit every pick at once — the bar's action. */
  const commit = () => {
    if (picked.length === 0) return
    toast({
      title: picked.length === 1 ? "Added to playlist" : `Added to ${picked.length} playlists`,
      // One name reads better than a count; past one, the count does.
      description: `“${song.title}” → ${picked.join(", ")}`,
      type: "success",
    })
    onClose()
  }

  /* Closing with picks in hand asks first — the platform rule for a modal
     with unsaved input, and this sheet's whole point is that the picks are
     not committed until Done. Registered on every render so it sees the
     current count. */
  guard.current = () => {
    if (picked.length === 0) return false
    setConfirmDiscard(true)
    return true
  }

  const toggle = (playlistTitle: string) =>
    setPicked(prev => prev.includes(playlistTitle)
      ? prev.filter(t => t !== playlistTitle)
      : [...prev, playlistTitle])
  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    done(trimmed)
  }

  /* Every pattern below is the Add-music sheet's, arrived at the hard way on a
   * phone with the keyboard up; this flow is its sibling and had none of them.
   * See `docs/components/dialog.md` for why each one is what it is. */

  if (mode === "create") {
    return (
      /* `mobile="form"`: a sheet whose primary action is a button under a
         field cannot be a bottom sheet — the keyboard leaves ~170px, and the
         action ends up behind it. The form presentation anchors top and puts
         the action in its own band. */
      <DialogContent mobile="form" showCloseButton={!isMobile} className="md:max-w-[max(32rem,50vw)]">
        {isMobile ? (
          <DialogActionBar
            className="-mx-3 -mt-3"
            leading={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Back to playlists"
                onClick={() => setMode("list")}
                className="touch-target shrink-0"
              >
                <ChevronLeft />
              </Button>
            }
            trailing={
              <DialogClose render={<Button variant="ghost" size="icon" aria-label="Close" className="touch-target" />}>
                <X />
              </DialogClose>
            }
          >
            <DialogTitle className="truncate">New playlist</DialogTitle>
          </DialogActionBar>
        ) : (
          <DialogHeader className="shrink-0">
            <DialogTitle className="md:text-large">New playlist</DialogTitle>
            <DialogDescription>“{song.title}” will be added to it.</DialogDescription>
          </DialogHeader>
        )}

        <DialogFormBody>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") create() }}
            placeholder="Playlist name"
            aria-label="Playlist name"
            autoFocus
          />
          {!isMobile && (
            <DialogFooter>
              <Button size="lg" variant="ghost" onClick={() => setMode("list")}>Back</Button>
              <Button size="lg" onClick={create} disabled={!name.trim()}>Create playlist</Button>
            </DialogFooter>
          )}
        </DialogFormBody>

        {isMobile && (
          <DialogFormActions>
            {/* Refuses focus: a tap would otherwise move focus off the field,
                close the keyboard, grow the sheet, and carry the button out
                from under the finger before the click resolved. */}
            <Button
              size="lg"
              onClick={create}
              disabled={!name.trim()}
              className="w-full"
              onPointerDown={e => e.preventDefault()}
            >
              Create
            </Button>
          </DialogFormActions>
        )}
      </DialogContent>
    )
  }

  return (
    /* `flex flex-col overflow-hidden`: the chrome's own layout is a GRID, so
       a `flex-1` list inside it is just a list at its natural height — the
       popup grew past its cap and scrolled itself, which with a keyboard up
       carries the title off the top the moment the field takes focus. As a
       flex column the LIST is the only thing that gives, and the bar's height
       is reserved as padding because the bar itself is out of the flow. */
    <DialogContent
      showCloseButton={!isMobile}
      className="md:max-w-[max(32rem,50vw)] flex flex-col overflow-hidden max-md:pt-[var(--sheet-bar-h)]"
    >
      {isMobile ? (
        /* A bar, not a stacked header: back·title·✕ on one line is the shape
           the whole flow uses, and on a phone the title's own line is a row
           the list does not get. `absolute` + glass so the rows run full
           height underneath and blur past the title. */
        <DialogActionBar
          className="absolute inset-x-0 top-0 z-10"
          leading={<span className="size-10 shrink-0" />}
          /* Dismissal until there is something to commit, then the commit —
             the trade the Add-music bar makes. Nothing is lost: the sheet
             still closes by pulling it down or tapping the backdrop, and with
             picks in hand both ask first. */
          trailing={picked.length > 0 ? (
            <Button onClick={commit} className="touch-target shrink-0">Done</Button>
          ) : (
            <DialogClose render={<Button variant="ghost" size="icon" aria-label="Close" className="touch-target" />}>
              <X />
            </DialogClose>
          )}
        >
          {/* The SONG is the context here, and the bar has one line for it —
              so it goes in the title rather than a description underneath. */}
          <DialogTitle className="truncate">Add “{song.title}”</DialogTitle>
        </DialogActionBar>
      ) : (
        <DialogHeader className="shrink-0">
          <DialogTitle className="md:text-large">Add to playlist</DialogTitle>
          <DialogDescription>
            {song.title}{song.artist ? ` · ${song.artist}` : ""}
          </DialogDescription>
        </DialogHeader>
      )}

      {filtered.length === 0 ? (
        /* Its own band, never a `flex-1` child of the scroller: that is the
           case WebKit collapses to zero height, which shows as a blank sheet. */
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center max-md:-mt-[var(--sheet-bar-h)] max-md:pt-[var(--sheet-bar-h)] max-md:-mb-3 max-md:pb-[var(--sheet-band-h)]">
          <p className="text-large font-medium text-foreground">No playlists match</p>
          <p className="text-small text-muted-foreground">“{query}”</p>
        </div>
      ) : (
        /* No `vh` cap: the sheet is a flex column that already ends at `--kb`,
           so the list takes exactly what the other bands leave. The rows run
           under both bands and pay for them in padding. */
        <div className={cn(
          dialogListClass,
          "gap-1",
          "max-md:-mt-[var(--sheet-bar-h)] max-md:-mb-3 max-md:pt-[var(--sheet-bar-h)] max-md:pb-[var(--sheet-band-h)]",
        )}>
          {/* New playlist — pinned on top (Tidal). */}
          <Row onClick={() => setMode("create")}>
            <span className="grid size-12 shrink-0 place-items-center rounded-xs bg-secondary text-foreground [&_svg]:size-5">
              <Plus />
            </span>
            <span className="text-small font-medium text-foreground">New playlist</span>
          </Row>

          {/* The same row as the tracks in the Add-music sheet, down to the
              +/✓ on the right: both screens are "pick things from a list", and
              a row that COMMITS on tap while looking like a row that picks is
              a difference nobody reads in advance. */}
          {filtered.map(p => {
            const on = picked.includes(p.title)
            return (
              <MediaListItem
                key={p.id}
                type="playlist"
                covers={p.covers}
                title={p.title}
                meta={`${p.songCount} songs`}
                onOpen={() => toggle(p.title)}
                className={cn(on && "bg-muted")}
                trailing={<SelectTrackButton selected={on} />}
              />
            )
          })}
        </div>
      )}

      {/* The filter sits at the BOTTOM on a phone — thumb-side, and where the
          keyboard opens against it — in a band with no surface of its own, so
          the rows pass underneath. Desktop keeps it in the flow with Cancel:
          there is no thumb and no keyboard to plan around. */}
      <DialogFooter
        className={cn(
          "shrink-0 mt-0 flex-col md:flex-row md:items-center",
          "max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:z-10 max-md:mx-0 max-md:mt-0 max-md:mb-0 max-md:border-t-0 max-md:bg-transparent",
        )}
      >
        {owned.length > 6 && (
          <div className="w-full min-w-0 md:flex-1">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find a playlist"
              aria-label="Find a playlist"
              startIcon={<Search />}
              onClear={() => setQuery("")}
              // Floating over the rows, so it carries its own surface and a
              // lift; 48px to match the control ladder.
              className="h-12 max-md:bg-popover max-md:shadow-lg"
            />
          </div>
        )}
        {!isMobile && (
          <>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button onClick={commit} disabled={picked.length === 0}>Done</Button>
          </>
        )}
      </DialogFooter>

      {/* Asked, not assumed — the sheet stays mounted behind it, so "Keep
          picking" returns to the same list with the same ticks. */}
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Discard {picked.length} {picked.length === 1 ? "playlist" : "playlists"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              “{song.title}” hasn't been added to {picked.length === 1 ? "it" : "them"} yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep picking</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmDiscard(false); setPicked([]); onClose() }}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  )
}

// One tappable row (New-playlist / a playlist). 44px+ target, hover fill.
function Row({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      /* The shared row recipe from `NavRow`. This used to be a byte-identical
         copy of it, differing only in `gap-3` for the cover thumb. */
      className={cn(navRowClass, "gap-3")}
    >
      {children}
    </button>
  )
}

