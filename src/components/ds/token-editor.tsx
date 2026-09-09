"use client"

/*
 * TokenEditor — the colour tokens, in the two views they actually have.
 *
 * **Design** is the palette: two layers, in the order the system resolves
 * them. A semantic token does not hold a colour, it holds a POINTER — the CSS
 * literally reads `--primary: var(--muza-blue-500)`. Showing the pointer is
 * the whole explanation of why `--primary` is a different blue in dark mode,
 * and it is why the two layers are one table and not two sections that happen
 * to sit near each other.
 *
 * **CSS** is the same values as text: the `:root` and `.dark` blocks,
 * copyable. Not a rendering OF the tokens — the tokens, in their file's own
 * form, with any live edits applied.
 *
 * Editing writes to `document.documentElement.style`, which is the last word
 * in the cascade, so the change lands on the WHOLE page — the sidebar, the
 * cards, every other section — and not on a preview rectangle. That is the
 * point: a token is only judged in company. Nothing persists; Reset removes
 * the inline properties and the stylesheet is back.
 *
 * Values are read out of `app.css` (see `src/lib/tokens.ts`), so this
 * component holds no palette of its own. It replaced three hand-kept copies:
 * the primitive hex arrays in `home.tsx`, and `SEMANTIC_TOKENS`, which mapped
 * every token to its primitive by hand, once per mode.
 */

import * as React from "react"
import { Check, Copy, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  darkDecl, primitiveGroups, semanticGroups,
  PRIMITIVES, SEMANTIC_DARK, SEMANTIC_LIGHT, type TokenDecl,
} from "@/lib/tokens"

type View = "design" | "css"

/* ── Reading a token's painted colour ──────────────────────────────────────
 * `getComputedStyle().getPropertyValue("--x")` returns the token's own value,
 * which for a semantic token is another `var()` — useless for painting. So a
 * probe element is scoped `.light` / `.dark`, given `background: var(--x)`,
 * and its resolved `backgroundColor` is read back. `.light` exists in app.css
 * precisely so both modes can be shown at once whatever the page is set to.
 */
function useResolved(token: string, mode: "light" | "dark", nonce: number) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [rgb, setRgb] = React.useState("")
  React.useEffect(() => {
    if (ref.current) setRgb(getComputedStyle(ref.current).backgroundColor)
  }, [token, mode, nonce])
  return { ref, rgb }
}

/*
 * Computed colour → hex, via a canvas.
 *
 * NOT by parsing the string. `getComputedStyle().backgroundColor` returns
 * whatever colour space the value was authored in — our tokens are `oklch()`,
 * so it comes back as `oklch(99.81% 0.0053 118.5)`. Reading its three numbers
 * as if they were R/G/B turned muza-white into a navy `#010077`, and it looked
 * plausible enough on a table full of numbers to miss.
 *
 * So the colour is PAINTED and the pixel read back. Reading `ctx.fillStyle`
 * alone is not enough — Chrome hands an `oklch()` string straight back rather
 * than normalising it — but a 1×1 `fillRect` plus `getImageData` gives the
 * actual sRGB bytes the screen shows, which is what a hex is.
 */
