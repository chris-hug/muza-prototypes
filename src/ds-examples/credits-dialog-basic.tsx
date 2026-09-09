"use client"

/*
 * Credits Dialog — the body, shown inline through `CreditsDialogPreview` so
 * the frame needs no click: the real `CreditsContent` off the real catalog
 * (A Love Supreme, key `a07`). Below a 768 window chip the preview takes the
 * sheet shape.
 */

import { CreditsDialogPreview } from "@/components/app/credits-dialog"

export default function CreditsDialogBasicExample() {
  return <CreditsDialogPreview albumKey="a07" />
}
