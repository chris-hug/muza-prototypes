"use client"

/*
 * PlaylistEditDrawer — the desktop "edit playlist" surface.
 *
 * Opened by the Edit action on a playlist you OWN. It docks to the right of
 * the app shell (a flex sibling of <main>, not an overlay) so the rest of the
 * app stays navigable: browse to Home, Search or any album and drag tracks
 * straight in. Mounted once at the shell level, so it survives navigation.
 *
 * Layout follows the staging pattern: type badge + actions in a header that
 * matches the Topbar's height, then editable title / description, the
 * visibility badge, a Sort + Filter row, and the drop zone (which becomes the
 * track list once tracks land). The left edge is a drag handle.
 *
 * Prototype: edits and drops live in memory only — wire to a playlist-tracks
 * store when one exists.
 */

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { ArrowUpDown, Globe, Lock, Maximize2, MoreHorizontal, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ContentTypeBadge } from "@/components/ui/badge"
import { MediaListItem } from "@/components/ui/media-list-item"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useMediaNav } from "@/lib/media-nav"
import { useToast } from "@/components/ui/toast"
import { useResizableWidth } from "@/lib/use-resizable-width"
import {
  usePlaylistEditor, PlaylistEditorContext, SONG_DRAG_TYPE,
  type PlaylistEditorTarget,
} from "@/lib/playlist-editor-context"
import type { SavedSong } from "@/lib/user-library"

export { usePlaylistEditor } from "@/lib/playlist-editor-context"

const RESIZE = { storageKey: "muza:playlist-editor-width", min: 374, max: 900 }

/** Slide duration for open/close; also how long the exit content is retained. */
const SLIDE_MS = 300
/** How long the cover dissolves over the destination once it has painted. */
const DISSOLVE_MS = 220

// ─── Provider ─────────────────────────────────────────────────────────────────
//
// Holds the editor state ABOVE the routed views, so the drawer survives
// navigation — open it on a playlist, then browse anywhere and keep dragging.

export function PlaylistEditorProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<PlaylistEditorTarget | null>(null)
  const [tracks, setTracks] = useState<SavedSong[]>([])

  const open = useCallback((t: PlaylistEditorTarget) => {
    setTarget(prev => {
      if (prev?.key !== t.key) setTracks([])   // different playlist → fresh list
      return t
    })
  }, [])
  const close = useCallback(() => setTarget(null), [])
  const addTrack = useCallback((song: SavedSong) => {
    setTracks(prev => (prev.some(t => t.id === song.id) ? prev : [...prev, song]))
  }, [])
  const removeTrack = useCallback((id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <PlaylistEditorContext.Provider value={{ target, tracks, open, close, addTrack, removeTrack }}>
      {children}
    </PlaylistEditorContext.Provider>
  )
}

// ─── Expand-to-page choreography ──────────────────────────────────────────────
//
// "Expand" makes the drawer BECOME the detail page. Four ordered steps, each
// there to avoid a specific visual glitch:
//
//   grow    — panel leaves the flex flow (a placeholder holds its slot so the
//             shell doesn't re-layout in one stall) and widens to cover the
//             content column. Not the viewport: that would swallow the sidebar.
//   cover   — it now hides the column, so the placeholder is dropped (<main>
//             reflows to full width unseen) and we navigate in the same tick.
//             The destination therefore renders at its FINAL width.
//   dissolve— destination has painted behind the cover; fade the cover out.
//   idle    — panel released back to the provider (closed).

type ExpandPhase = "idle" | "grow" | "cover" | "dissolve"

