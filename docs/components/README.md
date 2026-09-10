# Component docs — the single source of truth

One Markdown file per component, named after its design-system section id
(`dialog.md` → the `#dialog` section). Nothing in here is duplicated
anywhere else: the design-system page reads these files at build time and
renders them, so prose lives in exactly one place and an agent can read the
same file directly.

How the whole arrangement fits together — generated blocks, the three checks,
what only a reader can catch — is [`DOCUMENTATION.md`](../../DOCUMENTATION.md).

The procedure for writing or revising one of these — where to gather from,
what else has to move with it, and how the section is wired — is
[`COMPONENT_DOC_PASS.md`](../../COMPONENT_DOC_PASS.md) at the repo root.

## Every component has five outputs, from one source

| Output | Where it comes from |
|---|---|
| **"Used in:" links** under the section title | the frontmatter's `usage` list — `Label \| href` per line. An entry with no `\| href` renders as plain text, so a component nothing uses still answers the question. **Never leave it out**: an absent line reads as forgotten. Do not pass the `usage` prop in the page |
| **Section intro** on the design-system page | the doc's **lead** — its first paragraph — rendered automatically by `Section` (`home.tsx`). Do not write an intro paragraph in the page. |
| **Summary lines** under the intro | the frontmatter's optional `summary` list, one line each, Markdown-inline. Only for a section that is a **rule the page is measured against** rather than a component you can look at — Responsive has one, almost nothing else should. It exists so that "the page needs three more lines here" never again means typing them into `home.tsx` |
| **ⓘ modal** | the whole doc (`component-docs.ts` globs `docs/components/*.md`) |
| **`</>` call site** | `src/ds-examples/<id>-basic.tsx` — a real usage, imported by the page twice: once as a component, once as raw text (`?raw`). Never a snippet typed beside the demo |
| **The frame** | `<Example doc="<id>" code={…} codePath="src/ds-examples/…">` — the live component at the picked **window** chip, chrome drawn around it |

So a component section in `home.tsx` is: `<Section id title>` →
one or more `<Example>` frames → nothing else. Not one line of its prose is
written there. Variant switches go in the
frame's `controls`; explanation goes in the doc.

## Format

```markdown
---
title: Dialog
status: updated          # new | updated | concept — optional
source: src/components/ui/dialog.tsx
related: [toast, drawer] # other section ids — optional
usage:                   # "Used in:" links — REQUIRED, one per line.
  - Add to playlist | /?page=Playlists     # a real surface
  - Upload music | /?page=Music
  # An entry with no `| href` renders as plain text — that is how a
  # component nothing uses still answers the question. Never omit the key:
  #   - nothing yet — no view has adopted it
summary:                 # OPTIONAL, and usually wrong. Three or four lines
  - **Window** — …       # rendered under the intro when the lead alone is not
  - **Column** — …       # enough to USE the section. A rule, not a component.
---

Lead paragraph. One or two sentences on what the component is FOR. This is
the section intro on the page — write it to be read there, without the
heading above it.

## A heading per topic

Prose. Fenced code blocks carry usage:

```tsx
<Dialog>…</Dialog>
```
```

Rules for the body:

- **Say why, not just what.** The class list is in the source; what the
  docs owe the reader is the reason it is that class list.
- **Every claim measurable.** "~200px left with the keyboard up on a 12
  mini in Brave" beats "not much room".
- **Gather, don't scatter.** Everything about the component that was in
  `DESIGN_SYSTEM.md`, in the page's own prose, or only in a source comment
  belongs here; those places keep a pointer or nothing.
- Headings are `##` and `###` only — `#` is the title in the frontmatter.
- Code fences are `tsx` for usage, `css` for tokens, `text` for arithmetic.

## Sections every doc carries

Not every heading applies to every component, but a doc answers each of
these where it does — in this order, so a reader knows where to look:

1. **Lead** — what it is for, where it is used.
2. **Anatomy / variants / states** — parts, props, sizes, the token each
   part wears (semantic tokens only — `bg-background`, `text-primary-text`;
   never hex, never `text-sm`).
3. **Usage** — the call site, one `tsx` block; the wrong way, when there is
   a common one.
4. **Sizing** — which of the three measures the component reads and at
   what steps: the **window** (`useIsMobile` 768 = presentation,
   `useFooterNav` 608 = chrome, Tailwind `md:`), the **column**
   (`@container` on the page shell — cards, rails, headers), or its own
   **box** (a named `@container/<name>` — only where the same window can
   hand it two widths). Say what changes at each step and why the number
   is what it is. See [`responsive.md`](responsive.md).
5. **Behaviour** — pointer vs touch, keyboard, focus, what it does to the
   store, what closes it.
6. **Open questions** — where a comment, the page and the source disagree,
   say so rather than picking one silently.

## The frame, per kind of component

| Kind | `Example` props |
|---|---|
| Column-filling (grids, rails, headers, lists, page sections) | window chips (default); `align="stretch"` |
| Intrinsic / centred (button, badge, input, card, dialog preview) | window chips (default); `align="center"` |
| Presentation-swapped, a sheet below 768 (dialog previews, menus, drawers, toasts) | `bleed={w => w < 768}` — at those chips the frame draws no gutters, no tab bar, no stage padding, and the demo touches the edges as a sheet does. Inside the frame the chip **is** the window (`WindowWidthContext`), so `useIsMobile()` follows it |
| Box-measuring (`SongListItem`, `PlayerBar`, `PlayerOverlay`) | `widths={…}` with the component's own steps and `widthLabel="row"` / `"bar"`; no chrome is drawn |

Two rules for what goes INTO the frame:

- **Respect the column.** A demo is `w-full` (or narrower) and never sets a
  fixed width above what the narrowest column offers (296px at a 320px
  window). The hatched gutter is the page's padding: nothing crosses it, and
  nothing adds a second padding, border or box of its own beside it. If a
  field gets clipped at the 375 chip, the demo is wrong, not the frame.
- **Only the component.** No trigger buttons, labels or wrappers that the
  app does not render around it. Triggers and variant switches go in the
  frame's `controls`; a toast frame shows the toast, not the button that
  opens one; a header frame shows the header, not a card around it.

## Who reads this

| Reader | How |
|---|---|
| The design-system page | `component-docs.ts` globs these files; `Section` renders the lead, the ⓘ renders the rest |
| An agent | reads the file directly — it is plain Markdown in the repo |
| A developer | the GitHub link on each section header points here |

`DESIGN_SYSTEM.md` keeps the cross-cutting rules (tokens, typography, the
width system, gestures). Anything specific to ONE component belongs here,
and `DESIGN_SYSTEM.md` points at it.
