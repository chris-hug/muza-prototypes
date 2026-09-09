"use client"

/*
 * Artist Card in the Library grid — four real portraits and one artist with
 * no portrait, so the branded circle placeholder renders beside them.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `ArtistCard`, off the real library artists, inside the real `.grid-cards`
 * layout the Library › Artists view uses. It exists only so the design
 * system can render the component AND show the same file under `</>`.
 *
 * The card's one action is the click; in the app every host passes
 * `openArtist(slugify(name))`. There is no hover cluster and no menu.
 */

import { ArtistCard } from "@/components/ui/artist-card"
import { SAVED_ARTISTS } from "@/lib/artist-data"

const ARTISTS = SAVED_ARTISTS.slice(0, 4)

export default function ArtistCardBasicExample() {
  return (
    <div className="@container">
      <ul className="grid-cards">
        {ARTISTS.map(a => (
          <li key={a.id}>
            <ArtistCard name={a.name} image={a.image} onClick={() => {}} />
          </li>
        ))}
        {/* No portrait → the muted circle with the solid-secondary mark. */}
        <li>
          <ArtistCard name="Curtis Fuller" onClick={() => {}} />
        </li>
      </ul>
    </div>
  )
}
