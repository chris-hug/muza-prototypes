---
name: component-doc-pass
description: The named procedure for documenting or re-documenting a muza component. Run it whenever a component changes, whenever the user says "update the docs" for a component, and as a sweep when docs have drifted. Covers all five steps — gather, reconcile, consolidate, sync, present — not just the .md file.
---

# The Component Doc Pass

**The procedure lives in the repo, at `COMPONENT_DOC_PASS.md` in the project
root. Read that file and follow it.** The arrangement it operates inside —
what is generated, what is checked, and which of the four checks deliberately
does not gate — is `DOCUMENTATION.md`, also at the root. This skill exists to make sure it is
read at the right moment, not to restate it — two copies of a procedure is the
same drift the procedure was written to prevent, and the repo copy is the one
the `docs/components/README.md` already points at.

## When to run it

- a component changed — behaviour, classes, props, motion, anything
- the user says "update the docs" for a component
- docs have drifted and need a sweep
- a new component is added to the catalogue

## What you must not shortcut

Run all five steps: **gather · reconcile · consolidate · sync · present**. A
pass that only rewrites the `.md` is not a pass — the code comments are
published through the `</>` panel, `DESIGN_SYSTEM.md` holds the cross-component
rules, and the section's own wiring (`ds-sources.ts`, `ds-status.ts`, the
`Example` props) is documentation too.

Two things are worth carrying in your head before you open the file:

- **The code wins, but mismatches are findings.** Announce them; do not
  silently overwrite. That step has surfaced more wrong documentation than
  wrong code.
- **Coverage, not just consistency.** "Does the doc describe every behaviour
  the component has" is its own sweep. The grep lists for that are in the repo
  file — there are **two**: motion/state, and touch/pointer.
- **Touch is its own set of questions**, and they are invisible to a grep for
  class names. There are eight, they are listed in the repo file, and the rule
  that comes with them is to record the answer even when it is "nothing" — a
  reader who cannot find that decision will make a different one. (Not
  restated here: this file is a pointer, and a second copy of eight questions
  is exactly the drift the procedure exists to prevent.)
- **A doc gap can be a code smell.** When the sweep flags the same token
  across several components, ask whether it belongs to them at all before
  writing the same paragraph several times.
