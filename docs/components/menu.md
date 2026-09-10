---
title: Menu
source: src/components/ui/dropdown-menu.tsx
related: [detail-more-button, drawer, single-select, multi-select, select, popover]
usage:
  - Library list rows — ⋯ | /?page=Albums
  - Orders — row actions | /?page=Orders
  - Topbar — account | /?page=Home
contract:
  - "[sheet] **The app `DropdownMenu` is already a bottom sheet below 768** — use it for simple ⋯ lists rather than building one. Put the trigger on a real `Button` via `render`, and never use `CheckboxItem` / `RadioItem` / `Sub*` in a menu that can render below 768: they have no sheet counterpart."
---

`DropdownMenu` is the app's action menu — the list behind a card's "…", a
song row's "…", the share button and the toolbar pickers. It is one component
with two presentations: an anchored popup from 768 up and a bottom sheet
below, chosen by `useIsMobile()`, so a call site writes the items once and
never picks the surface.

## Anatomy

```tsx
<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
    <MoreHorizontal />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" sideOffset={6}>
    <DropdownMenuLabel>My account</DropdownMenuLabel>
    <DropdownMenuItem><User />Profile</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive"><Trash2 />Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Fifteen parts are exported; five of them know about the sheet. The rest are
thin wrappers over `@base-ui/react/menu` and exist only for the popup.

| Part | Popup (≥ 768) | Sheet (< 768) |
|---|---|---|
| `DropdownMenu` | `MenuPrimitive.Root` | `Sheet` with `swipeDirection="down"`; `open` / `onOpenChange` / `defaultOpen` pass through |
| `DropdownMenuTrigger` | `MenuPrimitive.Trigger` | `SheetTrigger` — the same `render` prop works on both |
| `DropdownMenuContent` | portal → positioner → popup | `SheetContent side="bottom"` with no ✕, a drag handle and an `sr-only` "Actions" title |
| `DropdownMenuItem` | `MenuPrimitive.Item` | a `SheetClose` button — tapping runs `onClick` and closes the sheet |
| `DropdownMenuLabel` | `px-2.5 py-1.5 text-xsmall text-muted-foreground` | `px-3 pt-2 pb-1`, same type |
| `DropdownMenuSeparator` | `-mx-1 my-1 h-px bg-border` | `my-1 h-px bg-border` (no bleed — the sheet has its own `px-2`) |
| `DropdownMenuGroup`, `…CheckboxItem`, `…RadioGroup`, `…RadioItem`, `…Sub`, `…SubTrigger`, `…SubContent`, `…Shortcut`, `…Portal` | base-ui parts | **no sheet equivalent** — see Open questions |

The mode travels down a `MenuModeContext` (`"dropdown" | "sheet"`) that the
root sets, so a part deep in `children` knows which surface it is in without
a prop. That is why the items can be the same JSX on both: nothing in
`DetailMenuItems` or `AlbumCardMenuItems` mentions the window.

## Two presentations, one gate

```tsx
const mobile = useIsMobile()      // (max-width: 767px), or the window chip in the frame
if (mobile) return <Sheet swipeDirection="down">…</Sheet>
return <MenuPrimitive.Root>…</MenuPrimitive.Root>
```

The gate is the **window**, at the 768 presentation step, never a `hover:`
media query — the reasons are in [`responsive.md`](responsive.md) (headless
previews and hybrid laptops both report `hover: hover` at phone width). A
popup ⇄ sheet swap is a different component, which is exactly what the 768
gate is for; 608 (the chrome gate) plays no part. Inside the design-system
frame `useIsMobile()` reads the window chip, so a "375" frame opens the
sheet — portaled to the real browser window, full width — and "768" opens the
popup.

## The popup

`DropdownMenuContent` mounts a `keepMounted` portal, a positioner with
`align="start"`, `side="bottom"`, `sideOffset={4}` (the "…" call sites pass
`align="end" sideOffset={6}`: `song-list-item.tsx:478`,
`cover-card-menu.tsx:142`), and the popup itself. The popup's class list is
exported as `dropdownMenuSurfaceClass` so the Detail Menu frame can draw the
surface open and inline without a Menu root — the live popup uses the same
string, so the two cannot drift.

| Property | Class | Why |
|---|---|---|
| Width | `min-w-44 w-max` | 176px floor, otherwise as wide as the longest item; it does not follow the trigger the way `Select`'s popup does |
| Height | `max-h-(--available-height) overflow-y-auto` | base-ui measures the room to the viewport edge |
| Surface | `rounded-xl bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10` | the same card as `Select` and `Combobox`; a ring, not a border, so it adds no width |
| Motion | `data-open:animate-in fade-in-0 zoom-in-95 duration-100` + an 8px `slide-in-from-*` per `data-[side=…]` | 100ms — attached, not presented; there is no `data-closed` exit, it disappears at once |
| Row state | `state-fade` on every item, sub-trigger and checkbox/radio item | the app's shared hover/focus timing, so a menu row settles like a nav row rather than snapping |
| Stacking | `isolate z-50` on positioner and popup | the layer every portalled popup in the app shares |

The popup stops `pointerdown`, `pointerup` and `click` from bubbling
(`dropdown-menu.tsx:118–120`). React bubbles synthetic events through the
**component** tree, portal or not, so without this a tap on an item would
reach the card underneath and fire its tap-to-open.

An item is `dropdownMenuItemClass`: `flex items-center gap-2 rounded-lg px-2.5
py-1.5 text-base font-normal`, highlight `focus:bg-accent
focus:text-accent-foreground` (base-ui moves DOM focus to the highlighted
item, so pointer and keyboard share one state), `data-inset:pl-8` to align a
label under items that carry an icon, and `variant="destructive"` →
`text-destructive` with a `bg-destructive/10` highlight. Any svg inside is
16px (`[&_svg:not([class*='size-'])]:size-4`), so `<User />` needs no class.

```text
py-1.5              12px
text-base line      21px × 1.5 (preflight default) = 31.5px
popup row           ≈ 43.5px
```

Checkbox and radio items reserve `pr-8` for a ✓ pinned `absolute right-2`,
the same asymmetry as `SelectItem`. A submenu opens `side="right"` with
`alignOffset={-3}` so its first row lines up with the parent row, and is
`min-w-[96px] rounded-lg shadow-lg`. `DropdownMenuShortcut` is `ml-auto
text-xsmall tracking-widest text-muted-foreground`.

## The sheet

Below 768 `DropdownMenuContent` is a `SheetContent side="bottom"` (the base-ui
Drawer — see `drawer`): pinned `inset-x-0 bottom-0 w-dvw`, slides in from the
bottom, swipe **down** to dismiss (`swipeDirection="down"` set on the root, as
`sheet.tsx:31–33` asks).

```tsx
<SheetContent side="bottom" showCloseButton={false}
  className="rounded-t-[28px] px-2 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] max-h-[80vh]">
  <SheetGrabber className="mx-auto mb-2" />                                    {/* drag handle */}
  <SheetTitle className="sr-only">Actions</SheetTitle>
  <div className="flex flex-col overflow-y-auto">{children}</div>
