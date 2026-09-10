---
title: NavigationMenu
source: src/components/ui/navigation-menu.tsx
related: [menu, tabs, popover]
usage:
  - nothing — the sidebar and the footer nav are the product's navigation
---

`NavigationMenu` is a horizontal menubar with hover-aware panels — a row of
triggers that coordinate one popup and slide between contents, the
marketing-site "Products / Solutions / Resources" pattern. It is a primitive
in waiting: nothing in the prototype renders it, and it has no phone
presentation.

## Anatomy

Ten parts, all thin wrappers over `@base-ui/react/navigation-menu`:

| Part | Classes | Note |
|---|---|---|
| `NavigationMenu` | `relative` | the root |
| `NavigationMenuList` | `flex items-center gap-1` | the row of triggers |
| `NavigationMenuItem` | — | one trigger + its content |
| `NavigationMenuTrigger` | `inline-flex items-center gap-1 h-9 px-3 rounded-full text-small font-medium text-foreground hover:bg-muted`, `focus-ring` | appends a `ChevronDown` at `size-3.5 text-muted-foreground` |
| `NavigationMenuContent` | `p-4 outline-none` | the panel body; lay out links inside it yourself |
| `NavigationMenuLink` | `block rounded-lg px-3 py-2 text-small text-foreground hover:bg-muted` | the same focus ring as the trigger |
| `NavigationMenuPortal` / `NavigationMenuPositioner` | positioner `z-50 outline-none`, `sideOffset={6}` | |
| `NavigationMenuPopup` | `rounded-xl border border-border bg-popover text-popover-foreground shadow-md min-w-[280px]`, `data-open:animate-in fade-in-0 zoom-in-95 duration-150` | a border, where `DropdownMenu` uses a ring |
| `NavigationMenuViewport` | `relative` | where base-ui portals each item's content |

The trigger is a 36px pill (`h-9`) in `text-small font-medium` — a step
lighter than a `Button` and a step heavier than a link, because it is both:
it navigates on click and opens on hover. Links inside the panel are
`text-small` at `font-normal`; the difference in weight is the whole hierarchy.

## How it differs from `DropdownMenu`

- **Coordinated, not per-trigger.** One popup serves the row; hovering from
  "Discover" to "Studio" keeps it open and swaps the content, where two
  `DropdownMenu`s would close and reopen.
- **Hover opens it.** `DropdownMenu` opens on click only.
- **Not window-gated.** There is no `useIsMobile()` here: below 768 it is the
  same hover popup, while every `DropdownMenu` becomes a sheet
  ([`responsive.md`](responsive.md)). Acceptable only while nothing uses it.

## Usage

```tsx
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Discover</NavigationMenuTrigger>
      <NavigationMenuPortal>
        <NavigationMenuPositioner>
          <NavigationMenuPopup>
            <NavigationMenuViewport>
              <NavigationMenuContent>
                <div className="grid grid-cols-2 gap-1 min-w-[320px]">
                  <NavigationMenuLink href="#">New releases</NavigationMenuLink>
                  …
                </div>
              </NavigationMenuContent>
            </NavigationMenuViewport>
          </NavigationMenuPopup>
        </NavigationMenuPositioner>
      </NavigationMenuPortal>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

This is the tree the design-system page has always rendered — a portal per
item, with the content inside the viewport. See the open questions before
copying it into a product surface.

## Sizing

Fixed, no steps. The row is as wide as its triggers; the popup is at least
280px (`min-w-[280px]`) and otherwise as wide as the content you put in it.

## Behaviour

- Hover or focus a trigger to open; base-ui's own open and close delays
  apply (nothing is overridden here). Moving the pointer between triggers
  keeps the popup open and animates the content across.
- Click on a trigger toggles its panel (`NavigationMenuTrigger.js:518`,
  `onClick: handleOpenEvent`); Escape closes; Tab moves into the panel's
  links.
- No exit animation: only `data-open:` rules exist on the popup.

## Open questions

- The trigger's chevron is `group-data-[popup-open]:rotate-180`
  (`navigation-menu.tsx:64`) · base-ui sets `data-popup-open` on the
  **trigger itself** (`NavigationMenuTriggerDataAttributes.d.ts:5`) and the
  trigger carries no `group` class, so the variant has no ancestor to match
  and the chevron never rotates. `data-popup-open:rotate-180` on the same
  element, or `[[data-popup-open]_&]`, is what was meant.
- The tree nests a `Portal → Positioner → Popup → Viewport` inside **each**
  `NavigationMenuItem` (`home.tsx:3052–3069, 3073–3088`, now
  `navigationmenu-basic.tsx`) · base-ui's content portals into the
  registered viewport (`NavigationMenuContent.js:130, 151`), which is one per
  root. Whether two viewports under one root behave as one popup or as two is
  untested — the page has never been reviewed at that level. If this
  component is ever used, build the documented anatomy (one portal at root
  level, contents inside the items) and compare.
- Not window-gated (see above): it is the only menu in the app that stays a
  hover popup on a phone. A `useIsMobile()` sheet like `DropdownMenu`'s, or a
  note that it is desktop-only, is owed before first use.
- The popup uses `border border-border` while `DropdownMenu`, `Select` and
  `Combobox` popups use `ring-1 ring-foreground/10`; `DatePicker` uses both.
  Three edges for one family of surfaces.
