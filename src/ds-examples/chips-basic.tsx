"use client"

/*
 * Chips in the shapes the app uses: a multi-select genre filter (primary fill
 * when selected), the same filter with `activeStyle="outline"` (the Create
 * listing form's release type), and dismissible chips (the Studio / Orders
 * active-filter strip, the upload form's artist lists).
 *
 * This file is a CALL SITE, not a copy: it renders the real `Chip`,
 * `ChipDismiss` and `ChipGroup`. Selection is real state, so the chips flip.
 */

import { useState } from "react"

import { Chip, ChipDismiss, ChipGroup } from "@/components/ui/chip"

const GENRES = ["Hip-Hop", "Electronic", "Jazz", "R&B", "Indie", "Afrobeats", "Pop"]
const RELEASE_TYPES = ["Album", "Single", "EP"]

export default function ChipsBasicExample() {
  const [genres, setGenres] = useState<string[]>(["Electronic"])
  const [type, setType] = useState("Album")
  const [tags, setTags] = useState(["Hip-Hop", "Electronic", "Jazz", "Indie"])

  const toggleGenre = (g: string) =>
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  return (
    <div className="flex flex-col gap-5">
      {/* Filter — multi-select, "All" is the empty selection */}
      <ChipGroup>
        <Chip selected={genres.length === 0} onClick={() => setGenres([])}>All</Chip>
        {GENRES.map(g => (
          <Chip key={g} selected={genres.includes(g)} onClick={() => toggleGenre(g)}>{g}</Chip>
        ))}
      </ChipGroup>

      {/* Single-select, outline when active — vinyl-create-listing.tsx */}
      <ChipGroup>
        {RELEASE_TYPES.map(t => (
          <Chip key={t} selected={type === t} activeStyle="outline" onClick={() => setType(t)}>{t}</Chip>
        ))}
      </ChipGroup>

      {/* Dismissible — the ✕ is the only button; the chip itself is a span */}
      <ChipGroup>
        {tags.map(tag => (
          <ChipDismiss key={tag} onDismiss={() => setTags(prev => prev.filter(t => t !== tag))}>
            {tag}
          </ChipDismiss>
        ))}
        {tags.length === 0 && (
          <Chip variant="ghost" onClick={() => setTags(["Hip-Hop", "Electronic", "Jazz", "Indie"])}>
            Reset
          </Chip>
        )}
      </ChipGroup>
    </div>
  )
}
