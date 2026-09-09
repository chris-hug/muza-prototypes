"use client"

/*
 * Chip Input in the pattern the upload flow uses: the committed names sit
 * above the field as `ChipDismiss` chips, the `ChipInput` below only hands
 * batches up. Type a name — a comma makes it a pending chip inside the
 * field, Enter commits every pending chip to the list above.
 *
 * This file is a CALL SITE, not a copy: it is the Main artists band of
 * `upload-music-dialog.tsx`, seeded with an artist from the catalog.
 * `ChipInput` keeps no committed state — `onCommit` is its whole API — so
 * the list above is the host's and the field is empty between commits.
 */

import { useState } from "react"

import { ChipInput } from "@/components/ui/chip-input"
import { ChipDismiss, ChipGroup } from "@/components/ui/chip"
import { Label } from "@/components/ui/label"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()

export default function ChipInputBasicExample() {
  const [artists, setArtists] = useState<string[]>([ALBUM.artist])
  return (
    <div className="flex flex-col gap-2 w-full max-w-xl">
      <Label>Main artists</Label>
      {artists.length > 0 && (
        <ChipGroup className="mb-1">
          {artists.map((name, i) => (
            <ChipDismiss
              key={`${name}-${i}`}
              onDismiss={() => setArtists(prev => prev.filter((_, j) => j !== i))}
            >
              {name}
            </ChipDismiss>
          ))}
        </ChipGroup>
      )}
      <ChipInput
        placeholder="Add a collaborator…"
        onCommit={values => setArtists(prev => [...prev, ...values])}
      />
      <p className="text-2xsmall text-muted-foreground">
        Separate names with a comma, then press{" "}
        <span className="font-medium text-foreground">Enter</span> to add them.
      </p>
    </div>
  )
}
