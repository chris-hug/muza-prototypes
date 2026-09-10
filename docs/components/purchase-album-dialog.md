---
title: Purchase Album Dialog
source: src/components/app/purchase-album-dialog.tsx
related: [dialog, paywall, radio-card, album-card]
usage:
  - Album detail — Unlock All Songs CTA | /?page=Album
---

`PurchaseAlbumDialog` is the one-time checkout behind an album's "Unlock All
Songs" CTA: a cart with one line, a tier picker, a receipt email and a slot
for Square's universal payment form, then a processing and a success step. It
reads as a transactional cart, not a generic modal.

## Anatomy

Three steps, one `DialogContent` (`md:max-w-xl max-h-[90vh] p-0 gap-0 flex
flex-col`): the dialog owns its bands, so the chrome's padding is zeroed and
each band pads itself.

**Summary**

| Band | What it wears | Why |
|---|---|---|
| Header | `shrink-0 px-6 pt-6 pb-4 border-b border-border`: `DialogHeader` (title `text-small`, description) + the **In cart** card | `shrink-0` so the buyer always sees what they are buying — the card never scrolls away or compresses when the body is tall |
| In cart | `rounded-2xl border border-border`, a row of `size-12 rounded-xs` cover · title `text-small font-medium` · `artist · year · format` in `text-muted-foreground` · price `tabular-nums` with a **Remove** link (`text-2xsmall`) under it | mirrors the seller-side `SelectedReleaseCard` in the upload flow, so buying reads as the mirror of listing. Remove does what Cancel does but reads as a cart-line action |
| Body | `flex-1 overflow-y-auto px-6 py-4 gap-6`: **Tier** (`RadioCardGroup` — Listening · Download) · **Contact** (email `Input` with a leading `Mail` glyph, `pl-10`) · **Payment** (`SquareContainer`) · **Total** (`text-large font-medium tabular-nums`) · the `ShieldCheck` line | the only scrolling band |
| Footer | `DialogFooter` with `m-0 shrink-0 border-t bg-muted px-6 py-4 rounded-b-xl md:rounded-b-2xl`: Cancel (`ghost`) · **Confirm and pay $x.xx** | `m-0` cancels `dialogFooterClass`'s full-bleed negative margins, which assume a `p-6` parent |

Section labels (`SectionLabel`) are `text-small font-medium` — sentence case,
never uppercase.

**Processing** — `Spinner size="lg"` + "Processing payment…", `min-h-[280px]`,
mocked at 1.4s. **Success** — `CircleCheck` in `text-primary-text`, "You own
{title}" in `text-xlarge font-medium`, a **Your impact** card (`bg-muted/40`:
"{artist} received $x — 100% of your purchase"), the confirmation and
receipt lines, the item recap with a **Download** button on the download
tier, then **See in library** (`outline`) · **Play album** (primary). It
stays open until the buyer picks an action — an earlier 1.5s auto-close felt
abrupt.

## Props

| Prop | Meaning |
|---|---|
| `album` | `{ cover, title, artist, year?, format? }` — what the cart line shows |
| `streamPrice` / `downloadPrice` | the two tiers, as strings (`"$2.99"`); the picker shows only when both are set |
| `userEmail` | pre-fills the receipt field. Defaults to **empty**, so the field opens on its placeholder — nothing in the app passes it today, and a mock address defaulted in was what every dialog and every design-system frame showed |
| `onPurchased(tier)` | fires on the success step; the album page uses it to mark the album owned in the library store |
| `upgradeMode` + `upgradePrice` + `onUpgraded` | pay-the-difference "add download" flow: tier picker hidden, cart shows the delta, the title becomes "Add download to {title}", success says "100% of your upgrade" and calls `onUpgraded` |
| `onGoToLibrary` | the success step's "See in library" |

## Usage

```tsx
<PurchaseAlbumDialog
  open={buyOpen}
  onOpenChange={setBuyOpen}
  album={{ cover: ALBUM.cover, title: ALBUM.title, artist: ALBUM.artist, year: ALBUM.year, format: ALBUM.format }}
  streamPrice={ALBUM.buyingPrice ?? ""}
  downloadPrice={ALBUM.downloadPrice}
  onPurchased={tier => library.purchase(ALBUM.id, tier)}
/>
```

The album page mounts it twice (`album-detail-view.tsx`): once for the
purchase, once with `upgradeMode` for a stream-tier owner adding the
download. The catalog stores the stream price as `buyingPrice`; the dialog
calls it `streamPrice`.

`PurchaseAlbumDialogPreview` renders the summary step inline with the
`DialogPreview` chrome, interactive (tier and email are local state) so a
reviewer can flip the tier and watch the total. Processing and success are
not previewed; open the live dialog for them.

## Sizing

Reads the **window** at **768** through the base dialog: a bottom sheet
below, a centred `md:max-w-xl` (576px) modal from there, capped at
`max-h-[90vh]`. No column or box step of its own; the body scrolls when the
height runs out. The preview follows the window chip through `DialogPreview`.

## Behaviour

- State resets on every open (`step`, `tier`, `email`).
- **Confirm and pay** enables once the email matches `\S+@\S+\.\S+`; the
  live integration would also wait for Square's `checkout.validate()`.
- Success does not close by itself. Remove, Cancel, the ✕, the backdrop and
  both success CTAs all go through `onOpenChange(false)`.
- **Square owns the payment UI.** `SquareContainer` is the `<div
  id="square-container">` Square's universal form mounts into: card fields
  with brand detection, Apple Pay, Google Pay, PayPal, and the saved-card
  row for returning customers all render inside that iframe. The dialog owns
  only the shell around it, which is why there is no "has saved card" prop.
  The header comment in the source carries the integration sketch.

## Artwork, links and motion

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, never a tinted neutral: a tinted edge picks up the surface beneath it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius. On the `size-12` cover in the cart line.

**Text that navigates carries `link-underline`** — the line is a background gradient whose width runs 0 → 100% over 140ms, so it wipes in from the left and retracts the same way. `text-decoration` cannot be drawn, only faded.

**Colour changes fade through `state-fade`** — 440ms in, 100ms out, on `cubic-bezier(0.2,0,0,1)`.

## Open questions

- home.tsx (section comment) says there are "four states (details → confirm → processing → success)" and "two triggers … `hasSavedPayment={boolean}`" · the source has three steps and no `hasSavedPayment` prop; saved-card detection lives inside Square's form.
- purchase-album-dialog.tsx:551–558 · the preview's body "mirrors the live dialog … if you change one, change both (no shared body extraction by design)" · the two copies already differ: the preview's Remove is a `<span>`, the live one a button. A shared body with a `preview` flag (as `LoginBody` does) would end that.
- `p-0 gap-0` on the popup cancels only the phone padding; `md:p-6 md:gap-5` from `dialogChromeClass` survive tailwind-merge. See [dialog.md](dialog.md), open questions.
