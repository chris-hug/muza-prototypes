"use client"

/*
 * SingleSelect three ways: the default sort trigger (ArrowUpDown, showing
 * the picked option), a fixed label ("Sort" — the trigger names the
 * category, the menu carries the value) and no icon — the generic pick-one
 * pill.
 *
 * This file is a CALL SITE, not a copy: the real `SingleSelect` with the
 * sort options the Discography grid uses. All three share one value, so a
 * pick in any menu updates the others. Below 768 the menu is a bottom sheet
 * — pick the 375 chip and open one.
 */

import { useState } from "react"

import { SingleSelect } from "@/components/ui/single-select"

type Sort = "year-desc" | "year-asc" | "title-az"

const SORTS = [
  { value: "year-desc", label: "Recording date (newest)" },
  { value: "year-asc",  label: "Recording date (oldest)" },
  { value: "title-az",  label: "Title (A–Z)" },
] as const

export default function SingleSelectBasicExample() {
  const [sort, setSort] = useState<Sort>("year-desc")
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SingleSelect value={sort} onChange={setSort} options={SORTS} />
      <SingleSelect value={sort} onChange={setSort} options={SORTS} label="Sort" />
      <SingleSelect value={sort} onChange={setSort} options={SORTS} icon={null} />
    </div>
  )
}
