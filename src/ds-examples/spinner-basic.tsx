"use client"

/*
 * Spinner in its three sizes, then composed the way the app uses it: the
 * large one over a "Processing payment…" line, as the purchase dialog does
 * while Square works, and the small one inline beside a saving message.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Spinner`. It draws in `currentColor`, so the wrapping text colour is what
 * tints it — the composed rows set `text-muted-foreground` once and both the
 * arc and the sentence take it.
 */

import { Spinner } from "@/components/ui/spinner"

export default function SpinnerBasicExample() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end gap-10">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </div>

      <div className="flex flex-col items-center gap-4 py-6 text-muted-foreground">
        <Spinner size="lg" label="Processing payment" />
        <p className="text-small">Processing payment…</p>
      </div>

      <div className="flex items-center gap-2 text-small text-muted-foreground">
        <Spinner size="sm" label="Saving" />
        <span>Saving changes…</span>
      </div>
    </div>
  )
}