function useExpandToPage({ panelKey, arrived, asideRef, navigate, onFinished }: {
  panelKey?: string
  /** True once the route shows the playlist we're expanding into. */
  arrived: boolean
  asideRef: React.RefObject<HTMLElement | null>
  navigate: (key: string) => void
  onFinished: () => void
}) {
  const [phase, setPhase] = useState<ExpandPhase>("idle")
  /** Docked width (frozen onto the content) and the width to grow to. */
  const [size, setSize] = useState<{ from: number; to: number } | null>(null)

  const start = useCallback(() => {
    if (!panelKey) return
    const from = asideRef.current?.getBoundingClientRect().width ?? 0
    const mainW = document.getElementById("app-content")?.getBoundingClientRect().width ?? 0
    setSize({ from, to: from + mainW })
    // Next frame, so the frozen width paints before the growth starts.
    requestAnimationFrame(() => setPhase("grow"))
  }, [panelKey, asideRef])

  // grow → cover: hand the layout over while the panel hides it.
  useEffect(() => {
    if (phase !== "grow" || !panelKey) return
    const t = setTimeout(() => { setPhase("cover"); navigate(panelKey) }, SLIDE_MS + 20)
    return () => clearTimeout(t)
  }, [phase, panelKey, navigate])

  // cover → dissolve: only once the destination is actually on screen. Two
  // frames so it has painted before we start revealing it.
  useEffect(() => {
    if (phase !== "cover" || !arrived) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setPhase("dissolve"))
    })
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner) }
  }, [phase, arrived])

  // dissolve → idle. Kept as its OWN effect: scheduling this from the effect
  // above would re-run it (phase is a dependency) and its cleanup would cancel
  // the timer before it ever fired.
  useEffect(() => {
    if (phase !== "dissolve") return
    const t = setTimeout(() => {
      setPhase("idle")
      setSize(null)
      onFinished()
    }, DISSOLVE_MS)
    return () => clearTimeout(t)
  }, [phase, onFinished])

  return {
    phase,
    size,
    start,
    /** Panel is out of flow and covering (any step after the click). */
    expanding: phase !== "idle",
    /** Placeholder only needed until the panel actually covers the column. */
    holdsSlot: phase === "grow",
  }
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function PlaylistEditDrawer() {
  const { target, tracks, close, addTrack, removeTrack } = usePlaylistEditor()
  const { openPlaylist } = useMediaNav()
  const [params] = useSearchParams()
  // One ref for the panel element: the resize hook writes the dragged width
  // straight onto it, and the expand choreography measures it.
  const resize = useResizableWidth(RESIZE)
  const asideRef = resize.ref

  /** Is the edited playlist's own page already open beside the drawer? */
  const viewingThis =
    params.get("page") === "Playlist" && params.get("playlist") === target?.key

  // The panel outlives `target` by one slide, so its content doesn't vanish
  // before the width finishes collapsing.
  const panel = useExitRetained(target, SLIDE_MS)
  const open = !!target

  const { phase, size, start, expanding, holdsSlot } = useExpandToPage({
    panelKey: panel?.key,
    arrived: viewingThis,
    asideRef,
    navigate: openPlaylist,
    onFinished: close,
  })


  return (
    <>
      {/* Holds the panel's slot while it is `fixed`, so leaving the flex flow
          doesn't force the whole shell to re-layout in one visible stall. */}
      {holdsSlot && size && (
        <div aria-hidden="true" className="hidden md:block shrink-0" style={{ width: size.from }} />
      )}

      <aside
        ref={asideRef}
        style={expandStyle({ phase, size, open, width: resize.width })}
        className={cn(
          "relative hidden md:flex h-screen shrink-0 flex-col overflow-hidden border-border bg-background",
          // Out of flow while expanding; `contain` keeps the per-frame work
          // inside this subtree so the growth stays at 60fps.
          expanding && "fixed inset-y-0 right-0 z-50 will-change-[width] [contain:layout_paint]",
          expandTransition({ phase, resizing: resize.resizing }),
          expandBox({ phase, open, hasCustomWidth: resize.width != null }),
        )}
      >
        {panel && !expanding && (
          <ResizeHandle {...resize} />
        )}

        {panel && (
          // Frozen at the docked width while expanding, so the content stays
          // pixel-identical (no re-wrap per frame) and only the box animates.
          <div
            style={size ? { width: size.from, minWidth: size.from } : undefined}
            className={cn(
              "flex h-full w-full min-w-[374px] flex-col transition-opacity duration-150 ease-out",
              // The editor UI drops away as the panel becomes the page.
              expanding && "ml-auto pointer-events-none opacity-0",
            )}
          >
            <EditorHeader
              panel={panel}
              onExpand={start}
              onClose={close}
              canExpand={!viewingThis}
            />
            {/* Keyed by playlist so the editable fields reset when a
                different playlist is opened. */}
            <EditorBody
              key={panel.key}
              panel={panel}
              tracks={tracks}
              onAddTrack={addTrack}
              onRemoveTrack={removeTrack}
            />
          </div>
        )}
      </aside>
    </>
  )
}

// ─── Style helpers ────────────────────────────────────────────────────────────
// Kept out of the JSX so the box rules read as one decision each.

function expandStyle({ phase, size, open, width }: {
  phase: ExpandPhase; size: { from: number; to: number } | null
  open: boolean; width: number | null
}): React.CSSProperties | undefined {
  // Any expand step holds the grown width; only the opacity changes after.
  if (phase !== "idle") return size ? { width: size.to } : undefined
  // A dragged width applies only while OPEN — otherwise it would override the
  // collapsed w-0 and leave the panel stuck on screen.
  return open && width != null ? { width } : undefined
}

function expandTransition({ phase, resizing }: { phase: ExpandPhase; resizing: boolean }) {
  // The width must track the pointer exactly while dragging.
  if (resizing) return "transition-none"
  // Dissolving: opacity only, so the width holds steady as it fades.
  if (phase === "dissolve") return "transition-opacity duration-200 ease-out"
  return "transition-all duration-300 ease-in-out"
}

