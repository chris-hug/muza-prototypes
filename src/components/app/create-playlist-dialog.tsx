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
import { Lock, X } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose, DialogActionBar, DialogFormBody, DialogFormActions,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast, TOAST_CONFIRM_MS } from "@/components/ui/toast"
import { useIsMobile } from "@/lib/use-media-query"
import { AddMusicDialog } from "@/components/app/add-music-dialog"
import { CreatePlaylistContext } from "@/lib/create-playlist-context"
import { registerPlaylists } from "@/lib/playlist-catalog"
import { useMediaNav, slugify } from "@/lib/media-nav"
import type { SavedSong } from "@/lib/user-library"

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
  /*
   * iOS raises the on-screen keyboard ONLY for a focus that happens inside
   * the user's own gesture. The name field is focused by the dialog
   * (`initialFocus`), which is a frame or two after the tap — too late, so
   * the field would come up with a caret and no keyboard.
   *
   * So the tap focuses a stand-in field that is ALREADY in the document: the
   * keyboard opens on the gesture, and when the sheet then moves focus to
   * the real input the keyboard simply follows it — iOS keeps it up as long
   * as focus lands on another text field. The stand-in never renders
   * anything visible and never takes a tab stop.
   */
  const primer = useRef<HTMLInputElement>(null)
  const open = useCallback(() => {
    if (matchMedia("(pointer: coarse)").matches) primer.current?.focus({ preventScroll: true })
    setCreateOpen(true)
  }, [])
  const { openPlaylist } = useMediaNav()

  /*
   * Adding the tracks ENDS the flow, so it lands on the playlist itself —
   * the thing just made, with the tracks in it. Anything else (staying put,
   * or dropping back to the library grid) makes the user go find it.
   *
   * Prototype: there is no playlist store, so the record is registered into
   * the catalog on the way out and the detail page resolves it by slug like
   * any other. Covers come from the picks; a real store would own both.
   */
  const finish = useCallback((songs: SavedSong[]) => {
    const title = name?.trim()
    if (!title) return
    registerPlaylists([{
      id: `new-${slugify(title)}`,
      title,
      covers: songs.map(s => s.cover).filter((c): c is string => !!c).slice(0, 4),
      songCount: songs.length,
      owner: "You",
      owned: true,
    }])
    openPlaylist(slugify(title))
  }, [name, openPlaylist])

  return (
    <CreatePlaylistContext.Provider value={{ open }}>
      {children}
      <CreatePlaylistDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={n => { setName(n); setAddOpen(true) }}
      />
      <AddMusicDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        playlistName={name}
        onAdd={finish}
      />
      {/* The keyboard's stand-in — see `open`. Zero-sized and transparent
          rather than `hidden`, because a display:none field cannot take
          focus and so cannot open the keyboard. */}
      <input
        ref={primer}
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 size-px opacity-0"
      />
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
  /* The floating pill is one object on an otherwise empty sheet, with the
     title two bands above it saying what is being made — so it only has to
     name the VERB. "Create playlist" is the desktop footer's label, where it
     sits beside Cancel and has to distinguish itself. */
  const mobileAction = editing ? "Save" : "Create"

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o) }}>
      {/* Desktop width matches the Add-music step it chains into — at least
          half the viewport. Phones get the full-screen form sheet. */}
      <DialogContent
        mobile="form"
        className="md:max-w-[max(32rem,50vw)]"
        /* A FUNCTION, not the ref: opened by touch, the popup's default is to
           focus ITSELF so the keyboard stays down — right for a picker, wrong
           for a form whose one job is to be typed into. Returning the field
           for every interaction type overrides that. */
        initialFocus={() => inputRef.current}
      >
        {isMobile ? (
          <DialogActionBar
            ref={barRef}
            tabIndex={-1}
            className="outline-none"
            // No Cancel: dismissal is the ✕ at the right, the same control
            // every other sheet in the app closes with, and the confirming
            // action is the full-width button in the body. One leading slot
            // stays empty so the centred title matches the Add step's bar.
            trailing={
              <DialogClose render={<Button variant="ghost" size="icon" aria-label="Close" className="touch-target" />}>
                <X />
              </DialogClose>
            }
          >
            <DialogTitle className="truncate">{title}</DialogTitle>
          </DialogActionBar>
        ) : (
          <DialogHeader>
            <DialogTitle className="md:text-large">{title}</DialogTitle>
          </DialogHeader>
        )}

        <DialogFormBody>
          {/* Name leads the form — it's the only required input, and on a
              phone that puts it directly under the bar, on screen at any
              keyboard height without relying on scroll-into-view.
              No cover picker: naming is the job here, and an image can be
              set later from the playlist itself. */}
          {/* No visible label — the placeholder carries it, and on a phone
               every line costs space above the keyboard. `aria-label` keeps
               the field named for screen readers. */}
          <Input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") create() }}
            placeholder="Your playlist's name"
            aria-label="Playlist name"
          />

          {/* Keep private — label + switch grouped at the RIGHT edge, aligned
              with the field and button above. The control lands under the
              thumb on a phone, and nothing floats alone on the left. */}
          <label className="flex w-full items-center justify-end gap-3 cursor-pointer">
            <span className="text-foreground text-small flex items-center gap-2 font-medium">
              <Lock className="size-4" />
              Keep private
            </span>
            <Switch checked={keepPrivate} onCheckedChange={setKeepPrivate} />
          </label>

          {!isMobile && (
            <DialogFooter>
              <DialogClose render={<Button size="lg" variant="ghost" />}>Cancel</DialogClose>
              <Button size="lg" onClick={create} disabled={!name.trim()}>{action}</Button>
            </DialogFooter>
          )}
        </DialogFormBody>

        {/* Full-width confirming action, as the reference has it — but in its
            own band below the scrolling body rather than sticky inside it, so
            it can never overlay a field. The sheet already ends at `--kb`, so
            this row sits directly above the keyboard. */}
        {isMobile && (
          <DialogFormActions>
            {/* `lg` (48px) — the DS's largest text button, and the right touch
                 target for the screen's primary action. No lift and no
                 disabled colour of its own: it sits ON the sheet, so the
                 ordinary `disabled:opacity-50` has a surface to fade against. */}
            <Button
              size="lg"
              onClick={create}
              disabled={!name.trim()}
              className="w-full"
              /* Keep the focus in the field. A tap on a button moves focus to
                 it, which closes the keyboard, which lets the sheet grow back
                 to full height — and the button travels down out from under
                 the finger BEFORE the click resolves, so the first tap does
                 nothing and only the second one lands. Refusing the default
                 pointer-down behaviour keeps focus (and the keyboard, and the
                 layout) exactly where it was; the click still fires. */
              onPointerDown={e => e.preventDefault()}
            >
              {mobileAction}
            </Button>
          </DialogFormActions>
        )}
      </DialogContent>
    </Dialog>
  )
}
