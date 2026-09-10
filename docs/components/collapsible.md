---
title: Collapsible
source: src/components/ui/collapsible.tsx
related: [accordion]
usage:
  - nothing yet — Orders expands a row with aria-expanded and its own state instead
---

`Collapsible` is one region that opens and closes under a text-link
trigger — "Show advanced options", "More…", an optional group of fields.
It is the building block an [Accordion](accordion.md) stacks; use the
Accordion the moment there is more than one.

## Anatomy

```tsx
<Collapsible>
  <CollapsibleTrigger>Show advanced options</CollapsibleTrigger>
  <CollapsiblePanel>…</CollapsiblePanel>
</Collapsible>
```

Three parts over `@base-ui/react/collapsible`:

| Part | Own classes | Why |
|---|---|---|
| `Collapsible` | — (the root, re-exported) | |
| `CollapsibleTrigger` | `appearance-none border-0 bg-transparent cursor-pointer p-0` then `inline-flex items-center gap-1.5 text-small text-foreground hover:text-foreground/80 outline-none focus-visible:underline underline-offset-3` — still the native decoration, not `link-underline`: this trigger underlines only on keyboard focus, never on hover | reset the native `<button>` first — UA defaults can leak a hairline border. Then a **link**, not a button: it reads as "show more" in running text, so focus is an underline, not the ring a control gets (`collapsible.tsx:30–34`) |
| `CollapsiblePanel` | `overflow-hidden transition-[height] duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0` | meant to animate height — see Open questions |

The panel is otherwise **bare**: no surface, no padding, no type. The call
site owns what is inside it (the frame's demo uses a `rounded-lg bg-muted
p-4` card, `mt-3` under the trigger).

The trigger exposes `data-panel-open` while open (`CollapsibleTriggerDataAttributes.js:11`),
so a chevron inside it can turn with
`group-data-[panel-open]:rotate-180` on a `group` trigger.

## Usage

```tsx
<Collapsible open={showMore} onOpenChange={setShowMore}>
  <CollapsibleTrigger className="group">
    Show advanced options
    <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
  </CollapsibleTrigger>
  <CollapsiblePanel>…</CollapsiblePanel>
</Collapsible>
```

Uncontrolled by default (`defaultOpen`); pass `open` + `onOpenChange` when
another control needs to know.

## Sizing

Fixed, no steps. The panel is as wide as its parent.

## Behaviour

- Click, Enter or Space on the trigger toggles; `aria-expanded` and
  `aria-controls` are base-ui's.
- The panel is **unmounted** while closed unless `keepMounted`; pass
  `hiddenUntilFound` for content the browser's find-in-page should reach.
- Height animation: see below.

## Open questions

- The panel's `transition-[height]` never runs. base-ui only sets a
  `--collapsible-panel-height` custom property on the panel
  (`CollapsiblePanel.js:126`); the element's own `height` stays `auto`, and
  CSS does not interpolate `0 → auto`. So the panel snaps open and closed —
  which `collapsible.tsx:50–53` admits ("for simplicity we just toggle
  visibility"). Making it animate is one class:
  `h-[var(--collapsible-panel-height)]` on the open state.
- The one collapsible in the app — the sidebar's nav groups
  (`sidebar.tsx:346–357`) — uses base-ui's `Collapsible` **directly**, not
  this wrapper, and animates with a `grid-template-rows: 0fr → 1fr`
  transition (`.sidebar-panel`, `app.css:643–653`). Two collapsibles, one of
  which animates. The grid trick is the simpler one and could become the
  wrapper's panel.
- The old page demo put a `<span>` inside the trigger and no chevron; the
  frame adds the chevron. Whether the trigger should render one itself,
  as `AccordionTrigger` does, is not decided.
