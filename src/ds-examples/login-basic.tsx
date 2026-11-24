"use client"

/*
 * Login — the dialog body, shown inline through `LoginDialogPreview` so the
 * frame needs no click. The real heading and form; the email is seeded so
 * the CTA shows enabled. Below a 640 window chip the preview takes the sheet
 * shape.
 */

import { LoginDialogPreview } from "@/components/app/login-dialog"

export default function LoginBasicExample() {
  return <LoginDialogPreview />
}
