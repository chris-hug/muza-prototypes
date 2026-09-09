---
title: Accordion
source: src/components/ui/accordion.tsx
related: [collapsible, separator]
usage:
  - nothing yet — no view groups content this way
---

`Accordion` is a stack of headed sections, divided by hairlines, each
opening under its heading with a turning chevron — an FAQ, a settings page's
optional groups. One at a time by default; several with `multiple`. For a
single region, use a [Collapsible](collapsible.md).

## Anatomy

```tsx
<Accordion>
  <AccordionItem value="payments">
    <AccordionTrigger>How do I get paid?</AccordionTrigger>
    <AccordionPanel>Payouts arrive in your wallet on every sale.</AccordionPanel>
  </AccordionItem>
</Accordion>
```

Four parts over `@base-ui/react/accordion`:

| Part | Own classes | Why |
|---|---|---|
| `Accordion` | `flex flex-col divide-y divide-border` | the hairlines come from the list, one declaration for all — never a `Separator` per item |
| `AccordionItem` | `py-1` | 4px above and below each section so the rule sits clear of the heading |
| `AccordionTrigger` | `group flex w-full items-center justify-between gap-3 py-3 text-left text-small font-medium text-foreground hover:text-foreground/80 focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm`, wrapped in base-ui's `Header` (an `h3`) | the full row is the target — the whole heading, not the chevron, opens it. Focus is a control's ring here, unlike `CollapsibleTrigger`'s underline: a row is a control |
| the chevron | `ChevronDown size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180` | rendered by the trigger, after `children` — a call site never adds one |
| `AccordionPanel` | `overflow-hidden text-small text-muted-foreground transition-[height] duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0`, children inside a `pb-3 pt-0` div | the body is muted — the heading is the ink; `pb-3` matches the trigger's `py-3` so open sections keep one rhythm |

```text
row height     py-3 (24) + text-small line (19 × 1.5 ≈ 28.5) ≈ 52px
+ item py-1    ≈ 60px per closed section, rule to rule
```

## Usage

```tsx
<Accordion defaultValue={["payments"]}>…</Accordion>     // one open at start
<Accordion multiple>…</Accordion>                         // several may stay open
```

`value` / `defaultValue` are **arrays** of item values (`AccordionRoot.d.ts:14`)
even when only one can be open. Nothing in the app renders an `Accordion`
today.

## Sizing

Fixed, no steps. Rows are as wide as their parent; the frame's `max-w-md`
is the call site's.

## Behaviour

- Click, Enter or Space on a trigger toggles its panel; **arrow keys** move
  between triggers, Home / End to the first and last (base-ui).
- **Single-open is the default**: base-ui 1.3's `multiple` prop defaults to
  `false` (`AccordionRoot.js:40`), so opening one section closes the other.
- The panel is unmounted while closed unless `keepMounted`.
- Height animation: the same caveat as the Collapsible — see Open questions.

## Open questions

- `accordion.tsx:11–12` says "set `openMultiple={false}` on Root to make only
  one section open at a time; default allows multiple" · base-ui 1.3 has no
  `openMultiple` — the prop is **`multiple`**, and it defaults to `false`
  (`AccordionRoot.d.ts:73–76`, `AccordionRoot.js:40`). The comment is wrong
  on both the name and the default; `openMultiple` would be a type error.
- The panel's `transition-[height]` does not run: base-ui sets only the
  `--accordion-panel-height` custom property and the element stays `height:
  auto`, so the section snaps open. Identical to the [Collapsible](collapsible.md)
  finding; the fix is the same one class.
- No call site in `src` or `app`. The old page demo's FAQ copy is kept in
  the frame as the only example of its intended use.
