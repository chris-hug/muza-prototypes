/*
 * tokens — the design system's colour tokens, read out of the stylesheet.
 *
 * `app.css` is the only place a token value is written. This module parses it
 * at build time (`?raw`, so the text is inlined and nothing is fetched), which
 * is what lets the design-system page SHOW the tokens without holding a second
 * copy of them.
 *
 * It held three. The Colors section hand-wrote every primitive as a hex array
 * in `home.tsx` (`{ name: "500", hex: "#000DA2" }` — 30-odd of them), and
 * `SEMANTIC_TOKENS` hand-mapped each semantic token to the primitive it points
 * at, twice, once per mode. Every one of those was a promise to remember to
 * edit two files, and the page had no way to notice when the promise was
 * broken: it would simply have shown a palette the app no longer used.
 *
 * The chain is already IN the CSS — a semantic token's value is literally
 * `var(--muza-brand-500)` — so the mapping does not need to be restated. It
 * needs to be read.
 */

import cssText from "../../app/app.css?raw"

export interface TokenDecl {
  /** Custom property name, without the leading `--`. */
  name: string
  /** The value exactly as written: an `oklch(…)`, a hex, or a `var(…)`. */
  value: string
  /** The trailing `/* … *\/` on the same line — usually the hex equivalent. */
  note?: string
  /** The `/* group *\/` comment the declaration sits under. */
  group?: string
  /** The primitive this points at, when the value is a single `var(--x)`. */
  refers?: string
}

/*
 * Brace matching rather than a regex: `:root { … }` can hold nested blocks
 * and a comment containing a brace, and a lazy `[^}]*` gets both wrong.
 */
function blocksFor(selector: string): string[] {
  const out: string[] = []
  let i = 0
  for (;;) {
    const at = cssText.indexOf(selector, i)
    if (at === -1) break
    const brace = cssText.indexOf("{", at)
    // The selector must be followed by nothing but whitespace before the `{`,
    // so `:root` does not also match inside `:root:not([data-theme])`.
    if (brace === -1 || !/^\s*$/.test(cssText.slice(at + selector.length, brace))) {
      i = at + selector.length
      continue
    }
    let depth = 1
    let j = brace + 1
    while (j < cssText.length && depth > 0) {
      if (cssText[j] === "{") depth++
      else if (cssText[j] === "}") depth--
      j++
    }
    out.push(cssText.slice(brace + 1, j - 1))
    i = j
  }
  return out
}

const DECL = /--([\w-]+)\s*:\s*([^;]+);(?:[ \t]*\/\*[ \t]*(.*?)[ \t]*\*\/)?/g
/*
 * A group heading is a short comment ALONE on its line. The leading
 * `(?:^|\n)[ \t]*` is the whole point: without it the trailing `/* #FEFFFB *\/`
 * that documents each primitive's hex matched too, so every colour became its
 * own "group" and the palette rendered as thirty headings with one swatch each.
 */
const GROUP = /(?:^|\n)[ \t]*\/\*[ \t]*([^*\n]{1,110}?)[ \t]*\*\/[ \t]*\n/g

function declarations(body: string): TokenDecl[] {
  // Walk group headings and declarations in source order so each declaration
  // can be told which heading it sits under.
  const marks: Array<{ at: number; group: string }> = []
  for (const m of body.matchAll(GROUP)) marks.push({ at: m.index ?? 0, group: m[1] })

  const out: TokenDecl[] = []
  for (const m of body.matchAll(DECL)) {
    const at = m.index ?? 0
    let group: string | undefined
    for (const mark of marks) if (mark.at < at) group = mark.group
    const value = m[2].trim()
    const ref = value.match(/^var\(\s*--([\w-]+)\s*\)$/)
    out.push({
      name: m[1],
      value,
      note: m[3],
      group,
      refers: ref ? ref[1] : undefined,
    })
  }
  return out
}

const ROOTS = blocksFor(":root").map(declarations)
const DARKS = blocksFor(".dark").map(declarations)

/*
 * Blocks are identified by what they DECLARE, never by what they mention.
 * Filtering `:root` bodies on the text "--muza-" picked the wrong one: the
 * semantic block is full of `var(--muza-white)` references, so it read as the
 * primitive block and the table came back with a single row.
 */
const declares = (d: TokenDecl[], name: string) => d.some(t => t.name === name)

/** Is this value a colour? The primitive block also carries `--radius` and
 *  friends, which have no swatch to draw. */
const isColour = (v: string) =>
  /^(#|oklch\(|rgba?\(|hsla?\(|color-mix\(|transparent$|currentColor$)/i.test(v)

/** Raw palette entries — `--muza-*`, `--tw-*`. Values are colours, never refs. */
export const PRIMITIVES: TokenDecl[] = (
  ROOTS.find(d => declares(d, "muza-white")) ?? []
).filter(t => isColour(t.value))

/** Semantic tokens in light mode — `--background`, `--primary`, … */
export const SEMANTIC_LIGHT: TokenDecl[] = ROOTS.find(d => declares(d, "background")) ?? []

/** The same tokens as `.dark` reassigns them. */
export const SEMANTIC_DARK: TokenDecl[] = DARKS.find(d => declares(d, "background")) ?? []

const DARK_BY_NAME = new Map(SEMANTIC_DARK.map(t => [t.name, t]))
/** The dark-mode declaration for a semantic token, if it has one. */
export function darkDecl(name: string): TokenDecl | undefined {
  return DARK_BY_NAME.get(name)
}

/** Primitives grouped under their `/* … *\/` heading, in source order. */
export function primitiveGroups(): Array<{ label: string; tokens: TokenDecl[] }> {
  const out: Array<{ label: string; tokens: TokenDecl[] }> = []
  for (const t of PRIMITIVES) {
    const label = t.group ?? "other"
    const last = out[out.length - 1]
    if (last && last.label === label) last.tokens.push(t)
    else out.push({ label, tokens: [t] })
  }
  return out
}

/*
 * Semantic tokens grouped by NAME, not by comment.
 *
 * The primitives carry `/* muza colors/blue *\/` headings; the semantic block
 * does not — it is 35 declarations with no dividers, so grouping it the same
 * way put all 35 under one heading called "core" and gave the reader a table
 * of contents with a single entry.
 *
 * The prefixes are the real structure: `--sidebar-*` and `--chart-*` are
 * self-contained sets that only their own surface uses, and everything else is
 * the vocabulary every component draws from.
 */
const SEMANTIC_SETS: Array<{ label: string; prefix: string }> = [
  { label: "sidebar", prefix: "sidebar-" },
  { label: "chart",   prefix: "chart-" },
]

export function semanticGroups(): Array<{ label: string; tokens: TokenDecl[] }> {
  const setFor = (name: string) =>
    SEMANTIC_SETS.find(s => name.startsWith(s.prefix))?.label ?? "core"

  const out: Array<{ label: string; tokens: TokenDecl[] }> = []
  for (const t of SEMANTIC_LIGHT) {
    const label = setFor(t.name)
    const last = out[out.length - 1]
    if (last && last.label === label) last.tokens.push(t)
    else out.push({ label, tokens: [t] })
  }
  return out
}
