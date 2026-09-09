---
title: Mobile Header
status: updated
source: src/components/ui/mobile-header.tsx
related: [footer-nav, responsive, dialog, search]
---

The frosted top bar for phone layouts. It is the **same glass** as the bottom
`FooterNav` — `.frosted-glass` with a hairline — bordered on the bottom
instead of the top, so the two bookend the screen with one material while
the page scrolls under both.

`MobileHeader` is a surface, not a layout: each screen is a different
arrangement of small primitives inside it. The route-aware arrangement the
app actually mounts is `MobileAppHeader`
([`mobile-app-header.tsx`](src/components/app/mobile-app-header.tsx)).

## When it replaces the Topbar

The desktop `Topbar` gives way to `MobileAppHeader` at the **same instant**
the sidebar gives way to the footer tab bar: below `FOOTER_NAV_BELOW`, read
through `useFooterNav()`. That width is arithmetic, not taste — the point
where the `MediaHeader` stacks plus twice the page gutter — so it is
imported from [`use-media-query.ts`](src/lib/use-media-query.ts) and never
written as a literal. The full ladder and the derivation live in
[Responsive](responsive.md).

```tsx
const footerNav = useFooterNav()
{footerNav && <MobileAppHeader activeNav={activeNav} onNavChange={navigate} />}
```

It renders **inside the shell's scroll container** as a `sticky top-0`
element, not above it: that is what lets page content pass under the glass.
A header outside the scroller would sit on a solid strip and the blur would
have nothing to blur.

## The glass, and the two insets

```tsx
<header className="frosted-glass border-b border-border/50 sticky top-0 z-30 select-none
                   px-3 pt-[max(12px,env(safe-area-inset-top))] pb-3 flex flex-col gap-3">
```

- **`.frosted-glass`** ([`app.css`](app/app.css)) is a single `blur(10px)`
  over a `color-mix` of `--background` — 58% in light, 92% in dark, where a
  lighter tint read as washed-out grey rather than deep glass. It bakes in
  **no border**: every consumer adds its own hairline (`border-b` here,
  `border-t` on the footer nav) so the edge never reads as heavy.
- **`px-3`** is the phone page gutter (`--page-px` is 12px below 584), so
  the title, the pills and the rows beneath share one left edge.
- **`pt-[max(12px,env(safe-area-inset-top))]`** — the status-bar inset on a
  notched phone, and the ordinary 12px everywhere else. `max()` rather than
  a sum: on a phone without a notch the inset is 0 and a bare `env()` would
  collapse the top pad to nothing.
- **`z-30`** matches the footer nav so the two bars share one layer above
  the page.

**`viewport-fit=cover` is what makes any `env(safe-area-inset-*)` resolve at
all.** It is set once in the viewport meta in [`root.tsx`](app/root.tsx).
Without it every such value in the app — this header, the footer nav, the
player shell, sheet footers, toasts — is silently `0`, and every safe-area
pad is a no-op that only shows up on a real notched phone.

## Composed, not configured

| Primitive | What it is | Metrics |
|---|---|---|
| `MobileTitleRow` | `h1` + optional `trailing` cluster | `text-2xlarge font-medium tracking-tight truncate`; row `min-h-9`, cluster `gap-2` |
| `MobileIconButton` | round secondary action (the `+` / search pills) | `size-9 rounded-full bg-secondary`, glyph `18px`, `active:scale-[0.96]` |
| `MobileAvatar` | trailing account image | `size-9 rounded-full`, `alt=""` |
| `MobileSearchBar` | pill search field, optional Cancel / clear | `h-10 rounded-full bg-secondary pl-4 pr-3`, `text-base`, Cancel in `text-primary-text` |
| `MobilePillTabs` | horizontal-scroll filter strip | see below |
| `MobileScopeToggle` | two-segment switch | `bg-muted/70 p-1`, segments `h-8 text-small font-medium`, active `bg-background` + shadow, `aria-pressed` |

The `size-9` on button and avatar is why the title row is `min-h-9`: a Home
header with only an avatar and a Library header with two buttons are the
same height, so switching tabs never moves the title.

`MobileSearchBar` shows its clear `✕` only while it has both an `onClear`
**and** a value, and the Cancel link only while it has an `onCancel` — the
host decides the state by which callbacks it passes. Enter calls `onSubmit`
and prevents the default so a wrapping form never submits twice.

## Pill tabs

```tsx
const TABS: PillTab[] = [
  { value: "all",       label: "All" },
  { value: "albums",    label: "Albums", count: 12 },
  { value: "selection", label: "Selection", icon: <Check /> },
]
<MobilePillTabs tabs={TABS} value={tab} onChange={setTab} />
```

- Each tab is a `Chip` at `size="md"` — `h-10 px-4 text-small`, the height of
  a default `Button`, so a strip can sit in a toolbar beside a sort button
  and read as one row.
- **`count`** renders as a pill `Badge` in the `count` variant after the
  label; it restyles itself when the chip is selected, so no per-tab colour
  is needed. **`icon`** is a leading glyph for a tab that is not a plain
  content type — the "Selection" tab in the Add-music sheet — and is forced
  to `size-4 shrink-0` so a stray SVG cannot resize the pill.
