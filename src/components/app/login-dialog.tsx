"use client"

/*
 * LoginDialog — passwordless email → one-time-passcode entry point.
 *
 * Content/flow referenced from a generic "create account or log in" modal,
 * rebuilt in the Muza language: muza mark, semantic type scale, pill primary
 * (no gradient), rounded form control. Mobile behaviour is inherited from the
 * base `DialogContent` — bottom sheet < 768px, centered modal ≥ 768px (`md`, the same gate as `useIsMobile`) — so we
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
import { LogoMark } from "@/components/ui/logo"

const TITLE = "Create a free account"
const DESCRIPTION = "Enter your email to get a one-time passcode."

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
      {/* No visible label. The dialog is one field long and the line above it
          already says what to type, so "Email" over an email box was the same
          sentence twice. The name still has to exist for anyone not reading
          it, hence `aria-label` — a placeholder is not a label: it is gone the
          moment you start typing, and screen readers are not obliged to
          announce it. */}
      <Input
        id="login-email"
        type="email"
        aria-label="Email address"
        autoComplete="email"
        placeholder="Enter your email address"
        /* `?? ""` keeps the field CONTROLLED in the preview too. With
           `undefined` React hands the input back to the DOM, and a static
           frame then quietly becomes typeable — and holds whatever it was
           left with across a hot reload, which is how a value survived the
           edit that was supposed to empty it. */
        value={email ?? ""}
        onChange={e => setEmail?.(e.target.value)}
      />
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
      {/* Centred, and the `pl-8` is what makes it true: the dialog header
          reserves `pr-8` for the ✕, so a plain `text-center` inside it centres
          on a box that is 32px narrower on the right and sits visibly left of
          the card's middle. Matching that inset on the other side gives the
          text the card's own axis back.
          
          The mark leads, so it is sized to lead: 40px, not 28. `mb-2` gives it
          its own air — the header stack is `gap-1.5`, tight because most
          dialogs open straight onto a title, and at that gap a brand mark
          reads as part of the headline instead of as the thing saying whose
          dialog this is. */}
      <div className="w-full flex flex-col items-center text-center pl-8">
        <LogoMark className="w-10 h-auto text-foreground mb-2" />
        <Title className="md:text-large">{TITLE}</Title>
        <Desc className="mt-1.5">{DESCRIPTION}</Desc>
      </div>
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
      <DialogContent className="md:max-w-md">
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
    <DialogPreview className={className ?? "md:max-w-md"}>
      <DialogPreviewHeader>
        <LoginHeading preview />
      </DialogPreviewHeader>
      {/* Empty, which is what a person actually opens: the placeholder, and a
          CTA that cannot fire yet. It used to carry `naomi@example.com` so the
          button would render in its enabled blue — a nicer picture of a state
          nobody sees first, and it read as the dialog SUGGESTING an address
          rather than waiting for one. A frame documents what the component
          does on arrival. */}
      <LoginBody />
      <p className="text-2xsmall text-muted-foreground">
        By continuing you agree to Muza's Terms. We only email you the sign-in code.
      </p>
    </DialogPreview>
  )
}
