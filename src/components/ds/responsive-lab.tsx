"use client"

/*
 * ResponsiveLab — a real page at a chosen width, not a diagram of one.
 *
 * The first version of this was a schematic: two abstract rulers on a shared
 * pixel scale, with the arithmetic drawn between them. It was correct and
 * unreadable — a bare "208" in a grey box, blue that stood for nothing you
 * could name, and no way to see what any of it did to actual content.
 *
 * This is the IRIS studio's layout stage instead. One frame, set to a real
 * viewport width, containing the real page chrome at its real size and the
 * REAL CardRail inside it. Pick a width and the cards reflow, because they
 * are cards and not rectangles: the rail's `@min-[560px]` container queries
 * measure the content column, and the content column here is genuinely that
 * many pixels wide.
 *
 *   ┌ stage — scrolls sideways when the frame is wider than the page ──────┐
 *   │ ┌ frame: width = the chosen viewport ─────────────────────────────┐  │
 *   │ │ ░ sidebar 208 ░│▨40▨│  ├──── 781 px content ────┤  │▨40▨│       │  │
 *   │ │                │    │  [ the real CardRail, real AlbumCards ]   │  │
 *   │ └─────────────────────────────────────────────────────────────────┘  │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Two things follow from using real pixels rather than a scale:
 *
 *   · At 1920 the frame does not fit the page, so the stage scrolls. That is
 *     the honest version — shrinking it to fit would mean every card in it is
 *     drawn at a size the app never renders, which is the exact mistake the
 *     old schematic made.
 *   · `useIsMobile()` / `useFooterNav()` still read the REAL window, so the
 *     chrome in the frame is drawn from `sidebarAt()` / `gutterAt()` — pure
 *     functions of the chosen width. Only component-level swaps gated on
 *     those hooks (dropdown ⇄ bottom sheet) cannot be shown here; the table
 *     below names the widths where they happen.
 *
 * Every number comes from `breakpoints.ts`.
 */

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { SIDEBAR_COLLAPSE_BELOW, WindowWidthContext } from "@/lib/use-media-query"
import {
  STACK, SIDEBAR_FULL, VIEWPORTS, DRAWER_FROM,
  gutterAt, sidebarAt, containerAt, colsAt, drawerAt, contentCapAt,
} from "@/lib/breakpoints"
import CardRailRowExample from "@/ds-examples/card-rail-row"

/** The 45° hatch that marks a gutter — `--color-border`, as everywhere else. */
const HATCH: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--color-border) 0 1px, transparent 1px 6px)",
}

/* No graph paper behind the frame, deliberately — unlike `Example`. There the
   ruled ground says "the component stops here, nothing failed"; here the frame
   already ends in a border and a shadow, and a grid running past it read as a
   second thing to decode next to the hatched gutters. */

/* ── the sidebar stand-in ───────────────────────────────────────────────── */

/*
 * Not the real `Sidebar`: that one reads the real window to decide its own
 * state, so dropping it in here would show the browser's chrome inside a frame
 * claiming to be 375px wide. What matters for this drawing is its WIDTH and
 * which of the three states it is in, and both are computed. It is drawn muted
 * on purpose — it is the thing taking space away, not the subject.
 */
