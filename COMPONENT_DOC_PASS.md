# The Component Doc Pass

How a Muza component is documented, and why the design-system page never
needs editing when the documentation changes.

This is the companion to [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): that file
holds the *system* — tokens, shared recipes, cross-component rules. This one
holds the *procedure* for a single component, and the wiring that makes the
design-system page a window onto the sources rather than a second copy of
them.

Component prose itself lives in `docs/components/<id>.md`, one file per
component. See [`docs/components/README.md`](docs/components/README.md) for
the index.

---

## One Markdown file per component is the single source of truth

`docs/components/<id>.md` is the only place a component's prose is written. The design-system page does not restate it — it **renders** it, in two places:

| Surface | What it renders | Where |
|---|---|---|
| "Used in:" links under the title | the frontmatter's **`usage`** list | `componentDoc(id).usage` |
| Summary lines under the intro (rare) | the frontmatter's **`summary`** list | `componentDoc(id).summary` |
| Section intro (the paragraph under the section title) | the doc's **lead** — its first non-heading paragraph | `home.tsx`, via `componentDoc(id).lead` |
| ⓘ info modal (section header, and each `Example` frame) | the doc's **whole body** | `Markdown source={entry.body}` |

Nothing a section says is typed on the page. The last hand-written piece was
`usage`, which lived as a `{label, href}` array in `home.tsx` until it moved
into the frontmatter — 45 sections' worth of links that no one would have
thought to revisit when a surface was renamed.

`src/lib/component-docs.ts` loads every `docs/components/*.md` with `import.meta.glob(..., { query: "?raw", eager: true })` and splits it into frontmatter, `lead` and `body`.

Frontmatter is a deliberately tiny subset of YAML — `key: value`, `key: [a, b]`, and a block list:

```yaml
---
title: Select
source: src/components/ui/select.tsx
related: [input, combobox, datepicker]
usage:
  - Orders › Order detail (carrier) | /?page=Orders
  - Upload music | /?page=Music
---
```

`summary` came later and needed no parser change, which is the point of collecting block lists generically. Use it only where a section is a RULE the rest of the page is measured against — Responsive carried four hand-written JSX bullets restating its own table until it got one. They were not stale, and that was luck: nothing kept them in step with `breakpoints.ts`.

`usage` is `Label | href` per line. A pipe rather than YAML mapping syntax, so a label can carry the `›` and `·` these lines are full of without quoting, and so the parser stays short. Block lists are parsed generically, so the next such field needs no new special case.

**The consequences, which are the point:**

- **Edit the `.md`, and both surfaces update by themselves.** They are coupled to it, so they can never fall out of date with it.
- **Never type component prose into `home.tsx`.** A paragraph written there is a second copy, and a second copy drifts — that is exactly how this codebase ended up with docs describing steps the code had removed.
- **The lead is load-bearing.** Only the FIRST paragraph becomes the section intro. A note appended as a second paragraph will show in the modal and not on the page. If something belongs in the intro, fold it into the opening paragraph.
- **A section with no `.md` shows no intro.** Write the doc to get one.
- The same file is what an agent reads. Prose exists once, for humans and machines alike.

## The `</>` panel is the FILE — so code comments are documentation

The third surface is the `</>` button on an `Example` frame. It does not show a snippet someone typed beside the demo; it shows the **call-site file itself**, imported with `import src from "@/ds-examples/<x>.tsx?raw"`, printed verbatim and linked to its GitHub blob. The component in the frame is likewise the **real** component, imported and rendered.

So the design-system page **renders**; the code lives in the repo and is maintained there. Change the file and every surface follows — the demo, the printed snippet and the GitHub link all move together, because they are the same file.

**This makes per-component code comments part of the documentation, not an aside.** Keep them current with the same care as the Markdown:

- The call-site file's own comments explain *why the demo is built this way* and travel with the snippet.
- A component file's header comment and inline notes are what the next reader (and the next agent) trusts. In this repo they have repeatedly been found **wrong** — describing steps the code had removed, class names it no longer used, arithmetic that no longer held. A stale comment is worse than none: it is documentation that lies with authority.
- `usageOf()` strips only the call site's leading `"use client"` and its head block comment from the panel, because the Markdown already covers that ground. Everything else in the file is printed as written — so a sloppy comment inside the file is published on the design-system page.

**The rule, in one line:** the Markdown carries the prose, the file carries the code and its comments, and the page is a window onto both. Update the source; never patch the window.

So "update the docs" means: **update the Markdown and the component's comments.** The page follows.

