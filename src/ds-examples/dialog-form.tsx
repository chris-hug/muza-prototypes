"use client"

/*
 * A design-system demo, kept in its own file so the code shown under `</>`
 * IS the code that renders: `Example` imports this module twice — once as a
 * component, once as raw text via `?raw`. There is no hand-written snippet
 * to drift out of step.
 *
 * Keep these files short and free of prototype plumbing: what a reader
 * copies out of the panel should compile in their own file.
 */

import { useState } from "react"

import {
  DialogPreview, DialogPreviewHeader, DialogPreviewTitle,
  DialogPreviewDescription, DialogPreviewFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioCardGroup, RadioCard } from "@/components/ui/radio-card"
import { Disc3, Disc, CassetteTape } from "lucide-react"

const KINDS = [
  { value: "vinyl",    title: "Vinyl",        description: "LPs, EPs, singles and limited pressings.", icon: <Disc3 /> },
  { value: "cd",       title: "Compact Disc", description: "Albums, EPs and special editions on CD.",  icon: <Disc /> },
  { value: "cassette", title: "Cassette",     description: "Full releases and limited runs on tape.",  icon: <CassetteTape /> },
]

export default function DialogFormExample() {
  const [kind, setKind] = useState("vinyl")

  return (
    <DialogPreview className="sm:max-w-[600px]">
      <DialogPreviewHeader>
        <DialogPreviewTitle>Create Listing</DialogPreviewTitle>
        <DialogPreviewDescription>Choose what you want to sell.</DialogPreviewDescription>
      </DialogPreviewHeader>

      <RadioCardGroup value={kind} onValueChange={setKind}>
        {KINDS.map(k => (
          <RadioCard
            key={k.value}
            value={k.value}
            selected={k.value === kind}
            onSelect={() => setKind(k.value)}
            icon={k.icon}
            title={k.title}
            description={k.description}
          />
        ))}
      </RadioCardGroup>

      <DialogPreviewFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Create Listing</Button>
      </DialogPreviewFooter>
    </DialogPreview>
  )
}
