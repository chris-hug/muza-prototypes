"use client"

/*
 * Accordion — three FAQ entries, one open at a time (base-ui's default;
 * pass `multiple` to let several stay open). Click a heading, or arrow
 * between them with the keyboard.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Accordion` parts. The hairlines between items, the chevron and its turn,
 * and the panel's type are all the component's — a call site gives it
 * headings and body text and nothing else.
 */

import {
  Accordion, AccordionItem, AccordionPanel, AccordionTrigger,
} from "@/components/ui/accordion"

const FAQ = [
  {
    value: "payments",
    q: "How do I get paid?",
    a: "Payouts arrive in your Muza wallet immediately on every sale. Withdraw to a connected bank account at any time.",
  },
  {
    value: "rights",
    q: "Do I keep my rights?",
    a: "Yes — you retain full ownership of your masters and compositions. Muza only handles distribution and storefront.",
  },
  {
    value: "exclusive",
    q: "Is Muza exclusive?",
    a: "No. You can release the same music on any other platform at any time.",
  },
]

export default function AccordionBasicExample() {
  return (
    <div className="w-full max-w-md">
      <Accordion defaultValue={["payments"]}>
        {FAQ.map(item => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionPanel>{item.a}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
