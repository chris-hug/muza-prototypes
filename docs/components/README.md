# Component docs — the single source of truth

One Markdown file per component, named after its design-system section id
(`dialog.md` → the `#dialog` section). Nothing in here is duplicated
anywhere else: the design-system page reads these files at build time and
renders them in the component's info modal, so prose lives in exactly one
place and an agent can read the same file directly.

## Format

```markdown
---
title: Dialog
status: updated          # new | updated | concept — optional
source: src/components/ui/dialog.tsx
related: [toast, drawer] # other section ids — optional
---

Lead paragraph. One or two sentences on what the component is FOR.

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
- Headings are `##` and `###` only — `#` is the title in the frontmatter.
- Code fences are `tsx` for usage, `css` for tokens, `text` for arithmetic.

## Who reads this

| Reader | How |
|---|---|
| The design-system page | `component-docs.ts` globs these files and renders the info modal |
| An agent | reads the file directly — it is plain Markdown in the repo |
| A developer | the GitHub link on each section header points here |

`DESIGN_SYSTEM.md` keeps the cross-cutting rules (tokens, typography,
responsive gating). Anything specific to ONE component belongs here.
