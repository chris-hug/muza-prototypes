"use client"

/*
 * Example — the design system's demo frame.
 *
 * Modelled on the IRIS studio's stage: a titled card whose body is the LIVE
 * component, constrained to a chosen breakpoint width so its responsive
 * behaviour can be seen without resizing the browser. The head carries two
 * icon buttons:
 *
 *   · `</>` — the usage snippet, copyable;
 *   · `ⓘ`  — the component's docs, read straight from
 *            `docs/components/<id>.md`. Same file an agent reads, so the
 *            prose exists once.
 *
 * Width is applied with a plain `max-width` on the stage, and the stage is a
 * `@container`, so components written against container queries (cards, rails,
 * media rows) react exactly as they would at that viewport. An iframe would
 * isolate the theme and double the work for no gain here.
 */

import { useState } from "react"
import { Code2, Info, Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Markdown } from "@/components/ds/markdown"
import { componentDoc } from "@/lib/component-docs"
import { FOOTER_NAV_BELOW, SIDEBAR_COLLAPSE_BELOW } from "@/lib/use-media-query"

/*
 * The rungs are THIS PROJECT'S, not Tailwind's generic scale — the page
 * gutter steps at 584 and 1069, the sidebar becomes a footer tab bar at 608,
 * and `useIsMobile()` cuts at 768. Chips showing 640/768/1024 would look
 * authoritative while missing every width where something actually changes.
 *
 * The names are width BANDS, not devices: a 1024px tablet held sideways is
 * "Desktop" here, and that is correct — what matters is the room the layout
 * has, never what the hardware is called.
 *
 * 608 and 1069 are ARITHMETIC (560 + 2×24; 780 + 208 + 80 + 1), so they are
 * imported from where they are computed rather than written down again.
 * Full table and reasoning: `docs/components/responsive.md`.
 */
function readWidths(): { label: string; px: number; note: string }[] {
  return [
    { label: "Phone",       px: 375,                    note: "reference phone — 12 mini / SE class" },
    { label: "Phone wide",  px: 584,                    note: "page gutter 12 → 24px" },
    { label: "Tablet",      px: FOOTER_NAV_BELOW,       note: "sidebar replaces the footer tab bar" },
    { label: "Tablet wide", px: 768,                    note: "useIsMobile() — components swap" },
    { label: "Desktop",     px: SIDEBAR_COLLAPSE_BELOW, note: "sidebar expands · gutter 24 → 40px" },
  // Sorted because two of them are computed and could in principle cross.
  ].sort((a, b) => a.px - b.px)
}

const WIDTHS = readWidths()

/*
 * What `</>` shows: the demo file with its explanatory head removed.
 *
 * The FILE is the single source of truth — it is what renders, and it is what
 * sits on GitHub. But its leading `"use client"` and block comment are there
 * for the reader of the repo, and they are already surfaced under ⓘ, together
 * with everything the component's Markdown adds. Printing them again in the
 * code panel would bury the six lines someone actually came to copy.
 *
 * Only the HEAD is dropped, and only when it is exactly that — one directive
 * and one comment at the very top. Nothing inside the code is touched, so
 * what remains is still a verbatim slice of the file rather than a rewrite.
 */
