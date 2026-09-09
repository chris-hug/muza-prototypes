---
title: Status Badge
source: src/components/ui/status-badge.tsx
related: [badge, order-status-badge, menu, media-header]
usage:
  - Studio › Music visibility column | /?page=Music
---

`StatusBadge` is a release's visibility — Public or Private — as a glass
badge that is also its own dropdown: click it and a two-row menu lets the
owner flip the state in place. It sits in the Studio's music table and on an
owned album's `MediaHeader` meta line.

## Anatomy

The badge is a Base UI `Menu.Trigger` (`data-slot="status-badge"`), so the
whole label is the button:

```text
[ globe  Public  ⌄ ]      public  → Globe
[ lock   Private ⌄ ]      private → Lock
```

| Part | Classes | Why |
|---|---|---|
| Trigger | `rounded-sm border border-border backdrop-blur-[8px] bg-background/50 text-muted-foreground pt-[4px] pb-[6px] px-[6px] text-2xsmall font-normal leading-none` | the `Badge` `outline` glass, so it reads as a status label first and a control second |
| Hover | `hover:border-foreground/40 hover:bg-muted hover:text-foreground` | the same lift Button `outline` gives (that one is `/30`) — the badge says it is clickable only when asked |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring/50` | keyboard focus; a 2px ring, where Button draws 3px |
| Glyph | `[&>svg]:size-3` | the 12px slot every badge has |
| Chevron | `ChevronDown` at `opacity-80`, `[[aria-expanded=true]_&]:rotate-180` in 200ms | says "this opens"; flips while open |
| Popup | `min-w-[7rem] rounded-xl border border-border bg-popover p-1 shadow-md`, `data-open:animate-in fade-in-0 zoom-in-95` | the app's menu surface, hand-built here on `MenuPrimitive` rather than `DropdownMenu` |
| Item | `rounded-lg px-2.5 py-1.5 text-xsmall`, `data-highlighted:bg-accent`, the status glyph, and a `Check` in `text-primary-text` on the current row | the current state is marked, not hidden |

The label and glyph come from `status`; the caller never passes text. The
popup is `keepMounted`, so the menu exists in the DOM closed and opens
without a mount.

## Usage

```tsx
// Controlled — the Studio table and MediaHeader.
<StatusBadge status={visibility} onStatusChange={setVisibility} />

// Read-only — the Studio's mobile row: no handler, the menu still opens but
// picking a row changes nothing.
<StatusBadge status={status} />
```

`onStatusChange` receives the picked key (`"public" | "private"`), including
the one already current. It is optional: without it the badge still opens its
menu (see the open questions).

## Sizing

Fixed, no steps. `w-fit shrink-0 whitespace-nowrap`; the popup is anchored
`bottom` / `start` with a 4px offset and is a `min-w-[7rem]` box.

## Behaviour

- Click or Space / Enter opens the menu; arrow keys move between the two
  rows; Escape closes. Base UI's `Menu` handles all of it.
- Picking a row calls `onStatusChange(key)` and closes.
- It is a menu, not a `Select`: no form value, no `name`.

## Open questions

- status-badge.tsx:19 "visually mirrors the base Badge's outline variant" ·
  the box differs: Badge `square` is a fixed `h-[26px]` (badge.tsx:83),
  StatusBadge is padding-derived — 1 + 4 + 15 + 6 + 1 = 27px — so beside a
  `ContentTypeBadge` in the Studio mobile row (studio-music.tsx:560–561) it
  is 1px taller.
- status-badge.tsx:44 draws a `ring-2` focus ring; Button and the form
  controls draw `ring-3`. Not recorded whether the thinner ring is deliberate
  for a 27px control.
- The menu opens even with no `onStatusChange` (studio-music.tsx:561 renders
  it read-only) · `OrderStatusBadge` renders a plain `Badge` in that case.
  Whether a handlerless StatusBadge should be inert is not recorded.
- DESIGN_SYSTEM.md's former `<StatusBadge>` entry (now this file) said
  `backdrop-blur-sm` and `border-[0.5px] border-neutral-500` · the source is
  `backdrop-blur-[8px]` and `border border-border` (status-badge.tsx:39–40).
  The source is taken as the rule.

## The menu it opens

`StatusBadge` uses the project's `DropdownMenu`, not Base UI's `Menu` directly,
and that is the whole point of the wrapper: below the presentation gate it
swaps the popup for a bottom sheet with big tappable rows.

It talked to the primitive until recently, which made it the one menu in the
app that behaved differently from all the others — on a phone it opened a 7rem
dropdown with 1.5-line rows, a desktop menu on a touch screen. Reach for
`DropdownMenu` unless a component owns a **value** (see
[Select](select.md), which cannot swap its root for that reason).
