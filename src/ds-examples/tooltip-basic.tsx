"use client"

/*
 * Tooltip on the three things that get one: a labelled button (a hint), an
 * icon button (its name — the tooltip IS the label there), and a disabled
 * button wrapped in a span, the way the vinyl listing's Publish explains why
 * it cannot be pressed. Hover or tab to a trigger.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Tooltip` parts under one `TooltipProvider`, which is what gives a row of
 * tooltips a shared delay and lets the pointer move between them without
 * re-waiting. A disabled button fires no pointer events, hence the span.
 */

import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

export default function TooltipBasicExample() {
  return (
    <TooltipProvider delay={200}>
      <div className="flex flex-wrap items-center gap-3">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
          <TooltipContent>A short hint, one line</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Add a track"><Plus /></Button>} />
          <TooltipContent>Add a track</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Search"><Search /></Button>} />
          <TooltipContent side="bottom">Search · ⌘K</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Button disabled>Publish</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Finish shop setup to publish.</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
