# Component tickets — May 2026 push

One ticket per new or updated component shipped in the May 2026
sessions. Copy a block straight into ClickUp / Linear.

**Format.** Each ticket leads with **Resources** (call-out blockquote
at the top) so a dev can jump straight from the ticket into the
design system + source. The rest of the block is orientation; the
exhaustive implementation notes already live as comments inside the
code.

- **Resources** (blockquote, highlighted) — design-system anchor + source file.
- **Used in** — clickable links to the live prototype pages where you can see it in context.
- **Summary** — one sentence on what it is and the problem it solves.
- **Use** — import path + minimal JSX so it's clear how to drop it in.
- **Behavior** — the rules / quirks a dev needs to honour when wiring it up.
- **Rules** — concrete sizing / class / slot constraints lifted from the source. The "don't deviate" list.

Repo: <https://github.com/chris-hug/muza-prototypes>
Prototype: <https://imjustsittingherelookingatprettycolours.help>
Design system route (local or hosted): `/?page=DesignSystem`

Grouped by **Core** (streaming, uploading, purchasing digital music
— day-one scope) and **Phase 2 / Shop** (physical merch, product
listings, order fulfillment — deferred).

---

## Core


### Toggle  ·  *new*

> **Resources**
> - DS: [Toggle](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#toggle)
> - Source: [`src/components/ui/toggle.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/toggle.tsx)

**Used in:**
- Currently only consumed as a `ToggleGroup` child (see ToggleGroup below). No standalone usage in product surfaces yet.

**Summary.** A pressable on/off button — the atomic primitive
behind `ToggleGroup`. Use standalone for single "press to toggle X"
controls.

**Use.**
```tsx
import { Toggle } from "@/components/ui/toggle"

<Toggle pressed={pressed} onPressedChange={setPressed}>Label</Toggle>
```

**Behavior.**
- Two visual states (pressed / unpressed) with the same sizes as
  `Button` (`sm` · default · `lg`).
- Inside a `ToggleGroup` the size is inherited from the group —
  don't set it twice.
- Built on base-ui's `Toggle` primitive, so the `pressed` /
  `onPressedChange` API matches.

**Rules.**
- Sizes: `sm` → `h-8 px-3 text-2xsmall`, default → `h-10 px-[18px] text-small font-medium`, `lg` → `h-12 px-10`.
- Icon-only: pair with `aspect-square px-0` so the pill stays square.
- API: `pressed` + `onPressedChange` (not `value` / `onChange`).

### ToggleGroup  ·  *new*

> **Resources**
> - DS: [ToggleGroup](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#togglegroup)
> - Source: [`src/components/ui/toggle-group.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/toggle-group.tsx)

**Used in:**
- [Topbar — theme switcher](https://imjustsittingherelookingatprettycolours.help/) (any page)
- [Artist › Discography — grid/list toggle](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Purchases — order-status filter](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)

**Summary.** Segmented control — a pill-shaped track holding 2–4
`Toggle` children. Use it for view-mode pickers and other "which
one of these is on" decisions.

**Use.**
```tsx
import { ToggleGroup } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"

<ToggleGroup value={[value]} onValueChange={(v) => setValue(v[0])}>
  <Toggle value="a">A</Toggle>
  <Toggle value="b">B</Toggle>
</ToggleGroup>
```

**Behavior.**
- Two modes: single-select (one pressed at a time, like radio) and
  multi-select (any combination).
- Same height + chrome as `TabsList sm` so it can sit next to tabs
  without optical clash.
- Children must be `Toggle` components — don't drop arbitrary
  buttons in.

**Rules.**
- Track: `h-[40px] p-1 rounded-full bg-muted` — children compute to `h-8`.
- Pass `value` as an array even for single-select (emit one entry).
- Don't override child sizes — they inherit the group's size token.

### Toolbar  ·  *new*

> **Resources**
> - DS: [Toolbar](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#toolbar)
> - Source: [`src/components/ui/toolbar.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/toolbar.tsx)

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Summary.** Horizontal grouped button bar with roving focus —
arrow keys move between items, only one tab stop for the whole bar.
Reach for it when you have ≥3 related controls that should feel
like one unit (rich-text controls, table actions, canvas tools).

**Use.**
```tsx
import { Toolbar, ToolbarSeparator } from "@/components/ui/toolbar"

<Toolbar>
  <Button variant="ghost" size="icon-sm"><Bold /></Button>
  <Button variant="ghost" size="icon-sm"><Italic /></Button>
  <ToolbarSeparator />
  <Button variant="ghost" size="icon-sm"><Link /></Button>
</Toolbar>
```

**Behavior.**
- Wrap button-like children (`Button`, `Toggle`, `ToggleGroup`,
  separators). Arrow keys traverse; `Tab` exits the toolbar.
- One visible focus ring at a time — leans on base-ui `Toolbar` for
  the semantics, so don't reinvent the keyboard handling.
- Use `Separator` between logically-grouped clusters.

**Rules.**
- Container: `inline-flex items-center gap-1` (default). Don't set roving-focus state by hand — base-ui handles it.
- Separator: `<ToolbarSeparator />` — renders `h-6 w-px bg-border mx-1`.
- All children should be focusable elements (`Button`, anchor, etc) — toolbar skips non-focusables.

### Meter  ·  *new*

> **Resources**
> - DS: [Meter](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#meter)
> - Source: [`src/components/ui/meter.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/meter.tsx)

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Summary.** Determinate value-within-a-range indicator. Use it for
"how much of X is used" (storage, password strength, profile
completion). Not the same as `Progress`, which is task-bound /
indeterminate.

**Use.**
```tsx
import { Meter, MeterLabel, MeterValue, MeterTrack, MeterIndicator } from "@/components/ui/meter"

<Meter value={value} min={0} max={100}>
  <div className="flex items-baseline gap-3">
    <MeterLabel>Storage</MeterLabel>
    <MeterValue>{() => `${value} GB / 100 GB`}</MeterValue>
  </div>
  <MeterTrack>
    <MeterIndicator />
  </MeterTrack>
</Meter>
```

**Behavior.**
- Requires `min`, `max`, `value`. Optional label and value text
  render in semantic slots so screen readers announce both.
- Colour bands (low / medium / high) opt-in — the bar stays neutral
  by default.

**Rules.**
- Track: `h-1 rounded-full bg-secondary`. Indicator: `bg-foreground`.
- `MeterValue` takes a function child so the projected value is computed (not just `value`).
- For coloured thresholds, layer state-driven classes on `MeterIndicator` — don't fork the component.

### ScrollArea  ·  *new*

> **Resources**
> - DS: [ScrollArea](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#scrollarea)
> - Source: [`src/components/ui/scroll-area.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/scroll-area.tsx)

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Summary.** Themed scrollable container with custom scrollbars
that match the design system and behave consistently on Mac /
Windows / touch. Use it any time native scrollbars look wrong (long
menus, sidebar lists, modal bodies).

**Use.**
```tsx
import { ScrollArea } from "@/components/ui/scroll-area"

<ScrollArea className="max-h-72">
  …long content…
</ScrollArea>
```

**Behavior.**
- Scrollbars auto-hide; reveal on hover / scroll.
- Set an explicit `max-height` (or let the parent constrain
  height) — the child must be taller than the viewport for the
  scrollbar to appear.

**Rules.**
- Caller MUST set a constraining height (`max-h-*`, `h-*`, flex grow with `min-h-0`). Without it the ScrollArea sizes to content and never scrolls.
- Don't nest scrollable elements inside — they'll fight the wrapper's overflow.

### Collapsible  ·  *new*

> **Resources**
> - DS: [Collapsible](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#collapsible)
> - Source: [`src/components/ui/collapsible.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/collapsible.tsx)

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Summary.** The lowest-level disclosure primitive — one panel
under one trigger. Reach for it when only a single section needs to
open / close; if you need ≥2 with shared semantics, use `Accordion`.

**Use.**
```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"

<Collapsible>
  <CollapsibleTrigger>Show more</CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>
```

**Behavior.**
- `Collapsible` is the API base; the trigger element is whatever
  you pass as `CollapsibleTrigger`.
- `Accordion` is built on top of this — don't re-implement the
  open/close state yourself.

**Rules.**
- Animate height via `data-[state=open]:animate-collapsible-down` + `data-[state=closed]:animate-collapsible-up` on `CollapsibleContent` (keyframes already in `app.css`).
- `CollapsibleContent` should set `overflow-hidden` so the height animation reads cleanly.

### Accordion  ·  *new*

> **Resources**
> - DS: [Accordion](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#accordion)
> - Source: [`src/components/ui/accordion.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/accordion.tsx)

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Summary.** Vertical stack of `Collapsible` panels with shared
single-open (or multi-open) semantics. Use for FAQ lists, settings
groups, anything that benefits from progressive disclosure of
parallel content.

**Use.**
```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

<Accordion type="single" collapsible>
  <AccordionItem value="a">
    <AccordionTrigger>Heading A</AccordionTrigger>
    <AccordionContent>…</AccordionContent>
  </AccordionItem>
</Accordion>
```

**Behavior.**
- `type="single"` (default) closes the previous panel when a new
  one opens; `type="multiple"` lets several stay open.
- `collapsible` prop allows the open panel to close on second
  click (off by default in single mode).

**Rules.**
- `AccordionTrigger` ships with a chevron that rotates 180° on `data-[state=open]` — don't duplicate it.
- Item border: `border-b border-border` between items, no border on the last (`last:border-b-0`).
- Match the page font weight — `font-medium` on triggers.

### NavigationMenu  ·  *new*

> **Resources**
> - DS: [NavigationMenu](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#navigationmenu)
> - Source: [`src/components/ui/navigation-menu.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/navigation-menu.tsx)

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Summary.** Horizontal nav with hover / focus-anchored popups —
the right primitive when you need a mega-menu or category tree
hanging off a top-level item. Use plain `<nav>` + links if you only
need flat navigation.

**Use.**
```tsx
import { NavigationMenu, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu"

<NavigationMenu>
  <NavigationMenuItem>
    <NavigationMenuTrigger>Browse</NavigationMenuTrigger>
    <NavigationMenuContent>…</NavigationMenuContent>
  </NavigationMenuItem>
</NavigationMenu>
```

**Behavior.**
- Sliding the cursor between triggers keeps the popup open, no
  click required — same UX as macOS menu bars.
- Built on base-ui `NavigationMenu` so the keyboard semantics
  (Home, End, Esc) come for free.

**Rules.**
- Triggers: `Button variant="ghost"` styling, `h-9 px-4`. Don't deviate.
- Popups must use `NavigationMenuContent` (not a raw `Popover`) so the slide-between-triggers behaviour wires up.

### Badge  ·  *updated*

> **Resources**
> - DS: [Badges](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#badges)
> - Source: [`src/components/ui/badge.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/badge.tsx)

**Used in:**
- [Artist › Discography — Type column](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Studio › Music — Type column](https://imjustsittingherelookingatprettycolours.help/?page=Music)
- [Shop › Orders — order detail status row](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)

**Summary.** Compact status / category label. Three exports: `Badge`
(primitive), `ContentTypeBadge` (album / single / EP), `StatusBadge`
(generic status colour map). Unified this push so all badges share
one height regardless of variant.

**Use.**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="success">New</Badge>
<Badge shape="pill">12</Badge>
```

**Behavior.**
- All variants now render at `h-[26px]` — don't override unless
  you have a specific reason (counts have a dedicated `pill` shape).
- Variants: `secondary` (default), `outline`, `primary` (brand
  fill — "Selected" / active), `success` (mint `#00D5A3` — "New"
  attention pill), `destructive`.
- Shape variants: square (default, `h-[26px]`) and `pill`
  (`h-5 min-w-5` round count badge — nest inside `Chip` via the
  `count` prop, don't hand-render).

**Rules.**
- Slot: `h-[26px] px-[6px] rounded-md text-2xsmall font-medium`. Pill shape: `h-5 min-w-5 px-1.5 pb-px rounded-full text-xsmall border-transparent`.
- `success` variant: `bg-[#00D5A3] text-black border-[#00b889]` — reserved for "New" attention only.
- Don't compose count badges by hand inside a Chip — pass `count={n}` to `Chip` and let it render `<Badge shape="pill">`.

### Chip  ·  *updated*

> **Resources**
> - DS: [Chips](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#chips)
> - Source: [`src/components/ui/chip.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/chip.tsx)

**Used in:**
- [Shop › Products — Create listing flow](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=products): "Release Type" picker (Single / EP / Album / Compilation) and dismissable artist / collaborator chips in the Main Artist + Featured Artist fields.

**Summary.** Interactive filter / tag pill. Use it for filter rows,
genre tags, anything dismissible. Distinct from `Badge` (Chip is
interactive; Badge is a label).

**Use.**
```tsx
import { Chip, ChipGroup } from "@/components/ui/chip"

<ChipGroup>
  <Chip selected={isOn} onClick={toggle}>Vinyl</Chip>
  <Chip count={3}>Genres</Chip>
</ChipGroup>
```

**Behavior.**
- Sizes: `sm` (`h-8 px-3 text-2xsmall`) and `md` (`h-10 px-4
  text-small`).
- Variants: default (outline), `ghost` (transparent until hover —
  use when the chip sits in dense filter rows).
- `count` prop auto-renders a `Badge shape="pill"` inside the
  chip — don't compose the badge manually.
- Selected state swaps the inner badge to `bg-background` via the
  `group/chip` modifier; pass `selected` rather than re-styling.

**Rules.**
- Sizes: `sm` → `h-8 px-3 text-2xsmall`; `md` → `h-10 px-4 text-small`.
- Active style: `activeStyle="outline"` keeps the border + foreground text on selected (default flips to filled).
- For dismissable chips use `<ChipDismiss>` not a hand-rolled `×` button.

### MultiSelect  ·  *updated*  *(renamed from `FilterMenu`)*

> **Resources**
> - DS: [MultiSelect](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#multi-select)
> - Source: [`src/components/ui/multi-select.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/multi-select.tsx)

**Used in:**
- [Studio › Music — filters](https://imjustsittingherelookingatprettycolours.help/?page=Music)
- [Artist › Discography — filters](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Summary.** Multi-select dropdown — outline pill trigger that
opens a menu of options with **left-side checkboxes**. The "filter
by N categories" workhorse.

**Use.**
```tsx
import { MultiSelect } from "@/components/ui/multi-select"

<MultiSelect
  label="Type"
  options={[{ value: "album", label: "Albums" }, …]}
  value={selected}
  onChange={setSelected}
/>
```

**Behavior.**
- Left-checkbox convention is the visual signal that this is
  multi-select (vs `SingleSelect`'s right ✓). Don't swap them.
- Trigger badge shows the active count when ≥1 option is selected.
- Menu stays open while you toggle; closes on outside-click.
- Searchable for long option lists; "Clear all" row at the bottom.

**Rules.**
- Trigger: `Button variant="outline" font-normal`. Pass `icon={null}` to drop the default chevron.
- Menu uses left `<Checkbox>` (not the right ✓ pattern from `SingleSelect` / `DropdownMenuCheckboxItem`).
- Always render "Clear all" footer when ≥1 option is selected — handled internally; don't add by hand.

### SingleSelect  ·  *new*  *(formerly `SortButton` / `Picker`)*

> **Resources**
> - DS: [SingleSelect](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#single-select)
> - Source: [`src/components/ui/single-select.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/single-select.tsx)

**Used in:**
- [Artist › Discography — sort](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Summary.** Single-select dropdown — outline pill trigger that
opens a menu with **right-side ✓** marking the current option. The
toolbar workhorse for sort / view-density / layout pickers.

**Use.**
```tsx
import { SingleSelect } from "@/components/ui/single-select"

<SingleSelect
  value={sort}
  onChange={setSort}
  options={[{ value: "newest", label: "Newest" }, …]}
/>
```

**Behavior.**
- Right-✓ convention is the visual signal that this is
  single-select. Don't swap with `MultiSelect`'s left-checkboxes.
- Distinct from the form-field `Select`, which lives inside forms
  and renders a field-style trigger. `SingleSelect` is for
  toolbar / inline use.
- Picking an option replaces the current value and closes the menu.

**Rules.**
- Trigger: `Button variant="outline" font-normal`. Default leading icon `ArrowUpDown`; pass `icon={null}` or a custom `lucide` icon to override.
- Menu uses `DropdownMenuItem` with `<Check>` on the right (auto-rendered on the active item).
- For inline form fields use `<Select>` instead — different visual chrome.

### AlbumCard  ·  *new*

> **Resources**
> - DS: [AlbumCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#album-card)
> - Source: [`src/components/ui/album-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/album-card.tsx)

**Used in:**
- [Library › Albums](https://imjustsittingherelookingatprettycolours.help/?page=Albums)
- [Artist › Top Albums](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Artist › Discography (grid view)](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Home › New Albums + Albums of the week rails](https://imjustsittingherelookingatprettycolours.help/)

**Summary.** Universal album / release tile — square cover + title
+ artist/year subtitle, with hover-revealed Add / More / Play
cluster on the cover. Use anywhere a release needs to be
representable as a single tile.

**Use.**
```tsx
import { AlbumCard } from "@/components/ui/album-card"

<AlbumCard
  cover={url}
  title={title}
  artist={artist}
  year={year}
  owned={isOwned}
/>
```

**Behavior.**
- Cover plays on tap; long-press opens the action menu on touch.
  On desktop, hover surfaces Add (or Edit, for owned) · ⋯ · Play.
- Title and artist text are independent click targets (album page
  vs artist page). Don't nest them in one link.
- Owned-album variant swaps Add→Edit and Report→Remove in the menu
  — pass `owned` rather than re-wiring the children.

**Rules.**
- Cover: square, `aspect-square rounded-xs shadow-sm`. Don't change the corner radius — paired with `Cover Play Button` chrome.
- Title: `text-small font-normal leading-5 truncate`; subtitle: `text-small text-muted-foreground leading-5 truncate`.
- Use `AlbumCardMenuItems` from `cover-card-menu.tsx` for the kebab — don't write a parallel menu.

### ArtistCard  ·  *new*

> **Resources**
> - DS: [ArtistCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#artist-card)
> - Source: [`src/components/ui/artist-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/artist-card.tsx)

**Used in:**
- [Library › Artists](https://imjustsittingherelookingatprettycolours.help/?page=Artists)
- [Artist › Similar Artists](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Home › Artists of the week rail](https://imjustsittingherelookingatprettycolours.help/)

**Summary.** Circular avatar + name tile. Use for artist grids and
rails. No hover overlay — the whole tile navigates to the artist
profile.

**Use.**
```tsx
import { ArtistCard } from "@/components/ui/artist-card"

<ArtistCard name={name} image={imageUrl} />
```

**Behavior.**
- The avatar image is inset to ~80% of the card width so the
  circle never visually dominates when sharing a row with square
  `AlbumCard`s.
- No play / menu actions on hover — keep it light.

**Rules.**
- Avatar: `rounded-full` inside a `size-[80%]` inset wrapper. Don't remove the inset — it's what keeps the circle visually balanced next to square AlbumCards.
- Label: `text-small font-normal leading-5 truncate text-center`.
- No hover overlay. Don't add one — Artist tiles are click-the-whole-tile, AlbumCard is click-the-cover-to-play.

### PlaylistCard  ·  *new*

> **Resources**
> - DS: [PlaylistCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#playlist-card)
> - Source: [`src/components/ui/playlist-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/playlist-card.tsx)

**Used in:**
- [Library › Playlists](https://imjustsittingherelookingatprettycolours.help/?page=Playlists)
- [Artist › Curated Playlists](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Home › Playlists of the week rail](https://imjustsittingherelookingatprettycolours.help/)

**Summary.** Square 2×2 composite cover (or custom artwork) +
title + song-count / owner subtitle. Same interaction model as
`AlbumCard`. Has a sibling `PlaylistCreateCard` for the "+ new
playlist" tile — pair them in grids.

**Use.**
```tsx
import { PlaylistCard } from "@/components/ui/playlist-card"
import { PlaylistCreateCard } from "@/components/ui/playlist-create-card"

<PlaylistCard
  title={title}
  covers={[c1, c2, c3, c4]}
  songCount={songCount}
  owner={ownerName}
  owned={isOwned}
/>
```

**Behavior.**
- Owned-playlist variant drops the owner subtitle and swaps menu
  items (Save→Edit, Report→Delete). Pass `owned`.
- Composite covers expect exactly 4 image URLs; fewer → uses
  single-image fallback automatically.

**Rules.**
- Cover: `aspect-square rounded-xs shadow-sm` — 2×2 grid built internally; don't lay out the 4 thumbs by hand.
- `PlaylistCreateCard` shares the same outer dimensions so a "+ new" tile slots cleanly into the same grid.
- Use `PlaylistCardMenuItems` from `cover-card-menu.tsx`.

### CoverPlayButton  ·  *new*

> **Resources**
> - DS: [Cover Play Button](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#cover-play-button)
> - Source: [`src/components/ui/cover-play-button.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/cover-play-button.tsx)

**Used in:**
- [Song List Item](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#song-list-item)
- [Artist › Discography (list view)](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Design system › List Table](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#list-table)

**Summary.** The square cover-as-play-button used in every row
that carries a track or release. Shared base behind `SongListItem`,
the discography list table, and any future list/grid that wants the
same affordance.

**Use.**
```tsx
import { CoverPlayButton } from "@/components/ui/cover-play-button"

<CoverPlayButton
  src={coverUrl}
  title={title}
  playing={isPlaying}
  onToggle={togglePlay}
  hoverGroup="song"    // or "row" / "self"
/>
```

**Behavior.**
- Four states driven entirely by CSS (no children swap, so
  transitions always crossfade cleanly):
  - idle, not hovered → cover only
  - idle, hovered → cover + dark wash + Play icon
  - playing, not hovered → cover + dark wash + 3D `PlayingWave`
  - playing, hovered → cover + dark wash + Pause icon
- The dot wave is the 3D `PlayingWave` primitive — it uses
  `transform-style: preserve-3d`, so this component must live
  inside a *static* host that doesn't animate opacity / transform
  on itself (CoverPlayButton itself qualifies; the host doesn't
  matter because the button has `overflow-hidden`).

**Rules.**
- Slot: `relative shrink-0 overflow-hidden rounded-xs shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 outline-none cursor-pointer size-12` (48×48 default).
- Group hook: outer is `group/cpb` and carries `data-playing` when `playing=true`. Children read both via `group-data-[playing]/cpb:` and `group-hover/cpb:` / `group-hover/row:` / `group-hover/song:` selectors.
- Don't conditionally render the overlay icons — they're always mounted; only their opacity changes via CSS. Conditional rendering reintroduces the smear.

### PlayingWave  ·  *new*

> **Resources**
> - DS: [Cover Play Button section](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#cover-play-button) (showcased alongside its host)
> - Source: [`src/components/ui/playing-wave.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/playing-wave.tsx)

**Used in:**
- [Cover Play Button](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#cover-play-button) (drives the "playing-at-rest" overlay)

**Summary.** Miniature 3D carousel of four dots rotating around a
Y-axis. The brand "now-playing" indicator — slow 8s loop, reads as
"alive, at rest." Distinct from `Spinner` (loading semantics).

**Use.**
```tsx
import { PlayingWave } from "@/components/ui/playing-wave"

<PlayingWave size={28} className="text-foreground" />
```

**Behavior.**
- All internal lengths are expressed in `em`, anchored to the
  wrapper's `font-size` = `size`. Change `size` and proportions
  stay locked.
- Inherits text colour via `currentColor`.

**Rules.**
- Default `size={28}` is the canonical Song-List-Item / Cover-Play-Button size.
- Uses `transform-style: preserve-3d` + `perspective` → promotes a compositing layer. Only safe inside hosts that DON'T animate their own opacity / transform (Button's `disabled:opacity-45` triggers the mosaic smear). For those hosts use `Spinner` instead.
- Keyframes (`muzaCarousel`, `muzaCarouselFloat`) live in `app.css` with anchor classes — Tailwind v4 tree-shakes keyframes referenced only via arbitrary-value classes. Don't remove the anchors.

### Spinner  ·  *new*

> **Resources**
> - DS: [Spinner](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#spinner)
> - Source: [`src/components/ui/spinner.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/spinner.tsx)

**Used in:**
- [Button — Loading state](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#button) (the "Loading" row of every variant uses `<Spinner size="sm" />`)
- [Spinner gallery + Composition](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#spinner)

**Summary.** Standard rotating loading circle — stroked arc on a
dimmed ring background, `animate-spin`. Universal "actively
working" indicator for inline contexts (buttons, status rows, etc).

**Use.**
```tsx
import { Spinner } from "@/components/ui/spinner"

<Spinner size="sm" />       // 16px — inside buttons / inline text
<Spinner size="md" />       // 24px — content area
<Spinner size="lg" label="Uploading" /> // 40px — full-section
```

**Behavior.**
- Inherits text colour via `currentColor` — same component looks
  right on every Button variant (white on primary, foreground on
  secondary, etc).

**Rules.**
- Slot: `inline-flex` wrapper with `role="status" aria-label={label}`. Children: `<svg class="animate-spin shrink-0 size-{sm/md/lg}">` with the standard 2-path circle.
- Sizes: `sm` → `size-4`, `md` → `size-6`, `lg` → `size-10`.
- Reserve next to text for a stable layout: wrap loading content in `min-w-[…]` slot so the spinner appearing doesn't push neighbours.

### TopProgressBar  ·  *new*

> **Resources**
> - DS: [Top Progress Bar](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#top-progress-bar)
> - Source: [`src/components/ui/top-progress-bar.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/top-progress-bar.tsx)

**Used in:**
- [Route-level nav transition](https://imjustsittingherelookingatprettycolours.help/) — mounted once in `home.tsx`; flipped true on every `activeNav` change for ~600ms so the bar shows on DS↔prototype boundary nav.
- [Design system trigger demo](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#top-progress-bar)

**Summary.** Thin 2px bar pinned to the viewport's top edge —
appears only when a load exceeds a 200ms threshold, climbs
asymptotically to ~85%, snaps to 100% on completion and fades.
NProgress-style; non-blocking.

**Use.**
```tsx
import { TopProgressBar } from "@/components/ui/top-progress-bar"

<TopProgressBar loading={isFetching} />
```

**Behavior.**
- Loads under 200ms stay invisible (the show-after delay).
- Bar grows non-linearly toward ~85%, holds there. Only flipping
  `loading=false` snaps it to 100% and triggers the fade-out.
- Controlled: parent owns the `loading` boolean. The bar handles
  visual timing internally.

**Rules.**
- Slot: `fixed top-0 left-0 right-0 z-50 h-[2px] pointer-events-none`. Inner bar `bg-foreground transition-[width,opacity] ease-out`.
- Single instance per route — don't mount multiple. Use one global wrapper near the route root.
- Don't add fake delays just to make the bar fire. If your fetch is <200ms, the bar staying hidden is correct.

### SongListItem  ·  *new*

> **Resources**
> - DS: [SongListItem](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#song-list-item)
> - Source: [`src/components/ui/song-list-item.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/song-list-item.tsx)

**Used in:**
- [Artist › Top Songs](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Summary.** Single row in any song list — Top Songs on Artist,
playlist detail, search results. The cover thumb itself acts as
the play button.

**Use.**
```tsx
import { SongListItem } from "@/components/ui/song-list-item"

<SongListItem
  cover={url}
  title={title}
  artist={artist}
  album={album}
  year={year}
  badge="Demo"
  duration="3:42"
  menuItems={<AlbumCardMenuItems />}
/>
```

**Behavior.**
- Idle hover shows ▶ on the thumb; playing state swaps to the
  3D-carousel wave animation with Pause-on-hover.
- Title / album / artist are independent hover-underline click
  targets — don't wrap the whole row in one link.
- Right cluster: `+` always visible; `info` + `⋯` revealed on
  hover; duration sits last.
- Pass `menuItems` to turn the kebab into a real `DropdownMenu`;
  omit to hide the kebab entirely.

**Rules.**
- Row: `group/song flex items-center gap-3 rounded-md pl-2 pr-2 py-1.5 cursor-pointer`.
- Cover uses `<CoverPlayButton hoverGroup="song">` — don't re-implement.
- Meta line: `text-small text-muted-foreground leading-5`. Underline target style: `underline-offset-[3px] [text-decoration-thickness:1px]`.

### CardRail  ·  *new*  *(renamed from `HomeRow`)*

> **Resources**
> - DS: [CardRail](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#card-rail)
> - Source: [`src/components/app/card-rail.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/card-rail.tsx)

**Used in:**
- [Home — New Albums / Playlists of the week / Artists of the week / Albums of the week](https://imjustsittingherelookingatprettycolours.help/)
- [Artist profile rails (Top Albums, Products, Curated Playlists, Similar Artists)](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Summary.** Section divider (separator + title + ◀ ▶ + optional
"Show all") followed by a horizontally-scrolling rail of cards.
Use for every "browse by category" rail on Home and Artist.

**Use.**
```tsx
import { CardRail } from "@/components/app/card-rail"

<CardRail title="New Albums" showAllLabel="Show all">
  {items.map(i => <li key={i.id}><AlbumCard {...i} /></li>)}
</CardRail>
```

**Behavior.**
- Visible card count steps off the rail's own width via `@container`
  (independent of viewport). The step map is the shared **Pattern B**
  rule — see [`FOUNDATION_TICKETS.md › Page layout — responsive
  container & growth tiers`](FOUNDATION_TICKETS.md#page-layout--responsive-container--growth-tiers)
  for the full table including the tier-2 7-card step.
- Touch-pan-x for swipe; arrow buttons scroll one page at a time.
- Scrollbar hidden — paging is the only intended affordance.

**Rules.**
- Children must be `<li>` wrappers around a card. Cards inside go full-width of the rail slot.
- Outer parent must be a `@container` so the rail can read its width — Library views already do this; Home does it explicitly.
- Don't replace the ◀ ▶ chrome — it ships built-in and disables when scroll position is at min / max.
- The rail's card sizing only resolves correctly inside a page
  wrapper that follows the **Page layout** foundation ticket — i.e.
  `max-w-[1480px] min-[1920px]:max-w-[1716px]`. Without that, the
  7-card tier-2 step won't have room to fire.

### PageSection  ·  *new*

> **Resources**
> - DS: [PageSection](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#page-section)
> - Source: [`src/components/app/section.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/section.tsx)

**Used in:**
- [Shop › Orders → click a row → order detail](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)
- [Purchases → click a fulfillment → purchase detail](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)
- Refund flow (expanded inside order detail)

**Summary.** Detail-page primitive: heading + action slot +
flat-or-boxed body. Use it for every section on Order detail,
Purchase detail, Wallet, Settings — anywhere the page is a stack
of labelled chunks.

**Use.**
```tsx
import { Section as PageSection } from "@/components/app/section"

<PageSection title="Customer" action={<Button variant="outline">Edit</Button>}>
  …
</PageSection>

<PageSection title="Line items" boxed>
  …
</PageSection>
```

**Behavior.**
- Heading sits **outside** the box so boxed and unboxed sections
  share the same hierarchy.
- `boxed` wraps children in a bordered card — reserve for product
  / data lists. Default (unboxed) is for metadata stacks (the
  right column on Order detail is intentionally flat).
- Action slot is right-aligned at heading height — drop a `Button`
  or `SingleSelect` in.

**Rules.**
- Heading: `text-small font-medium`. Don't bump to `font-semibold` — convention is `medium` across the app.
- Spacing between siblings: `gap-10` on parent. Don't add extra margin on the section itself.
- `boxed` body: `border border-border rounded-lg p-4`. Reserved for line-item / product lists. Don't nest boxed sections.

### List Table (pattern)  ·  *new*

> **Resources**
> - DS: [List Table](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#list-table)
> - Source: pattern lives in [`artist-profile-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/artist-profile-view.tsx) (`DiscographyView` function).
> ---

**Used in:**
- [Artist › Discography (list view)](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Summary.** Borderless table layout that powers the Artist ›
Discography list view. Not a packaged component yet — lift to
`src/components/ui/list-table.tsx` when a second consumer appears.

**Use.**
```tsx
// Pattern — copy from `artist-profile-view.tsx` `DiscographyView`
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CoverPlayButton } from "@/components/ui/cover-play-button"

<Table>
  <TableHeader>…sortable sticky <th>s…</TableHeader>
  <TableBody>
    {rows.map(r => (
      <TableRow className="group/row …">
        <TableCell><CoverPlayButton hoverGroup="row" …/></TableCell>
        …
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Behavior.**
- Single-line rows; no zebra; per-cell `bg-muted` hover with
  first / last cells rounding the outside corners.
- Cover cell is a play button with overlay + active-row wave
  animation (re-uses `CoverPlayButton`).
- Sortable column headers (label + arrow); `<th>`s are sticky so
  the header pins to the top of the page scroll.
- Rightmost cell holds a kebab menu sharing `AlbumCardMenuItems`
  so right-click and kebab match.

**Rules.**
- Row class: `group/row border-b-0 hover:bg-transparent [&>td]:group-hover/row:bg-muted [&>td:first-child]:group-hover/row:rounded-l-md [&>td:last-child]:group-hover/row:rounded-r-md [&_td]:py-1.5`.
- Sticky head: `[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background`.
- Cover button uses `<CoverPlayButton hoverGroup="row">`. Don't re-implement.


## Phase 2 / Shop


### ProductCard  ·  *new*  *(renamed from `ProductCardSmall`)*

> **Resources**
> - DS: [ProductCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#product-card)
> - Source: [`src/components/ui/product-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/product-card.tsx)

**Used in:**
- [Artist › Products tab + Artist › Products rail (Overview)](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Summary.** Compact product tile (image · title · price ·
full-width "Add to cart" pill). Use for every product surface on
the buyer side — Artist › Shop and any product rail.

**Use.**
```tsx
import { ProductCard } from "@/components/ui/product-card"

<ProductCard cover={url} title={title} price={price} onAddToCart={add} />
```

**Behavior.**
- Title clamps at two lines with reserved min-height so cards in
  a row stay flush regardless of title length.
- Full-width secondary "Add to cart" pill at the foot — don't
  swap for an icon button; the explicit label is doing work.

**Rules.**
- Cover: square, `aspect-square rounded-xs shadow-sm` (same as `AlbumCard`).
- Title: `text-small font-normal leading-5 line-clamp-2 min-h-10`. Don't drop `min-h-10` or short titles bunch the rest of the card upward.
- Add-to-cart pill: `Button variant="secondary" className="w-full"`. Full-width is part of the chrome.

### CheckoutCard  ·  *new*

> **Resources**
> - DS: [CheckoutCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#checkout-card)
> - Source: exported from [`purchases-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/purchases-view.tsx) (`CheckoutCard` + `CHECKOUTS` fixture).

**Used in:**
- [Purchases hub](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)

**Summary.** Buyer-side receipt for one checkout — date header +
per-shop fulfillment rows. Use on the Purchases hub to group
every shipment that shared a single payment.

**Use.**
```tsx
import { CheckoutCard } from "@/components/app/purchases-view"

<CheckoutCard checkout={c} />
```

**Behavior.**
- Wraps every shipment under one shared date + total header —
  "one charge, N fulfillments".
- Each fulfillment row links to its detail page.
- A payment-failure on any sub-row promotes a single recovery
  CTA up to the header strip so the user doesn't have to hunt.

**Rules.**
- Outer: `border border-border rounded-lg overflow-hidden`. Header strip is `bg-muted px-4 py-3 flex items-center justify-between`.
- Failure-recovery CTA lives ONLY in the header — sub-rows just show the failed-payment badge.
- Fulfillment rows are `<a>` links to detail pages; whole row is the click target.

### Items  ·  *new*  *(`DetailItemsSection`)*

> **Resources**
> - DS: [Items](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#items)
> - Source: [`src/components/app/items-section.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/items-section.tsx)

**Used in:**
- [Shop › Orders → click a row → order detail](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)
- [Purchases → click a fulfillment → purchase detail](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)

**Summary.** Shared product-list + money-breakdown card that drives
both the buyer purchase-detail page and the seller order-detail
page. Branch on `mode="buyer"` vs `mode="seller"` rather than
forking the component.

**Use.**
```tsx
import { ItemsSection as DetailItemsSection } from "@/components/app/items-section"

<DetailItemsSection mode="seller" items={items} totals={totals} />
```

**Behavior.**
- Buyer mode: format / type subtitle, no SKU, no tax line.
- Seller mode: variant + SKU subtitle, discount, labelled tax line.
- Each line collapses to a single price at qty=1 and expands to
  muted "unit × qty" + line total at qty > 1.

**Rules.**
- Lines: `flex items-start gap-3 py-3 border-b border-border last:border-b-0`.
- Money col: `text-small tabular-nums` right-aligned. Totals: `font-medium` on the bottom-most row.
- Don't fork for variations; branch on `mode`. New variations should be a new mode, not a new component.

### Order lifecycle status badges  ·  *new*

> **Resources**
> - DS: [Badges › Order lifecycle status](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#badges)
> - Source: exported from [`orders-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/orders-view.tsx) (`OrderStatusBadge`).

**Used in:**
- [Shop › Orders — list rows](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)
- [Shop › Orders → click a row → order detail header (interactive — opens transition menu)](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)
- [Purchases hub — list rows](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)
- [Purchases → click a fulfillment → purchase detail header](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)

**Summary.** Colour-coded status pills for orders (`OrderStatusBadge`
— payment_failed / new / shipped / delivered / refunded / cancelled).
The seller-side state machine made visible.

**Use.**
```tsx
import { OrderStatusBadge } from "@/components/app/orders-view"

// Static (list rows)
<OrderStatusBadge status={order.status} />

// Interactive (detail header) — opens forward-transition menu
<OrderStatusBadge status={order.status} onStatusChange={updateStatus} />
```

**Behavior.**
- As a static badge: renders the status row in orders /
  purchases lists.
- With an `onStatusChange` handler: the badge becomes a
  `DropdownMenu` of **allowed forward transitions only** — the
  state machine prevents illegal moves (e.g. can't go back from
  delivered to new).
- Don't render arbitrary statuses; the colour map is fixed.

**Rules.**
- Status → variant map is fixed inside the component. Adding a new status: extend the map + add to the allowed-transitions table; don't pass a custom colour from the call-site.
- Interactive variant: drops a `<ChevronDown>` after the label as the dropdown affordance. Static variant has no chevron.
- Use only on order surfaces — for generic "status" needs use `<StatusBadge>` (different module, freer colour map).