- The strip **bleeds to the edge**: `-mx-3 px-3` cancels the header's gutter
  and restores it as padding, so scrolled pills slide under the gutter
  instead of being cropped on a line that aligns with nothing. The scrollbar
  is hidden in every engine (`[scrollbar-width:none]` plus the WebKit
  pseudo-element).
- **`className` overrides the bleed to match the host.** The default only
  fits a 12px gutter. Inside a dialog the gutter is 12px on phones and 24px
  from `md`, so the Add-music sheet passes `-mx-3 px-3 md:-mx-6 md:px-6`;
  `SearchResultsView` uses the strip in the page body under `sm:hidden`.

## The search panel floats

Focusing the Explore field opens the recent-searches / suggestions panel
**over** the page instead of pushing it down:

```tsx
<div className="absolute inset-x-3 top-full z-40">
  <SearchPanel query={q} onPick={run} className="max-h-[calc(100svh-140px)] overflow-y-auto" />
</div>
```

- The header is `sticky`, which is a positioned box, so `top-full` lands the
  panel exactly on the header's bottom edge and `inset-x-3` keeps it on the
  gutter line. In flow it would displace the results underneath — and jump
  every time the suggestion count changed.
- `z-40` sits above the header's own `z-30` and above the footer nav.
- The height cap is **`svh`, not `dvh`**. On iOS the dynamic unit reports
  the height with the browser chrome collapsed, so a `dvh` cap is taller
  than the visible screen while the URL bar is showing and the panel's
  bottom rows would be unreachable. `100svh` is the small viewport and
  always fits. Same rule as a [Dialog](dialog.md) sheet.

## The arrangements in the app

| Route | Arrangement |
|---|---|
| Home | title + account avatar (the trigger for the shared `ProfileMenu`, a bottom sheet on touch) |
| Library (All / Albums / Artists / Playlists / Songs) | title + `New playlist` + search, then the filter strip |
| Explore | title + avatar + search field; the title steps aside while the field is focused or a query is active; the scope `ToggleGroup` appears under the field once results exist |
| Album / Playlist / Artist | a slim back ⇄ `…` bar (the page carries its own `MediaHeader`) |
| anything else | title + back-or-avatar |

Two of them carry rules worth knowing:

- **Library's search never resizes the header.** Title, `+` and the search
  pill share one fixed `h-10` row; tapping search hides the title and the
  `+` and the pill grows to the full width in place. The field drives the
  shared library-filter store, and the header **clears it on unmount** so a
  collapsed phone field can never leave a hidden filter applied when you
  come back.
- **The detail bar reserves no band.** It is transparent at rest with
  `-mb-[52px]`, so the cover pulls up under it and the back chevron and `…`
  sit in the gutters beside it; past `scrollTop > 300` it fades to glass and
  a small centred title appears. Its icons flip to light over a dark cover
  (the row is wrapped in `.dark`) — but only while transparent, since once it
  is glass they always sit on the light surface.

## Open questions

- claims "Phone layouts (< 768px)" for where the header appears · source gates it on `useFooterNav()`, i.e. below `FOOTER_NAV_BELOW` = 608 (app/routes/home.tsx:4526 vs app/routes/home.tsx:5692 and src/lib/use-media-query.ts:91; the Footer Nav section says "< 608px" at app/routes/home.tsx:4675)
- claims "five primitives" (`MobileTitleRow`, `MobileSearchBar`, `MobilePillTabs`, `MobileScopeToggle`, `MobileIconButton`) · source exports six — `MobileAvatar` is missing from both lists (app/routes/home.tsx:4540 and src/components/ui/mobile-header.tsx:9 vs src/components/ui/mobile-header.tsx:66)
- claims `MobileScopeToggle` is the Explore focused-state scope switch · source's live `ExploreHeader` uses the shared `ToggleGroup`, and `MobileScopeToggle` has no call site outside the design-system page (app/routes/home.tsx:4635 vs src/components/app/mobile-app-header.tsx:310)
- claims Explore is "focus → scope toggle, Enter → result filters" in the header · source shows the `ToggleGroup` only when `!focused && query`, shows the `SearchPanel` while focused, and the result filter pills render in the page body via `SearchResultsView` (src/components/app/mobile-app-header.tsx:17 vs src/components/app/mobile-app-header.tsx:309, :324 and src/components/app/search-results-view.tsx:130)
- claims a "Library — search mode (Cancel + tabs)" built from `MobileSearchBar` with Cancel · source's `LibraryHeader` uses its own growing pill with a trailing `✕`, never `MobileSearchBar` (app/routes/home.tsx:4591 vs src/components/app/mobile-app-header.tsx:234)
- claims an "Explore — scrolled (search collapses up)" state · source has no scroll-driven state in `ExploreHeader`; the title hides on focus or with an active query (app/routes/home.tsx:4621 vs src/components/app/mobile-app-header.tsx:296)
- claims the glass background is "~80%" and "blurred + saturated" · source is 58% in light and 92% in dark, and deliberately has no `saturate()` (app/app.css:274 vs app/app.css:289, :306, :285)
- claims the host places the panel "inline below the mobile search bar" · source positions it `absolute … top-full` as an overlay (src/components/ui/search-panel.tsx:12 vs src/components/app/mobile-app-header.tsx:325)
- the `140px` in `max-h-[calc(100svh-140px)]` has no derivation anywhere in source (src/components/app/mobile-app-header.tsx:326)
