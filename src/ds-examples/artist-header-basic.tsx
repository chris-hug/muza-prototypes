"use client"

/*
 * Artist Header — the full-bleed hero at the top of an artist profile:
 * cover photo under a dark gradient, the name, a teased bio that opens the
 * full text in a dialog, and the action row pinned bottom-left.
 *
 * This file is a CALL SITE, not a copy: it renders the real `ArtistHero`
 * with the props `artist-profile-view.tsx` passes — the same Sun Ra data
 * that page carries (its `ARTIST` record is module-private, so the fields
 * are repeated here), the portrait from `artistImage()`. Playback is the
 * host's: `isPlaying` + `onPlayToggle` are local state here, the player
 * store's in the app.
 *
 * Share and Save are hidden below the chrome gate (`useFooterNav`, 608) —
 * they move into the floating header's "…" — and inside the frame the chip
 * is the window, so pick 375 and they go.
 */

import { useState } from "react"

import { ArtistHero } from "@/components/app/artist-hero"
import { artistImage } from "@/lib/artist-data"

const ARTIST = {
  name:  "Sun Ra",
  cover: "https://miro.medium.com/v2/resize:fit:4800/format:webp/1*lGV1JcK0hYHFLvyimbVK5Q.jpeg",
  bio:   "Sun Ra (born Herman Poole Blount; May 22, 1914 – May 30, 1993) was an American jazz composer, bandleader, piano and synthesizer player, and poet known for his experimental music, cosmic philosophy, prolific output and theatrical performances.\n\nFor much of his career he led the Arkestra, an ensemble with an ever-changing lineup and name, distinguished by its costumes, choreography and freewheeling sound. Born in Birmingham, Alabama, he abandoned his birth name and claimed to be an alien from Saturn on a mission to preach peace — a persona he used to explore space, mythology and Black liberation.\n\nAcross more than three decades he recorded hundreds of releases, many on his own Saturn label, spanning bebop, big-band swing, free jazz and pioneering electronic music. Long a cult figure, he is now widely regarded as a visionary whose influence reaches across jazz, funk and experimental music.",
}

export default function ArtistHeaderBasicExample() {
  const [playing, setPlaying] = useState(false)

  return (
    <ArtistHero
      name={ARTIST.name}
      cover={ARTIST.cover}
      avatar={artistImage(ARTIST.name)}
      bio={ARTIST.bio}
      artistId="sun-ra"
      isPlaying={playing}
      onPlayToggle={() => setPlaying(p => !p)}
    />
  )
}
