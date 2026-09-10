---
title: Detail Menu
status: updated
source: src/components/ui/detail-more-button.tsx
related: [dialog, menu, drawer, song-list-item, mobile-header]
usage:
  - Album / Playlist / Artist detail — header “…” | /?page=Album
---

`DetailMoreButton` is the "…" overflow on a media detail page — Album,
Playlist, Artist — and the one menu those objects have anywhere else. It is
**one action model with two surfaces**: an anchored dropdown on desktop, a rich
bottom sheet on phones. The items are the same on both; only the chrome
differs.

## One action model, three consumers

`useDetailActions()` builds the item list once, and three things render it:

```tsx
// Trigger + surface — the detail page, the mobile chrome.
<DetailMoreButton kind="album" title={album.title} … />

// Items only — dropped inside another menu's content (card "…", row "…").
<DropdownMenuContent><DetailMenuItems kind="album" … /></DropdownMenuContent>

// The floating mobile header renders the same DetailMoreButton from a
// published config (see "Publishing the menu to the chrome").
usePublishDetailHeader({ title, menu })
```

This is what makes "the card menu" and "the detail menu" the same menu rather
than two lists that drift: there is no per-surface item list to keep in step.
If a card and the detail page show different rows for the same album, that is
a bug, not a variant.

## Showing it open — `DetailMenuSurface`

The design-system frame does not make you click: `DetailMenuSurface` renders
the surface itself, open and inline, off the same props `DetailMoreButton`
takes — the dropdown from 768 up, the bottom sheet below, chosen by
`useIsMobile()` (which inside the frame reads the window chip). It is not a
mock: the dropdown uses the live component's own class strings
(`dropdownMenuSurfaceClass` / `dropdownMenuItemClass`, exported by
`dropdown-menu.tsx` and used by `DropdownMenuContent` / `DropdownMenuItem`),
the sheet uses `DetailMenuSheetBody` — the same body the live sheet renders —
in `standalone` mode (plain buttons instead of `SheetClose`, a `<p>` instead
of the dialog title, because there is no Sheet root to close or label). The
actions run for real; Save flips the library store.

```tsx
<DetailMenuSurface kind="album" title="A Love Supreme" … />   // open, inline
<DetailMoreButton  kind="album" title="A Love Supreme" … />   // the trigger, in the app
```

## Two surfaces, gated by the window

```tsx
const isMobile = useIsMobile()          // (max-width: 767px)
if (!isMobile) return <DropdownMenu>…</DropdownMenu>
return <Sheet>…</Sheet>
```

The gate is **`useIsMobile()`, never a `hover:` media query**. Two reasons:

- the headless preview reports `hover: hover` even at phone width, so a
  hover-gated sheet never shows there — the phone surface would be
  unreviewable in exactly the tool used to review it;
- hybrid touch laptops report `hover: hover` too, and would get the dropdown.

`useIsMobile()` keys off width alone and is reliable on real devices. The
cutoff is **768px** (`(max-width: 767px)`), the project's "components swap"
step — not `md` (768), which is where dialogs recentre, and not 608, where the
sidebar becomes a footer bar. A dropdown ⇄ sheet swap is a *different
component*, and that is the one case the 768 gate is for; cosmetic show/hide
of a control may still use `[@media(hover:…)]`.

Because the hook reads the **window**, the design-system frame stands in for it: a window chip (375, 584 …) is fed to `useIsMobile()` through `WindowWidthContext`, so at "375" the "…" opens the sheet — portaled to the real browser window, full width — and from "768" up the dropdown. "Free" reads the browser you are sitting at.

The desktop surface is the app `DropdownMenu` with `align="end"`,
`sideOffset={6}` and `min-w-52`, listing the items flat in quick-actions-first
order. The trigger is a `Button` (`ghost` · `icon-sm` by default; `outline` /
`icon` / `icon-lg` via `triggerVariant` / `triggerSize`) with
`aria-label="More options"`; a custom glyph goes in `triggerIcon`.

