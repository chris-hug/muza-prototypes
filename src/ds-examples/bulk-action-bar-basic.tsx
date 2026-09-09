"use client"

/*
 * Bulk Action Bar — the pill Studio › Music shows once rows are ticked:
 * the count, a divider, two actions, ✕. This is `BulkActionBarContent`,
 * the pill on its own, inside the same centring row the live bar draws.
 * The live `BulkActionBar` wraps exactly this pill and portals it to the
 * bottom of the content area (`#app-content`), which is why it cannot sit
 * inside a frame — the pill can. Pull the window chip down to 375 and the
 * actions wrap onto a second line, as they do on a phone.
 *
 * In the app `onClear` empties the selection set, which drops `count` to
 * 0 and unmounts the live bar.
 */

import { BulkActionBarContent, BulkActionButton } from "@/components/ui/bulk-action-bar"

export default function BulkActionBarBasicExample() {
  return (
    <div className="flex justify-center">
      <BulkActionBarContent count={12} onClear={() => {}}>
        <BulkActionButton>Make public</BulkActionButton>
        <BulkActionButton>Make private</BulkActionButton>
      </BulkActionBarContent>
    </div>
  )
}
