"use client"

/*
 * Login, LIVE — the real `LoginDialog` behind a trigger: portal, focus trap,
 * the CTA disabled until the field has a value. Below a 768 window chip it
 * opens as a bottom sheet, straight from the base `DialogContent`.
 */

import { useState } from "react"

import { LoginDialog } from "@/components/app/login-dialog"
import { Button } from "@/components/ui/button"

export default function LoginLiveExample() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Open as modal</Button>
      <LoginDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
