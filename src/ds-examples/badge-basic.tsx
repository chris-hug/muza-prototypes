"use client"

/*
 * Badge — the base variants a call site picks from, the two status flags the
 * design-system page itself wears (`new` / `updated`), and `ContentTypeBadge`
 * in all seven types. The `count` variant lives inside a Chip and is shown
 * there (chips-count).
 *
 * This file is a CALL SITE, not a copy: it renders the real `Badge` and
 * `ContentTypeBadge`.
 */

import { Badge, ContentTypeBadge } from "@/components/ui/badge"

export default function BadgeBasicExample() {
  return (
    <div className="flex flex-col gap-5">
      {/* Base variants */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="new">New</Badge>
        <Badge variant="updated">Updated</Badge>
      </div>

      {/* Content type — always the muted fill + a 12px glyph */}
      <div className="flex flex-wrap items-center gap-2">
        <ContentTypeBadge type="song" />
        <ContentTypeBadge type="album" />
        <ContentTypeBadge type="single" />
        <ContentTypeBadge type="ep" />
        <ContentTypeBadge type="artist" />
        <ContentTypeBadge type="playlist" />
        <ContentTypeBadge type="label" />
      </div>
    </div>
  )
}
