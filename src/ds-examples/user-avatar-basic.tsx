"use client"

/*
 * User Avatar — the same username at the five sizes the app renders it (the
 * topbar's 40px default, the mobile header's 36, the settings hero's 64 and
 * 80), then a row of usernames to show how initials and colour fall out of
 * the string alone.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `UserAvatar`. There is no `size` prop — the diameter is `className`
 * (`size-N`), and the type step comes with it (`text-2xsmall` for 28px,
 * `text-large` for 64, `text-xlarge` for 80). Nothing is passed for colour:
 * the username is hashed into the palette in `src/lib/avatar.ts`.
 */

import { UserAvatar } from "@/components/ui/user-avatar"

const USERNAMES = [
  "Chris-123", "alex_99", "naomi-smith", "kira-92", "zoe",
  "miles-d", "ellaR", "monk", "jordan", "kai",
  "sun-ra", "pharoah_77", "ines_n", "yusef", "ophelia_3",
]

export default function UserAvatarBasicExample() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-4">
        <UserAvatar username="naomi-smith" className="size-7 text-2xsmall" />
        <UserAvatar username="naomi-smith" className="size-9" />
        <UserAvatar username="naomi-smith" />
        <UserAvatar username="naomi-smith" className="size-16 text-large" />
        <UserAvatar username="naomi-smith" className="size-20 text-xlarge" />
      </div>

      <div className="flex max-w-3xl flex-wrap gap-2">
        {USERNAMES.map(u => (
          <div key={u} className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3">
            <UserAvatar username={u} className="size-7 text-2xsmall" />
            <span className="text-2xsmall text-muted-foreground">{u}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
