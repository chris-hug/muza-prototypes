"use client"

/*
 * LoginDialog — passwordless email → one-time-passcode entry point.
 *
 * Content/flow referenced from a generic "create account or log in" modal,
 * rebuilt in the Muza language: muza mark, semantic type scale, pill primary
 * (no gradient), rounded form control. Mobile behaviour is inherited from the
 * base `DialogContent` — bottom sheet < 640px, centered modal ≥ 640px — so we
 * set ONLY the desktop width here (see DESIGN_SYSTEM.md › "Responsive dialog →
 * bottom sheet — the BASE DEFAULT").
 *
 * Single step by design (email → "we sent you a code"); the OTP-entry step
 * reuses the DS `OTP Input` component when wired to a real auth backend.
 */

import { useState } from "react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogPreview, DialogPreviewHeader, DialogPreviewTitle, DialogPreviewDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogoMark } from "@/components/ui/logo"

const TITLE = "Create a free account or log in"
const DESCRIPTION = "Enter your email and we'll send you a one-time passcode — no password to remember."

// Shared inner form, used by both the live dialog and the static DS preview.
// `preview` swaps the live <Input> for a styled placeholder so the kitchen-sink
// render stays inert (no focus-stealing, no state).
function LoginBody({ email, setEmail, onSubmit }: {
  email?: string
  setEmail?: (v: string) => void
  onSubmit?: () => void
}) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={e => { e.preventDefault(); onSubmit?.() }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email" className="font-medium">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          value={email}
          onChange={e => setEmail?.(e.target.value)}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={!email?.trim()}>
        Send me a one-time passcode
      </Button>
    </form>
  )
}

// Brand mark + title + description, shared header for live + preview.
function LoginHeading({ preview = false }: { preview?: boolean }) {
  const Title = preview ? DialogPreviewTitle : DialogTitle
  const Desc  = preview ? DialogPreviewDescription : DialogDescription
  return (
    <>
      <LogoMark className="w-7 h-auto text-foreground" />
      <Title className="text-large">{TITLE}</Title>
      <Desc>{DESCRIPTION}</Desc>
    </>
  )
}

// ─── Live dialog (controlled) ────────────────────────────────────────────────
export function LoginDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [email, setEmail] = useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Desktop width only — mobile bottom-sheet comes from the base. */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <LoginHeading />
        </DialogHeader>
        <LoginBody email={email} setEmail={setEmail} onSubmit={() => onOpenChange(false)} />
        <p className="text-2xsmall text-muted-foreground">
          By continuing you agree to Muza's Terms. We only email you the sign-in code.
        </p>
      </DialogContent>
    </Dialog>
  )
}

// ─── Static preview (DS kitchen sink) ─────────────────────────────────────────
export function LoginDialogPreview({ className }: { className?: string }) {
  return (
    <DialogPreview className={className ?? "sm:max-w-md"}>
      <DialogPreviewHeader>
        <LoginHeading preview />
      </DialogPreviewHeader>
      {/* Filled email so the static preview shows the CTA in its enabled
          (primary-blue) state rather than the disabled 45%-opacity look. */}
      <LoginBody email="naomi@example.com" />
      <p className="text-2xsmall text-muted-foreground">
        By continuing you agree to Muza's Terms. We only email you the sign-in code.
      </p>
    </DialogPreview>
  )
}
