---
title: Login
source: src/components/app/login-dialog.tsx
related: [dialog, otp-input, input, paywall]
usage:
  - Account entry — sign in / create account (passwordless) | /?page=Settings
---

`LoginDialog` is the passwordless account entry — one email field and one
pill that sends a one-time passcode. A plain dialog in the Muza language
(mark, semantic type, no gradient), not the paywall's landing-page split.

## Anatomy

```tsx
<DialogContent className="md:max-w-md">
  <DialogHeader>
    <LogoMark className="w-7 h-auto text-foreground" />
    <DialogTitle className="md:text-large">Create a free account or log in</DialogTitle>
    <DialogDescription>Enter your email and we'll send you a one-time passcode — no password to remember.</DialogDescription>
  </DialogHeader>
  <form className="flex flex-col gap-4">
    <Label htmlFor="login-email" className="font-medium">Email</Label>
    <Input id="login-email" type="email" autoComplete="email" placeholder="Enter your email address" />
    <Button type="submit" size="lg" className="w-full" disabled={!email.trim()}>Send me a one-time passcode</Button>
  </form>
  <p className="text-2xsmall text-muted-foreground">By continuing you agree to Muza's Terms. We only email you the sign-in code.</p>
</DialogContent>
```

| Part | What it wears | Why |
|---|---|---|
| Mark | `LogoMark w-7 text-foreground`, first in the header stack | the dialog is the account's front door, so the brand leads |
| Title | `dialogTitleClass` + `md:text-large` | `text-small` on the sheet, where it shares the line with the ✕; the larger desktop title from 768 |
| Field | `Label` (`font-medium`) + `Input type="email"`, `autoComplete="email"` | the one thing asked for |
| CTA | `Button size="lg" w-full px-4`, `disabled` until the field has a non-blank value | one action, full width, 48px. `px-4`, not `lg`'s 40: at 40 the label needed 318px and pushed the form past a 320 phone |
| Fine print | `text-2xsmall text-muted-foreground` | terms and what the email is used for |

`LoginBody` and `LoginHeading` are shared by the live dialog and the static
preview; `LoginHeading preview` swaps `DialogTitle` / `DialogDescription`
for their `DialogPreview*` twins. The preview shows the field EMPTY, on its
placeholder, with the CTA at its 50% disabled opacity — the state a person
actually opens. It used to seed `naomi@example.com` to get the enabled blue
button into the frame, which documented a nicer picture of a state nobody
meets first and read as the dialog suggesting an address it cannot know.

The field has no visible label: the dialog is one field long and the line
above it already says what to type. The name lives in `aria-label="Email
address"` — a placeholder is not a label, it disappears on the first
keystroke and a screen reader need not announce it.

## Usage

```tsx
const [open, setOpen] = useState(false)
<LoginDialog open={open} onOpenChange={setOpen} />
```

Single step by design: email → "we sent you a code". The code-entry step
reuses the [OTP Input](otp-input.md) once a real auth backend is wired.

## Sizing

Reads the **window** at **768** through the base dialog and sets its
desktop width, `md:max-w-md` (448px). The bottom sheet below 768 is
inherited from `DialogContent` — there is no positioning of its own here,
which is the rule every dialog follows. No column or box step.

**On a phone it sets its own spacing.** The base sheet's 12px inset and 8px
gaps suit a sheet of rows, not a sheet of three things: the field and button
ran nearly to the edge and heading, form and fine print sat on top of each
other. So `max-md:px-6` (the page gutter, so the field lines up with the page
behind), `max-md:gap-6` between heading, form and fine print, `gap-3` between
field and button (one action), 24 below, and `max-md:pt-7` so the mark clears
the grabber the base overlays at 6px.

**With the keyboard up** (`[data-kb="open"]`, app.css) the sheet has about
169px above an iPhone keyboard in Brave. Title, field and button need 151 of
it, so the mark, the line under the title and the fine print
(`data-login-aside`) step aside and the paddings shrink to 12 / 8 with 8
between. Field and button keep their 48. Everything returns when the
keyboard goes.

**The static preview shows the same sheet.** Its frame only pretends to be a
phone, so the `max-md:` classes above never reach it; `LoginDialogPreview`
passes the same values through `DialogPreview`'s `phoneClassName`. Change one,
change the other.

## Behaviour

- Submitting the form (Enter or the CTA) calls `onOpenChange(false)`; there
  is no request yet.
- The CTA enables on a non-blank value only; the field is `type="email"` so
  the browser validates the shape on submit.
- The field asks a phone for an address keyboard and leaves it alone:
  `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`, and
  `enterKeyHint="send"` so the code goes out from the keyboard.
- Closes like any dialog: ✕, backdrop, `Escape`.

## Open questions

- `LoginDialog` is mounted nowhere in the prototype — only the design-system page imports it (`home.tsx`). The section's "Used in: Settings" link points at a page that does not open it; the section carries no `concept` status.
- login-dialog.tsx:34–35 (comment) says `preview` "swaps the live `<Input>` for a styled placeholder so the kitchen-sink render stays inert" · `LoginBody` has no `preview` prop and always renders the live `Input`; the preview's field is live but its `setEmail` is absent, so typing into it changes nothing — inert by accident, not by the described mechanism.
