"use client"

/*
 * Bulk Action Bar with icons and inline eligibility counts — the Shop ›
 * Orders shape. Each action names how many of the selected rows it applies
 * to; the count sits in `text-background/60` so it reads as a qualifier of
 * the label, not a second number competing with "8 selected". Orders hides
 * an action whose count is 0 rather than greying it out.
 */

import { Mail, Truck } from "lucide-react"

import { BulkActionBarContent, BulkActionButton } from "@/components/ui/bulk-action-bar"

export default function BulkActionBarCountsExample() {
  return (
    <div className="flex justify-center">
      <BulkActionBarContent count={8} onClear={() => {}}>
        <BulkActionButton>
          <Truck className="size-4" />Mark shipped
          <span className="text-background/60 tabular-nums">(5)</span>
        </BulkActionButton>
        <BulkActionButton>
          <Mail className="size-4" />Email
          <span className="text-background/60 tabular-nums">(8)</span>
        </BulkActionButton>
      </BulkActionBarContent>
    </div>
  )
}
