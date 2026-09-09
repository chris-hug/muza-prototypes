"use client"

/*
 * Avatar — the three `size` steps with a real artist portrait from the
 * catalog, the initials fallback, a badge, and a stacked group with a count.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Avatar` parts. The image falls back to the initials while it loads or if
 * it fails; the ring on each one is the component's own `after:` hairline,
 * not a class added here. The group's `-space-x-2` overlap and
 * `ring-background` gaps come from `AvatarGroup`.
 */

import { Check } from "lucide-react"

import {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/ui/avatar"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()
const initials = (name: string) =>
  name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()

export default function AvatarBasicExample() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Avatar size="sm">
        <AvatarImage src={ALBUM.artistAvatar} alt={ALBUM.artist} />
        <AvatarFallback>{initials(ALBUM.artist)}</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src={ALBUM.artistAvatar} alt={ALBUM.artist} />
        <AvatarFallback>{initials(ALBUM.artist)}</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src={ALBUM.artistAvatar} alt={ALBUM.artist} />
        <AvatarFallback>{initials(ALBUM.artist)}</AvatarFallback>
      </Avatar>

      <Avatar size="lg">
        <AvatarFallback>{initials(ALBUM.artist)}</AvatarFallback>
      </Avatar>

      <Avatar size="lg">
        <AvatarImage src={ALBUM.artistAvatar} alt={ALBUM.artist} />
        <AvatarFallback>{initials(ALBUM.artist)}</AvatarFallback>
        <AvatarBadge aria-label="Verified"><Check /></AvatarBadge>
      </Avatar>

      <AvatarGroup>
        {ALBUM.artistsOnAlbum.slice(0, 3).map(p => (
          <Avatar key={p.name}>
            {p.image && <AvatarImage src={p.image} alt={p.name} />}
            <AvatarFallback>{initials(p.name)}</AvatarFallback>
          </Avatar>
        ))}
        <AvatarGroupCount>+{Math.max(0, ALBUM.artistsOnAlbum.length - 3)}</AvatarGroupCount>
      </AvatarGroup>
    </div>
  )
}
