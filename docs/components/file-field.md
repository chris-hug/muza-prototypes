---
title: File Field
source: src/components/ui/file-field.tsx
related: [input, form, button]
usage:
  - Settings → Artist verification → ID upload | /?page=Settings
---

`FileField` is the form control for "choose a file": a pill that says what
kind of file is wanted, the chosen file's name beside it, and the whole row as
one target. It exists because the browser's own control is not a field — it
renders a button whose text, size and position belong to the platform, and the
parts you can style are not the parts that matter.

## The trick, and why it is not a Button beside an Input

The native input is `sr-only` and a `<label>` wraps it. Three things follow
from that one arrangement, and they are the reason this is a component rather
than a composition:

- **A label wrapping an input forwards every click on any part of the row.**
  The filename text and the empty space to its right open the dialog too. A
  `Button` beside an `Input` could only ever forward clicks on the button.
- **The input stays real**, so the form, `accept` and validation still work —
  the field is not a picture of a file input, it is one.
- **`sr-only`, not `hidden`.** A hidden input is not focusable; an `sr-only`
  one is. That is what lets the shell answer the keyboard at all.

## Anatomy

| Part | Classes | Why |
|---|---|---|
| Shell | `<label>` · `flex items-center gap-3 rounded-full border border-border bg-background cursor-pointer` | the field recipe from the ladder, so it sits at the same height as the `Input` above it |
| — states | `hover:border-foreground/30`, `state-fade`, `focus-within:border-ring focus-ring-within` | `focus-within`, because focus lands on the child; `state-fade` so its colours move like every other control |
| Trigger pill | `inline-flex items-center gap-1.5 shrink-0 rounded-full bg-secondary text-secondary-foreground font-medium` + an `Upload` glyph at `size-3.5` | `--secondary` is the quiet fill on a control, which is what this is |
| Value | `flex-1 min-w-0 truncate text-xsmall`, `text-foreground` when a name is set, `text-muted-foreground` when not | the filename is the field's VALUE, so it reads like one |
| Input | `type="file" className="sr-only"` | the real control, still in the form |

## Sizing — and the even shoulder

Three steps, from the shared ladder (`CONTROL_SIZE`): `sm` 32 · `default` 40 ·
**`lg` 48, which is the default**, like every other field.

The pill inside grows with the shell, and the padding around it is the part
worth stating:

```text
lg       shell 48  ·  pill h-10  ·  pl-[3px] pr-5
default  shell 40  ·  pill h-8   ·  pl-[3px] pr-4
sm       shell 32  ·  pill h-6   ·  pl-[3px] pr-3
```

**3px, not 4 or 6.** The number to match is the vertical gap, and that is not
the difference between the two heights: the shell's 48px includes its 1px
border, so the room inside is 46 and a 40px pill centres with 3px above and
below — 4px from the outer edge once the border is counted. Measured on the
shipped field: left 4, top 4, bottom 4. It was 6px before, which read as the
pill hanging off-centre — the kind of two-pixel wrongness a pill inside a pill
makes impossible to miss.

The right edge is deliberately not 3: that side is text, and text takes the
field's own horizontal padding.

## Props

| Prop | What it does |
|---|---|
| `label` | the trigger's words. Say what is being uploaded ("Upload ID"), not "Browse…" |
| `fileName` | the chosen file's name. **Controlled** — the caller owns it, because the caller is what has to do something with the file |
| `placeholder` | shown while nothing is chosen; defaults to "No file chosen" |
| `size` | the ladder step; `lg` unless told otherwise |
| everything else | spread onto the real `<input type="file">` — `accept`, `multiple`, `onChange`, `name`, `id` |

## Usage

```tsx
const [name, setName] = useState<string | null>(null)

<Field label="ID for verification">
  <FileField
    label="Upload ID"
    accept=".jpg,.jpeg,.png,.pdf"
    fileName={name}
    onChange={e => setName(e.target.files?.[0]?.name ?? null)}
  />
</Field>
```

## Open questions

- The component holds no error state of its own. A rejected file (wrong type,
  too large) is the caller's to report, today through the `hint` on a
  neighbouring `Input` or a line of text below — `aria-invalid` and
  `invalid-ring` would work on the shell and are not wired.
- `multiple` is spread through and would upload several files, but the value
  slot shows a single `fileName`; a caller passing `multiple` has to compose
  the summary itself ("3 files").
- Shop settings uploads a logo through a `Button` that clicks a hidden input
  (`shop-settings-view.tsx:246`). That is an avatar uploader rather than a
  field — different shape, deliberately not this component — but the two
  should probably not both exist unexamined.
