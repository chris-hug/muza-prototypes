"use client"

/*
 * ToggleGroup at its three sizes — `sm` (40px, the app's only size so far),
 * `default` (48px) and `lg` (52px). The group sets `data-size`; the Toggles
 * inside read it for their padding and type, so nothing is passed to them.
 *
 * This file is a CALL SITE, not a copy: it renders the real components,
 * uncontrolled (`defaultValue`).
 */

import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"

export default function ToggleGroupSizesExample() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ToggleGroup size="sm" defaultValue={["grid"]} aria-label="View mode">
        <Toggle value="list">List</Toggle>
        <Toggle value="grid">Grid</Toggle>
        <Toggle value="compact">Compact</Toggle>
      </ToggleGroup>
      <ToggleGroup size="default" defaultValue={["grid"]} aria-label="View mode">
        <Toggle value="list">List</Toggle>
        <Toggle value="grid">Grid</Toggle>
        <Toggle value="compact">Compact</Toggle>
      </ToggleGroup>
      <ToggleGroup size="lg" defaultValue={["grid"]} aria-label="View mode">
        <Toggle value="list">List</Toggle>
        <Toggle value="grid">Grid</Toggle>
      </ToggleGroup>
    </div>
  )
}
