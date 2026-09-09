"use client"

/*
 * Command in a dialog — the palette. `CommandDialog` is the app `Dialog`
 * with the chrome stripped (`p-0`, no ✕) and the list's metrics raised
 * (48px input, 44px+ rows, 20px glyphs), so it takes the Dialog's own
 * presentation: a centred modal from 768 up, a bottom sheet below — inside
 * this frame the window chip decides. ⌘K is bound here, at the call site,
 * because the primitive binds nothing.
 */

import { useEffect, useState } from "react"
import { Music2, Search, Settings, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command"
import { getRichAlbums } from "@/lib/album-catalog"

const ALBUMS = getRichAlbums().slice(0, 3)

export default function CommandDialogExample() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Search className="size-4" />Open command palette
        <CommandShortcut>⌘K</CommandShortcut>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search albums, artists, playlists…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Albums">
            {ALBUMS.map(a => (
              <CommandItem key={a.id} onSelect={() => setOpen(false)}>
                <Music2 />{a.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => setOpen(false)}><Upload />Upload a track<CommandShortcut>⌘U</CommandShortcut></CommandItem>
            <CommandItem onSelect={() => setOpen(false)}><Settings />Settings<CommandShortcut>⌘,</CommandShortcut></CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
