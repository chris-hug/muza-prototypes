---
title: Switch
source: src/components/ui/switch.tsx
related: [checkbox, dialog, form]
usage:
  - Vinyl — create listing, 6 toggles | /?page=Shop
  - Edit release — visibility and monetisation | /?page=Music
  - Create playlist — public / private | /?page=Playlists
---

`Switch` is the on/off control for a setting that takes effect by itself —
"Keep private" on a new playlist, a listing's visibility, a shop
notification. A `primary` track when on, an `input` track when off, and two
sizes.

## Anatomy

```tsx
<Switch id="keep-private" checked={keepPrivate} onCheckedChange={setKeepPrivate} />
<Switch size="sm" … />
```

One base-ui `Switch.Root` (the track) with a `Switch.Thumb`; the size travels
as `data-size` so the thumb can read it through `group/switch`.

| | `default` | `sm` |
|---|---|---|
| track | 32 × 18px | 24 × 14px |
| thumb | 16px (`size-4`) | 12px (`size-3`) |
| thumb travel | `translate-x-[1px]` off → `translate-x-[14px]` on | 1px → 10px |
| hit area | 56 × 34px | 48 × 30px |

The track is `rounded-full border border-transparent` — the border is there
so the focus ring has an edge to colour (`focus-visible:border-ring` under
`focus-ring`) without the track growing on focus. The hit area is the same `after:-inset-x-3 after:-inset-y-2`
pseudo-element the checkbox uses.

| State | Track | Thumb (light) | Thumb (dark) |
|---|---|---|---|
| on | `bg-primary` | `bg-background` | `bg-primary-foreground` |
| off | `bg-input` (`dark:bg-input/80`) | `bg-background` | `bg-foreground` |

In dark mode the off thumb flips to `foreground` because `background` and
`input` are both near-black there and the thumb would vanish on its track.
Disabled is `data-disabled:opacity-50` with `cursor-not-allowed`; invalid is
the shared `aria-invalid:border-destructive` ring.

```text
default, on    1 (border) + 14 (translate) + 16 (thumb) = 31 → 1px from the right edge
default, off   1 (border) + 1  (translate)              = 2px from the left edge
```

## Usage — the setting row

The switch is never alone; it sits in a row with its consequence. Two real
recipes:

```tsx
// A single setting in a form — label leads, switch trails, the whole row is the label.
// create-playlist-dialog.tsx:196–202
<label className="flex w-full items-center justify-end gap-3 cursor-pointer">
  <span className="text-foreground text-small flex items-center gap-2 font-medium">
    <Lock className="size-4" />
    Keep private
  </span>
  <Switch checked={keepPrivate} onCheckedChange={setKeepPrivate} />
</label>

// A setting with a description — text block left, switch right, paired by id.
// bulk-action-dialog.tsx:180–194
<div className="flex items-center gap-3">
  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
    <Label htmlFor="bulk-notify" className="cursor-pointer">Send the shipping note to each buyer</Label>
    <p className="text-xsmall text-muted-foreground">Uses your shop default …</p>
  </div>
  <Switch id="bulk-notify" checked={notify} onCheckedChange={setNotify} />
</div>
```

`justify-end` in the first is deliberate: in a phone sheet the control lands
under the thumb and nothing floats alone on the left. Wrapping in `<label>`
makes the text a target with no `htmlFor`; the second recipe needs the
`id` pair because its text is not the label element.

## Sizing

Fixed, no steps. Neither size reads the window; `size="sm"` is a choice for
dense rows (`edit-release-dialog.tsx`, `upload-music-dialog.tsx` pass it
where a switch sits inside a card), not a responsive step.

## Behaviour

- `onCheckedChange(checked: boolean, eventDetails)`; `checked` /
  `defaultChecked` for controlled / uncontrolled.
- Space toggles a focused switch (it renders as a `<button role="switch">`,
  so Enter fires its click too). A wrapping `<label>` or an `htmlFor` label
  toggles on click.
- base-ui renders a hidden `<input>`; `name` submits with a form.
- The thumb slides and the track fades. Both were once broken in the same
  place and only the thumb was ever right; see **Motion**.

## Motion

Two transitions, on two elements, with two different jobs.

**The track** (`switch.tsx:31`) names its properties literally:

```
transition-[color,background-color,border-color,outline-color,transform]
```

Written out rather than `transition-colors` because the outline colour has to
travel with them — the focus ring and the invalid ring are both outlines, and a
switch that gains one mid-transition should not snap.

**The thumb** (`switch.tsx:64`) gets the character:

```
transition-transform duration-300
[transition-timing-function:cubic-bezier(.68,-0.55,.27,1.55)]
```

An overshoot curve: it runs a little past the end of the track and settles
back, which is what a physical toggle does. The thumb takes its spring in the
TRAVEL rather than in a scale, and that is a constraint rather than a
preference — the tick animation the checkbox and radio use sets
`transform: scale()`, which would overwrite the very translate that moves it.
Same curve as the pick mark's strokes in [select-track](select-track.md), so
the two confirmations in the create-playlist flow are in the same hand.

The thumb's class is not written out in the source comment for a reason worth
knowing: Tailwind scans the file as text, so a class quoted in prose is a class
it generates.

## Invalid

**`invalid-ring`** draws the error state: the same 2px outline `focus-ring` uses, in `--destructive` at 20% (40% in dark, where `--destructive` is `red-900` and 20% of it against a near-black track is a warning nobody sees). Because the two utilities share their geometry, a switch that is both focused and invalid can only differ in colour.

## Open questions

- `switch.tsx:16` says the unchecked thumb is `--foreground` · the source
  paints the thumb `bg-background` in both states in light mode (`:54`) and
  swaps to `bg-foreground` only under `dark:` when off (`:76`). The header's
  table describes dark mode as if it were both.
- ~~`transition-[colors,transform]` compiles to
  `transition-property: colors, transform`; `colors` is not a CSS property, so
  the declaration is invalid and the track snaps between `input` and
  `primary`.~~ **Answered.** The track now names the four colour properties and
  `transform` outright (`switch.tsx:31`), so it fades. Recorded because the
  failure is silent: an invalid `transition-property` does not warn, it just
  does nothing, and "the designer wanted a snap" is the wrong conclusion to
  reach from looking at it.
- The thumb sits 2px in when off and 1px in when on (arithmetic above), both
  sizes; the comment on `:68` derives 14 as "track − thumb − 2px padding" but
  the border eats one of those pixels only on the far side.
- ~~The design-system section drew a third setting row — switch leading,
  `text-base` label, description under, `ms-2` — that no call site uses.~~
  **Answered.** The section is now `src/ds-examples/switch-basic.tsx`, which
  renders four labelled rows plus the real "Keep private" row from
  `create-playlist-dialog.tsx`. Nothing invented for the frame.
