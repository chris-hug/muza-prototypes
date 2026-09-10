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
| card | `relative flex flex-col rounded-lg border cursor-pointer`, `transition-[border-color] duration-[130ms] ease-[cubic-bezier(0.2,0,0,1)]` | `relative` because the sweep overlay is absolutely positioned against it; the transition names `border-color` alone — `transition-colors` would sweep the background too |
| — unselected | `border-border hover:border-foreground/30` | the form-control hover, so it reads as a field |
| — selected | `border-foreground/20` | structure darkens; it does not go `primary`. The alpha has to match the sweep's ink exactly — see below |
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

## The ring is DRAWN, from where you pressed

Selecting a card does not swap its border on. A `.card-sweep` overlay
(`app.css`) draws the ring as a conic gradient over **340ms**, growing in
**both directions at once** from the point the pointer landed, and what it
leaves behind is the settled border.

| Part | Value | Why |
|---|---|---|
| Origin | `--card-sweep-from`, set per click from `atan2(dx, -dy)` around the card's centre | `atan2(dx, -dy)`, not the usual `atan2(dy, dx)`: a conic gradient counts from 12 o'clock clockwise while screen coordinates run x-right / y-**down** |
| Keyboard | origin `null` → CSS falls back to `-90deg` (12 o'clock) | `e.detail === 0` means no pointer; `clientX/Y` would be `0,0`, the window's top-left, and the sweep would start off the card |
| Extent | `--card-sweep`, a registered `@property` angle, `0deg → 180deg` | an unregistered custom property cannot be interpolated, and the ring would jump |
| Ink | `color-mix(in srgb, var(--foreground) 20%, transparent)` | **the same 20% the settled border uses** |
| Geometry | `inset: -1px`, `padding: 1px`, `border-radius: inherit`, `mask-composite: exclude` | |
| Curve | `340ms cubic-bezier(0.75, 0, 0.95, 0)` | ease-**in**: the ring holds at the press point, then races round and snaps shut |
| Replay | `key={`sweep-${value}-${from}`}` | remounts the overlay so the animation runs again on every selection |
| Reduced motion | `animation: none; --card-sweep: 180deg` | the full ring, immediately |

Four things in that table were each a visible bug first, and each is why the
build looks the way it does:

- **One arc, not two layers.** The obvious build is a clockwise gradient plus a
  second one running back from the origin. They share their edge at the press
  point, so the ink lands twice there and each edge is antialiased on its own —
  a glitch exactly where the eye is looking. A single gradient does both
  directions if it starts half a sweep *behind* the origin and runs twice the
  sweep forward: the arc is centred on the press point and both ends travel
  outward together.
- **`inset: -1px`, not `0`.** An absolutely positioned child is laid out
  against the padding box, and the border sits outside it, so `inset: 0` offsets
  the overlay by one border width and `border-radius: inherit` then bends it on
  a radius a pixel tighter. The drawn ring and the border ran parallel and never
  met. Keep this in step with the card's border width.
- **Ease-in, not ease-out.** On a ring that closes, the interesting part is the
  closing. `ease-out` spends its speed immediately and crawls the last third.
- **One alpha for both.** The drawn ring and the settled border are both
  `--foreground` at 20%. Change one without the other and the sweep ends on a
  step in brightness.

## The spring belongs to the card, not the dot

Picking a card runs the same `muzaTick` spring the [Checkbox](checkbox.md) and
the bare radio use — from anywhere on the header band, not only from the 16px
dot.

`RadioGroupItem` drives that spring from its own `onClick`, which is right for
a bare radio in a form but never fired when the press landed on the title, the
icon or the padding: the dot filled in without moving, on a card whose entire
point is that the whole thing is the target. So the card owns a `useTick` and
hands the resulting `data-anim` down — `RadioGroupItem` spreads incoming props
after its own `tickProps`, so the card's wins on every path.

A press on the dot itself bubbles up to the card, so both routes run one and
the same spring rather than two that can drift apart. The children band still
swallows its clicks, so typing a price ticks nothing.

Verified: clicking a card's title fires `muzaTick` and selects it, clicking
the dot still does, and clicking the price field does neither.

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
