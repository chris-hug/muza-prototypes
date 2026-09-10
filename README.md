# Muza

Music platform UI prototype — built with Vite, React Router v7, Tailwind v4, and shadcn/ui components.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Documentation

- [`DOCUMENTATION.md`](DOCUMENTATION.md) — how documentation works here: what
  is generated, what is checked, and what only a reader can catch. **Start
  here before writing docs.**
- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) — the system contract.
- [`docs/components/`](docs/components/README.md) — one page per subject,
  rendered into the design-system page at build time.
- [`COMPONENT_DOC_PASS.md`](COMPONENT_DOC_PASS.md) — the procedure for
  documenting a component.

```bash
npm run check        # everything CI runs — docs, types, build
npm run check:docs   # just the three doc gates (~1s, no install needed)
npm run doc-rules    # advisory: rules that never got a contract line
```
