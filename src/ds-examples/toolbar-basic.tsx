"use client"

/*
 * Toolbar — a pill strip of related controls with roving focus: Tab lands
 * on the strip once, the arrow keys move between its buttons. Two groups
 * and a lone button, split by separators.
 *
 * This file is a CALL SITE, not a copy: it renders the real `Toolbar` parts.
 * Nothing in the app mounts a Toolbar yet; this is the reference shape.
 */

import {
  Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator,
} from "@/components/ui/toolbar"

export default function ToolbarBasicExample() {
  return (
    <Toolbar aria-label="Formatting">
      <ToolbarGroup>
        <ToolbarButton>Bold</ToolbarButton>
        <ToolbarButton>Italic</ToolbarButton>
        <ToolbarButton>Underline</ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ToolbarButton>Link</ToolbarButton>
        <ToolbarButton>Code</ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarButton>Settings</ToolbarButton>
    </Toolbar>
  )
}
