---
title: Purchase Album Dialog
source: src/components/app/purchase-album-dialog.tsx
related: [dialog, paywall, radio-card, album-card]
usage:
  - Album detail — Buy CTA | /?page=Album
---

`PurchaseAlbumDialog` is the one-time checkout behind an album's "Buy"
CTA: a cart with one line, a tier picker, a payment choice (saved card or a
new one through Square's universal form), the price with its processing fee, then a processing and a success step. It
reads as a transactional cart, not a generic modal.

## Anatomy

Three steps, one `DialogContent` (`sm:max-w-xl max-h-[90vh] p-0 gap-0 flex
flex-col`): the dialog owns its bands, so the chrome's padding is zeroed and
each band pads itself.

**Summary**

| Band | What it wears | Why |
|---|---|---|
| Header | `shrink-0 px-6 pt-6 pb-4 border-b border-border`: `DialogHeader` (title `text-small`, description) + the **In cart** card | `shrink-0` so the buyer always sees what they are buying — the card never scrolls away or compresses when the body is tall |
| In cart | `rounded-2xl border border-border`, a row of `size-12 rounded-xs` cover · title `text-small font-medium` · `artist · year · format` in `text-muted-foreground` · price `tabular-nums` with a **Remove** link (`text-2xsmall`) under it | mirrors the seller-side `SelectedReleaseCard` in the upload flow, so buying reads as the mirror of listing. Remove does what Cancel does but reads as a cart-line action |
| Body | `flex-1 overflow-y-auto px-6 py-4 gap-6`: **Tier** (`RadioCardGroup` — Listening · Download files) · **Payment** (`PaymentMethodPicker`: two one-line `RadioCard size="sm"` rows, **VISA •••• 1111** (the saved card), selected by default, and **Pay with a new card**, which reveals `SquareContainer` under them) · **Price summary** (`PriceSummary`: album price · **Service fee** (5% + $0.30) · **Total** in `text-large font-medium tabular-nums`, the same figure the Buy button showed, plus, only when the cart already holds something, one line with the exact saving: "Add it to your cart with 3 other items and save $0.30." — `cartCount`, the host's count of other cart lines) · the `ShieldCheck` line | the only scrolling band |
| Footer | `DialogFooter` with `m-0 shrink-0 border-t bg-muted px-6 py-4 rounded-b-xl sm:rounded-b-2xl`: **Add to cart** (`outline`, cart glyph — ghost read as a link beside Pay) when the host passes `onAddToCart`, otherwise Cancel (`ghost`) · **Confirm and pay $x.xx**. Add to cart takes the picked tier and its price, asks for nothing, and closes the dialog; with `inCart` it reads **View cart** (✓) and calls `onOpenCart`. It replaces Cancel rather than joining it — Remove, the ✕ and the backdrop already dismiss, and three buttons do not fit a phone footer. This is where batch buy lives: the album page keeps one Buy button, as Bandcamp does (Check out now · Add to cart in its dialog) | `m-0` cancels `dialogFooterClass`'s full-bleed negative margins, which assume a `p-6` parent |

Section labels (`SectionLabel`) are `text-small font-medium` — sentence case,
never uppercase.

**Processing** — `Spinner size="lg"` + "Processing payment…", `min-h-[280px]`,
mocked at 1.4s. **Success** — `CircleCheck` in `text-primary-text`, "You own
{title}" in `text-xlarge font-medium`, a **Your impact** card (`bg-muted/40`:
"{artist} received $x — 100% of your purchase"), the confirmation and
receipt lines, the item recap with a **Download files** button on the download
tier, then **See in library** (`outline`) · **Play album** (primary). It
stays open until the buyer picks an action — an earlier 1.5s auto-close felt
abrupt.

## Props

| Prop | Meaning |
|---|---|
| `album` | `{ cover, title, artist, year?, format? }` — what the cart line shows |
| `streamPrice` / `downloadPrice` | the two tiers, as strings (`"$2.99"`); the picker shows only when both are set |
| `userEmail` | the account address the receipt goes to, named on the success step. Not asked for in the dialog — buying needs an account, and the account has one. Nothing passes it yet, so success reads "your account email" |
| `onPurchased(tier)` | fires on the success step; the album page uses it to mark the album owned in the library store |
| `upgradeMode` + `upgradePrice` + `onUpgraded` | pay-the-difference flow for the files on an album you own: tier picker hidden, cart shows the delta, the title becomes "Download files", success says "100% of your upgrade" and calls `onUpgraded` |
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
`DialogPreview` chrome, interactive (tier and payment method are local state) so a
reviewer can flip the tier and watch the total. Processing and success are
not previewed; open the live dialog for them.

## Sizing

Reads the **window** at **640** through the base dialog: a bottom sheet
below, a centred `sm:max-w-xl` (576px) modal from there, capped at
`max-h-[90vh]`. No column or box step of its own; the body scrolls when the
height runs out. The preview follows the window chip through `DialogPreview`.

## Behaviour

- State resets on every open (`step`, `tier`, payment `method`).
- **Every price includes the service fee; the checkout never grows.** The
  buyer always pays 5% + $0.30 per payment (Assif: ".30 per transaction +
  5%"); `serviceFee()` and `priceWithFee()` in `lib/cart.tsx` are the one
  rule. In the EU the full price has to be shown up front, so the album
  page's **Buy** button, the album tiles and the tier cards all show the
  price with the fee, what that album costs bought on its own, and Confirm
  and pay charges exactly that. The breakdown (album price · Service fee ·
  Total) stays for transparency. The cart only gets cheaper than the tiles added up, because it pays the
  $0.30 once; it says how much ("You save $0.60 by paying for 3 items at
  once").
- **Confirm and pay** is always enabled: the saved card is ready at once. The
  live integration would wait for Square's `checkout.validate()` when a new
  card is being entered.
- Success does not close by itself. Remove, Cancel, the ✕, the backdrop and
  both success CTAs all go through `onOpenChange(false)`.
- **Saved card first, Square form on demand.** A returning buyer usually
  pays with the card they used last time, so `VISA •••• 1111` (mocked)
  leads and starts selected. **Pay with a new card** reveals
  `SquareContainer`, the `<div id="square-container">` Square's universal
  form mounts into (card only: Apple Pay and Google Pay are not integrated). The form
  only renders when it is asked for; otherwise it pushes the price and the
  Pay button below the fold on a phone. The header comment in the source
  carries the integration sketch.

## Artwork, links and motion

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, never a tinted neutral: a tinted edge picks up the surface beneath it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius. On the `size-12` cover in the cart line.

**Text that navigates carries `link-underline`** — the line is a background gradient whose width runs 0 → 100% over 140ms, so it wipes in from the left and retracts the same way. `text-decoration` cannot be drawn, only faded.

**Colour changes fade through `state-fade`** — 440ms in, 100ms out, on `cubic-bezier(0.2,0,0,1)`.

## Open questions

- Where the processing fee is charged. The cart pays from the Muza wallet, so the card fee may really fall on the wallet top-up, not the checkout. The prototype charges it per checkout until that is settled.
- The saved card is mocked; a buyer with none should see the Square form alone, without the two radio cards.

- home.tsx (section comment) says there are "four states (details → confirm → processing → success)" and "two triggers … `hasSavedPayment={boolean}`" · the source has three steps and no `hasSavedPayment` prop; saved-card detection lives inside Square's form.
- purchase-album-dialog.tsx:551–558 · the preview's body "mirrors the live dialog … if you change one, change both (no shared body extraction by design)" · the two copies already differ: the preview's Remove is a `<span>`, the live one a button. A shared body with a `preview` flag (as `LoginBody` does) would end that.
- `p-0 gap-0` on the popup cancels only the phone padding; `sm:p-6 sm:gap-5` from `dialogChromeClass` survive tailwind-merge. See [dialog.md](dialog.md), open questions.
