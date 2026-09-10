---
title: Footer Nav
source: src/components/app/footer-nav.tsx
related: [mobile-header, player-bar, drawer, responsive]
usage:
  - Phone layouts (< 608px) — replaces the sidebar | /?page=Home
---

The phone tab bar that replaces the sidebar below the chrome gate — Home ·
Library · Search navigate, Studio opens a sheet of its four surfaces — on
the same frosted glass as the [Mobile Header](mobile-header.md), bordered
on the top instead of the bottom, so the two bookend the screen with one
material while the page scrolls under both.

## Anatomy

| Part | What it is | Tokens |
|---|---|---|
| Bar | `nav[aria-label="Primary"]`, `absolute inset-x-0 bottom-0 z-30 select-none` — it pins to the positioned content area it sits in | `frosted-glass border-t border-border/50` |
| Insets | `px-3 pt-2 pb-[max(10px, env(safe-area-inset-bottom))]` — 12px matches the phone gutter; the bottom pad is the home indicator's inset on a notched phone and 10px elsewhere, `max()` so a phone without an inset does not lose the pad | — |
| Cluster | `mx-auto flex w-full max-w-md gap-2` — four `flex-1` tabs sharing at most 448px, centred | — |
| Tab | `h-12 rounded-full`, the glyph `size-6`; `aria-current="page"` when active; press is colour only (`active:bg-press-on-muted` — no scale: the shadow repainting under a scaling pill is what made the glyphs judder), focus `focus-ring` | active: `bg-background text-foreground ring-1 ring-border/60` + a two-layer soft shadow, stroke 2.25 · inactive: `text-muted-foreground hover:text-foreground`, stroke 2 |
| Studio sheet | `SheetContent side="bottom" rounded-t-2xl`, a `SheetHeader` "Studio", then four rows — glyph `size-5`, label `text-base` (`font-medium` when that surface is active), description `text-xsmall text-muted-foreground` — each a `SheetClose` | rows `px-3 py-3 rounded-lg`, `hover:` / `active:` / `focus-visible:bg-muted` |

The bar is **66px tall** before the safe area (`8 + 48 + 10`), and that
number is load-bearing: the mini [Player Bar](player-bar.md) rests flush on
it at `bottom-[calc(56px + max(10px, env(safe-area-inset-bottom)))]` — the
tab height plus the top pad, plus the same bottom pad — so the two
surfaces touch with no gap.

## Which tab is lit

| Tab | Active for |
|---|---|
| Home | `Home` |
| Library | `Library`, `Albums`, `Artists`, `Songs`, `Playlists` — and the deep pages `Album`, `Playlist`, `Artist`, `Purchases` |
| Search | `Explore` |
| Studio | `Pages`, `Music`, `Analytics`, `Shop` |

Library staying lit on an album or artist page is the point: you got there
from your library, and the bar should say so. Wallet is not a Studio
surface — it is a per-user concept and lives in the avatar menu.

Studio is the one tab that does not navigate. It has four surfaces and, with
no sidebar on a phone to switch between them, tapping it opens the picker
instead — the same list the desktop sidebar's Studio accordion holds.

## Usage

```tsx
const footerNav = useFooterNav()
{footerNav && <FooterNav activeNav={activeNav} onNavChange={navigate} />}
```

`onNavChange` receives the target page name — one of the four tabs or one
of the four Studio surfaces. The parent must be `relative` (the shell's
content area is), and its scroll container carries `pb-32` so the last
rows can scroll clear of the bar and the mini player above it.

## Sizing

**Window, chrome gate only.** The bar exists below `useFooterNav()` — 608,
`FOOTER_NAV_BELOW = 560 + 2 × 24`, derived from the Media Header's stacking
point (see [Responsive](responsive.md)) — and from 608 up the icon rail
replaces it in the same instant. The bar itself is **fixed, no steps**: the
tabs split `max-w-md`, so from a 472px window (`448 + 2 × 12`) they stop
growing and the cluster centres.

In the frame the chip is the window, so at 375 the bar is drawn window-wide
with no gutters (it bleeds, as chrome does); at 608 and above the frame
still renders it inside the column, which is a state the app never shows.

## Behaviour

- Tap a tab → `onNavChange(target)`; tap Studio → the sheet; tap a surface
  → `onNavChange(surface)` and the sheet closes.
- Content scrolls under the glass: `.frosted-glass` is a single 10px
  backdrop blur over the background at 58% in light and 92% in dark (see
  [Mobile Header](mobile-header.md) for the material and the
  `viewport-fit=cover` requirement without which the safe-area pad is 0).
- `select-none` so a long press on a tab never selects the glyph.

## Open questions

- DESIGN_SYSTEM.md › "Bottom gutter — player clearance" says the mobile stack — footer nav plus mini bar — is
  "~112px" · it is 66 (bar, no safe area) + 56 (mini pill) = **122**, and the
  mini bar's disc overhangs 7px more (player-bar-b.tsx:532)
- sheet.tsx:32–34 says to override `swipeDirection` whenever `side` is not
  the default · footer-nav.tsx:102 mounts `<Sheet>` with the default
  (`"right"`) under `side="bottom"`, so swipe-to-dismiss on the Studio
  sheet is rightward rather than down — the same gap the Detail Menu has
