"use client"

/*
 * User Avatar — the placeholder palette itself, one swatch per entry, with
 * its name. This is the table `UserAvatar` hashes a username into
 * (`pickAvatarColor` in `src/lib/avatar.ts`); the component cannot be asked
 * for a specific swatch, so the swatches are drawn from the palette
 * directly, with the same classes the component uses for its disc.
 */

import { AVATAR_PALETTE } from "@/lib/avatar"

export default function UserAvatarPaletteExample() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-5 gap-4">
      {AVATAR_PALETTE.map(c => (
        <div key={c.name} className="flex flex-col items-center gap-1.5">
          <div
            className="flex size-12 items-center justify-center rounded-full text-small font-medium leading-none"
            style={{ backgroundColor: c.bg, color: c.fg }}
          >
            Aa
          </div>
          <span className="text-xsmall text-foreground">{c.name}</span>
        </div>
      ))}
    </div>
  )
}