function ChromeSidebar({ width }: { width: number }) {
  const full = width === SIDEBAR_FULL
  return (
    <div
      aria-hidden
      className="shrink-0 self-stretch border-r border-border bg-foreground/[0.04] py-4"
      style={{ width }}
    >
      <div className={cn("flex flex-col gap-3", full ? "px-3" : "items-center px-2")}>
        {[0, 1, 2, 3].map(i => (
          <span key={i} className="flex items-center gap-2">
            <span className="size-4 shrink-0 rounded-xs bg-muted-foreground/25" />
            {full && <span className="h-2 flex-1 rounded-full bg-muted-foreground/20" style={{ maxWidth: 70 + i * 12 }} />}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── the lab ────────────────────────────────────────────────────────────── */

export function ResponsiveLab() {
  /* Opens at the sidebar-collapse point: the one width where the page gets
     wider and the content gets NARROWER, which is the whole reason the two
     systems have to be told apart. Imported, never typed. */
  /*
   * `null` is FREE: the frame takes whatever width the stage has right now,
   * which is IRIS's own default — its iframe carries no width at all until a
   * chip is clicked, and the chip whose band the measured width falls into is
   * the one that lights up. Free is the honest version of "follow the window":
   * it follows the space the section actually has, which is the only width a
   * frame on this page can truthfully be.
   */
  const [pick, setPick] = useState<number | null>(null)
  const [avail, setAvail] = useState<number | null>(null)
  const [liveW, setLiveW] = useState<number | null>(null)

  /* The docked playlist editor. It is a toggle here and not a footnote,
     because it is the single fact that breaks "the content width follows
     from the window": open it and a 768px window leaves 294px of content —
     narrower than a 320px phone. Nothing else on this page can show that. */
  const [drawer, setDrawer] = useState(false)

  /* The real browser width, printed beside the frame's. A READOUT and not a
     setting: a "follow the window" mode was tried here and is impossible by
     construction — the frame is the whole window drawn inside a fraction of
     that same window, so following it means a frame that is always wider than
     the space it has (1795px of frame in 1400px of stage, every time). Free
     does what that mode was reaching for, without the lie. */
  useEffect(() => {
    const onResize = () => setLiveW(window.innerWidth)
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  /* What the stage has to give. Safe to feed straight back into the frame's
     width: the stage is a block-level flex row, so its own width comes from
     the page and never from the child being measured. */
  const stage = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setAvail(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* Before the first measurement there is nothing honest to draw a frame at,
     so fall back to the width where the two systems visibly disagree. */
  const w = pick ?? avail ?? SIDEBAR_COLLAPSE_BELOW

  /* The chain, in the order the page computes it. */
  const gutter    = gutterAt(w)
  const sidebar   = sidebarAt(w)
  const drawerW   = drawer ? drawerAt(w) : 0
  const container = containerAt(w, { drawer: drawerW })
  const cols      = colsAt(container)
  const peek      = container < STACK
  /* Whether the wrapper's own ceiling is what limits the column, rather than
     the window. Worth saying out loud: past this point a wider monitor adds
     margin, not content, and the arithmetic below would otherwise look wrong. */
  const capped    = w - sidebar - drawerW > contentCapAt(w)

  /* Keep the left edge in view when a pick is wider than the stage: without
     this, choosing 1920 looks like nothing happened until you scroll. */
  useEffect(() => { if (stage.current) stage.current.scrollLeft = 0 }, [w])


  return (
    <div className="mb-8 flex flex-col gap-3">
      {/* Chips right, live readout beside them — the same place every width
          picker in this design system sits. These are VIEWPORT widths; the
          `Example` frame's chips are CONTAINER widths. */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-small text-muted-foreground">
          <span className="font-medium text-foreground">Pick a window width</span> — the frame
          below really is that wide, and the cards in it are the real ones.
        </p>
        <span className="ml-auto flex items-center gap-2">
          {/* The counterpart of the `Example` frame's "content" label. These
              are WINDOW widths — the whole browser, chrome included. */}
          <span
            className="text-2xsmall text-muted-foreground/70 max-sm:hidden"
            title="These are WINDOW widths — the whole browser. What the component inside measures is the column, printed on the frame."
          >
            window
          </span>
          <span className="flex gap-0.5 rounded-full bg-muted p-0.5">
            {/* Free first, and the default. It is not a width — it is the
                absence of one, so the frame is as wide as the section can
                currently be. Resize the browser and it tracks. */}
            <button
              type="button"
              onClick={() => setPick(null)}
              aria-pressed={pick === null}
              title="No fixed width — the frame fills whatever room the page has right now"
              className={cn(
                "h-6 cursor-pointer rounded-full px-2.5 text-2xsmall font-medium transition-colors",
                pick === null ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Free
            </button>
            {VIEWPORTS.map(v => (
              <button
                key={v.px}
                type="button"
                onClick={() => setPick(v.px)}
                aria-pressed={pick === v.px}
                title={`${v.px}px — ${v.note}`}
                className={cn(
                  "h-6 cursor-pointer rounded-full px-2.5 text-2xsmall font-medium tabular-nums transition-colors",
                  pick === v.px ? "bg-background text-foreground"
                    /* In free mode the band the measured width has reached is
                       still marked, quietly — IRIS lights up LG at 1149px so
                       you can see where you landed without pinning anything. */
                    : pick === null && w >= v.px && !VIEWPORTS.some(o => o.px > v.px && w >= o.px)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v.px}
              </button>
            ))}
          </span>
          <span className="text-2xsmall tabular-nums text-foreground">
            {w}px{pick === null && <span className="text-muted-foreground"> free</span>}
          </span>
          {/* Not a chip among the widths: it does not set a width, it takes
              one away. */}
          <button
            type="button"
            onClick={() => setDrawer(d => !d)}
            aria-pressed={drawer}
            disabled={w < DRAWER_FROM}
            title={w < DRAWER_FROM
              ? `The editor is hidden below ${DRAWER_FROM}px`
              : "Dock the playlist editor — it takes its width off the column"}
            className={cn(
              "h-6 cursor-pointer rounded-full border px-2.5 text-2xsmall font-medium transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              drawer
                ? "border-transparent bg-secondary text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Editor docked
          </button>
          <span className="text-2xsmall tabular-nums text-muted-foreground">
            your window {liveW ?? "—"}px
          </span>
        </span>
      </div>

      {/* The stage. Scrolls sideways rather than scaling: a card drawn at 60%
          would be a card at a size the app never renders. */}
      <div
        ref={stage}
        className="flex overflow-x-auto rounded-xl border border-border"
        // `safe center`, not plain `center`: a centred flex item that is WIDER
        // than its scroll container has its overflow pushed off BOTH sides, and
        // the left half becomes unreachable — scrolling only ever reveals the
        // right. The `safe` keyword falls back to `start` exactly in that case,
        // so 320 sits in the middle and 1920 stays scrollable from its left
        // edge. Inline because Tailwind has no utility for the safe keyword.
        style={{ justifyContent: "safe center" }}
      >
        {/* `shrink-0`: the stage is a flex row now, so without it a 1920 frame
            would be squeezed to fit instead of overflowing — and every card in
            it would be drawn at a width the app never renders. */}
        <div className="flex min-h-full shrink-0 bg-background shadow-sm" style={{ width: w }}>

          {sidebar > 0 && <ChromeSidebar width={sidebar} />}

          <div className="flex min-w-0 flex-1 flex-col">
            {/* The page wrapper, with its real ceiling and centred the way the
                app centres it. Modelling the cap rather than letting the
                column stretch is the whole point: past a 1688px window the
                extra pixels become MARGIN, and a frame that swallowed them
                would keep telling the old lie. */}
            <div className="mx-auto flex w-full flex-1" style={{ maxWidth: contentCapAt(w) }}>
              <span aria-hidden className="shrink-0 self-stretch opacity-70" style={{ ...HATCH, width: gutter }} />

              {/* The content column. Everything inside measures THIS box — it
                  is the `@container` a real page hands its sections. */}
              <div className="@container min-w-0 flex-1 py-4">
                {/* The measure, drawn the way a dimension is drawn: two end
                    marks, a rule, and the number in the gap. It sits on the
                    content and nowhere else, which is the whole claim. */}
                <div className="mb-3 flex items-center gap-2 text-2xsmall">
                  <span aria-hidden className="h-3 w-px bg-muted-foreground/60" />
                  <span aria-hidden className="flex-1 border-t border-muted-foreground/40" />
                  <span className="tabular-nums text-foreground">{container} px column</span>
                  <span aria-hidden className="flex-1 border-t border-muted-foreground/40" />
                  <span aria-hidden className="h-3 w-px bg-muted-foreground/60" />
                </div>

                <WindowWidthContext.Provider value={w}>
                  <CardRailRowExample />
                </WindowWidthContext.Provider>
              </div>

              <span aria-hidden className="shrink-0 self-stretch opacity-70" style={{ ...HATCH, width: gutter }} />
            </div>

            {/* The third chrome state costs height, not width — so it is drawn
                where it actually sits rather than as a column. */}
            {sidebar === 0 && (
              <div aria-hidden className="flex h-11 shrink-0 items-center justify-around border-t border-border bg-foreground/[0.04] px-6">
                {[0, 1, 2, 3].map(i => <span key={i} className="size-4 rounded-xs bg-muted-foreground/25" />)}
              </div>
            )}
          </div>

          {/* The docked editor — a flex SIBLING of the content, which is
              exactly how it sits in the app, and why it takes its width off
              the column instead of floating over it. */}
          {drawerW > 0 && (
            <div
              aria-hidden
              className="flex shrink-0 flex-col gap-2 self-stretch border-l border-border bg-foreground/[0.04] p-4"
              style={{ width: drawerW }}
            >
              <span className="h-2 w-24 rounded-full bg-muted-foreground/25" />
              <span className="mt-1 flex-1 rounded-md border border-dashed border-border" />
              <span className="text-2xsmall tabular-nums text-muted-foreground">editor {drawerW}px</span>
            </div>
          )}
        </div>
      </div>

      {/* One sentence, in the order the page computes it. The arithmetic is
          here and nowhere else — on the frame it would be a second copy. */}
      <p className="text-xsmall text-muted-foreground tabular-nums">
        {capped
          ? <>capped at <span className="text-foreground">{contentCapAt(w)}px</span> — a{" "}
              {w}px window has more room than the page will use</>
          : <><span className="text-foreground">{w}px window</span>
              {sidebar > 0 && (
                <> − <span className="text-foreground">{sidebar}px</span> {sidebar === SIDEBAR_FULL ? "sidebar" : "icon rail"}</>
              )}
              {drawerW > 0 && (
                <> − <span className="text-foreground">{drawerW}px</span> editor</>
              )}</>}
        {" "}− <span className="text-foreground">2 × {gutter}px</span> gutter (hatched)
        {" "}= <span className="text-foreground">{container}px</span> column
        {" · "}{cols} card {cols === 1 ? "column" : "columns"}
        {peek ? ", rail cuts its last card as a swipe cue" : ", rail ends flush"}
        {sidebar === 0 && (
          <span className="ml-2 text-muted-foreground/80">
            No sidebar here — the tab bar sits at the bottom and costs height, not width.
          </span>
        )}
        {drawerW > 0 && (
          <span className="ml-2 text-muted-foreground/80">
            With the editor docked the column is no longer a function of the window.
          </span>
        )}
      </p>

      {/* What the frame cannot show, and the shape of the whole ladder — the
          IRIS pattern: one stage, then a plain table. */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-xsmall tabular-nums">
          <thead className="border-b border-border bg-muted text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Name</th>
              <th scope="col" className="px-3 py-2 font-medium">Window</th>
              <th scope="col" className="px-3 py-2 font-medium">Sidebar</th>
              <th scope="col" className="px-3 py-2 font-medium">Gutter</th>
              <th scope="col" className="px-3 py-2 font-medium">Column</th>
              {/* The second content column is the point of the table now: the
                  same window, with the editor docked, is a different app. */}
              <th scope="col" className="px-3 py-2 font-medium">…with editor</th>
              <th scope="col" className="px-3 py-2 font-medium">Cards</th>
              {/* No separate "Defined in" column: only four of these widths
                  have a constant to name, so it was five empty cells and a
                  header. The constant now sits at the end of the sentence it
                  belongs to. */}
              <th scope="col" className="px-3 py-2 font-medium">What changes here</th>
            </tr>
          </thead>
          <tbody>
            {VIEWPORTS.map(v => {
              const c = containerAt(v.px)
              const prev = containerAt(v.px - 1)
              const lost = prev - c
              const d = drawerAt(v.px)
              const withDrawer = d > 0 ? containerAt(v.px, { drawer: d }) : null
              return (
                <tr
                  key={v.px}
                  // The active width is a SELECTED row and wears the table's own
                  // token for it (`data-[state=selected]:bg-muted`, table.tsx) —
                  // not a primary tint, which reads as a link or a focus ring.
                  // A row is also a second way to pick that width: click it and
                  // the chip above follows, since both read `pick`.
                  data-state={w === v.px ? "selected" : undefined}
                  onClick={() => setPick(v.px)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPick(v.px) } }}
                  tabIndex={0}
                  aria-pressed={pick === v.px}
                  title={`Show the frame at ${v.px}px`}
                  className={cn(
                    "border-b border-border last:border-0 cursor-pointer transition-colors",
                    "hover:bg-muted data-[state=selected]:bg-muted",
                    "outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                  )}
                >
                  <th scope="row" className="whitespace-nowrap px-3 py-2 font-medium text-foreground">{v.name}</th>
                  <td className="px-3 py-2 text-foreground">{v.px}</td>
                  <td className="px-3 py-2 text-muted-foreground">{sidebarAt(v.px) || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{gutterAt(v.px)}</td>
                  <td className="px-3 py-2 text-foreground">
                    {c}
                    {/* The counter-intuitive part, marked only where it is
                        true: the page grew and the content shrank. */}
                    {lost > 0 && (
                      <span className="ml-1.5 text-muted-foreground">−{lost} vs {v.px - 1}px</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {withDrawer == null
                      ? <span title={`The editor is hidden below ${DRAWER_FROM}px`}>—</span>
                      : <>{withDrawer}<span className="ml-1.5 text-muted-foreground/70">−{c - withDrawer}</span></>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {colsAt(c)}{c < STACK && " · peek"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {v.note}
                    {/* The constant to import instead of typing the number —
                        `608` and `1069` are arithmetic and move if anything in
                        their chain does. Named here rather than in a column
                        of its own, since most widths have none. */}
                    {v.where !== "—" && (
                      <>
                        {" · "}
                        <code className="rounded-sm bg-muted px-1 font-sans text-2xsmall font-normal">{v.where}</code>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="max-w-2xl text-2xsmall text-muted-foreground">
        The names are <span className="text-foreground">width bands, not devices</span> — a 1024px
        tablet held sideways is “Desktop” here, and that is right: what matters is the room the
        layout has, never what the hardware is called. Two of them are gates with a job:{" "}
        <span className="text-foreground">608 = chrome</span> (tab bar, mobile header, mini player) and{" "}
        <span className="text-foreground">768 = presentation</span> (sheets ⇄ dialogs, the docked editor) — Tailwind’s{" "}
        <code className="rounded-sm bg-muted px-1 font-sans text-2xsmall font-normal">md:</code> is that second gate in CSS, and the only screen token allowed to switch a presentation;{" "}
        <code className="rounded-sm bg-muted px-1 font-sans text-2xsmall font-normal">sm:</code> /{" "}
        <code className="rounded-sm bg-muted px-1 font-sans text-2xsmall font-normal">lg:</code> reflow in-page content only.{" "}
        <span className="text-foreground">608</span> and{" "}
        <span className="text-foreground">1069</span> are arithmetic —{" "}
        <code className="rounded-sm bg-muted px-1 font-sans text-2xsmall font-normal">560 + 2×24</code> and{" "}
        <code className="rounded-sm bg-muted px-1 font-sans text-2xsmall font-normal">780 + 208 + 80 + 1</code>{" "}
        — so never write either number into a component.
      </p>

      <p className="max-w-2xl text-2xsmall text-muted-foreground">
        Three of these widths make the page wider and the column narrower — the
        chrome that appears there costs more than the pixel gained. Every number
        is computed from{" "}
        <code className="rounded-sm bg-muted px-1 font-sans text-2xsmall font-normal">breakpoints.ts</code>;
        inside a frame the chip IS the window — presentation swaps gated on{" "}
        <code className="rounded-sm bg-muted px-1 font-sans text-2xsmall font-normal">useIsMobile()</code>{" "}
        read the chip, so a 375 frame opens sheets; the sheet itself is portaled to your real
        window, so it appears at the bottom of the browser. A component that measures its own{" "}
        <span className="text-foreground">box</span> (song row, player bar, player overlay) has its
        own chips on its own section.
      </p>
    </div>
  )
}
