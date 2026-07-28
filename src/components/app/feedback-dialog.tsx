"use client"

/*
 * FeedbackDialog — free-text feedback from Studio users.
 *
 * Opened from the "Send Feedback" action inside the Studio nav (sidebar +
 * mobile Studio sheet), so it's only reachable by accounts that have the
 * Studio surface. A single textarea + Cancel / Send. Built on the base
 * Dialog, so it's a centered modal on desktop and a bottom sheet on mobile.
 *
 * Prototype: Send just closes + clears (no backend). Wire `onSubmit` to a
 * real endpoint when available.
 */

import { useState } from "react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function FeedbackDialog({
  open, onOpenChange, onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Called with the message when Send is pressed. Defaults to a no-op. */
  onSubmit?: (message: string) => void
}) {
  const [text, setText] = useState("")

  const send = () => {
    const message = text.trim()
    if (!message) return
    onSubmit?.(message)
    setText("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-large">Send feedback</DialogTitle>
          <DialogDescription>
            Spotted a bug or have an idea? Tell us — it goes straight to the team.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What's on your mind?"
          rows={8}
          aria-label="Your feedback"
          className="min-h-48"
          autoFocus
        />
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button onClick={send} disabled={!text.trim()}>Send feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
