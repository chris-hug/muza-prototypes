"use client"

/*
 * Select in its three everyday shapes: a placeholder trigger whose popup is
 * grouped by label (real albums from the catalog), a pre-filled sort trigger,
 * and a disabled one.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Select` parts, so the code shown under `</>` is the code that runs. Each
 * field is uncontrolled (`defaultValue`) — nothing here needs page state, so
 * what you copy out compiles on its own.
 *
 * The trigger is `w-fit`; the popup takes the trigger's width. Open the album
 * field to see the label groups and the ✓ on the picked row.
 */

import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { getRichAlbums } from "@/lib/album-catalog"

const ALBUMS = getRichAlbums()
const LABELS = Array.from(new Set(ALBUMS.map(a => a.label ?? "Other")))

const SORTS = [
  { value: "recent",  label: "Most recent" },
  { value: "popular", label: "Most popular" },
  { value: "az",      label: "A → Z" },
  { value: "za",      label: "Z → A" },
]

export default function SelectBasicExample() {
  return (
    <div className="flex flex-wrap gap-6 items-start">
      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-auto">
        <Label htmlFor="select-album">Album</Label>
        <Select>
          <SelectTrigger id="select-album">
            <SelectValue placeholder="Pick an album" />
          </SelectTrigger>
          <SelectContent>
            {LABELS.map(label => (
              <SelectGroup key={label}>
                <SelectLabel>{label}</SelectLabel>
                {ALBUMS.filter(a => (a.label ?? "Other") === label).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-auto">
        <Label htmlFor="select-sort">Sort by</Label>
        <Select defaultValue="recent">
          <SelectTrigger id="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-auto">
        <Label htmlFor="select-disabled">Disabled</Label>
        <Select disabled>
          <SelectTrigger id="select-disabled">
            <SelectValue placeholder="Pick an album" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALBUMS[0].id}>{ALBUMS[0].title}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
