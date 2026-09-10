---
title: Chip Input
source: src/components/ui/chip-input.tsx
related: [chips, input, combobox, multi-select]
usage:
  - Upload music → Main Artist(s) | /?page=Music
  - Upload music → Additional credits | /?page=Music
---

`ChipInput` is the text field that turns names into chips: a comma makes a
**pending** chip inside the field, Enter commits the whole batch to the form.
It is how the upload flow collects Main artists and Additional credits — the
committed list sits above the field as `ChipDismiss` chips, and the field only
ever hands batches up.

## Anatomy

Three parts, one file, no primitive underneath — a plain `<input>` in a
`<div>` that borrows the form-control pill:

| Part | Classes | Why |
|---|---|---|
| Wrapper | `min-h-10 w-full rounded-full border border-border bg-background flex items-center flex-wrap gap-1.5 px-2 pt-[3px] pb-[7px] cursor-text`, `hover:border-foreground/30`, `focus-within:border-ring focus-ring-within` (the wrapper owns the ring because focus lives on the inner input — same 2px outline as `focus-ring`, matched on `:focus-within`) | the pill is the wrapper, not the input, so chips and text share one border; `focus-within` because focus lives on the inner input; `min-h` not `h` because chips wrap to a second line; the asymmetric 3/7 is the family's 2px optical lift, the same job `pt-[6px] pb-[10px]` does on `Input` |
| Pending chip | `inline-flex items-center gap-1.5 rounded-full bg-muted text-foreground h-7 pl-3 pr-1.5 text-2xsmall font-normal`; label `truncate max-w-[180px]`; ✕ `size-3.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10` with a `size-2.5` glyph, `aria-label="Remove <name>"` | 28px inside a 40px pill — 28 + 3 + 7 + 2px border is exactly 40, so the chip *is* the row height; `bg-muted` with no border reads as *less final* than the bordered `ChipDismiss` above the field |
| Input | `flex-1 min-w-[80px] h-7 bg-transparent outline-none text-small font-normal text-foreground placeholder:text-muted-foreground px-2 py-0` | `flex-1` takes whatever the chips leave; `min-w-[80px]` is the floor before it wraps under them; `h-7` and **no** `py-*` — see Sizing |

The placeholder shows only while there is no pending chip
(`placeholder={pending.length === 0 ? placeholder : ""}`) — once a chip is
in, the empty text beside it is the cue.

**Two tiers, on purpose.** Typing fast — "John, Mary, Bob," — yields three
pending chips without a round trip to the host; the host receives one array
per Enter. That is why the component has no `value` prop: pending chips are
its own, committed ones are the form's.

## Usage

```tsx
const [artists, setArtists] = useState<string[]>([])

<ChipGroup>
  {artists.map((name, i) => (
    <ChipDismiss key={`${name}-${i}`} onDismiss={() => setArtists(p => p.filter((_, j) => j !== i))}>
      {name}
    </ChipDismiss>
  ))}
</ChipGroup>
<ChipInput
  placeholder="Add a collaborator…"
  onCommit={values => setArtists(prev => [...prev, ...values])}
/>
```

Three props: `placeholder`, `onCommit` (required — receives every pending chip
plus any trailing text as one array) and `className`. The upload dialog uses
exactly this shape twice (`upload-music-dialog.tsx:685`, `:742`), each time
with a `ChipGroup` of `ChipDismiss` above it.

## Sizing

`size` is `"sm"` (32px) · `"default"` (40px) · `"lg"` (48px) — the shared
ladder from `src/lib/control-size.ts` — but here it is a **starting** height,
not a fixed one. `w-full`; the field fills the form column it is in and reads
none of the three measures. Empty or with one row of chips it is exactly its
step, the same as the `Input`, `SelectTrigger` and `Button` beside it. It is
the one member of the family that can be taller: `min-h-10` lets the chips
wrap, and every extra row costs 28px + the 6px gap — 40 / 74 / 108.

The height is built from the inside out, and `min-h-10` is the floor rather
than the thing doing the work:

```text
             child   +pt  +pb  +border  =
sm            24       2    4      2      32
default       28       3    7      2      40
lg            36       3    7      2      48
```

Every child — the pending chip and the field alike — is
`CONTROL_STACK[size].child`, which is why it lands ON the step and not near it. It used to
be **46.5px** — 6.5px taller than every other field on the page — because the
inner `<input>` carried its own `py-1` on top of a 28.5px line box (19px × 1.5)
and then the wrapper added `py-1` again. `min-h-10` is a floor, so nothing
clamped it: the field simply grew and no rule was broken. The fix was to stop
padding the inner input at all and give it the same `h-7` the chips have.

## Behaviour

- **Comma** → `ingest`: the text is split on commas; everything before the
  last comma becomes chips (trimmed, empties dropped), the remainder stays as
  the typed text. Pasting `a, b, c` therefore gives two chips and the text
  `c` — the last token is still being typed until a comma or Enter says
  otherwise.
- **Enter** → `commitAll`: pending chips plus the trimmed text go to
  `onCommit`; both clear. Nothing to commit → no-op. `preventDefault`, so an
  enclosing form does not submit on the same key.
- **Backspace** on empty text pops the last pending chip — a correction
  without reaching for the ✕.
- **Blur** soft-commits whatever is pending or typed (`onBlur`,
  `chip-input.tsx:111`), so tabbing away does not drop the chips.
- **Click** anywhere on the wrapper focuses the input; the chip ✕ stops
  propagation so removing a chip does not also refocus-and-select.

## Focus and motion

The **wrapper** owns the ring, not the input: `focus-ring-within` matches `:focus-within`, so the pill lights up while the caret is in the `<input>` inside it. Same 2px outline at 20% of `--ring` as `focus-ring`, split into its own utility because an element matching `:focus-within` for its child would otherwise light up for any button nested in it.

The chip's ✕ carries `state-fade`, so its colour eases instead of snapping.

## Open questions

- ~~Header comment says the field "matches the project's standard rounded-full
  input — same border, height, focus ring", but the height was `min-h-10` with
  symmetric `py-1` inside and out.~~ Answered: drift. It measured 46.5px against
  the family's 40, and the asymmetric lift was missing. Both fixed; the comment
  now names the 40px.
- Header (`chip-input.tsx:19`) says pending chips use "the same `bg-muted`
  pill shape used by `<ChipDismiss>`". `ChipDismiss` is `chipVariants`
  (`rounded-full border pb-px` plus a size step) with `pr-1.5`; the pending
  chip is a hand-written `h-7 pl-3 pr-1.5 text-2xsmall` with no border and no
  `pb-px`. Same idea, no shared recipe — nothing keeps them in step.
- No `id`, `name`, `disabled` or `aria-invalid` pass-through: the inner
  `<input>` takes only its value, placeholder and handlers. A `<Label htmlFor>`
  cannot target it, and the upload form's label is a plain `<Label>` beside it.
  Should it accept `id` and `aria-label`?
- The pending chip's ✕ is `size-3.5` (14px), the smallest tap target in the
  form family; `Checkbox` expands its own hit area with `after:` insets. Does
  the chip need the same?
- Blur commits (`chip-input.tsx:111`). The helper copy under every call site
  says "then press Enter" and nothing about leaving the field; a user who
  tabs away has the chips committed silently. Wanted — say so in the copy;
  otherwise drop the blur commit.
