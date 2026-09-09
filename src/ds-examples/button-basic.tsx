"use client"

/*
 * Button — every variant at every size, text and icon-only, plus the two
 * states a caller produces without a prop: disabled, and loading (a disabled
 * button with a `Spinner` in front of the label).
 *
 * This file is a CALL SITE, not a copy: it renders the real `Button` with the
 * real `variant` / `size` props. The grid around it is only a ruler; the
 * buttons are what you copy.
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

const ROW = "grid grid-cols-[120px_auto_auto_auto] gap-x-8 items-center py-3 border-b border-border/50 last:border-b-0"
const HEAD = "text-2xsmall text-muted-foreground"

export default function ButtonBasicExample() {
  return (
    <div className="flex flex-col gap-10">
      {/* Text buttons — lg · default · sm */}
      <div className="flex flex-col">
        <div className={ROW}>
          <div />
          <p className={HEAD}>Large</p>
          <p className={HEAD}>Default</p>
          <p className={HEAD}>Small</p>
        </div>
        {VARIANTS.map(v => (
          <div key={v.key} className={ROW}>
            <p className={HEAD}>{v.label}</p>
            <div className="flex"><Button variant={v.key} size="lg">{v.label}</Button></div>
            <div className="flex"><Button variant={v.key}>{v.label}</Button></div>
            <div className="flex"><Button variant={v.key} size="sm">{v.label}</Button></div>
          </div>
        ))}
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
      </div>

      {/* Icon-only — icon-lg · icon · icon-sm. `aria-label` is the label. */}
      <div className="flex flex-col">
        <div className={ROW}>
          <div />
          <p className={HEAD}>Large</p>
          <p className={HEAD}>Default</p>
          <p className={HEAD}>Small</p>
        </div>
        {VARIANTS.map(v => (
          <div key={v.key} className={ROW}>
            <p className={HEAD}>{v.label}</p>
            <div className="flex"><Button variant={v.key} size="icon-lg" aria-label="Add"><Plus /></Button></div>
            <div className="flex"><Button variant={v.key} size="icon" aria-label="Add"><Plus /></Button></div>
            <div className="flex"><Button variant={v.key} size="icon-sm" aria-label="Add"><Plus /></Button></div>
          </div>
        ))}
        <div className={ROW}>
          <p className={HEAD}>Disabled</p>
          <div className="flex"><Button size="icon-lg" disabled aria-label="Add"><Plus /></Button></div>
          <div className="flex"><Button size="icon" disabled aria-label="Add"><Plus /></Button></div>
          <div className="flex"><Button size="icon-sm" disabled aria-label="Add"><Plus /></Button></div>
        </div>
        <div className={ROW}>
          <p className={HEAD}>Loading</p>
          <div className="flex"><Button size="icon-lg" disabled aria-label="Adding"><Spinner size="sm" /></Button></div>
          <div className="flex"><Button size="icon" disabled aria-label="Adding"><Spinner size="sm" /></Button></div>
          <div className="flex"><Button size="icon-sm" disabled aria-label="Adding"><Spinner size="sm" /></Button></div>
        </div>
      </div>
    </div>
  )
}
