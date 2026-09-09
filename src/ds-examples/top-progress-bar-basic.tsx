"use client"

/*
 * Top Progress Bar — a button flips `loading` for 1.4s so the bar can be
 * seen doing its whole cycle: 200ms of nothing, then the climb, then the
 * snap to full and the fade.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `TopProgressBar`. The bar is `fixed` to the top of the BROWSER window, not
 * to this frame — look at the very top edge of the screen after clicking.
 * In the app the parent flips `loading` around a fetch or a navigation and
 * nothing else; the timing lives inside the component.
 */

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { TopProgressBar } from "@/components/ui/top-progress-bar"

export default function TopProgressBarBasicExample() {
  const [loading, setLoading] = useState(false)
  const trigger = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1400)
  }
  return (
    <div className="flex items-center gap-4">
      <TopProgressBar loading={loading} />
      <Button variant="outline" onClick={trigger} disabled={loading}>
        {loading ? "Loading…" : "Trigger a 1.4s load"}
      </Button>
      <span className="text-2xsmall text-muted-foreground">
        Watch the top edge of the window.
      </span>
    </div>
  )
}
