"use client"

/*
 * Collapsible — one "show more" region: a text-link trigger and the panel it
 * reveals. Click the trigger; tab to it and press Space.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Collapsible` parts. The trigger has no button chrome of its own — it is
 * meant to read as a link in running text — and the panel is bare, so the
 * surface, spacing and type inside it belong to the call site.
 */

import { ChevronDown } from "lucide-react"

import {
  Collapsible, CollapsiblePanel, CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function CollapsibleBasicExample() {
  return (
    <div className="w-full max-w-md">
      <Collapsible>
        <CollapsibleTrigger className="group">
          Show advanced options
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="mt-3 flex flex-col gap-3 rounded-lg bg-muted p-4 text-small text-foreground">
            <p>Release on a schedule, restrict to a region, or hide from search.</p>
            <p className="text-muted-foreground">
              One region that opens and closes. When there are several, stacked, that is an Accordion.
            </p>
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </div>
  )
}
