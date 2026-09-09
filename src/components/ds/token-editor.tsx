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

/*
 * A colour cell: the chip, then what the token RESOLVES THROUGH, then the
 * measured value under it.
 *
 * The name is the primary line because that is the answer to the question the
 * table is asked — "what is `--border` in dark mode?" is answered by
 * "`--muza-neutrals-700`", not by a hex. The hex is the check, so it sits
 * underneath in the muted size.
 */
function Swatch({ token, mode, nonce, label, editor }: {
  token: string
  mode: "light" | "dark"
  nonce: number
  /** The primitive this resolves through, or the literal when it has none. */
  label: string
  /** Replaces the label line with an input — used on the primitive rows,
   *  where the label IS the value and the value is what you change. */
  editor?: React.ReactNode
}) {
  const { ref, rgb } = useResolved(token, mode, nonce)
  return (
    <span className="flex items-center gap-2">
      {/* Only the CHIP sits in the scoped wrapper — the text beside it stays
          in the page's own theme so it is readable in either mode. */}
      <span className={cn(mode, "shrink-0")}>
        <span
          ref={ref as React.Ref<HTMLDivElement>}
          className="block size-6 rounded-md border border-border"
          style={{ background: `var(--${token})` }}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        {editor ?? (
          <span className="truncate font-mono text-2xsmall text-foreground">{label}</span>
        )}
        <span className="truncate px-1.5 font-mono text-2xsmall tabular-nums text-muted-foreground/70">
          {hex(rgb)}
        </span>
      </span>
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

/*
 * The two layers as ONE list, in resolution order. Both the rail and the
 * table are built from this, so a heading in the rail and a heading in the
 * table cannot disagree about what exists or what it is called.
 */
const SECTIONS = [
  {
    kind: "semantic" as const,
    id: "tok-semantic",
    title: "Semantic",
    blurb: "what a component names — never a raw colour",
    groups: semanticGroups(),
  },
  {
    kind: "primitive" as const,
    id: "tok-primitive",
    title: "Primitive",
    blurb: "the raw palette — never named by a component",
    groups: primitiveGroups(),
  },
]

/* The group comments in app.css are written for someone reading the
   stylesheet, so they carry prefixes and parentheticals the rail has no room
   for. Shortened for the rail only — the table prints them as written. */
const railLabel = (label: string) =>
  label
    .replace(/^muza colors\//, "")
    .replace(/^tailwind colors\//, "tw ")
    .replace(/\s*\(.*$/, "")

const NAV: Array<{ id: string; label: string; level: 0 | 1 }> = SECTIONS.flatMap(section => [
  { id: section.id, label: section.title, level: 0 as const },
  ...section.groups.map(g => ({ id: slug(g.label), label: railLabel(g.label), level: 1 as const })),
])

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

  /*
   * The CSS view is built PER GROUP, not as one string, so the rail keeps
   * working in it — the same anchors, the same scroll. A single `<pre>` would
   * have left the rail present and inert, which is worse than not having it.
   * `cssText` is the same content joined, for the clipboard.
   */
  const cssGroups = React.useMemo(() => {
    const width = 26
    const line = (t: TokenDecl) => {
      const decl = `  --${t.name}:`.padEnd(width + 4) + `${valueOf(t)};`
      return t.note ? `${decl.padEnd(58)}/* ${t.note} */` : decl
    }
    return SECTIONS.flatMap(section =>
      section.groups.map((group, i) => ({
        id: slug(group.label),
        sectionId: i === 0 ? section.id : undefined,
        // The selector opens on the first group of a section and closes on
        // the last, so the text stays valid CSS you can paste.
        open: i === 0 ? (section.kind === "primitive" ? ":root {" : ":root {") : undefined,
        close: i === section.groups.length - 1 ? "}" : undefined,
        label: group.label,
        body: group.tokens.map(line).join("\n"),
      })),
    )
  }, [edits])

  /* Dark mode is a block of its own — it redeclares the same names, so it
     cannot be interleaved with the light ones. */
  const darkBlock = React.useMemo(() => {
    const width = 26
    return `.dark {\n${SEMANTIC_DARK.map(t => `  --${t.name}:`.padEnd(width + 4) + `${valueOf(t)};`).join("\n")}\n}`
  }, [edits])

  const cssText = React.useMemo(
    () =>
      cssGroups
        .map(g => [g.open, `  /* ${g.label} */`, g.body, g.close].filter(Boolean).join("\n"))
        .join("\n\n") + "\n\n" + darkBlock,
    [cssGroups, darkBlock],
  )

  return (
    /* One surface. The switch is IN the header rather than floating above it,
       because it changes what the surface shows — a control that sits outside
       the thing it controls reads as a page-level setting. */
    <div className="rounded-xl border border-border">
      {/* Sticky, opaque, and the top of a three-layer stack: this header at 0,
          then the table head and the rail at `top-10` — its own 40px height —
          so nothing ever slides under anything else. `bg-background` is not
          decoration here; a transparent sticky bar shows the rows travelling
          through it. */}
      <div className="sticky top-0 z-20 flex h-10 flex-wrap items-center gap-3 rounded-t-xl border-b border-border bg-background px-3">
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
                navigator.clipboard?.writeText(cssText)
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

      {/* One bordered surface, two columns, in BOTH views. The rail used to
          live inside the design branch, so switching to CSS dropped it — and
          a wall of declarations is exactly where a table of contents earns
          its keep. The columns are the frame; only the right one changes.

          Deliberately no `overflow-hidden` on this wrapper: it is the obvious
          way to clip the children to the rounded corner, and it silently
          kills `position: sticky` inside, because any overflow other than
          `visible` makes this the sticky element's scroll container and it
          has nothing to scroll. The border lives on the outer wrapper. */}
      <div className="flex">
        {/* The rail. A palette is a long page and the reader arrives looking
            for one group — "the neutrals", "the blues" — so the set of groups
            has to be visible without scrolling through it first. It is the
            table of contents of the table beside it, listing exactly the
            headings that appear there and nothing else. Sticky, so it stays
            available while the rows scroll past; hidden below the
            presentation gate, where there is no room for a second column. */}
        {/* The COLUMN stretches, the rail inside it sticks.
            Sticking the column itself (`self-start`) sized it to its own
            content, so its border and background stopped a few rows down and
            the table lost its left edge for the rest of its height. A sticky
            element cannot be the thing that draws a full-height column. */}
        <div className="hidden w-44 shrink-0 border-r border-border bg-muted/30 md:block">
        <nav
          aria-label="Token groups"
          data-active={active}
          className="sticky top-10 flex flex-col gap-0.5 p-2"
        >
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
                  ? "mt-3 font-medium text-foreground first:mt-0"
                  : active === item.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
        </div>

        {/* ── ONE table ────────────────────────────────────────────────────
            Both layers, in the order the system resolves them, under the same
            four headings. They were two panels — a table and a swatch grid —
            and that made them look like two subjects. They are one subject
            read twice: `--primary` and `--muza-blue-500` are the same colour
            at two levels of naming, and one column set is what makes a
            pointer something you can look UP. */}
        {/* No `overflow-x-auto` here. Setting one axis to `auto` makes the
            OTHER axis a scroll container too, which made this div the sticky
            head's scroll parent — the header then stuck to the top of a box
            that was itself scrolling off screen, so it looked like sticky was
            simply not working. The table is `table-fixed`, so it squeezes its
            columns instead of demanding a scrollbar. */}
        <div className="min-w-0 flex-1">
          {view === "css" ? (
            <pre className="overflow-x-auto bg-muted/40 px-4 py-3 text-2xsmall leading-5 text-foreground">
              <code>
                {cssGroups.map(g => (
                  <React.Fragment key={g.id}>
                    {g.open && <div className="text-muted-foreground">{g.open}</div>}
                    {/* The SAME anchor id the design view uses. Only one view
                        is mounted at a time, so the ids never collide. */}
                    <div id={g.id} className="scroll-mt-10">
                      <span className="text-muted-foreground/70">{`  /* ${g.label} */`}</span>
                      {"\n"}{g.body}{"\n"}
                    </div>
                    {g.close && <div className="text-muted-foreground">{g.close}{"\n"}</div>}
                  </React.Fragment>
                ))}
                {"\n"}{darkBlock}
              </code>
            </pre>
          ) : (
          <table className="w-full table-fixed text-left text-2xsmall">
            {/* Fixed columns, not content-driven. Auto layout let the two
                colour cells take whatever their longest primitive name asked
                for, which pushed "Used for" off the right edge entirely — the
                column was there and invisible. The prose column is the widest
                because it is the only one holding a sentence. */}
            <colgroup>
              <col className="w-[19%]" />
              <col className="w-[23%]" />
              <col className="w-[23%]" />
              <col className="w-[35%]" />
            </colgroup>
            {/* Sticky, because the table is 70-odd rows and four columns of
                hex look alike: without the header, "which of these is dark
                mode" becomes a scroll back up. `top-10` clears the surface
                header, which sticks at 0 and is 40px tall. */}
            <thead className="sticky top-10 z-10 border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Name</th>
                <th scope="col" className="px-3 py-2 font-medium">Light mode</th>
                <th scope="col" className="px-3 py-2 font-medium">Dark mode</th>
                <th scope="col" className="px-3 py-2 font-medium">Used for</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map(section => (
                <React.Fragment key={section.kind}>
                  <tr id={section.id} className="scroll-mt-6 border-b border-border bg-secondary">
                    <td colSpan={4} className="px-3 py-2">
                      <span className="font-medium text-foreground">{section.title}</span>
                      <span className="ml-2 text-muted-foreground">{section.blurb}</span>
                    </td>
                  </tr>

                  {section.groups.map(group => (
                    <React.Fragment key={group.label}>
                      <tr id={slug(group.label)} className="scroll-mt-6 border-b border-border bg-muted/50">
                        <td colSpan={4} className="px-3 py-1.5 text-muted-foreground">
                          {group.label}
                        </td>
                      </tr>

                      {group.tokens.map(t => {
                        const dark = section.kind === "semantic" ? darkDecl(t.name) : undefined
                        return (
                          <tr key={t.name} className="border-b border-border last:border-0">
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <span className="font-mono text-foreground">--{t.name}</span>
                            </td>
                            {/* Light: the chip, and what the token resolves
                                THROUGH. On a primitive that is its own value,
                                so the cell is where the value is edited —
                                the layer a colour lives on is the layer you
                                change, and an inline property on <html> would
                                beat both modes if applied to a semantic one. */}
                            <td className="px-3 py-1.5">
                              <Swatch
                                token={t.name}
                                mode="light"
                                nonce={nonce}
                                label={t.refers ? `--${t.refers}` : valueOf(t)}
                                editor={section.kind === "primitive" ? (
                                  <ValueField
                                    token={t.name}
                                    value={valueOf(t)}
                                    onChange={v => set(t.name, v)}
                                  />
                                ) : undefined}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              {section.kind === "primitive" ? (
                                /* A primitive is one colour and is never
                                   redeclared in `.dark`. That is the whole
                                   point of the layer above it, so the cell
                                   says so rather than repeating the chip. */
                                <span className="text-muted-foreground/60">not redeclared</span>
                              ) : dark ? (
                                <Swatch
                                  token={t.name}
                                  mode="dark"
                                  nonce={nonce}
                                  label={dark.refers ? `--${dark.refers}` : dark.value}
                                />
                              ) : (
                                <span className="text-muted-foreground/60">same as light</span>
                              )}
                            </td>
                            {/* "Used for" is the trailing comment on the
                                declaration in app.css — written beside the
                                value, so the answer to "what is this for"
                                lives where the value does and cannot drift
                                from it. */}
                            <td className="px-3 py-1.5 text-muted-foreground">
                              {section.kind === "primitive"
                                ? <span className="text-muted-foreground/60">—</span>
                                : t.note}
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  )
}