## The pass, step by step

The named procedure for documenting or re-documenting a component. Run it whenever a component changes, and in full when writing its `.md` for the first time.

**1 · Gather — from every source, not just the obvious one.**

A component's knowledge is scattered. Collect all of it before writing a line:

- the **component file** itself — header comment, inline notes, and the actual classes and constants;
- the **call-site file** in `src/ds-examples/`, whose comments explain the demo;
- **system-wide comments elsewhere**, which often hold the real rule: `app/app.css`, `src/lib/breakpoints.ts`, `src/lib/use-media-query.ts`, and sibling components that reference this one (a rail's rule is frequently written in the card's file, and vice versa);
- **`DESIGN_SYSTEM.md`** — token tables, shared recipes, cross-component patterns;
- the existing **`docs/components/<id>.md`**, and the ⓘ docs of related components;
- **tickets**, when intent is in question rather than behaviour.

**2 · Reconcile — the code wins, and mismatches are findings.**

Verify every class, number and prop against the source rather than trusting the prose around it. Where a comment, a doc or a ticket disagrees with the code, the code is what ships — but **report the mismatch instead of quietly overwriting it**. In this repo that step has repeatedly surfaced more wrong documentation than wrong code, and occasionally a real bug hiding behind a confident sentence.

Two failure modes, and the second is the one that hides:

- **Consistency** — does the doc contradict the code it already mentions?
- **Coverage** — does the doc describe every behaviour the component actually
  HAS? An undocumented behaviour is one nobody is checking. Motion is the
  weakest area, because animation ships faster than prose.

Coverage is mechanical enough to audit. Grep the component for the shared
utilities and check each against its doc.

**Motion and state:**

```
state-fade · state-fade-quick · press-ripple · card-sweep
link-underline · link-underline-group · focus-ring · focus-ring-within
invalid-ring · art-edge · page-enter · useTick · @container · animate-[…]
```

**Touch and pointer** — the second sweep, added after a touch pass shipped
behaviour that no doc described:

```
touch-target · data-pressing · useLongPress · useSheetDrag · useCoarsePointer
sheet-glass · SheetGrabber · disabled-solid · touch-callout · touch-action
--kb · data-kb · --sheet-bar-h · --sheet-band-h · --sheet-drag-progress
```

Anything present in the code and absent from the `.md` is a gap. Four real
examples of what that catches: `togglegroup.md` had no motion section until
the travelling pill was built there; `tabs.md` said nothing about the
travelling `Indicator` — writing that prose surfaced a live bug, because the
indicator was hidden until the first click; all three card docs still said a
long press called an `onMore` prop no host passed, months after the cards had
started raising their own sheet; and `menu.md` never mentioned `state-fade`,
which is on every row it documents. The missing prose and the bug usually have
the same root: nobody had stated what the attribute meant.

**The system file does not get its own copy.** `DESIGN_SYSTEM.md`'s touch
contract is GENERATED from the `contract:` frontmatter of the page that owns
each rule (`npm run sync-docs`, checked in CI). Write the obligation once, in
the page; never paraphrase it into the system file. That is the mechanism
behind "one account per fact" — the earlier version was a convention, and it
lasted an hour.

A value that IS the rule (44px of target) is stated in the system file and may
be cited by pages. A DERIVED value (28 = a 20px pill plus an 8px inset) is
stated where it is derived and nowhere else.

Seven blocks are generated today — colour, tokens, type, width, touch, menus,
sheets. Two sections stay hand-written on purpose, and the reason is the same
for both: **Icons** is one decision about one mark, and the **strict touch
rules** (touch-action, never synthesise a tap from pointerup, snap mandatory,
viewport width) have no component that owns them. Do not create a page to
satisfy the script — a subject earns a page by being a subject.

**And one thing that cannot gate: `npm run doc-rules`.** It finds sentences in
the owner pages that read like obligations (NEVER, ALWAYS, must, mandatory)
and reports the ones no `contract:` line covers — the gap the generator cannot
see, because a rule that never got a contract line is invisible to a check
that compares contract lines. Run it during a pass, read the list, promote
what deserves promoting.

It is advisory on purpose. "Is this sentence a rule" is not decidable, and
about half of what it finds is a prop note, a sentence that happens to use the
word, or a component detail that belongs to its page. A check that is wrong
half the time must not block a push: it teaches everyone to bypass, and takes
the honest gates with it. Judgements go in `NOT_A_RULE` in the script, each
with the reason visible.

