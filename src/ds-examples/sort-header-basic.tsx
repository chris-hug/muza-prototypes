"use client"

/*
 * SortHeader — a sortable column, in the three states it has.
 *
 * The frame is a real `TableHead` row rather than three loose buttons: the
 * component is a label INSIDE a header cell, and its hover hint only reads
 * correctly against the cells beside it.
 *
 * Click a header to sort by it; click the same one again to turn the arrow
 * around. That is the whole interaction, and it is the reason the arrow is
 * always in the layout — pointing at a column must not move the row.
 */

import { useState } from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, SortHeader } from "@/components/ui/table"

const ROWS = [
  { title: "A Love Supreme", year: 1965, tracks: 4 },
  { title: "Out to Lunch",   year: 1964, tracks: 5 },
  { title: "Maiden Voyage",  year: 1965, tracks: 6 },
]

type Key = "title" | "year" | "tracks"

export default function SortHeaderBasicExample() {
  const [key, setKey] = useState<Key>("year")
  const [dir, setDir] = useState<"asc" | "desc">("desc")

  const sortBy = (next: Key) => {
    if (next === key) setDir(d => (d === "asc" ? "desc" : "asc"))
    else { setKey(next); setDir("asc") }
  }

  const rows = [...ROWS].sort((a, b) => {
    const x = a[key], y = b[key]
    const cmp = typeof x === "number" && typeof y === "number"
      ? x - y
      : String(x).localeCompare(String(y))
    return dir === "asc" ? cmp : -cmp
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortHeader label="Title" active={key === "title"} dir={dir} onClick={() => sortBy("title")} />
          </TableHead>
          <TableHead>
            <SortHeader label="Recorded" active={key === "year"} dir={dir} onClick={() => sortBy("year")} />
          </TableHead>
          <TableHead>
            <SortHeader label="Tracks" active={key === "tracks"} dir={dir} onClick={() => sortBy("tracks")} />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(r => (
          <TableRow key={r.title}>
            <TableCell className="text-foreground">{r.title}</TableCell>
            <TableCell className="tabular-nums">{r.year}</TableCell>
            <TableCell className="tabular-nums">{r.tracks}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
