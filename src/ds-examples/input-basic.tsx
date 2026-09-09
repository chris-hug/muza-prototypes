"use client"

/*
 * Input in its four everyday shapes: a plain field with a hint, a field in
 * its error state, a search field with a leading icon, and a filter field
 * whose ✕ appears once there is a value.
 *
 * This file is a CALL SITE, not a copy: it renders the real `Input` with the
 * props the app passes. The affordances — `startIcon`, `onClear`, `hint`,
 * `hintTone` — are props, so the field owns the padding they cost; nothing
 * here hand-rolls a wrapper. `onClear` needs a controlled value (the ✕ shows
 * while `value` is truthy), which is why only the last field carries state.
 */

import { useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function InputBasicExample() {
  const [query, setQuery] = useState("Blue Note")
  return (
    <div className="flex flex-wrap gap-6 items-start">
      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-[280px]">
        <Label htmlFor="input-name">Display name</Label>
        <Input
          id="input-name"
          placeholder="e.g. Kendrick Lamar"
          hint="Your public display name on Muza."
        />
      </div>

      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-[280px]">
        <Label htmlFor="input-email">Email</Label>
        <Input
          id="input-email"
          type="email"
          placeholder="you@muza.com"
          defaultValue="not-an-email"
          aria-invalid="true"
          hint="Enter a valid email address."
          hintTone="error"
        />
      </div>

      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-[280px]">
        <Label htmlFor="input-search">Search</Label>
        <Input id="input-search" startIcon={<Search />} placeholder="Search artists, albums…" />
      </div>

      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-[280px]">
        <Label htmlFor="input-filter">Filter — clearable</Label>
        <Input
          id="input-filter"
          startIcon={<Search />}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          placeholder="Filter your library…"
        />
      </div>
    </div>
  )
}
