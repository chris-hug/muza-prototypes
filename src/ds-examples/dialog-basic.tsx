"use client"

/*
 * Dialog, LIVE — a trigger that opens the real `Dialog` (portal, backdrop,
 * focus trap). The same "Create Listing" picker the static frame above shows
 * with `DialogPreview`, so the two frames are one dialog seen twice. Below a
 * 768 window chip the trigger opens a bottom sheet; from 768 a centred modal.
 */

import { useState } from "react"
import { Disc3, Disc, CassetteTape } from "lucide-react"

import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioCardGroup, RadioCard } from "@/components/ui/radio-card"

const KINDS = [
  { value: "vinyl",    title: "Vinyl",        description: "LPs, EPs, singles and limited pressings.", icon: <Disc3 /> },
  { value: "cd",       title: "Compact Disc", description: "Albums, EPs and special editions on CD.",  icon: <Disc /> },
  { value: "cassette", title: "Cassette",     description: "Full releases and limited runs on tape.",  icon: <CassetteTape /> },
]

export default function DialogBasicExample() {
  const [kind, setKind] = useState("vinyl")

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open: Create Listing
      </DialogTrigger>
      {/* Desktop width only — the sheet below 768 comes from the base. */}
      <DialogContent className="md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Listing</DialogTitle>
          <DialogDescription>Choose what you want to sell.</DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <DialogClose render={<Button size="lg" variant="outline" />}>Cancel</DialogClose>
          <Button size="lg">Create Listing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
