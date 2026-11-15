"use client"

/*
 * Credits Dialog, DRAFT, a song — what a song's "Show credits" opened in
 * the earlier version: the whole album read track by track, scrolled to that song under
 * its sticky bar (Black Radio, "Afro Blue"). Kept beside the current
 * version while it settles.
 */

import { CreditsDialogPreview } from "@/components/app/credits-dialog"

export default function CreditsDialogASongExample() {
  return <CreditsDialogPreview albumKey="a30" track="Afro Blue" variant="draft" />
}
