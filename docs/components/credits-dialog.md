---
title: Credits Dialog
source: src/components/app/credits-dialog.tsx
related: [dialog, media-header, detail-more-button, album-card]
usage:
  - Album detail › ⓘ button / “…” → Show credits | /?page=Album
  - Any album card / song row → Show credits | /?page=Albums
---

`CreditsDialog` is the release metadata behind every "Show credits" action
and the MediaHeader's ⓘ — a 3:2 cover header over main artist, album, label,
recording date and the per-instrument performers. Albums only; a playlist
has no release credits.

## Anatomy

```tsx
<DialogContent className="md:max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[92vh] md:max-h-[85vh]">
  <CreditsContent
    credits={credits}
    heading={<DialogTitle className="md:text-large font-medium leading-none">Album credits</DialogTitle>}
    onArtist={name => go(() => openArtist(slugify(name)))}
    onAlbum={albumLinkable ? () => go(() => openAlbum(slugify(credits.album))) : undefined}
    bodyClassName="min-h-0"
  />
</DialogContent>
```

| Part | What it wears | Why |
|---|---|---|
| Cover header | `relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-muted`: the cover once as a backdrop (`object-cover scale-125 blur-2xl opacity-80`), a `from-black/30` gradient, then the real cover `h-full aspect-square rounded-xs shadow-lg` centred on top | a square in a 3:2 frame would letterbox; the blurred copy fills the sides with the artwork's own colour instead of a flat bar |
| Metadata body | `flex flex-col gap-5 p-6 overflow-y-auto` + `bodyClassName` — `min-h-0` in the live sheet (grows to the dialog's cap), `max-h-[50vh]` in the preview | the body is the scrolling band; the header never scrolls away |
| Heading | `DialogTitle md:text-large font-medium leading-none` — "Album credits" | slotted, so the live dialog passes a real `DialogTitle` for a11y while the preview passes a `<p>` |
| Fields | `Field`: label `text-2xsmall text-muted-foreground leading-[16px]`, value `text-small text-foreground leading-[20px]` — Main artist · Album · Label · Recording Date | label and recording date render only when the catalog has them |
| Performers | "Performers" `text-small font-medium`, then role → names, comma-joined | role is the label, names the value |
| Links | a value with a handler is a `<button>` with `hover:underline underline-offset-[3px]`, 1px thickness | main artist, album (when `hasAlbumDetail`) and every performer navigate |

## Usage

Mounted **once** by `CreditsProvider` (in the app shell; the design-system
page mounts its own). Any descendant opens it by key:

```tsx
const credits = useCredits()
<Button onClick={() => credits.open("a07")}>Show credits</Button>
```

Outside a provider `open` is a no-op, so menus that bake it in never crash.
Data comes from `getCredits(albumKey)` in `album-catalog` — hand-curated for
the prototype; production would source MusicBrainz / Discogs.

`CreditsDialogPreview albumKey` renders `CreditsContent` inline in a
bordered `bg-popover` card with a plain heading and no handlers — a static
render for the design system.

## Sizing

Reads the **window** at **768** through the base dialog: a bottom sheet
below (`max-h-[92vh]`), a centred `md:max-w-md` (448px) modal from there
(`md:max-h-[85vh]`). `p-0` lets the cover header bleed to the edges; the
metadata band pads itself. No column or box step. The preview reads
`useIsMobile()` and drops to full width with top corners only at a phone
chip, so a 375 frame shows the sheet shape.

## Behaviour

- Opening sets the key; `Dialog open={!!credits}`. Closing (✕, backdrop,
  `Escape`) clears it.
- **A link navigates, then dismisses** — `go()` runs the navigation and
  closes the dialog so the destination is visible.
- The album link is offered only when `hasAlbumDetail(slugify(album))` —
  navigating must not land on the default fallback page.
- The body scrolls when the performer list outgrows the height cap; the
  cover header stays.

## Open questions

- credits-dialog.tsx:157–161 (comment) still explains the mobile-sheet positioning ("full-width, bottom-anchored, top-rounded, slides up") that the next comment says now comes from the base `DialogContent`. One of the two comments is redundant.
- `p-0 gap-0` on the popup cancels only the phone padding; see [dialog.md](dialog.md), open questions.
