---
title: Radio Card
source: src/components/ui/radio-card.tsx
related: [checkbox, purchase-album-dialog, product-card, input]
usage:
  - Vinyl listing — format selector (Vinyl / CD / Cassette) | /?page=Shop&shop-tab=products
  - Upload music — distribution choices | /?page=Music
---

`RadioCard` is the big selectable card for a short list of exclusive choices
that each need an icon and a sentence — a listing's product type, a
release's monetisation, an album's purchase tier. The radio dot and a darker
border carry the selection; the icon circle stays neutral so the chosen card
does not shout.

## Anatomy

```tsx
<RadioCardGroup value={monetization} onValueChange={setMonetization}>
  <RadioCard value="streaming" selected={monetization === "streaming"} onSelect={() => setMonetization("streaming")}
    icon={<RadioIcon />} title="For streaming" description="Anyone on Muza can listen" />
  <RadioCard value="purchase" … title="For purchase" description="Fans pay to unlock">
    <Input placeholder="Price" />        {/* the band under the divider */}
  </RadioCard>
</RadioCardGroup>
```

`RadioCardGroup` is `RadioGroup` (see [`checkbox.md`](checkbox.md)) with the
card gap: `w-full flex flex-col gap-3` in place of `grid gap-2`. A card is
one `div` with up to two bands:

| Part | Classes | Why |
|---|---|---|
| card | `flex flex-col rounded-lg border transition-colors cursor-pointer` | |
| — unselected | `border-border hover:border-foreground/30` | the form-control hover, so it reads as a field |
| — selected | `border-foreground` | structure darkens; it does not go `primary` |
| header band | `flex items-center gap-4 px-4 py-5` | |
| radio | `RadioGroupItem value={value}` | the real 16px mark; it is the only focusable part |
| icon circle | `size-10 rounded-full bg-secondary text-secondary-foreground [&_svg]:size-4` | **always** neutral — a selected card has one signal, the border + dot |
| title | `text-small font-medium text-foreground leading-snug` | |
| description | `text-xsmall text-muted-foreground leading-snug` | optional |
| divider | `border-t border-border` | only with `children` |
| children band | `flex flex-col gap-7 px-6 py-7`, `onClick={e => e.stopPropagation()}` | always visible, never gated on selection; clicks inside do not re-select the card |

```text
header band       20 + 40 (icon circle) + 20 = 80px, or taller if the description wraps
children band     28 + content + 28, with 28px between children
```

The children band is wider-set (`px-6`) than the header (`px-4`) on purpose:
its inputs align with the title text, which starts 16 + 16 + 40 + 16 = 88px in
— close enough to `px-6`'s 24px that the two read as one column on a phone
without pretending to a grid.

## Usage

Every card needs `value` for the group **and** `selected` + `onSelect` for
itself — all three call sites pass the same setter twice:

```tsx
const [tier, setTier] = useState<"stream" | "download">("stream")

<RadioCardGroup value={tier} onValueChange={v => setTier(v as typeof tier)}>
  <RadioCard value="stream"   selected={tier === "stream"}   onSelect={() => setTier("stream")}
    icon={<RadioIcon />} title="Listening" description={`Stream on any device · ${streamPrice}`} />
  <RadioCard value="download" selected={tier === "download"} onSelect={() => setTier("download")}
    icon={<Download />}  title="Download"  description={`Lossless files + listening · ${downloadPrice}`} />
</RadioCardGroup>
```

(`purchase-album-dialog.tsx:263–279`.) Pass the icon bare — the circle sizes
it to 16px.

## Sizing

Fills its column (`w-full` on the group), cards stacked at 12px — no window,
column or box steps. Text wraps; the 40px circle and 16px dot never change.
`upload-music-dialog.tsx:1192` and `shop-my-products.tsx:457` render it at
the width of a dialog body; nothing constrains it narrower.

## Behaviour

- Click anywhere on the header band → `onSelect`. Click on the dot itself →
  the group's `onValueChange` as well (same setter, same result).
- Keyboard reaches only the dot: Tab focuses it, arrow keys move the
  selection between cards (base-ui `RadioGroup`), which fires
  `onValueChange` — so the keyboard path works, through the second of the two
  props.
- The children band swallows clicks (`stopPropagation`) so typing a price
  does not fire `onSelect`; it is shown whether or not the card is selected.

## Open questions

- Selection is held twice: `RadioCardGroup value` / `onValueChange`
  (`radio-card.tsx:37–41`) **and** `RadioCard selected` / `onSelect`
  (`:57–59`). Every call site wires both to one setter
  (`upload-music-dialog.tsx:1192–1203`, `shop-my-products.tsx:457–465`,
  `purchase-album-dialog.tsx:263–279`); `selected` could come from the group
  context and `onSelect` from `onValueChange`, and a card could not disagree
  with its group.
- The card is a `div` with `onClick` and `cursor-pointer` (`radio-card.tsx:78`)
  — no `role`, not focusable, no keyboard activation of its own. Wrapping the
  header in a `<label>` (as Settings' `RadioRow` does, `settings-view.tsx:384`)
  would give the whole card the click natively and drop the second prop pair.
- The header comment names three consumers (`radio-card.tsx:5–7`) ·
  `purchase-album-dialog.tsx:263, 633` is a fourth.
- The design-system section (`home.tsx:758–818`) rendered two groups — a
  five-card product-type list and the monetisation pair. The frame keeps the
  pair (it shows both a plain card and one with a children band); the product
  list is the same card five times.