let ctx: CanvasRenderingContext2D | null | undefined
function hex(color: string): string {
  if (!color) return ""
  if (ctx === undefined) {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    ctx = canvas.getContext("2d", { willReadFrequently: true })
  }
  if (!ctx) return color
  try {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    const to = (n: number) => n.toString(16).padStart(2, "0")
    const out = `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
    // Alpha is real in this palette — `--muted-foreground` is a 50% neutral —
    // so say so rather than printing an opaque hex that is not what you see.
    return a < 255 ? `${out} · ${Math.round((a / 255) * 100)}%` : out
  } catch {
    return color
  }
}

function Swatch({ token, mode, nonce, size = "size-8" }: {
  token: string; mode: "light" | "dark"; nonce: number; size?: string
}) {
  const { ref, rgb } = useResolved(token, mode, nonce)
  return (
    <span className="flex items-center gap-2">
      {/* Only the SWATCH sits in the scoped wrapper — the label beside it
          stays in the page's own theme so it is readable either way. */}
      <span className={cn(mode, "shrink-0")}>
        <span
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(size, "block rounded-lg border border-border")}
          style={{ background: `var(--${token})` }}
        />
      </span>
      <span className="font-mono text-2xsmall tabular-nums text-muted-foreground">{hex(rgb)}</span>
    </span>
  )
}

/* ── One editable row ─────────────────────────────────────────────────── */
function ValueField({ token, value, onChange }: {
  token: string; value: string; onChange: (v: string) => void
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      spellCheck={false}
      aria-label={`--${token}`}
      className={cn(
        "w-full min-w-0 rounded-md border border-transparent bg-transparent px-1.5 py-0.5",
        "font-mono text-2xsmall text-foreground outline-none transition-colors",
        "hover:border-border focus:border-ring focus:bg-background",
      )}
    />
  )
}

/* Every group that exists gets a rail entry, derived from the same functions
   that render the panels — a hand-written list would be one more thing that
   can disagree with what is on screen. */
const slug = (s: string) => "tok-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

const NAV: Array<{ id: string; label: string; level: 0 | 1 }> = [
  { id: "tok-semantic", label: "Semantic", level: 0 },
  ...semanticGroups().map(g => ({
    id: slug(g.label),
    // The group comments in app.css are written for a reader of the
    // stylesheet, so they carry parentheticals the rail has no room for.
    label: g.label.replace(/\s*\(.*$/, ""),
    level: 1 as const,
  })),
  { id: "tok-primitive", label: "Primitive", level: 0 },
  ...primitiveGroups().map(g => ({
    id: slug(g.label),
    label: g.label.replace(/^muza colors\//, "").replace(/^tailwind colors\//, "tw ").replace(/\s*\(.*$/, ""),
    level: 1 as const,
  })),
]

export function TokenEditor() {
  const [view, setView]     = React.useState<View>("design")
  const [active, setActive] = React.useState<string>(NAV[1]?.id ?? "")
  const [edits, setEdits]   = React.useState<Record<string, string>>({})
  const [copied, setCopied] = React.useState(false)
  // Bumped on every edit so the swatches re-read their computed colour —
  // an inline custom property changes no React state on its own.
  const [nonce, setNonce]   = React.useState(0)

  function set(token: string, value: string) {
    setEdits(prev => ({ ...prev, [token]: value }))
    document.documentElement.style.setProperty(`--${token}`, value)
    setNonce(n => n + 1)
  }

  function reset() {
    for (const token of Object.keys(edits)) {
      document.documentElement.style.removeProperty(`--${token}`)
    }
    setEdits({})
    setNonce(n => n + 1)
  }

  // Remove the inline overrides when the section unmounts, so a token left
  // mid-edit does not follow the reader around the rest of the app.
  React.useEffect(() => () => {
    for (const token of Object.keys(edits)) {
      document.documentElement.style.removeProperty(`--${token}`)
    }
  }, [edits])

  /*
   * The rail follows the scroll, not only the clicks.
   *
   * Measured on scroll rather than with an IntersectionObserver, and that is
   * deliberate: "which group am I in" is a question about the LAST heading I
   * passed, not about which heading is currently on screen. With an observer
   * the mark simply vanished whenever the scroll position sat between two
   * headings — which is most of the time, since a group is taller than the
   * band that counts as "here".
   */
  React.useEffect(() => {
    if (view !== "design") return
    const watched = NAV.filter(n => n.level === 1)

    const measure = () => {
      let current = watched[0]?.id
      for (const item of watched) {
        const el = document.getElementById(item.id)
        if (!el) continue
        // 120px down from the top: a heading counts as reached slightly
        // before it touches the edge, so the mark moves with the reader
        // rather than after them.
        if (el.getBoundingClientRect().top <= 120) current = item.id
      }
      if (current) setActive(current)
    }

    measure()
    /* Listen on `document` in the CAPTURE phase, not on `window`. A scroll
       event does not bubble, and this page does not scroll the window at all
       — `<main>` is the scroller — so a window listener never fired once. */
    document.addEventListener("scroll", measure, { passive: true, capture: true })
    window.addEventListener("resize", measure)
    return () => {
      document.removeEventListener("scroll", measure, { capture: true })
      window.removeEventListener("resize", measure)
    }
  }, [view])

  const dirty = Object.keys(edits).length
  const valueOf = (t: TokenDecl) => edits[t.name] ?? t.value

  const css = React.useMemo(() => {
    const block = (label: string, tokens: TokenDecl[]) => {
      const width = Math.max(...tokens.map(t => t.name.length)) + 3
      const lines = tokens.map(t => {
        const decl = `  --${t.name}:`.padEnd(width + 4) + `${valueOf(t)};`
        return t.note ? `${decl.padEnd(56)}/* ${t.note} */` : decl
      })
      return `${label} {\n${lines.join("\n")}\n}`
    }
    /* The PRIMITIVE block is here too, and first. Editing happens on that
       layer — it is the one with the input fields — so a CSS view that showed
       only the semantic blocks would have answered "nothing changed" to every
       edit the reader had just made. Order follows app.css: palette, then
       what points at it, then what dark mode reassigns. */
    return [
      block(":root", PRIMITIVES),
      block(":root", SEMANTIC_LIGHT),
      block(".dark", SEMANTIC_DARK),
    ].join("\n\n")
  }, [edits])

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar — the view switch, and the state of the edits. */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex gap-0.5 rounded-full bg-muted p-0.5">
          {(["design", "css"] as const).map(v => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "h-6 cursor-pointer rounded-full px-3 text-2xsmall font-medium transition-colors",
                view === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "design" ? "Design" : "CSS"}
            </button>
          ))}
        </span>

        <p className="text-2xsmall text-muted-foreground">
          {dirty === 0
            ? "Edit any value — the whole page changes with it, not a preview box."
            : `${dirty} token${dirty === 1 ? "" : "s"} overridden on :root — nothing is saved.`}
        </p>

        <span className="ml-auto flex items-center gap-2">
          {dirty > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw /> Reset
            </Button>
          )}
          {view === "css" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(css)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </span>
      </div>

      {view === "css" ? (
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted p-4 text-2xsmall leading-5 text-foreground">
          <code>{css}</code>
        </pre>
      ) : (
      <div className="flex gap-8">
        {/* The rail. A palette is a long page and the reader arrives looking
            for one group — "the neutrals", "the blues" — so the set of groups
            has to be visible without scrolling through it first. It is the
            table of contents of the thing beside it, which is why it lists
            exactly the headings that appear there and nothing else. Sticky,
            so it stays available while the palette scrolls past it, and
            hidden below the presentation gate where there is no room for a
            second column. */}
        <nav aria-label="Token groups" data-active={active} className="sticky top-6 hidden h-fit w-40 shrink-0 flex-col gap-0.5 md:flex">
          {NAV.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                setActive(item.id)
              }}
              className={cn(
                "truncate rounded-lg px-2 py-1 text-left text-2xsmall transition-colors",
                item.level === 0
                  ? "mt-2 font-medium text-foreground first:mt-0"
                  : active === item.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {/* ── Semantic ─────────────────────────────────────────────────
              The token a component names. Four columns, in resolution
              order: the name you write, what it looks like light, what it
              looks like dark, and the primitive each mode points at. */}
          <section id="tok-semantic" className="flex scroll-mt-6 flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <h4 className="text-small font-medium text-foreground">Semantic</h4>
              <p className="text-2xsmall text-muted-foreground">
                what a component names — never a raw colour
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-2xsmall">
                <thead className="border-b border-border bg-muted text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Token</th>
                    <th scope="col" className="px-3 py-2 font-medium">Light</th>
                    <th scope="col" className="px-3 py-2 font-medium">Dark</th>
                    <th scope="col" className="px-3 py-2 font-medium">Points at</th>
                  </tr>
                </thead>
                <tbody>
                  {semanticGroups().map(group => (
                    <React.Fragment key={group.label}>
                      <tr id={slug(group.label)} className="scroll-mt-6 border-b border-border bg-muted/40">
                        <td colSpan={4} className="px-3 py-1.5 text-muted-foreground">
                          {group.label}
                        </td>
                      </tr>
                      {group.tokens.map(t => {
                        const dark = darkDecl(t.name)
                        return (
                          <tr key={t.name} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-mono text-foreground">--{t.name}</span>
                            </td>
                            <td className="px-3 py-2">
                              <Swatch token={t.name} mode="light" nonce={nonce} />
                            </td>
                            <td className="px-3 py-2">
                              {dark
                                ? <Swatch token={t.name} mode="dark" nonce={nonce} />
                                : <span className="text-muted-foreground/60">same</span>}
                            </td>
                            {/* The pointer, both modes. This is the column the
                                hand-written table existed to provide, and the
                                one it could silently get wrong. */}
                            <td className="px-3 py-2 font-mono text-muted-foreground">
                              <span className="block">{t.refers ? `--${t.refers}` : valueOf(t)}</span>
                              {dark && dark.refers !== t.refers && (
                                <span className="block text-muted-foreground/60">
                                  dark: {dark.refers ? `--${dark.refers}` : dark.value}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Primitive ────────────────────────────────────────────────
              The raw palette. Editable, because this is the layer where a
              change is meant to happen: retune a primitive and every
              semantic token pointing at it moves with it — which is the
              behaviour the two-layer system exists to give you, and it is
              visible here in one click. */}
          <section id="tok-primitive" className="flex scroll-mt-6 flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <h4 className="text-small font-medium text-foreground">Primitive</h4>
              <p className="text-2xsmall text-muted-foreground">
                the raw palette — never named by a component
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {primitiveGroups().map(group => (
                <div key={group.label} id={slug(group.label)} className="flex scroll-mt-6 flex-col gap-2">
                  <p className="text-2xsmall text-muted-foreground">{group.label}</p>
                  <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(232px,1fr))]">
                    {group.tokens.map(t => (
                      <div
                        key={t.name}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-1.5 transition-colors",
                          edits[t.name] ? "border-ring bg-muted/50" : "border-transparent",
                        )}
                      >
                        <span
                          className="size-8 shrink-0 rounded-lg border border-border"
                          style={{ background: `var(--${t.name})` }}
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-mono text-2xsmall text-foreground">
                            {t.name.replace(/^muza-|^tw-/, "")}
                          </span>
                          <ValueField
                            token={t.name}
                            value={valueOf(t)}
                            onChange={v => set(t.name, v)}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      )}
    </div>
  )
}