</SheetContent>
```

- **No ✕.** The handle (4 × 36px, `bg-border`) says "drag me"; a row tap
  closes the sheet anyway. It is `SheetGrabber` now rather than the same six
  classes written out here and in `detail-more-button.tsx` — see
  [Drawer](drawer.md).
- **A row must not repaint the controls inside it.** The mobile row painted
  every descendant `svg` `text-muted-foreground` (`[&_svg]`), which reached
  into a nested `Checkbox` and turned its tick dark **on the blue fill**.
  Scoped to direct children (`[&>svg]`), so the row still styles its own leading
  icon and leaves a control's own parts alone. Measured after: tick
  `oklch(0.9816 0.0131 111.4)` on `rgb(30 52 216)`. `pb-[max(12px, env(safe-area-inset-bottom))]`
  keeps the last row above the home indicator, which is why
  `viewport-fit=cover` is mandatory in the viewport meta — without it the
  `env()` is 0 and the pad is the 12px floor alone.
- **Rows are tap targets.** `flex w-full items-center gap-3 rounded-xl px-3
  py-3 text-base`, glyphs at `size-5` in `text-muted-foreground`, `active:`
  and `focus-visible:` fill `bg-muted`; hover fills only under
  `[@media(hover:hover)]` so a tap leaves no sticky highlight.
  `variant="destructive"` turns text and glyph `text-destructive`.

```text
py-3                24px
text-base line      31.5px
sheet row           ≈ 55.5px  (≥ 44)
```

The 12px-class gutter of every phone sheet is here as `px-2` on the content
plus `px-3` on a row: a glyph sits 20px from the screen edge. The
cross-cutting sheet rules (`svh`, `--kb`, `viewport-fit`) live in
[`dialog.md`](dialog.md); this sheet holds no field, so the keyboard budget
never applies to it.

## Usage

```tsx
// A "…" on a row or card — the most common shape in the app.
<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
    <MoreHorizontal />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" sideOffset={6}>
    <AlbumCardMenuItems … />          {/* items only — shared with the detail page */}
  </DropdownMenuContent>
