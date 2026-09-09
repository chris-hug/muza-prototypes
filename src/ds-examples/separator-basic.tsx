"use client"

/*
 * Separator both ways: horizontal hairlines between stacked rows, and
 * vertical ones between counts in a single line.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Separator`. The vertical one is `self-stretch`, so it takes its height
 * from the flex row it sits in — the row must have one (`h-6` here), or the
 * line is zero pixels tall.
 */

import { Separator } from "@/components/ui/separator"

export default function SeparatorBasicExample() {
  return (
    <div className="flex w-full max-w-md flex-col gap-8 text-small text-foreground">
      <div className="flex flex-col gap-3">
        <span>Recently played</span>
        <Separator />
        <span>Saved albums</span>
        <Separator />
        <span>Following</span>
      </div>

      <div className="flex h-6 items-center gap-3">
        <span>Songs · 248</span>
        <Separator orientation="vertical" />
        <span>Albums · 32</span>
        <Separator orientation="vertical" />
        <span>Playlists · 14</span>
      </div>
    </div>
  )
}
