"use client"

/*
 * PurchasedBadge — the "Owned" marker, at its default size (the MediaHeader
 * meta line) and squeezed to a card row's meta size (AlbumCard's pricing
 * row passes its own meta classes plus a 12px glyph).
 *
 * This file is a CALL SITE, not a copy: it renders the real component; the
 * size is nothing but a text-size class on `className`.
 */

import { PurchasedBadge } from "@/components/ui/purchased-badge"

export default function PurchasedBadgeBasicExample() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <PurchasedBadge />
      <PurchasedBadge className="text-xsmall [&_svg]:size-3" />
    </div>
  )
}
