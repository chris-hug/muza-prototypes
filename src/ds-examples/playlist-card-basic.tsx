"use client"

/*
 * Playlist Card in the Library grid — the create tile first, then one of
 * your own playlists ("By you", Edit instead of the heart) and two saved
 * ones ("By <owner>", the owner name a link).
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `PlaylistCreateCard` and `PlaylistCard`, off the real saved playlists,
 * inside the real `.grid-cards` layout the Library › Playlists view uses.
 *
 * Hover a collage for the cluster (heart or Edit · ⋯ · Play); the Play
 * button plays the playlist's first track, Save is bound to the library
 * store, and the ⋯ is the shared playlist menu. Tap the collage or the
 * title to open the playlist.
 */

import { PlaylistCard } from "@/components/ui/playlist-card"
import { PlaylistCreateCard } from "@/components/ui/playlist-create-card"
import { getAllPlaylists } from "@/lib/playlist-catalog"

const PLAYLISTS = getAllPlaylists()
const playlist = (id: string) => PLAYLISTS.find(p => p.id === id)!

const OWN    = playlist("p01")   // Blue Note Essentials — yours
const SAVED  = playlist("p02")   // Blue Note Late Night — by Sarah K
const SAVED2 = playlist("p13")   // Modal Jazz Meditations — by Elena P

export default function PlaylistCardBasicExample() {
  return (
    <div className="@container">
      <ul className="grid-cards">
        <li>
          <PlaylistCreateCard onClick={() => {}} />
        </li>
        <li>
          <PlaylistCard title={OWN.title} covers={OWN.covers} songCount={OWN.songCount} owned onEdit={() => {}} />
        </li>
        <li>
          <PlaylistCard title={SAVED.title} covers={SAVED.covers} songCount={SAVED.songCount} owner={SAVED.owner} onOwnerClick={() => {}} />
        </li>
        <li>
          <PlaylistCard title={SAVED2.title} covers={SAVED2.covers} songCount={SAVED2.songCount} owner={SAVED2.owner} onOwnerClick={() => {}} />
        </li>
      </ul>
    </div>
  )
}
