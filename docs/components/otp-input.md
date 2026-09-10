---
title: OTP Input
source: src/components/ui/input-otp.tsx
related: [input, login, form]
usage:
  - nothing yet — login is email + password, no code step
---

`InputOTP` is the segmented code field for a one-time verification code — six boxes, one character each, that behave as a single input: type and the caret advances, paste and it fills, Backspace steps back. It wraps `input-otp`; the login dialog's "we sent you a code" step is where it belongs.

## Anatomy

| Part | Wears | Notes |
|---|---|---|
| `InputOTP` | container `flex items-center gap-2 has-[:disabled]:opacity-50`; the real `<input>` `disabled:cursor-not-allowed` | one invisible `<input maxLength={n}>` receives every keystroke; the slots only display |
| `InputOTPGroup` | `flex items-center` | slots in a group touch, sharing borders |
| `InputOTPSlot` | `h-10 w-10 border-y border-r border-border bg-background text-base`; `first:rounded-l-md first:border-l last:rounded-r-md`; active `z-10 ring-3 ring-ring/50` | 40px — the form-control height; the active slot lifts (`z-10`) so its ring is not cut by the neighbour's border. **The one control still on the old `ring-3`**: everything else moved to the `focus-ring` outline, and an outline on a segmented field would trace each slot's own box |
| Fake caret | `animate-caret-blink h-4 w-px bg-foreground` (`--animate-caret-blink`, `app.css:275`) | the real caret is in the hidden input; this one blinks in the active slot |
| `InputOTPSeparator` | `role="separator"`; a `·` in `text-muted-foreground` | between groups of three |

## Usage

```tsx
import { REGEXP_ONLY_DIGITS } from "input-otp"

<InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} onComplete={verify}>
  <InputOTPGroup>
    <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

A four-digit PIN is `maxLength={4}` and one group. Slot `index` runs `0 … maxLength − 1` across the groups. `pattern={REGEXP_ONLY_DIGITS}` refuses letters and brings up the numeric keyboard on phones.

## Sizing

Fixed, no steps: six 40px slots, two 8px gaps and a `·` — about 260px, inside a 320px phone's 296px column.

## Behaviour

- A tap anywhere in the field focuses the hidden input; the active slot is the one the caret is in, shown by the ring and the fake caret.
- Typing advances, Backspace clears and steps back, ← / → move, paste distributes across the slots, `onComplete` fires once all `maxLength` characters are in.
- `disabled` dims the whole field (`has-[:disabled]:opacity-50`) and blocks the cursor.

## Open questions

- The slots are `rounded-l-md` / `rounded-r-md` on a `bg-background` box with a plain `border-border`, and focus is `ring-3 ring-ring/50` alone — the app's other controls now draw `focus-ring`, a 2px outline at 20% of `--ring`; the form-control recipe (`DESIGN_SYSTEM.md`) is `rounded-full` with `hover:border-foreground/30`. A segmented field cannot be a pill, and whether it should also carry the shared ring is not recorded, but the hover and the ring's border are missing without a stated reason.
- Not wired: `login-dialog.tsx:13` says the OTP step "reuses the DS OTP Input component when wired to a real auth backend"; today the login is one step, and this component renders only on the design-system page.
