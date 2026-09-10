---
title: Artist Header
source: src/components/app/artist-hero.tsx
related: [media-header, detail-more-button, dialog, responsive]
usage:
  - Artist profile (hero) | /?page=Artist&artist=sun-ra
---

The full-bleed hero at the top of an artist profile — cover photo under a
dark gradient, the name, a teased bio that opens in a dialog, and Play /
Artist radio with Share / Save pinned bottom-left. It is `ArtistHero`, not a
variant of the [Media Header](media-header.md): a person is presented as a
photograph, a release as a cover.

## Anatomy

| Part | What it is | Tokens |
|---|---|---|
| Section | `relative w-full overflow-hidden`, scoped **`.dark`** so every token inside resolves to its dark value — `text-foreground` is light, `outline` buttons (`border-border bg-background/20 backdrop-blur`) read correctly on the photo with no per-button overrides | `text-foreground` |
| Photo | `absolute inset-0 object-cover`, `alt={name}` | — |
| Scrim | a black gradient, 35% at the top through 40% to 80% at the bottom. Deliberately **not** a theme token: the photo is not themed, so the thing that keeps text readable on it cannot be either | — |
| Content | `absolute inset-x-0 bottom-0`, in the **same capped wrapper as the page below** (`max-w-[1480px]`, `1716px` from 1920) with `px-page pb-8`, so the name sits on the page's own left edge | — |
| Name | `h1`, fluid `clamp(2.5rem, 5vw, 4rem)` — 40px up to an 800px window, 64px from 1280 | `font-medium leading-[1.05] tracking-tight` |
| Bio | the opening ~100 characters, cut at a word boundary with trailing punctuation dropped, then "… " and a **read more** link | `text-small leading-6 text-foreground/90`; the link is underlined at rest (`underline underline-offset-[3px]`, 1px thick) — a permanent underline has nothing to wipe in, so it does not use `link-underline` |
| Actions | **Play** (`default`, `lg`, `h-12 px-6 rounded-full`, icon + label, flips to Pause with `aria-pressed`) · **Artist radio** (`outline`, same shape, `Radio` glyph) · right: `ShareButton` and a `LibraryHeartButton` for `type="artist"`, both `outline` `icon` | — |

The bio dialog is the base `DialogContent` — a bottom sheet below 768, a
centred `md:max-w-xl` modal above — built like the other content dialogs: a
header row (the `avatar`, `size-20 rounded-full`, falling back to `cover`,
beside the name as `DialogTitle` in `text-large font-medium` and "Artist" in
`text-small text-muted-foreground`), a `Separator`, then the bio in
`text-base leading-8 text-foreground/80 whitespace-pre-line` with a
Wikipedia attribution line in `text-2xsmall` — the bio and portrait come
from there.

## Usage

```tsx
<ArtistHero
  name={ARTIST.name}
  cover={ARTIST.cover}
  avatar={artistImage(ARTIST.name)}
  bio={ARTIST.bio}
  artistId={artistId}
  isPlaying={isThisArtistPlaying}
  onPlayToggle={() => {
    if (player.playingFrom === ARTIST.name && player.track) { player.toggle(); return }
    player.play(topSong, ARTIST.name)
  }}
/>
```

Playback is the host's — it knows the artist's tracks — so the hero only
reports `isPlaying` and asks through `onPlayToggle`. Share and Save are
wired inside, to the adaptive share action and the library store. The page
also publishes its title and "…" menu to the mobile chrome with
`usePublishDetailHeader`, which is where Share and Save go below the chrome
gate.

## Sizing

The hero reads the **window**, three ways:

```text
height   aspect 1072/400 of its width · floor 320px · cap 552px
         cap 640px from a 1920 window   (min-[1920px]:max-h-[640px])
name     5vw, clamped 40–64px
actions  Share + Save hidden below 608  (useFooterNav)
```

The caps are the page's two content tiers times the Figma frame's
proportions: `1480 × 400 / 1072 ≈ 552` and `1716 × 400 / 1072 ≈ 640`. So
the hero stops growing **taller** at exactly the windows where the rails
stop growing **wider**, and past each ceiling the photo crops sideways via
`object-cover` rather than inflating the hero. Change the tier-1 cap and
both hero caps must be recomputed (see DESIGN_SYSTEM.md › "Layout — page
max-width tiers").

The action row is the one place the hero uses a gate: below `useFooterNav()`
(608) there is no room for four controls beside the name and the floating
detail bar already carries a "…", so Share and Save move into it.

In the frame, the window chip drives `useFooterNav()` — pick 375 and the
right-hand pair goes. What the chip **cannot** drive is `vw` and the
`min-[1920px]` media query, which read the real browser: the name's size
and the 640 cap follow the window you are sitting at, not the chip.

## Behaviour

- **Play** toggles through the host; the label and glyph follow
  `isPlaying`.
- **read more** opens the full bio; a swipe or the ✕ closes it. The hero is
  fixed-height, so the bio can never grow it — that is why the text opens
  elsewhere.
- **Share** copies a link or opens the native sheet where there is one;
  **Save** toggles the artist in the library with the usual toast.

## Artwork and motion

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, never a tinted neutral: a tinted edge picks up the surface beneath it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius. On the `size-20` portrait.

**Colour changes fade through `state-fade`** — 440ms in, 100ms out, on `cubic-bezier(0.2,0,0,1)`. The bio's inline links ride on it.

## Open questions

- artist-hero.tsx:84 sizes the `h1` with an arbitrary `text-[clamp(2.5rem,5vw,4rem)]`
  · the type rule (DESIGN_SYSTEM.md › "Typography — semantic size aliases")
  is semantic aliases only, never a primitive or an arbitrary size; nothing
  in the scale is fluid, so the hero has no alias to use
- artist-hero.tsx:118 renders **Artist radio** with no handler and no prop
  for one · the "…" menu offers "Play radio" for an artist
  (detail-more-button.tsx:243–251), also unwired — the control exists on
  two surfaces and does nothing on either
- artist-hero.tsx:19 says Share and Save move into the floating header's
  "…" below the footer-nav gate · the artist page publishes only `libraryType`
  / `libraryId` / `libraryName` to the chrome (artist-profile-view.tsx:257–260);
  Share is a built-in of that menu, so this holds, but only because the
  menu adds it on its own
- the `h1` here is `font-medium` while the Media Header's `h1` is
  `font-semibold` (media-header.tsx:323) — see that doc
