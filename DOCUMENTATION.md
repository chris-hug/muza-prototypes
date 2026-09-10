# How documentation works here

Start here if you are about to write, move or delete anything in `docs/`,
`DESIGN_SYSTEM.md`, or a code comment that explains a decision.

This file is the **meta** one: what the pieces are, which of them is generated,
what is checked and what is not. The step-by-step procedure for documenting a
component is [`COMPONENT_DOC_PASS.md`](COMPONENT_DOC_PASS.md); this is the
arrangement that procedure operates inside.

---

## The four ways a doc goes wrong

They are genuinely different problems, which is why there is more than one
mechanism. Every one of these has happened in this repo.

| # | Failure | What it looks like | Why it survives an ordinary review |
|---|---|---|---|
| 1 | **Undocumented behaviour** | Cards gained a long press; the docs went on describing the version before it | Nothing in the doc is *wrong*. A reader cannot notice an absence |
| 2 | **A duplicated fact drifts** | `--kb`'s derivation written in two files; one goes two revisions stale | Both copies pass every grep, and both read as authoritative |
| 3 | **A rule is never promoted** | A "must" written into a page and never added to the system file | The generator only knows about rules that already carry a contract line |
| 4 | **A doc is confidently wrong** | "the bar is 44px" after it became 54 | Well-formed prose about a real thing. Only a reader who knows can tell |
| 5 | **The code ignores the rule** | The contract says "never a hardcoded hex" and three files have twenty | Every document is correct and agrees with every other. Nothing was looking at the app |

---

## The pieces

| Piece | Holds | Written by |
|---|---|---|
| `DESIGN_SYSTEM.md` | The system contract — tokens, colour, type, width, touch, sheets, menus. What another component must **obey** | Hand, **plus 7 generated blocks** |
| `docs/components/<id>.md` | One page per subject. The long account: what it is, how it behaves, why each rule exists, open questions | Hand |
| `COMPONENT_DOC_PASS.md` | The procedure: gather · reconcile · consolidate · sync · present, both grep lists, the eight touch questions | Hand |
| Code comments | Published through the `</>` panel on the design-system page, so a stale comment is a stale doc | Hand |
| `CHANGELOG.md` | What changed and when | Hand |

A page is inlined into the app at build time (`src/lib/component-docs.ts`), so
the ⓘ modal renders the same bytes you read on disk. There is no second copy
of a component's prose anywhere.

---

## What is generated, and why

`DESIGN_SYSTEM.md` used to state a rule briefly and link to the page that
explained it. That is still **two prose accounts of one fact**, and it drifted
within an hour of being written.

So the brief version is now the long version's frontmatter, projected. Each
rule lives once, as a tagged `contract:` line in the page that owns it:

```yaml
contract:
  - "[touch] **A drag is never a tap, and a press must be visible.** …"
  - "[width] **Name a box container.** …"
```

`npm run sync-docs` collects them into the marked blocks in
`DESIGN_SYSTEM.md`, each with a link back. **Never edit between the markers** —
edit the owning page and re-run.

Seven blocks today — `color`, `token`, `type`, `width`, `touch`, `menu`,
`sheet` — fed by eleven owner pages. A page may feed more than one block:
`responsive.md` owns both the width gates and the pointer gate.

### Which side does a number live on?

> A **derived** value (28 = a 20px pill plus an 8px inset; 54 = 8 + 40 + 6) is
> stated where it is derived, and nowhere else.
>
> A value that **is** the rule (44px of target; `lg` for a form action)
> belongs in the system file, and the pages may cite it.

"One account per fact" was the earlier version of this and was too vague to
follow — including by the person who wrote it, an hour later.

### What is deliberately NOT generated

`## Icons` is one decision about one mark. The strict touch rules
(`touch-action`, never synthesise a tap from `pointerup`, snap `mandatory`,
nothing exceeds the viewport width) have no component that owns them. Both
stay hand-written, and both say so in place.

**A subject earns a page by being a subject** — never create one to satisfy
the script.

---

## The three checks

| Command | Answers | Gates | What it caught |
|---|---|---|---|
| `npm run doc-sweep` | (1) is every behaviour named? | **CI, ~8s** | `--sheet-drag-progress` in the code and in no doc; `rounded-t-[28px]` at five call sites, which moved into the component instead |
| `npm run sync-docs -- --check` | (2) has a duplicated fact drifted? | **CI** | Its own creation: `--kb` written twice, two revisions apart |
| `npm run doc-rules` | (3) did a rule get promoted? | **No — advisory** | 7 candidates, 3 real (footer margins, `swipeDirection` on the root, `user-scalable=no`) |
| `npm run conformance` | **(5) does the CODE obey the contract?** | **CI** | 4 violations on its first run: a sheet corner written at a call site, `h-dvh` on the side drawers, and two files with hardcoded card colours |

Failure (5) was the last one to get a check, and the most embarrassing to have
missed: the first three all compare documents with documents. `conformance`
reads the source and asks whether it does what the contract says. It found four
violations the day it was written — including one in `sheet.tsx`, which the
same day's own rule had been written about.

Failure (4) has no mechanism and cannot have one. It is the **reconcile** step
of the doc pass, and it needs somebody who knows what the number should be.

### Why `doc-rules` must not gate

About half of what it finds is not a rule — a prop's own requirement, prose
that happens to use "must", a component internal. **A check that is wrong half
the time teaches people to bypass it, and they take the honest gates with them
on the way past.** Its exit code is always 0, and its judgements live in a
`NOT_A_RULE` list with the reason written beside each one.

---

## When you change something

- **A component's behaviour** → run the doc pass. `doc-sweep` will tell you if
  you missed a shared utility; it will not tell you if you missed a paragraph.
- **A rule** → edit the `contract:` line in the owning page, then
  `npm run sync-docs`. CI fails if you forget the second half.
- **A number** → change it where it is derived. If you find yourself editing
  the same number in two files, one of them is wrong to have it.
- **Adding a rule to a page** → run `npm run doc-rules` and see whether it
  should be promoted to the contract.
- **A new subject** → a page, an entry in `BLOCKS` if it owns part of the
  contract, and a line in `doc-sweep`'s `ALIAS` if the file and the doc are
  named differently.

---

## Known debt

- `doc-sweep` carries a **baseline of ten** components documented before the
  check existed. That list is a to-do, not an exemption: delete a line, watch
  it stay green, and it has shrunk.
- Seven root files are ticket drafts and briefs from earlier phases
  (`COMPONENT_TICKETS.md`, `PAGE_TICKETS.md`, `CLICKUP_TICKETS*`,
  `FOUNDATION_TICKETS.md`, `BRIEF_*`). Nothing reads them, nothing checks
  them, and they look like documentation. The tickets live in ClickUp now.
- ~~`AGENTS.md` describes the wrong framework~~ — **fixed**. It had told every
  agent this was Next.js and to read `node_modules/next/dist/docs/`, a path
  that does not exist. It now describes the real stack and the checks.
- `.next/` is **823MB** of gitignored leftovers from the migration — 621MB of
  it Turbopack's persistent dev cache (three `.sst` tables account for 398MB),
  last written 9 April. `next` is not installed, so nothing can read it and
  nothing will regenerate it. It costs nothing in the repo and 823MB on disk:
  `rm -rf .next next-env.d.ts`.
