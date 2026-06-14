/*
 * artist-data — the curated library artists, as a PURE leaf module (no
 * component / catalog imports). Kept dependency-free on purpose so any
 * module (the library view, search) can read it without dragging in the
 * media-list-table graph, which would create import cycles. The library
 * artists view re-exports these for backward-compatible imports.
 */

export interface SavedArtist {
  id:    string
  name:  string
  image: string
}

// pravatar fallback for the two artists Wikipedia's REST page-summary
// API has no thumbnail for (Djrum, Thundercat). Everyone else uses a
// real Wikipedia commons portrait resolved via
// scripts/fetch-wikipedia-artist-images.mjs.
const PORTRAIT = (seed: string) => `https://i.pravatar.cc/400?u=${seed}`

export const SAVED_ARTISTS: SavedArtist[] = [
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

// Real Wikipedia portraits for the wider cast — album personnel (sidemen),
// featured-artist rails, track artists — beyond the curated library set.
// Resolved via `scripts/fetch-wikipedia-artist-images.mjs`; paste its output
// here when adding names.
const WIKIPEDIA_PORTRAITS: Record<string, string> = {
  "Herbie Hancock": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Herbie_Hancock_2023.jpg/500px-Herbie_Hancock_2023.jpg",
  "Wayne Shorter": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Wayne-Shorter_in_Amsterdam%2C_1980.jpg/500px-Wayne-Shorter_in_Amsterdam%2C_1980.jpg",
  "Sonny Clark": "https://upload.wikimedia.org/wikipedia/en/b/bf/Sonny_Clark.jpg",
  "Eric Dolphy": "https://upload.wikimedia.org/wikipedia/en/8/86/Eric_Dolphy.jpg",
  "Charles Mingus": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Charles_Mingus_1976_cropped.jpg/500px-Charles_Mingus_1976_cropped.jpg",
  "Gil Scott-Heron": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gil_Scott-Heron.jpg/500px-Gil_Scott-Heron.jpg",
  "Clifford Jordan": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Clifford_Jordan.jpg/500px-Clifford_Jordan.jpg",
  "Stanley Cowell": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Stanley_Cowell.jpg/500px-Stanley_Cowell.jpg",
  "Diana Krall": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Diana_krall.jpg/500px-Diana_krall.jpg",
  "Thelonious Monk": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Thelonious_Monk%2C_Minton%27s_Playhouse%2C_New_York%2C_N.Y.%2C_ca._Sept._1947_%28William_P._Gottlieb_06191%29.jpg/500px-Thelonious_Monk%2C_Minton%27s_Playhouse%2C_New_York%2C_N.Y.%2C_ca._Sept._1947_%28William_P._Gottlieb_06191%29.jpg",
  "Roland Kirk": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Roland-Kirk.jpg/500px-Roland-Kirk.jpg",
  "Lee Morgan": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Lee_Morgan_%281959%29.jpg/500px-Lee_Morgan_%281959%29.jpg",
  "Cannonball Adderley": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Cannonball_Adderley_press_photo_1966.jpg/500px-Cannonball_Adderley_press_photo_1966.jpg",
  "Horace Silver": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Horace_Silver_by_Dmitri_Savitski_1989.jpg/500px-Horace_Silver_by_Dmitri_Savitski_1989.jpg",
  "Joe Henderson": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Joe_Henderson_2.jpg/500px-Joe_Henderson_2.jpg",
  "Duke Ellington": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Duke_Ellington_-_publicity.JPG/500px-Duke_Ellington_-_publicity.JPG",
  "Charles Tolliver": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Charles_tolliver.jpg/500px-Charles_tolliver.jpg",
  "Ranee Lee": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Ranee_Lee_portrait.JPG/500px-Ranee_Lee_portrait.JPG",
  "Oscar Peterson": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Oscar_Peterson.jpg/500px-Oscar_Peterson.jpg",
  "Cecil Taylor": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Cecil_taylor_E5122329-2.jpg/500px-Cecil_taylor_E5122329-2.jpg",
  "Andrew Cyrille": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Andrew_Cyrille.jpg/500px-Andrew_Cyrille.jpg",
  "Ornette Coleman": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Ornette-Coleman-2008-Heidelberg-schindelbeck.jpg/500px-Ornette-Coleman-2008-Heidelberg-schindelbeck.jpg",
  "Ron Carter": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Ron_Carter_Berkeley1.jpg/500px-Ron_Carter_Berkeley1.jpg",
  "Paul Chambers": "https://upload.wikimedia.org/wikipedia/en/7/72/Paul_Laurence_Dunbar_Chambers%2C_Jr..jpg",
  "Elvin Jones": "https://upload.wikimedia.org/wikipedia/commons/6/62/Elvin_Jones_1979_1.jpg",
  "McCoy Tyner": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Mccoy_Tyner_1973_gh_%28cropped%29.jpg/500px-Mccoy_Tyner_1973_gh_%28cropped%29.jpg",
  "Freddie Hubbard": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Freddie_Hubbard_1976.jpg/500px-Freddie_Hubbard_1976.jpg",
  "Jimmy Garrison": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Jimmyegarrison.jpg/500px-Jimmyegarrison.jpg",
  "Philly Joe Jones": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Philly_Joe_Jones_Advertisement.jpg/500px-Philly_Joe_Jones_Advertisement.jpg",
  "Art Blakey": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Art_blakey_studio_portrait.jpg/500px-Art_blakey_studio_portrait.jpg",
  "Hank Mobley": "https://upload.wikimedia.org/wikipedia/en/0/08/Hank_Mobley.jpg",
  "Art Farmer": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Art_Farmer.jpg/500px-Art_Farmer.jpg",
  "Bobby Hutcherson": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Bh_070701.jpg/500px-Bh_070701.jpg",
  "George Coleman": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/George_Coleman_at_the_Jazz_Standard%2C_October_2012.jpg/500px-George_Coleman_at_the_Jazz_Standard%2C_October_2012.jpg",
  "Jackie McLean": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Jackie_McLean.jpg/500px-Jackie_McLean.jpg",
  "James Spaulding": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/James_Spaulding_photo.jpg/500px-James_Spaulding_photo.jpg",
  "Kenny Drew": "https://upload.wikimedia.org/wikipedia/en/e/e0/Kenny_Drew.jpg",
  "Lonnie Liston Smith": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Lonnie_Liston_Smith_Glastonbury_2009-1.jpg/500px-Lonnie_Liston_Smith_Glastonbury_2009-1.jpg",
  "Reggie Workman": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Shepp_workman_mergentheim_08.jpg/500px-Shepp_workman_mergentheim_08.jpg",
}

// Combined name → portrait lookup. The curated library DB wins (so Home and
// the library view stay identical), then the wider Wikipedia set fills in.
const ARTIST_IMAGE_BY_NAME: Record<string, string> = {
  ...Object.fromEntries(Object.entries(WIKIPEDIA_PORTRAITS).map(([n, u]) => [n.toLowerCase(), u])),
  ...Object.fromEntries(SAVED_ARTISTS.map(a => [a.name.toLowerCase(), a.image])),
}

/** Real portrait for a known artist (library DB + wider Wikipedia set), or
 *  `undefined` when we have no real photo — callers then show the branded
 *  ArtistCard placeholder rather than a random/stock image. */
export function artistImage(name: string): string | undefined {
  return ARTIST_IMAGE_BY_NAME[name.trim().toLowerCase()]
}
