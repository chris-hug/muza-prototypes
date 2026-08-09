"use client"

/*
 * ExperimentsView — a scratch page for in-progress ideas that aren't part of
 * the product yet (motion studies, alternative marks, interaction tests).
 * Reachable from the sidebar entry right under "Design system".
 *
 * Nothing here is production UI: each experiment gets a short heading + a note
 * on what it's exploring, so the page reads as a lab bench rather than a spec.
 */

import { AnimatedMark } from "@/components/ui/animated-mark"

export function ExperimentsView() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-page pt-8 pb-24 flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xlarge font-medium text-foreground tracking-tight">Experiments</h1>
          <p className="text-small text-muted-foreground max-w-xl">
            Sketches and motion studies that aren’t part of the product yet.
          </p>
        </div>

        <Experiment
          title="Animated mark — faux 3D"
          note="Vertical bars orbit a shared axis: x = sin(angle), width = cos(angle). The foreshortening plus back-to-front painting and a depth fade read as rotation — no 3D transforms and no blur, so the edges stay crisp. Rotates on its own; the pointer’s horizontal position nudges the spin."
        >
          <AnimatedMark className="size-40 text-foreground" />
        </Experiment>
      </div>
    </div>
  )
}

// One bench slot — heading + note on the left, the live thing on a plain
// surface. Uses the same card treatment as the rest of the app.
function Experiment({
  title, note, children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-large font-medium text-foreground">{title}</h2>
        {note && <p className="text-small text-muted-foreground max-w-2xl">{note}</p>}
      </div>
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-12">
        {children}
      </div>
    </section>
  )
}