function expandBox({ phase, open, hasCustomWidth }: {
  phase: ExpandPhase; open: boolean; hasCustomWidth: boolean
}) {
  if (phase !== "idle") {
    return cn("min-w-0 max-w-none border-l-0", phase === "dissolve" ? "opacity-0" : "opacity-100")
  }
  if (!open) return "w-0 min-w-0 max-w-0 border-l-0 opacity-0"
  return cn("border-l opacity-100", !hasCustomWidth && "w-[30%] min-w-[374px] max-w-[550px]")
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function ResizeHandle({ onPointerDown, reset, resizing }: {
  onPointerDown: (e: React.PointerEvent) => void
  reset: () => void
  resizing: boolean
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize playlist editor"
      onPointerDown={onPointerDown}
      onDoubleClick={reset}
      className={cn(
        "absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize transition-colors",
        // Neutral surface tint — a resize affordance isn't an accent.
        "hover:bg-secondary",
        resizing && "bg-secondary-hover",
      )}
    />
  )
}

function EditorHeader({ panel, canExpand, onExpand, onClose }: {
  panel: PlaylistEditorTarget
  canExpand: boolean
  onExpand: () => void
  onClose: () => void
}) {
  const { add: toast } = useToast()
  return (
    // Same 54px + border as the app Topbar, so the two header bars line up
    // across the drawer's left edge.
    <div className="flex h-[54px] shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4">
      <ContentTypeBadge type="playlist" />
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Playlist options" />}>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6}>
            <DropdownMenuItem onClick={() => toast({ title: "Saved", type: "success" })}>Save changes</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onClose}>Discard</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Expand → the panel becomes the full detail view. Pointless (and so
            hidden) when that page is already open beside it. */}
        {canExpand && (
          <Button variant="outline" size="icon" aria-label={`Open ${panel.title}`} onClick={onExpand}>
            <Maximize2 />
          </Button>
        )}
        <Button variant="outline" size="icon" aria-label="Close editor" onClick={onClose}>
          <X />
        </Button>
      </div>
    </div>
  )
}

function EditorBody({ panel, tracks, onAddTrack, onRemoveTrack }: {
  panel: PlaylistEditorTarget
  tracks: SavedSong[]
  onAddTrack: (s: SavedSong) => void
  onRemoveTrack: (id: string) => void
}) {
  const { add: toast } = useToast()
  const [title, setTitle] = useState(panel.title)
  const [description, setDescription] = useState("")
  const [filter, setFilter] = useState("")

  const needle = filter.trim().toLowerCase()
  const shown = needle
    ? tracks.filter(t => [t.title, t.artist, t.album].some(f => f?.toLowerCase().includes(needle)))
    : tracks

  const onDrop = (song: SavedSong) => {
    onAddTrack(song)
    toast({ title: "Added to playlist", description: `“${song.title}” → ${title}`, type: "success" })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      {/* Title + description — edit in place. */}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        aria-label="Playlist title"
        className="w-full bg-transparent text-large font-medium text-foreground outline-none placeholder:text-muted-foreground"
      />
      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Enter playlist description"
        aria-label="Playlist description"
        className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
      />

      <span className="inline-flex w-fit items-center gap-1 rounded-sm border border-border bg-muted px-[6px] pb-px text-2xsmall text-foreground [&_svg]:size-3">
        {panel.isPrivate ? <Lock /> : <Globe />}
        {panel.isPrivate ? "Private" : "Public"}
      </span>

      {/* Both are form controls → the shared h-10 (Button `default`; `lg` is 48). */}
      <div className="flex items-center gap-2">
        <Button variant="outline" className="shrink-0">
          <ArrowUpDown />
          Sort
        </Button>
        <Input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter playlist on track, artist…"
          aria-label="Filter playlist"
          startIcon={<Search />}
          onClear={() => setFilter("")}
        />
      </div>

      <TrackDropZone
        tracks={shown}
        empty={tracks.length === 0}
        filter={filter}
        onDrop={onDrop}
        onRemove={onRemoveTrack}
      />
    </div>
  )
}

function TrackDropZone({ tracks, empty, filter, onDrop, onRemove }: {
  tracks: SavedSong[]
  empty: boolean
  filter: string
  onDrop: (s: SavedSong) => void
  onRemove: (id: string) => void
}) {
  const [over, setOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setOver(false)
    const raw = e.dataTransfer.getData(SONG_DRAG_TYPE)
    if (!raw) return
    try { onDrop(JSON.parse(raw) as SavedSong) } catch { /* not one of ours */ }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex min-h-28 flex-1 flex-col gap-1 rounded-xl border border-dashed p-2 transition-colors",
        over ? "border-primary bg-primary/5" : "border-border bg-muted/40",
      )}
    >
      {tracks.length === 0 ? (
        <p className="m-auto text-small text-muted-foreground">
          {empty ? "Drop tracks here" : `No tracks match “${filter}”.`}
        </p>
      ) : (
        tracks.map(t => (
          <MediaListItem
            key={t.id}
            type="song"
            cover={t.cover}
            title={t.title}
            subtitle={t.artist}
            meta={t.album}
            trailing={
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${t.title}`} onClick={() => onRemove(t.id)}>
                <X />
              </Button>
            }
          />
        ))
      )}
    </div>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

/** Keeps the last non-null value around for `ms` after it clears, so exit
 *  animations still have something to render. */
function useExitRetained<T>(value: T | null, ms: number): T | null {
  const [retained, setRetained] = useState<T | null>(value)
  useEffect(() => {
    if (value) { setRetained(value); return }
    const t = setTimeout(() => setRetained(null), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return retained
}
