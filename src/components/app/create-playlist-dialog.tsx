"use client"

/*
 * CreatePlaylistDialog — the "New Playlist" sheet.
 *
 * Structure follows the Figma flow (5953:181957), which mirrors the Apple
 * Music pattern: cover placeholder → name field → "Keep private" toggle, with
 * Cancel / Done in the header. Built on the base Dialog, so it's a bottom
 * sheet on mobile and a centred modal on desktop — no bespoke chrome.
 *
 * Prototype: Done only toasts (no playlist store yet). After creating, the
 * host can open the Add-music step — see `onCreated`.
 */

import { useCallback, useState } from "react"
import { Lock } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { PlaylistCreateCard } from "@/components/ui/playlist-create-card"
import { useToast } from "@/components/ui/toast"
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
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Called with the new playlist's name once created. */
  onCreated?: (name: string) => void
}) {
  const { add: toast } = useToast()
  const [name, setName] = useState("")
  const [keepPrivate, setKeepPrivate] = useState(false)

  const reset = () => { setName(""); setKeepPrivate(false) }

  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onCreated?.(trimmed)
    toast({ title: "Playlist created", description: `“${trimmed}” is ready.`, type: "success" })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o) }}>
      {/* Matches the Add-music step it chains into — at least half the
          viewport on desktop, still a bottom sheet on mobile. */}
      <DialogContent className="sm:max-w-[max(32rem,50vw)]">
        <DialogHeader>
          <DialogTitle className="text-large">New Playlist</DialogTitle>
        </DialogHeader>

        {/* Cover — the existing "create playlist" tile (tinted square + round
            button), relabelled for picking an image. Prototype: no picker
            wired, so it's a static affordance. */}
        <PlaylistCreateCard label="Add cover image" className="mx-auto w-40" />

        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") create() }}
          placeholder="Your playlist's name"
          aria-label="Playlist name"
          autoFocus
        />

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

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button onClick={create} disabled={!name.trim()}>Create playlist</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
