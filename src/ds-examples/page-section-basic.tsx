"use client"

/*
 * Page Section in its three shapes, stacked the way a detail page stacks
 * them: flat (the default), flat with an action beside the heading, and
 * boxed — the heading stays outside the card so all three share one
 * hierarchy.
 *
 * This file is a CALL SITE, not a copy: the real `Section` from
 * `section.tsx` (the buyer's purchase detail and the seller's order detail
 * both compose their pages from it). The content is placeholder prose; in
 * the app it is the fulfillment form, the timeline, the items list.
 */

import { Section } from "@/components/app/section"
import { Button } from "@/components/ui/button"

export default function PageSectionBasicExample() {
  return (
    <div className="flex flex-col gap-10">
      <Section title="Shipment">
        <p className="text-small text-muted-foreground">
          Flat — heading and content, no chrome. The vertical rhythm between
          neighbouring sections is the separation.
        </p>
      </Section>

      <Section title="Fulfillment" action={<Button variant="outline">Mark as shipped</Button>}>
        <p className="text-small text-muted-foreground">
          The action slot right-aligns beside the heading — the one forward
          step this section offers.
        </p>
      </Section>

      <Section title="Items" boxed>
        <p className="text-small text-foreground">
          Boxed — a bordered card around the content, for a list of products
          or data rows where the container reinforces the grouping.
        </p>
      </Section>
    </div>
  )
}