**It gates.** `.github/workflows/docs.yml` runs the sweep on every pull
request and every push to `main`, so a component that gains a behaviour and
does not gain the prose fails before anyone reads the stale version. A red run
means something NEW went undocumented — the baseline covers what was already
there.

**Run it locally too, do not eyeball it: `npm run doc-sweep`.** Both lists above are in
`scripts/doc-sweep.mjs`, which walks every component in `src/components/ui`,
greps its source for them, and reports anything present in the code and absent
from its doc. Exit 1 when something is open, so it can gate a push or a CI
job. It carries a **baseline** of debt that predates it — that list is a
to-do, not an exemption: delete a line, watch it stay green, and it has
shrunk.

What it cannot do is tell you a doc is confidently wrong about a number. That
is the consistency half, and it needs a reader.

**A doc gap is sometimes a code smell.** `rounded-t-[28px]` showed up in five
call sites and in none of their docs — the honest fix was not five paragraphs
but moving the corner into `SIDE_CLASSES.bottom`, where it belongs, after
which there was nothing left to document per component. When the sweep flags
the same token in several components at once, ask whether it should be theirs
at all.

### The touch questions

Ask these of any component a finger can reach. Each one is a real bug this
project shipped, and each is invisible to the motion sweep above:

1. **What does a long press do here, and does the component say so?** If it
   raises a menu, is it the *same* menu the entity gets elsewhere?
2. **Is the hold visible from the first frame?** A hold with no feedback reads
   as a tap that did not register, so people lift and try again — which is a
   tap.
3. **Is a drag ever mistaken for a tap?** The browser suppresses a click after
   a scroll, but not after a short drag the scroller declined to follow.
4. **Does anything inside the primary tap area navigate away?** A link inside
   a row that is mostly one action is a coin toss under a thumb — and missing
   costs a page load, not just a miss.
5. **What is the painted size, and what is the target size?** 24×24 is the AA
   floor, 44×44 is what a fingertip wants, and two targets closer than 12px
   are worse than two small ones.
6. **Does iOS want this gesture too?** A long press on an image raises
   Safari's own menu unless `-webkit-touch-callout` says otherwise, and it has
   to be declined before the finger lands.
7. **What happens when the keyboard is up?** Which band is pinned, what does
   the sheet's height resolve to, and does the focused field stay visible when
   the sheet shrinks under it?
8. **Which gate decides — window, or pointer?** Width says how much room there
   is; `useCoarsePointer()` says what is doing the pointing. Answering one
   with the other is its own bug.

Record the answers in the doc even when the answer is "nothing": *"no long
press"* is a documented decision, and a reader who cannot find it will add
one.

**3 · Consolidate — into the Markdown.**

Everything the reader needs goes into `docs/components/<id>.md`:

- the **lead** — the first non-heading paragraph — is the component's one-paragraph definition, because it becomes the section intro. Anything that belongs on the page must live in that paragraph;
- the **body** is everything else, and is what the ⓘ modal shows;
- record open questions as open questions rather than guessing.

**4 · Sync the other maintained sources.**

The Markdown is not the only thing you own:

- the component's **code comments** — a published surface via `</>`, so they get the same care;
- **`DESIGN_SYSTEM.md`** — when the change touches a token, a shared recipe or a rule other components follow. A component-specific detail belongs in the `.md`; a system-wide rule belongs in both, stated once in `DESIGN_SYSTEM.md` and referenced from the `.md`.

**5 · Present — wire the section so it demonstrates, not just describes.**

Prose is only half of it. The section's *frame* is documentation too, and it is the half that proves the prose. Never type component prose into `home.tsx` — the intro, the ⓘ modal and the `</>` panel read the sources you just updated — but do wire the following deliberately.

**Every rendered doc states when it was rendered.** The ⓘ modal carries a
`rendered <date · time>` line under the file path, from `DOCS_RENDERED_AT` in
`src/lib/component-docs.ts` — the execution time of the module that inlines the
Markdown, so in dev it becomes the moment of the edit and in a build it is the
moment the bundle loaded. A doc modal is trusted on sight and a stale one looks
exactly like a fresh one; the timestamp is what separates them. It is not the
same statement as the section's "Changed" date, which comes from git and
describes the COMPONENT. If a new doc surface is added, it carries the
timestamp too — and the timestamp keeps deriving from the doc content's own
load, never from a hand-typed constant.

**A · Section shell**

