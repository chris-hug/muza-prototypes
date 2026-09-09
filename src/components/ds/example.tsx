"use client"

/*
 * Example — the design system's demo frame.
 *
 * Modelled on the IRIS studio's stage: a titled card whose body is the LIVE
 * component, constrained to a chosen breakpoint width so its responsive
 * behaviour can be seen without resizing the browser. The head carries two
 * icon buttons:
 *
 *   · `</>` — the CALL SITE: the file that renders in the frame, showing how
 *            the real component is used. Not its implementation — that is
 *            behind "Source" in the section header;
 *   · `ⓘ`  — the component's docs, read straight from
 *            `docs/components/<id>.md`. Same file an agent reads, so the
 *            prose exists once.
 *
 * Width is applied with a plain `max-width` on the stage, and the stage is a
 * `@container`, so components written against container queries (cards, rails,
 * media rows) react exactly as they would at that COLUMN width. A window chip
 * also stands in for the window: `WindowWidthContext` makes `useIsMobile()`
 * and `useFooterNav()` read the chip instead of the browser, so a "375" frame
 * opens sheets where the app would. The sheet itself is still portaled to the
 * real window (the presentation is the phone's, the geometry is yours). An
 * iframe would isolate the theme and double the work.
 */

import { useState } from "react"
import { Code2, Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { VIEWPORTS, containerAt, sidebarAt, gutterAt } from "@/lib/breakpoints"
import { WindowWidthContext } from "@/lib/use-media-query"
import { ChromeSidebar, ChromeGutter, ChromeTabBar } from "@/components/ds/chrome-schematic"

export type ExampleWidth = {
  label: string
  /** The width the STAGE is set to — what the component measures. */
  px: number
  note: string
  /** What the readout prints when this chip is active. Defaults to `px`. */
  readout?: string
  /** The page chrome to draw around the stage, when this chip is a window
   *  width. Omitted for chips that are a plain box width (a component's own
   *  steps), where there is no chrome to speak of. */
  chrome?: { window: number; sidebar: number; gutter: number }
}

/*
 * ONE ladder on the page: the same window widths the Responsive section is
 * picked in. The frame is still a container — it sets itself to what that
 * window LEAVES after the chrome — so a chip labelled 1069 makes the stage
 * 781px wide and says so.
 *
 * This replaced a second ladder of raw container steps (304 · 464 · 692 · 928
 * · 1164 · 1500). Those were the card grid's own switch points, which made
 * them exact but unlabelled: a 464px column does exist (a 488px window), but
 * nothing on the page said so. Two unlabelled number sets on one page read as
 * a contradiction, and labelling them did not fix it — it only named the
 * contradiction. Nothing was lost by dropping them:
 * stepping through these nine windows yields column counts 2·2·3·3·3·4·5·6·7,
 * so every step of the card ladder is still reachable, at a width that
 * actually occurs.
 *
 * A component with steps of its OWN is the exception and passes `widths` —
 * `SongListItem` does. Not because its 260/300/380 are unreachable from a
 * window: sweeping every width from 320 to 1920 finds them at 348 (a rail
 * cell), 340 and 388, 420 and 468. The reason is that a window does not
 * DETERMINE that row's width. At a 1069px window the same component is 765px
 * wide in a list and 363px in a `SongRail` cell — one number in, two answers
 * out. Only its own box says which, so its chips are its own box.
 */
export const WINDOW_WIDTHS: ExampleWidth[] = VIEWPORTS.map(v => {
  const container = containerAt(v.px)
  const sidebar = sidebarAt(v.px)
  const gutter = gutterAt(v.px)
  return {
    label: String(v.px),
    px: container,
    note: `${v.note} — leaves a ${container}px column`,
    readout: `${v.px} → ${container}px`,
    chrome: { window: v.px, sidebar, gutter },
  }
})

/*
 * What `</>` shows: the call-site file with its explanatory head removed.
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
  widths = WINDOW_WIDTHS,
  widthLabel = "window",
  responsive = true,
  controls,
  bleed: bleedFn,
  align = "center",
  frameless = false,
  className,
  stageClassName,
  children,
}: {
  /** Variant name, e.g. "Bottom sheet". Optional — a lone demo needs none. */
  title?: string
  /** Section id whose `docs/components/<id>.md` backs the ⓘ button. */
  doc?: string
  /** The CALL SITE for the `</>` panel — pass the demo module's own source
   *  (`import src from "…?raw"`), so what is shown is what renders. Never a
   *  snippet typed beside the demo: that is a second copy, and it drifts. */
  code?: string
  /** Repo-relative path of that file — printed above the snippet and linked
   *  to GitHub, so the panel says where its truth lives. */
  codePath?: string
  /** Start at a fixed step instead of full width. */
  defaultWidth?: string
  /** Override the width chips for a component with steps of its own — see
   *  the note above `WINDOW_WIDTHS`. Defaults to the window ladder. */
  widths?: ExampleWidth[]
  /** What the chips measure, named beside them. `window` by default; say
   *  `row` (or whatever the box is) when passing `widths`. */
  widthLabel?: string
  /** `false` for a component that does not answer to width at all — Button,
   *  Badge, Spinner, Avatar. The width picker is hidden and the stage runs
   *  full width; `</>` and ⓘ stay. Chips on such a component advertise a
   *  responsiveness it does not have. */
  responsive?: boolean
  /** Variant switches — rendered at the left of the toolbar. */
  controls?: React.ReactNode
  /** When the demo is CHROME-level at a given window — a bottom sheet, which
   *  spans the window edge to edge and covers the tab bar — return true and
   *  the frame draws no gutters, no tab bar and no stage padding at that chip,
   *  so the demo really touches the frame's edges. `w => w < 768` for a
   *  component that is a sheet below the presentation gate. */
  bleed?: (windowPx: number) => boolean
  /** How the demo sits in the frame. `center` (default) shrink-wraps it —
   *  right for a dialog or a card that has its own width. `stretch` makes it
   *  fill the frame, which is the only way a component that READS its
   *  container width (rails, grids, anything with `@min-[…]` classes) can
   *  react to the breakpoint chips at all. */
  align?: "center" | "stretch"
  /** Drops the frame: no border, no surface, no chrome — just the demo, in the
   *  page's own background, with the toolbar still above it.
   *
   *  A frame is a claim that the component has an EDGE worth showing: a card,
   *  a dialog, a rail that reacts to its container. A row of buttons has no
   *  edge — it sizes from a prop and renders identically at 320 and at 1920 —
   *  so boxing it invents a container the component never has, and the reader
   *  spends attention on a rectangle that means nothing. */
  frameless?: boolean
  className?: string
  stageClassName?: string
  children: React.ReactNode
}) {
  const [width, setWidth] = useState<string | null>(defaultWidth ?? null)
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const active = widths.find(w => w.label === width)
  const px = active?.px

  /*
   * The readout spells out the step the chip does not have room for. A window
   * chip prints `1069 → 781px`, so the frame never shows a number the reader
   * has to derive. A chip that carries no `readout` — a component's own steps
   * — prints its label, because there the label already IS the width.
   */
  const readout = !active ? "free" : active.readout ?? `${active.px}px`

  /* Chrome is drawn only for a window chip. With none — "free", or a chip that
     is a plain box width — the stage is the frame, as before. */
  const chrome = active?.chrome
  /* A sheet is chrome, not column: at a window chip where the demo says so it
     fills the window, gutters and tab bar included. */
  const bleed = !!chrome && !!bleedFn?.(chrome.window)

  const usage = code ? usageOf(code) : undefined

  const copy = () => {
    if (!usage) return
    navigator.clipboard?.writeText(usage)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    /* `data-slot` is not decoration: `Section` uses it to space CONSECUTIVE
       examples apart (`[data-slot=ds-example]+[data-slot=ds-example]`) without
       also pushing the prose paragraphs some sections put between them. A
       plain `gap` on the children would have stacked on top of their own
       margins. */
    <div data-slot="ds-example" className={cn("flex flex-col gap-2", className)}>
      {/* Title row — name at the left, the width picker at the right. */}
      <div className="flex items-center gap-3 min-w-0">
        {title && <p className="text-small font-medium text-foreground truncate">{title}</p>}
        {/* No picker for a component that does not answer to width. A Button
            takes its size from a prop and renders identically at 320 and at
            1920, so a row of chips beside it promises a behaviour it does not
            have — and invites the reader to hunt for a difference that is not
            there. The `</>` and ⓘ buttons stay: those are useful either way. */}
        <div className={cn("ml-auto flex items-center gap-1 shrink-0", !responsive && "hidden")}>
          {/* Named, because a bare row of numbers beside a component invites
              exactly one question — "which width is that?" — and the page used
              to answer it differently in two places. Everything here is a
              WINDOW width now, the same ladder the Responsive section uses;
              the readout carries the container it leaves. */}
          <span
            className="mr-1 text-2xsmall text-muted-foreground/70 max-sm:hidden"
            title={`These are ${widthLabel.toUpperCase()} widths — the box the component itself measures. The window is wider by the sidebar and the page gutter; see the Responsive section.`}
          >
            {widthLabel}
          </span>
          {widths.map(w => (
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
            {readout}
          </button>
        </div>
      </div>

      <div className={cn(!frameless && "rounded-xl border border-border overflow-hidden")}>
        {/* Toolbar — variant controls left, code + docs right. */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 border-b border-border min-h-11",
          frameless ? "bg-transparent px-0" : "bg-muted",
        )}>
          <div className="flex-1 min-w-0 flex items-center gap-2">{controls}</div>
          <div className="shrink-0 flex items-center gap-1">
            {code && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={showCode ? "Hide the call site" : "Show the call site"}
                title="The call site — how the component is used, not how it is built"
                aria-expanded={showCode}
                onClick={() => setShowCode(v => !v)}
                className={cn(showCode && "bg-secondary")}
              >
                <Code2 />
              </Button>
            )}
            {/* NO docs button here. The section header carries one, and it
                opens the same file: every `doc` prop on this page equals its
                section's id, so a second button was the same document behind
                a different icon — and the two had already drifted, one with
                the file path in its header and one with it in a footer. One
                document, one door. */}
          </div>
        </div>

        {/* Markup panel. */}
        {showCode && usage && (
          <div className="relative border-b border-border">
            {/* Say plainly WHAT this is. It is not the component's source —
                that sits behind "Source" in the section header. It is the
                call site: the file that renders in the frame above, showing
                how the real component is used. */}
            {codePath && (
              <p className="px-3 pt-3 text-2xsmall text-muted-foreground bg-muted">
                <span className="text-foreground font-medium">Call site</span>
                <span className="opacity-70"> — this exact file renders in the frame above; it imports the real component. </span>
                <a
                  href={`https://github.com/chris-hug/muza-prototypes/blob/main/${codePath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-text hover:underline underline-offset-2"
                >
                  {codePath}
                </a>
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
            at a narrow step the component no longer fills the card, and the
            ruled ground makes that emptiness read as "this is how wide it is"
            instead of "something failed to render". The grid is its own
            absolutely positioned layer so its opacity can't reach the demo,
            and the frame sits on `bg-background` — an opaque surface, so the
            grid never shows through the component itself. */}
        {/* The ruled ground is only visible where the frame ENDS — no padding
            of its own. A ring of grid around a full-width frame would be a
            second border inside a bordered card, framing nothing. */}
        <div
          className="relative flex overflow-x-auto"
          // `safe center`, not plain `center`: a centred flex item WIDER than
          // its scroll container has its overflow pushed off both sides and
          // the left half becomes unreachable. `safe` falls back to `start`
          // exactly in that case, so a 1920 window stays scrollable from its
          // left edge. Inline because Tailwind has no utility for it.
          style={{ justifyContent: "safe center" }}
        >
          {/* The 12px graph paper. It is a RULER — it exists to make the
              stage read as a measured surface when a frame is showing you how
              wide something is. Frameless has no stage and nothing to measure,
              so the grid there was just lines behind the content. */}
          {!frameless && (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 opacity-40",
                "bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)]",
                "[background-size:12px_12px]",
              )}
            />
          )}
          {/* The chrome, drawn around the stage whenever the chip is a WINDOW
              width. It is what makes the ladder's one baffling step legible:
              584 leaves 536px of content, 608 leaves 508 — the window grew and
              the content shrank, because the 52px icon rail arrives at 608 and
              costs more than the 24px gained. Told as two numbers that reads
              like a bug; with the rail in the picture it reads as a cause. */}
          <div
            className={cn("flex min-w-0", chrome ? "shrink-0 flex-col" : "w-full")}
            style={chrome ? { width: chrome.window } : undefined}
          >
            <div className="flex min-w-0 flex-1">
              {chrome && chrome.sidebar > 0 && <ChromeSidebar width={chrome.sidebar} />}
              {chrome && !bleed && <ChromeGutter width={chrome.gutter} />}

              {/* The `@container` must be EXACTLY the chip's width, so padding
                  cannot live on it: a container query measures the CONTENT
                  box, so `p-6` here made every component see 48px less than
                  the chip said — at the 584 step a rail read 536 and stayed in
                  its below-560 layout. What padding there is belongs to the
                  inner surface — and beside a drawn gutter there is none. */}
              <div
                data-slot="example-stage"
                className={cn("@container relative", chrome ? "min-w-0 flex-1" : "w-full")}
                style={px && !chrome ? { maxWidth: px } : undefined}
              >
                <div
                  className={cn(
                    "flex flex-col gap-6",
                    /* Frameless keeps the page's own background: painting
                       `bg-background` inside a box that has no border would
                       still draw a rectangle, just a borderless one. */
                    frameless ? "bg-transparent" : "bg-background",
                    /* With chrome drawn, the hatched gutter IS the page's
                       horizontal padding — a second `px-6` inside the column
                       inset every component 24px further than the app ever
                       does. So: no horizontal padding beside a gutter, only
                       the page's vertical rhythm; a sheet bleeds to all four
                       edges; without chrome ("Free", a box chip) the frame is
                       just a box and keeps its own breathing room. */
                    bleed ? "p-0 items-stretch"
                      : chrome ? cn("px-0 py-6", align === "center" ? "items-center" : "items-stretch")
                      : frameless ? cn("px-0 py-6", align === "center" ? "items-center" : "items-stretch")
                      : cn("p-6", align === "center" ? "items-center" : "items-stretch"),
                    stageClassName,
                  )}
                >
                  {/* A window chip is the window for everything inside: the
                      gate hooks read it instead of the browser, so a "375"
                      frame opens sheets, not dropdowns. "Free" and a box
                      chip pass `null` — the real window. */}
                  <WindowWidthContext.Provider value={chrome?.window ?? null}>
                    {children}
                  </WindowWidthContext.Provider>
                </div>
              </div>

              {chrome && !bleed && <ChromeGutter width={chrome.gutter} />}
            </div>

            {/* Costs height, not width — drawn where it actually sits, so
                "no sidebar" does not read as "no chrome". A bleeding demo (a
                sheet) covers it, so it is not drawn then. */}
            {chrome && chrome.sidebar === 0 && !bleed && <ChromeTabBar />}
          </div>
        </div>
      </div>

    </div>
  )
}