## The sheet

The phone surface is the base-ui **`Sheet`** (the Drawer primitive — see
`drawer`), not a `Dialog`: `<SheetContent side="bottom" className="rounded-t-2xl">`.
It is pinned `inset-x-0 bottom-0`, `w-dvw`, slides in from the bottom, and
keeps `SheetContent`'s default ✕ at `top-3 right-3`. It has three bands, none
of which scroll independently: **header · quick actions · grouped rows**.

The cross-cutting phone-sheet rules — 12px gutter, `svh` not `dvh`,
`bottom: var(--kb)`, `viewport-fit=cover` — live in [`dialog.md`](dialog.md)
and are not repeated here. Note that this surface is a *menu*: it holds no
field, so the keyboard never opens over it and the `--kb` budget never
applies. What does carry over is the reason for a 12px-class gutter — a sheet
spans the whole screen — which is why the action bands sit at `px-1` inside a
popup with no padding of its own (a row's own `px-3` brings the glyph to 16px
from the edge).

### Header — the entity, then breathing room

```tsx
<SheetHeader className="flex-row items-center gap-3 border-b-0 pb-6">
  <MenuCover kind={kind} cover={cover} covers={covers} title={title} />
  <div className="min-w-0 text-left flex flex-col gap-1">
    <SheetTitle className="truncate text-base leading-tight">{title}</SheetTitle>
    {subtitle && <p className="truncate text-small text-muted-foreground leading-none">{subtitle}</p>}
    <div className="flex items-center gap-2 min-w-0">
      <ContentTypeBadge type={badgeType} />
      {meta && <span className="text-xsmall text-muted-foreground truncate">{meta}</span>}
    </div>
  </div>
</SheetHeader>
```

- **`MenuCover` is 72px** (`size-18`) in all three shapes, each with `art-edge` — the 1px inset outline every piece of artwork in the app carries, black at 10% in light and white at 10% in dark, so a pale cover keeps an edge against the sheet: a **square** for an
  album (`rounded-xs`, 2px), a **2×2 collage** for a playlist, a **circle** for
  an artist. 72px is chosen to match the height of the three text lines beside
  it — title, subtitle, badge row — so the cover and the text stack read as one
  block rather than a thumbnail beside a paragraph.
- The collage needs **four** covers; with fewer it falls back to the square,
  using `cover ?? covers[0]`. Four tiles at 36px each is the smallest grid
  that still reads as "several albums"; two or three would read as a broken
  image. An artist ignores `covers` entirely.
- `SheetHeader` normally draws a hairline under itself (a scrolling sheet
  needs it); here it is removed (`border-b-0`) and replaced by `pb-6`. The
  header is the object's identity, not a toolbar, and a rule under it would
  cut the identity off from the actions it describes.
- The title overrides `SheetTitle`'s `text-large` down to **`text-base`**
  (21px) with `leading-tight`: it shares a 72px box with two more lines, and
  24px would not leave room for the badge row.
- The badge is derived from `kind`, never passed. `meta` is the one free
  field: the year for an album, "23 tracks" for a playlist.

### Quick actions — three pills

```tsx
<div className="flex items-stretch gap-2 px-1 pb-2">
  {quick.map(a => <QuickAction {...a} />)}
</div>
```

Each pill is `flex-1 min-w-0 flex flex-col items-center gap-2 rounded-2xl
bg-secondary px-2 py-3.5`, a `size-5` glyph over a `text-xsmall` label, with
`focus-ring` for the keyboard.
`flex-1` is what lets two or three of them share the width evenly, so a
playlist's two pills are simply wider than an album's three.

Pills carry a **`shortLabel`** for the tile ("Save" / "Remove") where the
full row label ("Save to library") would wrap at a third of 375px; the
dropdown and the rows always use the full label, since they have the width.

Which three depends on the kind:

