# muza — read this first

A music-platform **prototype**: the surface is real, the data is mock. Decisions
here are design decisions, and they are written down.

## The stack

**React Router 7 (framework mode) · Vite 6 · React 19 · Tailwind v4 · Base UI.**

Not Next.js. There is a `.next/` directory and a `next-env.d.ts` at the root —
both are gitignored leftovers from a migration, `next` is not a dependency, and
nothing reads them. (This file used to say the opposite and sent agents to
`node_modules/next/dist/docs/`, which does not exist.)

Things that follow from the actual stack:

- Routes are declared in **`app/routes.ts`**, not by file-system convention.
  `app/root.tsx` is the shell.
- **Tailwind v4**: configuration is CSS (`@theme` in `app/app.css`), not
  `tailwind.config.js`. Utilities in `app.css` are **unlayered**, so they beat
  a utility class on purpose — that is how several rules are enforced.
- **Base UI**, not Radix. Different prop names (`render` rather than `asChild`),
  different data attributes (`data-open`, `data-starting-style`).
- `npm run dev` serves on **:3001**.

## Before you write code

Read [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) for the rules a component must obey,
and the page for whatever you are touching in
[`docs/components/`](docs/components/README.md).

Two that catch people immediately:

- **Semantic aliases, never primitives.** `text-small`, not `text-sm`, and never
  `text-[17px]`. Same for colour: `bg-primary`, never a hex.
- **Touch is a first-class surface.** Phones are the default for the player.
  Before changing anything a finger reaches, read the eight touch questions in
  [`COMPONENT_DOC_PASS.md`](COMPONENT_DOC_PASS.md).

## Before you push

Documentation is part of the change, not a follow-up.
[`DOCUMENTATION.md`](DOCUMENTATION.md) explains the arrangement — what is
generated, what is checked, what only a reader can catch. The short version:

```bash
npm run doc-sweep    # every behaviour named in its doc          (CI gate)
npm run sync-docs    # regenerate the contract blocks            (CI gate)
npm run doc-rules    # rules that never got a contract line      (advisory)
npx tsc --noEmit && npm run build
```

**Never edit between the `BEGIN GENERATED` markers in `DESIGN_SYSTEM.md`.** Edit
the `contract:` line in the page that owns the rule and re-run `npm run
sync-docs`.

## How this repo argues

Comments and docs say **why**, including what was tried and failed — a
measurement, a browser's behaviour, the bug a rule exists to prevent. When you
change something those explain, change the explanation in the same commit. A
comment is published through the `</>` panel on the design-system page, so a
stale comment is a stale doc.
