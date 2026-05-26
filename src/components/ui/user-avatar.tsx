"use client"

/*
 * UserAvatar — circular placeholder avatar with deterministic color +
 * initials derived from a `username`. Hash-stable: the same username
 * always produces the same color across sessions.
 *
 * Defaults to size-10 (40px) to drop into the topbar profile menu as
 * a swap for the manual `<div className="size-10 rounded-full bg-secondary">`.
 * Pass `className` to size it differently (e.g. `size-20` for a hero
 * profile block).
 */

import { cn } from "@/lib/utils"
import {
  pickAvatarColor, initialsFromUsername,
} from "@/lib/avatar"

export interface UserAvatarProps {
  /** Used both to compute the initials and to hash the color slot. */
  username: string
  /** Optional override — by default the initials are derived from
   *  `username`. Pass this when you want different display letters
   *  (e.g. a single emoji or a curated short label). */
  initials?: string
  /** Optional aria-label override. Defaults to `username`. */
  label?: string
  className?: string
}

export function UserAvatar({
  username, initials, label, className,
}: UserAvatarProps) {
  const color = pickAvatarColor(username)
  const text  = initials ?? initialsFromUsername(username)
  return (
    <div
      aria-label={label ?? username}
      style={{ backgroundColor: color.bg, color: color.fg }}
      className={cn(
        "size-10 rounded-full flex items-center justify-center font-medium leading-none select-none text-small",
        className,
      )}
    >
      {text}
    </div>
  )
}
