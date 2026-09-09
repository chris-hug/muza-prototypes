"use client"

/*
 * MultiSelect as a filter row: Type (two picked, so the trigger is active
 * and counts), Artist (searchable — the long-list shape Studio › Music
 * uses, fed from the catalog) and Status (nothing picked, an idle pill).
 *
 * This file is a CALL SITE, not a copy: the real `MultiSelect` with the
 * props `studio-music.tsx` passes. The selection is a `Set<string>` the
 * parent owns; the component only reports the next Set. Below 768 the popup
 * is a bottom sheet — pick the 375 chip and open one.
 */

import { useState } from "react"

import { MultiSelect } from "@/components/ui/multi-select"
import { getRichAlbums } from "@/lib/album-catalog"

const ARTISTS = Array.from(new Set(getRichAlbums().map(a => a.artist)))

export default function MultiSelectBasicExample() {
  const [type, setType]     = useState<Set<string>>(new Set(["album", "single"]))
  const [artist, setArtist] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<Set<string>>(new Set())
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelect
        label="Type"
        selected={type}
        onChange={setType}
        options={[
          { value: "album",  label: "Album" },
          { value: "single", label: "Single" },
          { value: "ep",     label: "EP" },
        ]}
      />
      <MultiSelect
        label="Artist"
        searchable
        searchPlaceholder="Search artists…"
        minWidth="min-w-52"
        selected={artist}
        onChange={setArtist}
        options={ARTISTS.map(a => ({ value: a, label: a }))}
      />
      <MultiSelect
        label="Status"
        selected={status}
        onChange={setStatus}
        options={[
          { value: "public",  label: "Public" },
          { value: "private", label: "Private" },
        ]}
      />
    </div>
  )
}
