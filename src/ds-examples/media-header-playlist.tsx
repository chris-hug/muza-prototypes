"use client"

/*
 * Media Header for YOUR OWN playlist — the `my-playlist` variant: a 2×2
 * composite cover from `covers`, no format, the track count in the year
 * slot, and the interactive visibility `StatusBadge` beside the meta. Edit
 * replaces the save heart (a playlist you own is in your library by
 * definition), and in the stacked tier the third action is "Add music".
 *
 * This file is a CALL SITE, not a copy: the real `MediaHeader` off the real
 * playlist catalog, with the props `playlist-detail-view.tsx` passes when
 * `owned` is true. Visibility is local state here; the page persists it.
 */

import { useState } from "react"

import { MediaHeader } from "@/components/ui/media-header"
import type { StatusBadgeStatus } from "@/components/ui/status-badge"
import { getPlaylistDetail } from "@/lib/playlist-catalog"
import { slugify } from "@/lib/media-nav"

const PLAYLIST = getPlaylistDetail()

export default function MediaHeaderPlaylistExample() {
  const [visibility, setVisibility] = useState<StatusBadgeStatus>("public")

  return (
    <MediaHeader
      variant="my-playlist"
      cover={PLAYLIST.cover}
      covers={PLAYLIST.covers}
      title={PLAYLIST.title}
      owner={PLAYLIST.owner}
      ownerAvatar={PLAYLIST.ownerAvatar}
      year={PLAYLIST.trackMeta}
      visibility={visibility}
      onVisibilityChange={setVisibility}
      libraryType="playlist"
      libraryId={slugify(PLAYLIST.title)}
      libraryName={PLAYLIST.title}
      onEdit={() => {}}
      onAddMusic={() => {}}
      onPlay={() => {}}
      onShuffle={() => {}}
      onOwnerClick={() => {}}
    />
  )
}