| Kind | Pills |
|---|---|
| Album | Share · Save · **Credits** — or **Edit** when owned (Credits moves into the rows) |
| Playlist | Share · Save — or Share · **Add music** · **Edit info** when owned (no Save: a playlist you own is in your library by definition) |
| Artist | Share · Save · **Play radio** |

Share is adaptive: `Share…` opening the native sheet where `useShare` reports
one, otherwise `Copy link` — the label and glyph say what the tap does, the
same as the song menu. "Add music" uses `AddMusicIcon`, the header button's
own glyph: one action, one mark.

### Grouped rows — dividers between groups

```tsx
<div className="flex flex-col px-1 pb-2">
  {groups.map((group, gi) => (
    <div key={gi} className="flex flex-col">
      {gi > 0 && <div className="mx-2 my-1 h-px bg-border" />}
      {group.map(a => <SheetRow {...a} />)}
    </div>
  ))}
</div>
```

A `SheetRow` is `flex w-full items-center gap-3 rounded-lg px-3 py-3
text-base`, a `size-5` glyph in `text-muted-foreground` and the label in
`text-foreground`; `hover:` and `focus-visible:` fill with `bg-muted`. There
is no `active:` fill — the press is the app's ripple (see below). The source promises a **44px+ tap target**, and the arithmetic
clears it comfortably:

```text
py-3                         12 + 12 = 24px
text-base line                21px × 1.5 (theme default) ≈ 31.5px
row height                   ≈ 55px  (≥ 44)
```

The three groups, in order — an empty group is skipped and so is its divider:

