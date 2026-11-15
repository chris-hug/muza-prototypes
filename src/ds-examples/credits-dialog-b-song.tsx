"use client"

/*
 * Credits Dialog, a song — two heads side by side:
 * with the album's floating cover (the default) and text only
 * (`songCover={false}`). Under either: the musicians on that take, the
 * Composer section, and the Album as a row of its own. Black Radio,
 * "Afro Blue", as the draft below.
 */

import { CreditsDialogPreview } from "@/components/app/credits-dialog"

export default function CreditsDialogBSongExample() {
  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-6">
      <CreditsDialogPreview albumKey="a30" track="Afro Blue" variant="current" />
      <CreditsDialogPreview albumKey="a30" track="Afro Blue" variant="current" songCover={false} />
    </div>
  )
}
