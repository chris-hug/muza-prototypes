"use client"

/*
 * CreatePlaylistDialog — the "New Playlist" form.
 *
 * Structure follows the Figma flow (5953:181957), which mirrors the Apple
 * Music pattern: cover placeholder → name field → "Keep private" toggle, with
 * Cancel / Create in the header. Built on the base Dialog with
 * `mobile="form"`: a FULL-SCREEN sheet on phones (actions in the top bar,
 * where the keyboard can't reach them) and a centred modal on desktop
 * (ordinary header + footer). See the Dialog section of the design system.
 *
 * Why not the default bottom sheet: with the keyboard up a 12 mini in Brave
 * has ~200px left, and title + field + toggle + footer need ~240. Lifting,
 * capping or hiding content just moves the overlap around. Anchoring top and
 * moving the actions above the field removes the budget altogether.
 *
 * Prototype: Create only toasts (no playlist store yet). After creating, the
 * host can open the Add-music step — see `onCreated`.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Lock } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose, DialogActionBar, DialogFormBody,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { PlaylistCreateCard } from "@/components/ui/playlist-create-card"
import { useToast, TOAST_CONFIRM_MS } from "@/components/ui/toast"
import { useIsMobile } from "@/lib/use-media-query"
import { AddMusicDialog } from "@/components/app/add-music-dialog"
import { CreatePlaylistContext } from "@/lib/create-playlist-context"

export { useCreatePlaylist } from "@/lib/create-playlist-context"

/*
 * CreatePlaylistProvider — mounts the two-step flow once (New Playlist →
 * Add music) so any surface can start it with `useCreatePlaylist().open()`:
 * the mobile Library header "+", the grid's create tile, the list's create row.
 */
export function CreatePlaylistProvider({ children }: { children: React.ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState<string | undefined>()
  const open = useCallback(() => setCreateOpen(true), [])

  return (
    <CreatePlaylistContext.Provider value={{ open }}>
      {children}
      <CreatePlaylistDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={n => { setName(n); setAddOpen(true) }}
      />
      <AddMusicDialog open={addOpen} onOpenChange={setAddOpen} playlistName={name} />
    </CreatePlaylistContext.Provider>
  )
}

export function CreatePlaylistDialog({
  open, onOpenChange, onCreated,
  mode = "create", initialName = "", initialPrivate = false,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Called with the playlist's name once created / saved. */
  onCreated?: (name: string) => void
  /** `edit` reuses the exact same form to change an existing playlist's
   *  details — one form, so the fields can't drift apart between the two. */
  mode?: "create" | "edit"
  initialName?: string
  initialPrivate?: boolean
}) {
  const { add: toast } = useToast()
  const isMobile = useIsMobile()
  const editing = mode === "edit"
  const [name, setName] = useState(initialName)
  const [keepPrivate, setKeepPrivate] = useState(initialPrivate)
  const inputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Re-seed whenever the dialog opens: in edit mode it must show the CURRENT
  // values, and the component instance outlives a single open/close cycle.
  useEffect(() => {
    if (open) { setName(initialName); setKeepPrivate(initialPrivate) }
  }, [open, initialName, initialPrivate])

  const reset = () => { setName(initialName); setKeepPrivate(initialPrivate) }

  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onCreated?.(trimmed)
    toast(editing
      ? { title: "Playlist updated", description: `“${trimmed}” saved.`, type: "success", timeout: TOAST_CONFIRM_MS }
      : { title: "Playlist created", description: `“${trimmed}” is ready.`, type: "success", timeout: TOAST_CONFIRM_MS })
    reset()
    onOpenChange(false)
  }

  const title = editing ? "Edit info" : "New Playlist"
  const action = editing ? "Save" : "Create playlist"

  // Cover — the existing "create playlist" tile (tinted square + round
  // button), relabelled for picking an image. Prototype: no picker wired, so
  // it's a static affordance.
  const cover = (
    <PlaylistCreateCard
      label={editing ? "Change cover image" : "Add cover image"}
      className="mx-auto w-40"
    />
  )

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o) }}>
      {/* Desktop width matches the Add-music step it chains into — at least
          half the viewport. Phones get the full-screen form sheet. */}
      <DialogContent
        mobile="form"
        className="sm:max-w-[max(32rem,50vw)]"
        // Desktop: straight into the name field. Phone: park focus on the
        // bar so the keyboard does NOT spring up before the sheet has been
        // seen (Base UI would otherwise focus the first tabbable — Cancel —
        // which is fine, but the bar is the explicit, stable choice). The
        // user taps the field when ready to type.
        initialFocus={() => (isMobile ? barRef.current : inputRef.current)}
      >
        {isMobile ? (
          <DialogActionBar
            ref={barRef}
            tabIndex={-1}
            className="outline-none"
            leading={<DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>}
            trailing={
              <Button variant="ghost" className="text-primary-text" onClick={create} disabled={!name.trim()}>
                {editing ? "Save" : "Create"}
              </Button>
            }
          >
            <DialogTitle className="text-base font-medium truncate">{title}</DialogTitle>
          </DialogActionBar>
        ) : (
          <DialogHeader>
            <DialogTitle className="text-large">{title}</DialogTitle>
          </DialogHeader>
        )}

        <DialogFormBody>
          {/* Phone: the name field comes FIRST, directly under the bar, so it
              is on screen at any keyboard height without relying on the
              browser scrolling it into view. The cover tile follows — it
              isn't needed while typing. Desktop keeps the Figma order. */}
          {!isMobile && cover}

          <Input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") create() }}
            placeholder="Your playlist's name"
            aria-label="Playlist name"
          />

          {isMobile && cover}

          {/* Keep private — the same setting-row shape already used on staging:
              Switch leads, lock icon sits with the label, muted description
              underneath. See the Switch section in the design system. */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <Switch
                checked={keepPrivate}
                onCheckedChange={setKeepPrivate}
                aria-describedby="new-playlist-private-desc"
              />
              <p className="text-foreground text-base ms-2 flex items-center gap-2 font-medium">
                <Lock className="size-4" />
                Keep private
              </p>
            </label>
            <p id="new-playlist-private-desc" className="text-small text-muted-foreground">
              Your playlist will not be visible nor accessible by anyone.
            </p>
          </div>

          {!isMobile && (
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              <Button onClick={create} disabled={!name.trim()}>{action}</Button>
            </DialogFooter>
          )}
        </DialogFormBody>
      </DialogContent>
    </Dialog>
  )
}