| Group | Rows |
|---|---|
| Manage / queue | Make private ⇄ Make public (owned playlist) · Add to a playlist (album only — you add an album's *tracks* to a playlist; a playlist is not addable to a playlist, an artist not at all) · Play next · Add to queue |
| Navigation | Go to album / Go to playlist (`onGoToSelf` — a card or row, never the item's own page) · Credits (owned album, since its pill is Edit) · Go to artist · Go to label · Go to owner (playlist — it has an owner, not an artist) · Artist info |
| Destructive | **Delete playlist** (owned) in `text-destructive`, otherwise **Report** — a plain row, never styled destructive |

### What a CARD's sheet can offer, and what is missing on purpose

The long press on a card raises this same sheet, so the card has to pass the
handlers — a card that passes none shows Share and Report. As wired today:

| Kind | Present | Absent, and why |
|---|---|---|
| Album | Copy link/Share · Save (store-bound) · Credits · Go to album · Go to artist · Report | **Add to a playlist** — the flow adds a SONG to playlists; adding an album's tracks has no implementation. **Go to label** — no label data on a card. **Play next / Add to queue** — the player has no queue. |
| Playlist | Copy link/Share · Save (store-bound) · Go to playlist · Go to owner · Report | **Add music / Edit info / Make private / Delete** on an owned playlist — the card is not the owner surface; those live on the playlist page. |
| Artist | Copy link/Share · Save (store-bound) · **Play radio** · **Artist info** · Report | — |

**Play radio** starts the artist's first track from the app's search index
with the player's "playing from" line naming the station (`John Coltrane
radio`). There is no queue in the player yet, so a station is one track and a
label rather than a generated run — when a queue lands, this is where it feeds
from. The track is resolved when the card renders, not when the row is tapped,
so an artist whose records carry no track list shows **no Play radio row at
all** rather than one that apologises when pressed.

**Artist info** opens what the catalogue actually knows: portrait, name,
release count (and track count where the track lists exist), and the first few
titles. The prose bio lives on the artist page; this is the glance you get
without leaving the row you were browsing.

Save is bound through `libraryType` + `libraryId` on all three, not through
`onAdd`/`onRemove` props: those are optional at most call sites, so the tile
was being dropped for lack of a handler and a card's sheet offered Share alone.
Bound to the store it also reads live, so it matches the card's own heart.

**A row only exists where its handler is wired.** `useDetailActions` filters
every group with `a => a.onClick`, so a card that passes no `onPlayNext` shows
no "Play next", and no call site needs a conditional. Report is the one
exception: it has a baked default (a "Reported" toast) so every non-owned
album and playlist offers it without the caller wiring anything.

Two things are `keepOpen`: the **Save** pill (it flips to Remove in place, and
the user should see that happen) and nothing else — every other pill and row
is wrapped in `SheetClose` and dismisses the sheet on tap.

## The press is the app's ripple — and both rows carry it

`SheetRow` and `QuickAction` are bespoke buttons, not `Button`, so they opt
into the press language by hand: the `press-ripple` class, `relative`, and a
`--press-fill` naming the colour the ripple grows to.

| Surface | Token | Why that one |
|---|---|---|
| `SheetRow` | `[--press-fill:var(--press-on-muted)]` | it presses on the sheet's own surface, one step past its `bg-muted` hover |
| `QuickAction` | `[--press-fill:var(--press-on-secondary)]` | the pill is `bg-secondary`, so its press steps from there |

**`relative` is not decoration.** The ripple is painted on the element's
`::before` at `absolute; inset: 0`; on a statically positioned host that
anchors to the nearest positioned ancestor instead — which, for these two, is
the sheet. The colour then floods the whole panel. Every bespoke consumer of
`press-ripple` has to say `relative`, and this file is one of the places where
forgetting it was a visible bug.

The desktop dropdown item is a third surface: `dropdownMenuItemClass` plus
`state-fade`, so its highlight eases at the same 440ms-in / 100ms-out as every
other colour change instead of snapping.

Keyboard focus is not uniform, on purpose. A `QuickAction` draws `focus-ring`
— the 2px outline at 20% of `--ring` — because it is a pill with its own edge.
A `SheetRow` has no edge to trace, so it fills with `bg-muted` instead, the
same surface its hover uses.

## Save is bound to the library store

```tsx
<DetailMoreButton kind="album" title={album.title}
  libraryType="album" libraryId={album.id} libraryName={album.title} />
```

With `libraryType` + `libraryId` the Save pill reads `useUserLibrary()` live and
toggles through `useLibraryToggle()` — the same store and keys the header and
card hearts use, so all of them flip together, and the toast ("Saved to
Library" / "Removed from Library", with Undo) is the one every save affordance
fires. The heart fills (`fill-current`) when saved.

Without the binding it falls back to the passed `inLibrary` plus
`onAdd` / `onRemove`. Prefer the binding: the fallback is a snapshot, and a
heart elsewhere on the page can go stale against it.

The binding means the component **needs a `UserLibraryProvider`** above it
(`useUserLibrary` throws without one). It is mounted once at the app shell;
the design-system page mounts its own seeded one. Toasts come from the
`ToastProvider` in the root; `useCredits` has a no-op default and needs
nothing.

## Publishing the menu to the chrome

Below 768 the detail page's own "…" is hidden and the floating
`DetailHeader` in `MobileAppHeader` renders it instead — the slim transparent
bar with back on the left and "…" on the right. The page hands it the config:

```tsx
const albumMenu = {
  kind: "album" as const,
  title: ALBUM.title, subtitle: ALBUM.artist, cover: ALBUM.cover,
  meta: String(ALBUM.year),
  libraryType: "album" as const, libraryId: ALBUM.id, libraryName: ALBUM.title,
  onGoToArtist: () => openArtist(slugify(ALBUM.artist)),
}
usePublishDetailHeader({ title: ALBUM.title, menu: albumMenu })
```

The chrome then renders `<DetailMoreButton {...config.menu} />` — the same
component, the same props, so the sheet from the bar must be identical to the
one the in-page button would open.

**The bridge must forward every field via live getters.** The page rebuilds
`albumMenu` on every render (its handlers are fresh closures), so
`usePublishDetailHeader` cannot publish that object — a new identity each
render would `setConfig` in a loop. It publishes **one stable object** whose
display fields are getters reading the latest config from a ref and whose
handlers are wrapper functions calling through to it. React sees the same
reference each effect and bails out.

The cost of that design is that the stable object is a **hand-written field
list**, and a field it does not name is silently `undefined` on the chrome's
sheet. That is not hypothetical — a stale whitelist once swallowed exactly
these:

- **`covers`** → the playlist sheet lost its collage and showed the plain
  square fallback;
- **`meta`** → the "8 tracks" / year beside the badge vanished;
- **`libraryType` / `libraryId`** → Save fell back to the unbound path: no live
  state, no flip to Remove, and the header heart and the sheet disagreed.

The failure is silent because every one of those props is optional, so
nothing type-checks against the omission. When adding a prop to
`DetailMoreButtonProps`, add its getter (or wrapper) in `detail-actions.tsx` in
the same change. See the open questions for two fields that are missing today.

## Open questions

- home.tsx:3099 · the static "phone bottom sheet" preview gives a *playlist* a
  third "Play radio" pill · source gives a playlist only Share + Save (Play
  radio is the artist's third pill) (detail-more-button.tsx:243–251)
- home.tsx:3111–3112 · the same preview shows Credits and Go to artist rows on
  a playlist · source adds those rows only for `kind="album"`; a playlist gets
  "Go to owner" (detail-more-button.tsx:266–271)
- home.tsx:3114 · the preview renders Report in `text-destructive` · source
  marks only "Delete playlist" destructive; Report is a plain row
  (detail-more-button.tsx:276–277)
- home.tsx:3082 / 3098 / 3106 · the preview uses `px-5` / `px-4` gutters ·
  source: the header inherits `SheetHeader`'s `px-6` (sheet.tsx:134) while the
  quick actions and rows sit at `px-1` (detail-more-button.tsx:365, 370)
- DESIGN_SYSTEM.md:657 and home.tsx:3060 list the pills as "Share · Save ·
  (Edit / Play radio …)" · source's third pill on a non-owned album is Credits,
  and an owned playlist has Share · Add music · Edit info with no Save
  (detail-more-button.tsx:243–251)
- DESIGN_SYSTEM.md:658 claims "44px tap target" and the source comment
  "44px+" · with `py-3` + `text-base` (21px, no line-height override in
  app.css, Tailwind default 1.5) the row measures ≈ 55px, so the figure is a
  floor, not the height (detail-more-button.tsx:113, 117; app.css:229)
- detail-actions.tsx:62 says the bridge forwards **every** `DetailMenu` field
  · source names no getter for `onGoToOwner` or `onGoToSelf`
  (detail-actions.tsx:66–94), and the playlist page wires `onGoToOwner`
  (playlist-detail-view.tsx:107) — so the chrome's sheet on another user's
  playlist silently lacks "Go to owner" while the in-page button has it
- detail-actions.tsx:63 says the chrome-rendered sheet is "identical to the
  in-page one" · the bridge's wrapper handlers are unconditionally defined
  (`onPlayNext: () => ref.current.menu?.onPlayNext?.()`, detail-actions.tsx:80–93),
  so the "drop unwired rows" filter (detail-more-button.tsx:283) never fires
  through it: an album page that wires no `onPlayNext` / `onAddToQueue` /
  `onGoToLabel` shows no such rows in-page but shows dead ones in the chrome
- ~~`swipeDirection` defaults to `"right"` under a `side="bottom"` sheet, so
  the dismiss gesture is sideways~~ — **answered**: `Sheet` defaults to
  `"down"` now, and the side drawer is the one that overrides.
- DESIGN_SYSTEM.md:614–615 says every sheet sits at `bottom: var(--kb, 0px)`
  with a sticky footer · this surface is `SheetContent` (base-ui Drawer),
  pinned `bottom-0` with no `--kb` and no footer (sheet.tsx:75) — moot for a
  menu with no field, but the sentence does not hold for it
