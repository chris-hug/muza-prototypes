"use client"

/*
 * Command, inline — the searchable list on its own surface, always open.
 * Type to filter: cmdk matches against each item's text. Groups are the
 * real catalog's albums and the artists on them, then two actions with
 * their shortcuts. The border is the call site's — `Command` draws none,
 * because inside `CommandDialog` the dialog's border is the border.
 */

import { Music2, Settings, Upload, User } from "lucide-react"

import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command"
import { getRichAlbums } from "@/lib/album-catalog"

const ALBUMS = getRichAlbums().slice(0, 4)
const ARTISTS = Array.from(new Set(ALBUMS.map(a => a.artist)))

export default function CommandBasicExample() {
  return (
    <Command className="border border-border rounded-xl w-full max-w-sm">
      <CommandInput placeholder="Search albums, artists…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Albums">
          {ALBUMS.map(a => (
            <CommandItem key={a.id}><Music2 />{a.title}</CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Artists">
          {ARTISTS.map(name => (
            <CommandItem key={name}><User />{name}</CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem><Upload />Upload a track<CommandShortcut>⌘U</CommandShortcut></CommandItem>
          <CommandItem><Settings />Settings<CommandShortcut>⌘,</CommandShortcut></CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
