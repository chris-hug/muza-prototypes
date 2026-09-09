"use client"

/*
 * Toggle on its own — the three states (pressed · unpressed · disabled) and
 * the three standalone sizes. Standalone metrics mirror Button; inside a
 * ToggleGroup the group's `data-size` takes over (see togglegroup-basic).
 *
 * This file is a CALL SITE, not a copy: it renders the real `Toggle`,
 * uncontrolled (`defaultPressed`), so each one flips on its own.
 */

import { Toggle } from "@/components/ui/toggle"

export default function ToggleBasicExample() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Toggle defaultPressed>Pressed</Toggle>
        <Toggle>Unpressed</Toggle>
        <Toggle disabled>Disabled</Toggle>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Toggle size="sm">Small</Toggle>
        <Toggle size="default" defaultPressed>Default</Toggle>
        <Toggle size="lg" defaultPressed>Large</Toggle>
      </div>
    </div>
  )
}