| What | Where | Rule |
|---|---|---|
| `id` | `<Section>` | the dasherised form; it is the key that ties doc, status and source together |
| `title` | `<Section>` | display name |
| `usage` | **the doc's frontmatter** | the "Used in:" list. Lives with the rest of the component's prose, so it is coupled to the doc like everything else. The `usage` prop on `<Section>` remains only as a deliberate override. **Always answer this** — see below |
| `status` | `ds-status.ts` (`SECTION_STATUS_BY_ID`) | `new` / `updated` / `concept`. Editorial, hand-set, frozen within a release. Pass the prop only as a deliberate deviation |
| `phase` | `<Section>` | `2` marks the Shop / Products experience — not in the day-one build |
| source + "Changed" date | `ds-sources.ts` | map the section id to the file that backs it; the date is derived from `git log` at build time and maintains itself forever. Set once per component |

**B · The `Example` frame**

- `doc` — the section id; this is what lights up ⓘ and pulls lead + body from the Markdown.
- `code` — the `?raw` import of the call site. Never a snippet typed beside the demo.
- `codePath` — repo-relative path; the GitHub blob link is built from it, so a wrong path publishes a dead link.
- `widths` + `widthLabel` — **only** when a window does not DETERMINE the component's width. `SongListItem` qualifies: at a 1069 window it is 765px in a list and 363px in a rail cell. One placement is not a reason. Otherwise the default window ladder.
- `responsive={false}` — for a component that does not answer to width at all (Button, Badge, Spinner, Avatar). Chips there advertise behaviour it does not have.
- `defaultWidth` — the opening chip, when one particular width is the point.
- `bleed={w => …}` — chrome-level demos (a bottom sheet, a toast bar) span the window edge to edge, so the frame drops its gutters, tab bar and stage padding at those widths.
- `align` — `stretch` for anything that READS its container (rails, grids, `@min-[…]`); `center` for something with its own width, like a dialog.
- `stageClassName` — when the stage's own padding would distort the measured width. A chip that says 380 must hand the component 380.
- `controls` — variant switches in the toolbar.
- `title` — the variant's name, when the section holds more than one frame.

**The "Used in:" line is always answered, even with "nothing".**

An absent line is indistinguishable from a forgotten one, and the reader cannot tell which. So every section says something:

```yaml
usage:
  - Artist › Top Songs | /?page=Artist      # a real surface, linked
  - nothing yet — no view has adopted it     # no `| href` → plain text, not a link
```

Say what is true, and say it precisely. `Form` taught this: the component is imported nowhere, but a dozen views hand-roll the same field stack — so "nothing yet" was accurate about the component and badly wrong about the product. The line now reads *"Upload music — hand-rolled, not via Form"*. Where the pattern and the component have parted company, the line is the place that admits it.

**C · What the frame must show**

- **One variant per frame.** Six toasts in a two-column grid made the width change the demo's own layout instead of the component; the rest belong under the frame as a plain catalogue, or in a second frame.
- **Mirror the real placement.** The toast sits top-right from 768 and bottom-full-width below it because that is where `ToastViewport` puts it; the List Table swaps to mobile rows below 608 because that is what the app does. A frame showing a rendering the app never produces is worse than no frame.
- **Draw the chrome** wherever a window chip is in play, so the reader sees why a wider window can leave a narrower column.

Two items in group A are one-time wiring (the id and `ds-sources.ts`). Everything in B and C is a decision per component, and the three most common misfires are: a private chip scale with no justification, several variants in one box, and a demo whose own layout — not the component — is what reacts to the width.

**The invariant:** three windows (intro · ⓘ · `</>`), two maintained per-component sources (the `.md` and the file with its comments), one system-wide document (`DESIGN_SYSTEM.md`). Maintain the sources; the windows take care of themselves.

**Git workflow.**

- **Commit and push only when the user explicitly asks.** Don't do it on your own initiative.
- **Branch off `main` first** if you're on the default branch, unless the user says to push to `main` directly.
- **Commit messages** end with the trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **`main` is the deploy + handoff branch.** The user deploys the live demo (`https://muza.imjustsittingherelookingatprettycolours.help`) from `main`, so a push triggers the redeploy; GitHub blob links used in tickets also only resolve once the code is on `main`. Ship to `main` when asked.
- **Never commit** `.next/` or `Budhabudhabing/`.

**Type tokens.** Product code uses semantic aliases only (`text-small`, `text-xsmall`, `text-base`, …) — never raw primitives (`text-sm`/`text-lg`) and never arbitrary `text-[17px]`. The primitives layer (and the `clamp()` definitions for fluid display sizes) live in `app/app.css`; semantic aliases point at them via `var()`.
