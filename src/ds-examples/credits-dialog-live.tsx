"use client"

/*
 * Credits Dialog, LIVE — opened the way the app opens it: `useCredits().open(key)`
 * from any component under `CreditsProvider` (mounted once in the app shell;
 * the design-system page mounts its own). Two releases so the data variety
 * shows. Artist, album and performers navigate and dismiss the dialog. Below
 * a 768 window chip it opens as a bottom sheet.
 */

import { useCredits } from "@/components/app/credits-dialog"
import { Button } from "@/components/ui/button"

export default function CreditsDialogLiveExample() {
  const credits = useCredits()
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => credits.open("a07")}>Show credits · A Love Supreme</Button>
      <Button variant="outline" onClick={() => credits.open("out-to-lunch")}>Show credits · Out to Lunch</Button>
    </div>
  )
}
