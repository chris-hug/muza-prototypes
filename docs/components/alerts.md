---
title: Alerts
source: src/components/ui/alert.tsx
related: [toast, alertdialog]
usage:
  - Shop › My products — empty / warning state | /?page=Shop
---

An `Alert` is an inline, persistent notice that belongs to the content it sits
in — "your track is processing", "the shop is not live yet". It stays until
the condition changes; a [toast](toast.md) registers and leaves, and an
[alert dialog](alertdialog.md) asks for a decision.

## Anatomy

```tsx
<Alert variant="destructive">
  <AlertCircle />
  <AlertTitle>Upload failed</AlertTitle>
  <AlertDescription>File format not supported. Please upload an MP3 or WAV file.</AlertDescription>
  <AlertAction>
    <Button variant="outline" size="sm">Open settings</Button>
  </AlertAction>
</Alert>
```

| Part | What it wears | Why |
|---|---|---|
| `Alert` | `grid w-full gap-1 rounded-lg border px-3 pt-3 pb-[14px] text-small`, `role="alert"` | `pb-[14px]` over `pb-3`: the description's `leading-5` leaves the last line optically higher than the first, so 2px extra at the bottom centres the block |
| leading `<svg>` | `size-4 self-start mt-[3px] text-current`, first column of `grid-cols-[auto_1fr]` with `gap-x-2.5` | `self-start` + 3px: the glyph sits on the title's x-height centre instead of floating between title and description when the description wraps |
| `AlertTitle` | `font-heading font-medium leading-5` | the only medium weight on the surface |
| `AlertDescription` | `text-small leading-5 text-muted-foreground text-balance md:text-pretty` | balanced on phones (short measures), pretty on desktop |
| `AlertAction` | `absolute right-3 top-1/2 -translate-y-1/2`; the alert reserves `pr-18` for it (`has-data-[slot=alert-action]`) | centred on the whole body, so it does not float above the description on a two-line alert |

Both the icon column and the action are detected structurally (`has-[>svg]`,
`has-data-[slot=alert-action]`), so an alert without an icon or an action
loses that column and that padding without a prop.

## Variants

| `variant` | Surface | Text |
|---|---|---|
| `default` | `bg-card text-card-foreground` | title and description as above |
| `destructive` | `bg-card text-destructive`, description `text-destructive/90`, icon `text-current` | the surface stays the card's — only the type turns red, so a destructive alert is still one family with the default one |

There is no `success` / `warning` / `info` variant on purpose: a coloured
surface makes an alert compete with the content it annotates. The icon
carries the meaning, as it does in the toast.

## Usage

```tsx
<Alert>
  <Info />
  <AlertTitle>Heads up</AlertTitle>
  <AlertDescription>Your track is processing. It may take up to 10 minutes to appear publicly.</AlertDescription>
</Alert>
```

Used by **Shop › My products** (`shop-my-products.tsx`): the destructive
"Shop not live yet" alert with an `AlertAction` linking to settings.

## Sizing

Fills its **column** (`w-full`); no steps. The only width-dependent class is
`md:text-pretty` on the description — a text-wrapping preference, not a
presentation switch. There is no phone / desktop form.

## Behaviour

Static. `role="alert"` announces the content when it mounts, so an alert
that appears in response to an action is read out; mount it only when the
condition is true rather than toggling visibility with a class.

## Motion

**Colour changes fade through `state-fade`** — `color, background-color, border-color, outline-color, opacity` on `cubic-bezier(0.2,0,0,1)`, 440ms in and 100ms out. The split needs no second mechanism: the transition that runs on the way in is the one declared on `:hover`, the one on the way out is the one on the element. An Alert's own links ride on it, so a hover inside the copy eases like everything else.

## Open questions

- alert.tsx:8 (comment) says `py-3` — the class is `pt-3 pb-[14px]`; the comment predates the 2px bottom adjustment.