function usageOf(source: string): string {
  let rest = source.replace(/^\s*["']use client["'];?\s*/, "")
  if (rest.startsWith("/*")) {
    const close = rest.indexOf("*/")
    if (close !== -1) rest = rest.slice(close + 2)
  }
  return rest.replace(/^\s*\n/, "").trimEnd()
}

export function Example({
  title,
  doc,
  code,
  codePath,
  defaultWidth,
  controls,
  className,
  stageClassName,
  children,
}: {
  /** Variant name, e.g. "Bottom sheet". Optional — a lone demo needs none. */
  title?: string
  /** Section id whose `docs/components/<id>.md` backs the ⓘ button. */
  doc?: string
  /** Usage snippet for the `</>` panel. Pass the demo module's own source
   *  (`import src from "…?raw"`) so what is shown is what renders. */
  code?: string
  /** Repo-relative path of that file — printed above the snippet and linked
   *  to GitHub, so the panel says where its truth lives. */
  codePath?: string
  /** Start at a fixed rung instead of full width. */
  defaultWidth?: string
  /** Variant switches — rendered at the left of the toolbar. */
  controls?: React.ReactNode
  className?: string
  stageClassName?: string
  children: React.ReactNode
}) {
  const [width, setWidth] = useState<string | null>(defaultWidth ?? null)
  const [showCode, setShowCode] = useState(false)
  const [showDoc, setShowDoc] = useState(false)
  const [copied, setCopied] = useState(false)
  const entry = componentDoc(doc ?? "")
  const px = WIDTHS.find(w => w.label === width)?.px

  const usage = code ? usageOf(code) : undefined

  const copy = () => {
    if (!usage) return
    navigator.clipboard?.writeText(usage)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Title row — name at the left, the width picker at the right. */}
      <div className="flex items-center gap-3 min-w-0">
        {title && <p className="text-small font-medium text-foreground truncate">{title}</p>}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {WIDTHS.map(w => (
            <button
              key={w.label}
              type="button"
              onClick={() => setWidth(width === w.label ? null : w.label)}
              aria-pressed={width === w.label}
              title={`${w.px}px — ${w.note}`}
              className={cn(
                "px-2 py-0.5 rounded-full text-2xsmall font-medium transition-colors cursor-pointer",
                width === w.label
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {w.label}
            </button>
          ))}
          {/* The measured width, and the way back to "as wide as it gets". */}
          <button
            type="button"
            onClick={() => setWidth(null)}
            className={cn(
              "ml-1 text-2xsmall tabular-nums transition-colors cursor-pointer",
              width ? "text-muted-foreground hover:text-foreground underline underline-offset-2" : "text-foreground",
            )}
          >
            {px ? `${px}px` : "free"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {/* Toolbar — variant controls left, code + docs right. */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-muted min-h-11">
          <div className="flex-1 min-w-0 flex items-center gap-2">{controls}</div>
          <div className="shrink-0 flex items-center gap-1">
            {code && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={showCode ? "Hide markup" : "Show markup"}
                aria-expanded={showCode}
                onClick={() => setShowCode(v => !v)}
                className={cn(showCode && "bg-secondary")}
              >
                <Code2 />
              </Button>
            )}
            {entry && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`About ${entry.title}`}
                onClick={() => setShowDoc(true)}
              >
                <Info />
              </Button>
            )}
          </div>
        </div>

        {/* Markup panel. */}
        {showCode && usage && (
          <div className="relative border-b border-border">
            {codePath && (
              <p className="px-3 pt-3 text-2xsmall text-muted-foreground bg-muted">
                <a
                  href={`https://github.com/chris-hug/muza-prototypes/blob/main/${codePath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-text hover:underline underline-offset-2"
                >
                  {codePath}
                </a>
                <span className="opacity-70"> — rendered above, verbatim</span>
              </p>
            )}
            <pre className="m-0 overflow-x-auto bg-muted p-3 pr-24 text-2xsmall leading-5 text-foreground">
              <code>{usage}</code>
            </pre>
            <Button
              variant="secondary"
              size="sm"
              onClick={copy}
              className="absolute top-2 right-2"
            >
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}

        {/* Stage. Graph-paper grid behind the frame, as in the IRIS studio:
            at a narrow rung the component no longer fills the card, and the
            ruled ground makes that emptiness read as "this is how wide it is"
            instead of "something failed to render". The grid is its own
            absolutely positioned layer so its opacity can't reach the demo,
            and the frame sits on `bg-background` — an opaque surface, so the
            grid never shows through the component itself. */}
        {/* The ruled ground is only visible where the frame ENDS — no padding
            of its own. A ring of grid around a full-width frame would be a
            second border inside a bordered card, framing nothing. */}
        <div className="relative flex justify-center">
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 opacity-40",
              "bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)]",
              "[background-size:12px_12px]",
            )}
          />
          <div
            // Centred: at a wide rung a component narrower than the frame
            // would otherwise hug the left edge with a field of empty white
            // beside it, which reads as a layout bug rather than as "this is
            // its natural width". A demo that wants the full width can still
            // take it — `w-full` on its own root wins over the centring.
            // The padding belongs to the FRAME, not to the ruled ground: the
            // white area is the simulated viewport, so the demo needs its air
            // inside it — on the ground it would only pad left and right,
            // since the frame shrink-wraps its content vertically.
            className={cn(
              "@container relative w-full bg-background flex flex-col items-center gap-6 p-6",
              stageClassName,
            )}
            style={px ? { maxWidth: px } : undefined}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Docs modal — the component's own Markdown, rendered with the app's
          tokens so the docs look like the thing they document. */}
      {entry && (
        <Dialog open={showDoc} onOpenChange={setShowDoc}>
          <DialogContent className="sm:max-w-[min(46rem,90vw)] flex flex-col max-h-[85svh]">
            <DialogHeader className="shrink-0">
              <DialogTitle className="sm:text-large">{entry.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <Markdown source={entry.body} />
              <p className="mt-6 pt-4 border-t border-border text-2xsmall text-muted-foreground">
                Source of truth:{" "}
                <a
                  href={`https://github.com/chris-hug/muza-prototypes/blob/main/${entry.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-text hover:underline underline-offset-2"
                >
                  {entry.path}
                </a>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
