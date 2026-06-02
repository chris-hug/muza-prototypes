"use client"

/*
 * ResponsiveDiagram — a DS-only schematic of the responsive ladder: three
 * wireframe layout frames (desktop / tablet / phone) showing how the nav
 * chrome, page gutter and card-column count change together, plus a
 * column-ladder strip mapping container width → column count.
 *
 * Purely illustrative — hardcoded proportions, not the real components.
 * The source of truth is the ladder block in app.css.
 */

import { cn } from "@/lib/utils"

// A single placeholder "card" rect in a frame.
const Card = () => <div className="flex-1 rounded-[3px] bg-foreground/15 aspect-square min-w-0" />

// A few faint nav-item lines for the sidebar wireframe.
function NavLines({ count, icon }: { count: number; icon?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 p-1.5">
      {Array.from({ length: count }).map((_, i) => (
        icon
          ? <div key={i} className="size-2.5 rounded-[2px] bg-foreground/20" />
          : <div key={i} className="h-1.5 rounded-full bg-foreground/15" style={{ width: `${60 + (i % 3) * 12}%` }} />
      ))}
    </div>
  )
}

interface FrameProps {
  title: string
  range: string
  gutter: string
  cols: number
  /** Visual gutter width in px (schematic, scaled down). */
  gutterPx: number
  nav: "sidebar" | "rail" | "footer"
}

function Frame({ title, range, gutter, cols, gutterPx, nav }: FrameProps) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-small font-medium text-foreground">{title}</span>
        <span className="text-2xsmall text-muted-foreground tabular-nums">{range}</span>
      </div>

      {/* Wireframe viewport */}
      <div className="relative h-44 rounded-lg border border-border bg-muted/30 overflow-hidden flex">
        {/* Sidebar / icon rail (left) */}
        {nav === "sidebar" && (
          <div className="w-[34px] shrink-0 border-r border-border bg-background"><NavLines count={5} /></div>
        )}
        {nav === "rail" && (
          <div className="w-[22px] shrink-0 border-r border-border bg-background"><NavLines count={5} icon /></div>
        )}

        {/* Content area */}
        <div className="relative flex-1 min-w-0 flex flex-col">
          {/* Gutter bands — shaded strips at the content edges */}
          <div aria-hidden className="absolute inset-y-0 left-0 bg-primary/10 border-r border-dashed border-primary/30" style={{ width: gutterPx }} />
          <div aria-hidden className="absolute inset-y-0 right-0 bg-primary/10 border-l border-dashed border-primary/30" style={{ width: gutterPx }} />

          {/* Card grid */}
          <div className="flex-1 flex items-start gap-1.5 py-2.5" style={{ paddingLeft: gutterPx + 6, paddingRight: gutterPx + 6 }}>
            {Array.from({ length: cols }).map((_, i) => <Card key={i} />)}
          </div>
        </div>

        {/* Footer tab bar (phone) */}
        {nav === "footer" && (
          <div className="absolute inset-x-0 bottom-0 h-7 border-t border-border bg-background/80 backdrop-blur-sm flex items-center justify-center gap-5">
            {[0, 1, 2].map(i => <div key={i} className={cn("size-2.5 rounded-[2px]", i === 0 ? "bg-foreground/40" : "bg-foreground/15")} />)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-2xsmall text-muted-foreground tabular-nums">
        <span><span className="text-foreground">{gutter}</span> gutter</span>
        <span>{cols === 2 ? "1–2" : title === "Tablet" ? "3–4" : "5–7"} cols</span>
      </div>
    </div>
  )
}

// Container-width → column-count ladder.
const STEPS = [
  { w: 304, c: 2 }, { w: 464, c: 3 }, { w: 692, c: 4 },
  { w: 928, c: 5 }, { w: 1164, c: 6 }, { w: 1500, c: 7 },
]

function ColumnLadder() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-2xsmall text-muted-foreground">
          <span className="tabular-nums text-foreground">&lt;304</span> 1 col
        </span>
        {STEPS.map(s => (
          <div key={s.w} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="text-muted-foreground/40">›</span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-2xsmall text-muted-foreground">
              <span className="tabular-nums text-foreground">{s.w}</span> {s.c} cols
            </span>
          </div>
        ))}
      </div>
      <p className="text-2xsmall text-muted-foreground">
        Container width (not viewport). Cards are <span className="text-foreground tabular-nums">143–220px</span>; a column is added only once the current ones reach their 220px cap — so cards stay large instead of splitting early.
      </p>
    </div>
  )
}

export function ResponsiveDiagram() {
  return (
    <div className="flex flex-col gap-7 max-w-3xl rounded-xl border border-border p-5">
      {/* Three layout tiers */}
      <div className="grid grid-cols-1 @min-[560px]:grid-cols-3 gap-5">
        <Frame title="Desktop" range="≥ 1069px" gutter="40px" gutterPx={11} cols={5} nav="sidebar" />
        <Frame title="Tablet"  range="584–1068" gutter="24px" gutterPx={7}  cols={3} nav="rail" />
        <Frame title="Phone"   range="< 584px"  gutter="12px" gutterPx={4}  cols={2} nav="footer" />
      </div>

      {/* Legend for the gutter band */}
      <div className="flex items-center gap-2 text-2xsmall text-muted-foreground -mt-3">
        <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] bg-primary/10 border border-dashed border-primary/30" />
        page gutter (<code className="font-sans px-1 rounded-sm bg-muted">px-page</code>) · sidebar collapses to an icon rail below 1069, then to a bottom tab bar below 768
      </div>

      <div className="h-px bg-border" />

      <ColumnLadder />
    </div>
  )
}
