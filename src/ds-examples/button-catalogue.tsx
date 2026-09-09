"use client"

/*
 * Button — the rest: the size ladder, the icon-only set, and the two states a
 * caller produces without a prop (disabled, and loading — a disabled button
 * with a `Spinner` in front of the label).
 *
 * No frame, no surface, no rules between the rows. This is a CATALOGUE: you
 * scan it for the one you need. The grid lines it used to have drew a table
 * around things that are not table data, and every rule was one more edge
 * competing with the buttons' own — which are the only edges here that mean
 * anything. Labels sit above their column in muted 15px and that is enough
 * structure; the alignment does the rest.
 *
 * A call site, not a copy: the real `Button` with the real `variant` and
 * `size` props.
 */

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const VARIANTS = [
  { key: "default",         label: "Primary" },
  { key: "secondary",       label: "Secondary" },
  { key: "outline",         label: "Outline" },
  { key: "outline-primary", label: "Primary outline" },
  { key: "ghost",           label: "Ghost" },
  { key: "link",            label: "Link" },
  { key: "destructive",     label: "Destructive" },
] as const

const ROW  = "grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-x-8 py-2"
const HEAD = "text-2xsmall text-muted-foreground"

export default function ButtonCatalogueExample() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-1">
        <p className="text-small font-medium text-foreground">Sizes</p>
        <div className={ROW}>
          <div />
          <p className={HEAD}>lg — 48px</p>
          <p className={HEAD}>default — 40px</p>
          <p className={HEAD}>sm — 32px</p>
        </div>
        {VARIANTS.map(v => (
          <div key={v.key} className={ROW}>
            <p className={HEAD}>{v.label}</p>
            <div className="flex"><Button variant={v.key} size="lg">{v.label}</Button></div>
            <div className="flex"><Button variant={v.key}>{v.label}</Button></div>
            <div className="flex"><Button variant={v.key} size="sm">{v.label}</Button></div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-1">
        <p className="text-small font-medium text-foreground">Icon only</p>
        {/* `aria-label` IS the label here — without it the button is a shape
            with no name, and a screen reader announces "button". */}
        <div className={ROW}>
          <div />
          <p className={HEAD}>icon-lg — 48px</p>
          <p className={HEAD}>icon — 40px</p>
          <p className={HEAD}>icon-sm — 32px</p>
        </div>
        {VARIANTS.map(v => (
          <div key={v.key} className={ROW}>
            <p className={HEAD}>{v.label}</p>
            <div className="flex"><Button variant={v.key} size="icon-lg" aria-label="Add"><Plus /></Button></div>
            <div className="flex"><Button variant={v.key} size="icon" aria-label="Add"><Plus /></Button></div>
            <div className="flex"><Button variant={v.key} size="icon-sm" aria-label="Add"><Plus /></Button></div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-1">
        <p className="text-small font-medium text-foreground">States</p>
        {/* Neither is a variant. `disabled` is the native attribute, and
            "loading" is that same disabled button with a `Spinner` where an
            icon would go — so there is nothing to remember beyond the two
            things you already know. */}
        <div className={ROW}>
          <div />
          <p className={HEAD}>lg</p>
          <p className={HEAD}>default</p>
          <p className={HEAD}>sm</p>
        </div>
        <div className={ROW}>
          <p className={HEAD}>Disabled</p>
          <div className="flex"><Button size="lg" disabled>Primary</Button></div>
          <div className="flex"><Button disabled>Primary</Button></div>
          <div className="flex"><Button size="sm" disabled>Primary</Button></div>
        </div>
        <div className={ROW}>
          <p className={HEAD}>Loading</p>
          <div className="flex"><Button size="lg" disabled><Spinner size="sm" />Primary</Button></div>
          <div className="flex"><Button disabled><Spinner size="sm" />Primary</Button></div>
          <div className="flex"><Button size="sm" disabled><Spinner size="sm" />Primary</Button></div>
        </div>
      </section>
    </div>
  )
}