</DropdownMenu>

// A labelled trigger — `render` puts the menu on a real Button.
<DropdownMenuTrigger render={<Button variant="outline" />}>
  Sort by <ChevronDown className="[[aria-expanded=true]_&]:rotate-180" />
</DropdownMenuTrigger>
```

Use `render`, not `className={buttonVariants(…)}`: the trigger then *is* a
`Button`, with its icon sizing and focus ring, and the same `render` works
when the trigger becomes a `SheetTrigger`. The chevron reads its rotation off
`aria-expanded`, which both primitives set.

Items are shared, not copied: a media object has exactly one menu, built by
`useDetailActions()` and rendered as `DetailMenuItems` / `SongMenuItems`
inside this content (see [`detail-more-button.md`](detail-more-button.md)).
The toolbar pickers (`SingleSelect`, `MultiSelect`) are this menu with a
`Button` or `filterTriggerCls` trigger.

## Sizing

Reads the **window** once, at **768** — presentation only. Above it the popup
is intrinsic (`min-w-44 w-max`) and needs no column; below it the sheet is
the window's full width. There are no other steps, and the menu never
measures its column or its own box.

## Behaviour

- **Popup:** base-ui `Menu` — opens on trigger click, arrow keys move the
  highlight, typeahead by first letter (`MenuRoot.js` mounts
  `useTypeahead`), Escape and outside click close; an item closes the menu
  on select unless `closeOnClick={false}` (`MenuItem.d.ts:43`).
- **Sheet:** the Drawer — opens on trigger click, closes on row tap
  (`SheetClose`), backdrop tap, Escape, or a downward swipe; focus is trapped
  inside while open.
- `open` / `onOpenChange` control either surface; `defaultOpen` works on both.
- Nothing here touches a store; the items do (Save, queue, share), and they
  are documented with the Detail Menu.

## Open questions

- Below 768 `DropdownMenuGroup`, `…CheckboxItem`, `…RadioGroup`, `…RadioItem`,
  `…Sub`, `…SubTrigger`, `…SubContent` render `MenuPrimitive.*` parts under a
  `Sheet` root; base-ui 1.3.0 throws "Menu parts must be placed within
  <Menu.Root>" (`MenuRootContext.js:18`). No app call site uses them today
  (`MultiSelect` puts a `Checkbox` inside a plain item instead), so the crash
  is latent — but the API promises parts that only half the window range can
  render.
- In sheet mode `DropdownMenuItem` spreads nothing but `onClick`, `disabled`
  and `className` onto its button (`dropdown-menu.tsx:174–190`); any other
  prop — `aria-label`, `data-*`, base-ui's `closeOnClick` — is silently
  dropped below 768 and honoured above it.
- `max-h-[80vh]` on the sheet (`dropdown-menu.tsx:92`) · the phone-sheet rule
  in `dialog.md` is `svh`, not `vh`, because `vh` is the *large* viewport on
  iOS and can exceed what is visible with the toolbar shown.
- DESIGN_SYSTEM.md's "Context Menu" section (`w-64 … border border-border
  py-1 shadow-lg`) describes `context-menu.tsx` — the sidebar's hover flyout,
  a styled surface with no behaviour — not this menu's `min-w-44 p-1
  shadow-md ring-1`. Two menu chromes, one named "context menu" in the doc
  and "DropdownMenu" everywhere in code; the sidebar flyout has no
  design-system section of its own.
- The popup animates in (`data-open:animate-in`) but has no `data-closed`
  rule, so it vanishes instantly; the sheet animates both ways. Intentional?
- The design-system section (`home.tsx:2913–2933`) rendered the same menu
  under four button variants — a demonstration of `Button`, not of the menu —
  and passed `className={buttonVariants({ variant })}` where the app passes
  `render={<Button …/>}`. Dropped; the frame shows one labelled trigger and
  one "…".
