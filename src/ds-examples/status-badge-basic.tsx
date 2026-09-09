"use client"

/*
 * StatusBadge — a release's visibility, public or private. Click it: the
 * badge is its own dropdown and the choice flips in place. A read-only
 * one beside it, as the Studio's mobile row renders it (no handler).
 *
 * This file is a CALL SITE, not a copy: it renders the real `StatusBadge`
 * with the same controlled `status` + `onStatusChange` pair the Studio table
 * passes.
 */

import { useState } from "react"

import { StatusBadge, type StatusBadgeStatus } from "@/components/ui/status-badge"

export default function StatusBadgeBasicExample() {
  const [status, setStatus] = useState<StatusBadgeStatus>("public")
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={status} onStatusChange={setStatus} />
      <StatusBadge status="private" />
    </div>
  )
}
