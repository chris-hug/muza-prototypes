---
title: Responsive
status: updated
source: src/lib/use-media-query.ts
related: [dialog, card-rail, mobile-header]
---

Muza has **its own breakpoints**, and they are not Tailwind's. The generic
scale (`sm` 640, `md` 768, `lg` 1024, `xl` 1280) is still used inside class
names, but almost nothing about the page layout changes at those widths. The
widths where something actually changes are these five — and two of them are
*calculated*, not chosen.

## The ladder

| Name | px | What changes at this width | Defined in |
|---|---|---|---|
| **Phone** | 375 | Nothing switches here — it is the reference phone (iPhone 12 mini / SE class), the narrowest width this app is tested at | — |
| **Phone wide** | 584 | Page gutter `--page-px` 12 → 24px | `app.css` |
| **Tablet** | 608 | Sidebar replaces the footer tab bar; `Topbar` replaces `MobileAppHeader` | `FOOTER_NAV_BELOW` |
| **Tablet wide** | 768 | `useIsMobile()` flips — components swap outright (dropdown ⇄ bottom sheet, inline toggle ⇄ header toggle) | `useIsMobile()` |
| **Desktop** | 1069 | Sidebar expands from the icon rail; page gutter 24 → 40px | `SIDEBAR_COLLAPSE_BELOW` |

The names describe **width bands, not devices**. A 1024px tablet held sideways
is "Desktop" here, and that is correct: what matters is how much room the
layout has, never what the hardware is called.

## Two of them are arithmetic

`608` and `1069` are not taste. They are the viewport widths at which a
*container* threshold is reached, so they must be recomputed if anything in
that chain moves — which is why they are exported constants and not literals:

```text
Tablet   608 = 560 (MediaHeader stacks)     + 2 × 24 (gutter in that band)
Desktop 1069 = 780 (MediaHeader full)  + 208 (sidebar) + 80 (px-10 × 2) + 1 (border)
```

Both live in [`use-media-query.ts`](src/lib/use-media-query.ts) as
`FOOTER_NAV_BELOW` and `SIDEBAR_COLLAPSE_BELOW`, with the arithmetic in the
comment above each. Never write `608` or `1069` into a component.

## The other ladder: container columns

Card grids and rails do not step on viewport width at all — they step on
their own **container** width, so a rail inside a narrow column behaves like
a rail on a narrow phone:

```text
304 → 2 columns · 464 → 3 · 692 → 4 · 928 → 5 · 1164 → 6 · 1500 → 7
```

Plus two container thresholds inside components: **560** (MediaHeader stacks,
rails switch to swipe-peek) and **780** (MediaHeader shows its full action
cluster).

The base declaration under a container-query ladder must be a **real layout**,
not the ladder's bottom rung — it is what renders in engines without container
queries, and what a 320px phone gets. `.grid-cards` learned this the hard way:
its base was `repeat(1, minmax(143px, 220px))`, which on a 296px-wide viewport
produced one stretched column with a field of empty space beside it.

### Measuring a container query

A container query measures the container's **content box**. Padding on the
`@container` element therefore shrinks what everything inside it reads: the
design system's demo frame carried `p-6` on its stage, so at the 584 rung a
rail saw 536 and stayed in its below-560 layout while the chip said 584. Put
the padding on a child, and keep the `@container` at the width it claims.

## Gutter

`--page-px` is one knob, applied with the `px-page` utility — never `px-10`:

| Viewport | Gutter |
|---|---|
| ≥ 1069 | 40px |
| 584–1068 | 24px |
| < 584 | 12px |

A bottom sheet uses the same 12px at phone width. It spans the whole screen,
so a 24px gutter would cost 48px of a 320–375px width — enough to visibly
squeeze list rows.

## Pointer, not width

Hover is pointer-only: every `hover:` / `group-hover:` utility is auto-wrapped
in `@media (hover: hover)` by Tailwind v4, so hover states never fire on touch
and there is no sticky-hover after a tap.

- To merely **show/hide** a control by pointer:
  `[@media(hover:none)]:!hidden` / `[@media(hover:hover)]:!hidden`. The `!` is
  required — Tailwind v4 sorts pointer/hover variants *before* base
  `flex`/`hidden`, so without it the base wins and the gate is a silent no-op.
- To **swap a component**, gate on width (`useIsMobile()`), never on hover: the
  headless preview reports `hover: hover` at phone width, and hybrid
  touch-laptops do too — a hover-gated sheet would simply never appear.
