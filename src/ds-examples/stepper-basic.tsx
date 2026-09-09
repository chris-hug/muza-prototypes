"use client"

/*
 * The stepper as the upload wizard uses it: four steps, the visited ones
 * clickable, in a row of its own.
 *
 * The frame is the whole three-zone arrangement, not the stepper alone: the
 * component's argument is that progress needs a row nobody else is in, and
 * you cannot see that from a stepper floating on its own. Header, stepper
 * row, body, footer — take the window down with the chips and nothing
 * collides, which is the entire fix.
 */

import { useState } from "react"

import { Stepper } from "@/components/ui/stepper"
import { Button } from "@/components/ui/button"

const STEPS = ["Release Info", "Monetisation", "Track matching", "Preview"] as const

export default function StepperBasicExample() {
  const [step, setStep] = useState(2)
  const last = step === STEPS.length

  return (
    <div className="flex w-full flex-col">
      {/* Header — identity and window controls only. */}
      <div className="flex items-center border-b border-border px-6 py-4">
        <p className="text-base font-medium text-foreground">Upload music</p>
      </div>

      {/* The stepper's own row. Nothing else is in it, so the centring is
          honest and there is nothing to collide with. */}
      <div className="border-b border-border px-6 py-4">
        <Stepper steps={STEPS} current={step} onStepSelect={setStep} />
      </div>

      <div className="px-6 py-10 text-center text-small text-muted-foreground">
        Step {step} — {STEPS[step - 1]}
        <br />
        Steps you have already passed are buttons; the ones ahead are not.
      </div>

      {/* Footer — actions. Cancel stays for the whole flow. */}
      <div className="flex items-center gap-2 border-t border-border px-6 py-4">
        <Button variant="ghost" onClick={() => setStep(1)}>Cancel</Button>
        <div className="ml-auto flex items-center gap-2">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>
          )}
          <Button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))} disabled={last}>
            {last ? "Publish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}
