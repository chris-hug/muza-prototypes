"use client"

/*
 * LibraryArtistsView — the user's saved artists.
 *
 * Grid of <ArtistCard>s, one per saved artist. Same component that
 * shows up on Explore, search results, "fans also liked" rails.
 *
 * Figma: 8950:97861 (Artists Feed) — 5-column grid on desktop,
 * circular avatars, name only (no subtitle).
 */

import { useSearchParams } from "react-router"
import { ArtistCard } from "@/components/ui/artist-card"

interface SavedArtist {
  id:    string
  name:  string
  image: string
}

// pravatar fallback for the two artists Wikipedia's REST page-summary
// API has no thumbnail for (Djrum, Thundercat). Everyone else uses a
// real Wikipedia commons portrait resolved via
// scripts/fetch-wikipedia-artist-images.mjs.
const PORTRAIT = (seed: string) => `https://i.pravatar.cc/400?u=${seed}`

const SAVED_ARTISTS: SavedArtist[] = [
  { id: "ar01", name: "John Coltrane",     image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/John_Coltrane_1963_cropped_ver2.jpg/500px-John_Coltrane_1963_cropped_ver2.jpg" },
  { id: "ar02", name: "Alice Coltrane",    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Alice_Coltrane_1972.jpg/500px-Alice_Coltrane_1972.jpg" },
  { id: "ar03", name: "Pharoah Sanders",   image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Pharoah_Sanders_photo.jpg/500px-Pharoah_Sanders_photo.jpg" },
  { id: "ar04", name: "Yusef Lateef",      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Yusef_Lateef.jpg/500px-Yusef_Lateef.jpg" },
  { id: "ar05", name: "Sun Ra",            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Sun_Ra_%281973_publicity_photo_-_Impulse_ABC_Dunhill%29.jpg/500px-Sun_Ra_%281973_publicity_photo_-_Impulse_ABC_Dunhill%29.jpg" },
  { id: "ar06", name: "Don Cherry",        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Don_Cherry_in_2010.jpg/500px-Don_Cherry_in_2010.jpg" },
  { id: "ar07", name: "Anthony Braxton",   image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Anthony_braxton_5268134w.jpg/500px-Anthony_braxton_5268134w.jpg" },
  { id: "ar08", name: "Makaya McCraven",   image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Bobby_Broom_Trio_-_INNt%C3%B6ne_Jazzfestival_2013_Makaye_McCraven.jpg/500px-Bobby_Broom_Trio_-_INNt%C3%B6ne_Jazzfestival_2013_Makaye_McCraven.jpg" },
  { id: "ar09", name: "Nubya Garcia",      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Nubya_Garcia_INNt%C3%B6ne_01.jpg/500px-Nubya_Garcia_INNt%C3%B6ne_01.jpg" },
  { id: "ar10", name: "Theon Cross",       image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Theon_Cross_at_Ljubljana%2C_May_2015.jpg/500px-Theon_Cross_at_Ljubljana%2C_May_2015.jpg" },
  { id: "ar11", name: "Loraine James",     image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Loraine_James_making_her_NYC_debut_at_the_Knockdown_Center_on_May_1%2C_2022.jpg/500px-Loraine_James_making_her_NYC_debut_at_the_Knockdown_Center_on_May_1%2C_2022.jpg" },
  { id: "ar12", name: "Djrum",             image: PORTRAIT("djrum")       },
  { id: "ar13", name: "Thundercat",        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Thundercat_%2843228969271%29_-_edited.jpg/500px-Thundercat_%2843228969271%29_-_edited.jpg" },
  { id: "ar14", name: "Mal Waldron",       image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Mal_Waldron.jpg/500px-Mal_Waldron.jpg" },
  { id: "ar15", name: "Ryo Fukui",         image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Ryo_Fukui.png/500px-Ryo_Fukui.png" },
]

export function LibraryArtistsView() {
  const [, setParams] = useSearchParams()

  // Sun Ra is the only artist with a profile page wired up right now
  // (the prototype's demo target). Real routing would pass an artist
  // id; this just toggles `?page=Artist` on the Sun Ra card click.
  const openSunRaProfile = () => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set("page", "Artist")
      return next
    })
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="@container mx-auto max-w-[1528px] px-10 pt-8 pb-12">
        <h1 className="text-2xlarge font-medium text-foreground tracking-tight mb-6">
          Artists
        </h1>

        <ul className="grid grid-cols-[repeat(1,minmax(143px,220px))] @min-[304px]:grid-cols-[repeat(2,minmax(143px,220px))] @min-[464px]:grid-cols-[repeat(3,minmax(143px,220px))] @min-[692px]:grid-cols-[repeat(4,minmax(143px,220px))] @min-[928px]:grid-cols-[repeat(5,minmax(143px,220px))] @min-[1164px]:grid-cols-[repeat(6,minmax(143px,220px))] gap-x-4 gap-y-6">
          {SAVED_ARTISTS.map(a => (
            <li key={a.id}>
              <ArtistCard
                name={a.name}
                image={a.image}
                onClick={a.id === "ar05" ? openSunRaProfile : undefined}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
