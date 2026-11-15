"use client"

/*
 * Credits Dialog, an album — the cover floating
 * over a blurred band of itself, then album, main artist · year, the
 * musicians with what they play, production and the sleeve, and the release
 * card. Three covers in three colours side by side (Speak No Evil, Cool
 * Struttin', Out to Lunch), so the band shows how it takes each cover's own
 * colour.
 */

import { CreditsDialogPreview } from "@/components/app/credits-dialog"

export default function CreditsDialogBExample() {
  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-6">
      {["a02", "a04", "a06"].map(key => (
        <CreditsDialogPreview key={key} albumKey={key} variant="current" />
      ))}
    </div>
  )
}
