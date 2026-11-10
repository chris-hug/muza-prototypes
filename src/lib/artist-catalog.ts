/*
 * Artist catalog — the data behind the artist page.
 *
 * One profile per artist, keyed by name slug (`?page=Artist&artist=<slug>`).
 * An unknown slug gets Sun Ra, the example artist in the Figma, because
 * every card in the app links somewhere and most of the artists on them have
 * no profile of their own yet.
 *
 * Where it comes from: sleeves are iTunes Search API artwork, portraits are
 * Wikimedia Commons, tracks and durations are matched against iTunes. The
 * bios are written here, not copied. Release years are ORIGINAL years: iTunes
 * reports the reissue, so they were curated by hand and two were corrected
 * against MusicBrainz. MusicBrainz was not applied wholesale, because its
 * earliest date for a release group is sometimes a recording or an odd
 * pressing rather than the release.
 */

import { registerAlbums } from "@/lib/album-catalog"
import { registerPlaylists } from "@/lib/playlist-catalog"
import { artistImage } from "@/lib/artist-data"
import { slugify } from "@/lib/media-nav"

// ─── Mock data ──────────────────────────────────────────────────────────────
//
// Sun Ra is the example artist in the Figma. The data below is
// hand-curated jazz content so the layout reads as a real profile.

const ARTIST = {
  name:   "Sun Ra",
  cover:  "https://miro.medium.com/v2/resize:fit:4800/format:webp/1*lGV1JcK0hYHFLvyimbVK5Q.jpeg",
  bio:    "Sun Ra (born Herman Poole Blount; May 22, 1914 – May 30, 1993) was an American jazz composer, bandleader, piano and synthesizer player, and poet known for his experimental music, cosmic philosophy, prolific output and theatrical performances.\n\nFor much of his career he led the Arkestra, an ensemble with an ever-changing lineup and name, distinguished by its costumes, choreography and freewheeling sound. Born in Birmingham, Alabama, he abandoned his birth name and claimed to be an alien from Saturn on a mission to preach peace — a persona he used to explore space, mythology and Black liberation.\n\nAcross more than three decades he recorded hundreds of releases, many on his own Saturn label, spanning bebop, big-band swing, free jazz and pioneering electronic music. Long a cult figure, he is now widely regarded as a visionary whose influence reaches across jazz, funk and experimental music." }

// Real Sun Ra tracks pulled from the corresponding album sleeves
// below. Cover URLs are the iTunes 200×200 thumbnails (smaller
// payload than the 600px artwork the Discography grid uses).
const COVER_SPACE      = "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/200x200bb.jpg"
const COVER_LANQUIDITY = "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b3/2a/5f/b32a5f91-5551-1ac0-17c6-e6dd4dcc0292/4062548021820_3000.jpg/200x200bb.jpg"
const COVER_FUTURISTIC = "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e0/21/2d/e0212d9d-45a5-e914-128e-63ceac48a6a1/21CRGIM30721.rgb.jpg/200x200bb.jpg"
const COVER_SLEEPING   = "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a7/f2/b9/a7f2b9d7-3cd0-c092-d667-59dd10e11b6c/4062548112283.png/200x200bb.jpg"
const COVER_HELIO1     = "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/9b/38/66/9b386653-0486-11fa-81d9-c6395e8acf81/Heliocentric_V1_cover.jpg/200x200bb.jpg"
const COVER_ASTRO      = "https://is1-ssl.mzstatic.com/image/thumb/Music62/v4/fd/56/b8/fd56b88e-1bb8-9be7-c945-61fbaf9da665/Astro_Black_2018_cover-300.jpg/200x200bb.jpg"
const COVER_PURPLE     = "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/47/a2/78/47a278ec-8b25-ab01-33fa-f3283fc90f28/Purple_Night_1500-B.jpg/200x200bb.jpg"
const COVER_MAYAN      = "https://is1-ssl.mzstatic.com/image/thumb/Music/cd/cb/07/mzi.qqxpchzn.jpg/200x200bb.jpg"

const TOP_SONGS = [
  { id: "s1",  cover: COVER_SPACE,      title: "Space Is the Place",       album: "Space Is the Place",                       year: 1973, duration: "21:14" },
  { id: "s2",  cover: COVER_LANQUIDITY, title: "Lanquidity",               album: "Lanquidity",                               year: 1978, duration: "9:11" },
  { id: "s3",  cover: COVER_SLEEPING,   title: "Door of the Cosmos",       album: "Sleeping Beauty",                          year: 1979, duration: "9:03" },
  { id: "s4",  cover: COVER_FUTURISTIC, title: "Rocket Number Nine",       album: "The Futuristic Sounds of Sun Ra",          year: 1961, duration: "3:24" },
  { id: "s5",  cover: COVER_HELIO1,     title: "Heliocentric",             album: "The Heliocentric Worlds of Sun Ra, Vol. 1", year: 1965, duration: "5:13" },
  { id: "s6",  cover: COVER_LANQUIDITY, title: "Where Pathways Meet",      album: "Lanquidity",                               year: 1978, duration: "6:14" },
  { id: "s7",  cover: COVER_ASTRO,      title: "Astro Black",              album: "Astro Black",                              year: 1973, duration: "8:54" },
  { id: "s8",  cover: COVER_LANQUIDITY, title: "There Are Other Worlds",   album: "Lanquidity",                               year: 1978, duration: "7:51" },
  { id: "s9",  cover: COVER_MAYAN,      title: "El Is a Sound of Joy",     album: "Mayan Temples",                            year: 1990, duration: "5:42" },
  { id: "s10", cover: COVER_PURPLE,     title: "Stars Fell on Alabama",    album: "Purple Night",                             year: 1990, duration: "5:09" },
]

// Full discography — used by the Discography tab.
//   · `kind`   — filter bucket the chip bar groups by. Says HOW the
//                artist relates to the release ("their" albums vs
//                remixes they did vs releases where they had a
//                secondary role on someone else's work).
//   · `type`   — what the release format actually is (album / single
//                / ep). Independent of `kind`: a remix is still a
//                single, a secondary-role contribution could be on
//                an album, etc.
export type ReleaseKind = "album" | "single" | "ep" | "remix" | "secondary"
export type ReleaseType = "album" | "single" | "ep"
// All cover URLs are real iTunes Search API artwork — every release
// below points to its actual record sleeve.
const DISCOGRAPHY: Array<{ id: string; title: string; year: number; kind: ReleaseKind; type: ReleaseType; tracks: number; band?: string; cover: string }> = [
  // ── Studio / live albums ─────────────────────────────────────────
  { id: "d1",  title: "Space Is the Place",                          year: 1973, kind: "album",     type: "album",  tracks: 4,  band: "Sun Ra and his Arkestra",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
  { id: "d2",  title: "Lanquidity",                                  year: 1978, kind: "album",     type: "album",  tracks: 4,  band: "Sun Ra and his Arkestra",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b3/2a/5f/b32a5f91-5551-1ac0-17c6-e6dd4dcc0292/4062548021820_3000.jpg/600x600bb.jpg" },
  { id: "d3",  title: "The Futuristic Sounds of Sun Ra",             year: 1961, kind: "album",     type: "album",  tracks: 9,  band: "The Sun Ra Arkestra",                              cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e0/21/2d/e0212d9d-45a5-e914-128e-63ceac48a6a1/21CRGIM30721.rgb.jpg/600x600bb.jpg" },
  { id: "d4",  title: "Jazz by Sun Ra",                              year: 1956, kind: "album",     type: "album",  tracks: 5,  band: "Sun Ra",                                           cover: "https://is1-ssl.mzstatic.com/image/thumb/Music7/v4/29/ee/10/29ee103c-3ea8-3351-0e6d-e1f0db368be7/dj.vrxtlpkw.jpg/600x600bb.jpg" },
  { id: "d5",  title: "God Is More Than Love Can Ever Be",           year: 1979, kind: "album",     type: "album",  tracks: 5,  band: "Sun Ra",                                           cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/43/91/bc/4391bc79-3d1c-3534-adc7-37a31f81b463/God_is_More_cover_300.jpg/600x600bb.jpg" },
  { id: "d6",  title: "Sleeping Beauty",                             year: 1979, kind: "album",     type: "album",  tracks: 3,  band: "Sun Ra and his Arkestra",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a7/f2/b9/a7f2b9d7-3cd0-c092-d667-59dd10e11b6c/4062548112283.png/600x600bb.jpg" },
  { id: "d7",  title: "The Heliocentric Worlds of Sun Ra, Vol. 1",   year: 1965, kind: "album",     type: "album",  tracks: 6,  band: "Sun Ra and his Solar Arkestra",                    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/9b/38/66/9b386653-0486-11fa-81d9-c6395e8acf81/Heliocentric_V1_cover.jpg/600x600bb.jpg" },
  { id: "d8",  title: "Cosmos",                                      year: 1976, kind: "album",     type: "album",  tracks: 5,  band: "Sun Ra and his Arkestra",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music49/v4/20/db/51/20db5143-be96-6741-6d70-08d9fc0d5605/Cosmos_art_1500.jpg/600x600bb.jpg" },
  { id: "d9",  title: "Strange Celestial Road",                      year: 1980, kind: "album",     type: "album",  tracks: 4,  band: "Sun Ra and his Arkestra",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/3e/08/94/3e089402-eb30-e3a0-8e66-c3e567e8ac39/18CRGIM05763.rgb.jpg/600x600bb.jpg" },
  { id: "d10", title: "The Other Side of the Sun",                   year: 1979, kind: "album",     type: "album",  tracks: 6,  band: "Sun Ra and his Arkestra",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/34/ed/e2/34ede2b9-db9b-cd9c-f941-82eb0da97bae/OSOTS.1500.jpg/600x600bb.jpg" },
  { id: "d11", title: "Astro Black",                                 year: 1973, kind: "album",     type: "album",  tracks: 4,  band: "Sun Ra and his Arkestra",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music62/v4/fd/56/b8/fd56b88e-1bb8-9be7-c945-61fbaf9da665/Astro_Black_2018_cover-300.jpg/600x600bb.jpg" },
  { id: "d12", title: "Celestial Love",                              year: 1982, kind: "album",     type: "album",  tracks: 6,  band: "Sun Ra and his Arkestra",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/3a/6e/84/3a6e848e-f47e-89c5-ddfd-895001b28966/Celestial_Love_cover_1500.jpg/600x600bb.jpg" },
  { id: "d13", title: "Crystal Spears",                              year: 1973, kind: "album",     type: "album",  tracks: 6,  band: "Sun Ra and his Astro-Infinity Arkestra",            cover: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/5c/8a/00/5c8a00ec-08fc-4f81-81fd-b9bb9775fa62/090771808226.jpg/600x600bb.jpg" },
  { id: "d14", title: "Universe in Blue",                            year: 1972, kind: "album",     type: "album",  tracks: 4,  band: "Sun Ra and his Arkestra",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/84/95/00/84950031-84db-9640-88ad-4f8645581b20/Universe_in_Blue_CMR-006_cover.jpg/600x600bb.jpg" },
  { id: "d15", title: "Sub Underground #1",                          year: 1974, kind: "album",     type: "album",  tracks: 5,  band: "Sun Ra",                                           cover: "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/6d/d4/af/6dd4afb6-ea24-9251-aa2f-e7759f315398/Sub_Underground_1500border.jpg/600x600bb.jpg" },
  { id: "d16", title: "Toward the Stars",                            year: 1955, kind: "album",     type: "album",  tracks: 5,  band: "Sun Ra",                                           cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/8e/66/80/8e66806d-b584-dd89-5a71-480a99885525/5013929311923.jpg/600x600bb.jpg" },
  { id: "d17", title: "Mayan Temples",                               year: 1990, kind: "album",     type: "album",  tracks: 13, band: "Sun Ra Arkestra",                                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/cd/cb/07/mzi.qqxpchzn.jpg/600x600bb.jpg" },
  { id: "d18", title: "Hours After",                                 year: 1986, kind: "album",     type: "album",  tracks: 5,  band: "Sun Ra Arkestra",                                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/d1/1d/4a/mzi.otumrxgy.jpg/600x600bb.jpg" },
  { id: "d19", title: "Reflections in Blue",                         year: 1986, kind: "album",     type: "album",  tracks: 6,  band: "Sun Ra Arkestra",                                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/11/34/3a/mzi.rmaotwum.jpg/600x600bb.jpg" },
  { id: "d20", title: "Purple Night",                                year: 1990, kind: "album",     type: "album",  tracks: 7,  band: "Sun Ra Arkestra · feat. Don Cherry",               cover: "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/47/a2/78/47a278ec-8b25-ab01-33fa-f3283fc90f28/Purple_Night_1500-B.jpg/600x600bb.jpg" },

  // ── Singles ──────────────────────────────────────────────────────
  { id: "d21", title: "Seductive Fantasy",                           year: 2020, kind: "single",    type: "single", tracks: 1,  band: "Sun Ra Arkestra",                                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/35/32/42/3532426a-57ad-3fe8-fbed-0c8b28c8ed76/4062548013412_3000.jpg/600x600bb.jpg" },
  { id: "d22", title: "Somebody Else's Idea",                        year: 2022, kind: "single",    type: "single", tracks: 1,  band: "Sun Ra Arkestra",                                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/07/51/9a/07519a16-4fab-4ed6-5de5-a6429e73edd5/634457107823.png/600x600bb.jpg" },
  { id: "d23", title: "Chopin",                                      year: 2022, kind: "single",    type: "single", tracks: 1,  band: "Sun Ra Arkestra",                                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/c1/1a/39/c11a3942-a9e5-cdec-b46a-f1b8533a5efe/634457103269.png/600x600bb.jpg" },
  { id: "d24", title: "Baby Won't You Please Be Mine",               year: 2024, kind: "single",    type: "single", tracks: 2,  band: "Sun Ra Arkestra",                                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e7/41/57/e7415716-189e-bdd5-9d2a-0e4ba934ecf8/cover.jpg/600x600bb.jpg" },
  { id: "d25", title: "Lights on a Satellite",                       year: 2024, kind: "single",    type: "single", tracks: 1,  band: "Sun Ra Arkestra",                                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c8/6f/7b/c86f7b5a-87c8-7242-11e8-1153f403faf9/cover.jpg/600x600bb.jpg" },

  // ── EPs ──────────────────────────────────────────────────────────
  { id: "d26", title: "Sun Ra Arkestra Meets Salah Ragab in Egypt",  year: 1984, kind: "ep",        type: "ep",     tracks: 5,  band: "Sun Ra Arkestra · Salah Ragab",                    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/e5/31/3d/e5313d17-bde8-782b-6446-c7a2fd9ae758/4062548032420.png/600x600bb.jpg" },
  { id: "d27", title: "Big John's Special",                          year: 2024, kind: "ep",        type: "ep",     tracks: 3,  band: "Sun Ra Arkestra",                                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/02/8e/1f/028e1fa4-9637-6097-2d74-e901087946ba/cover.jpg/600x600bb.jpg" },

  // ── Remixes ──────────────────────────────────────────────────────
  { id: "d28", title: "Door of the Cosmos (Floating Points Edit)",   year: 2018, kind: "remix",     type: "single", tracks: 1,  band: "Sun Ra · Floating Points",                         cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a7/f2/b9/a7f2b9d7-3cd0-c092-d667-59dd10e11b6c/4062548112283.png/600x600bb.jpg" },
  { id: "d29", title: "Nuclear War (NON Reconstruction)",            year: 2001, kind: "remix",     type: "single", tracks: 1,  band: "Sun Ra · NON",                                     cover: "https://is1-ssl.mzstatic.com/image/thumb/Music62/v4/fd/56/b8/fd56b88e-1bb8-9be7-c945-61fbaf9da665/Astro_Black_2018_cover-300.jpg/600x600bb.jpg" },

  // ── Secondary role (appearances on others' albums) ──────────────
  { id: "d30", title: "We the People of the Myths (feat. Marshall Allen)", year: 2022, kind: "secondary", type: "single", tracks: 1, band: "Meditations on Crime · King Khan · Harper Simon", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/20/a0/ce/20a0ce67-41ad-efa2-058f-335fabbf572b/899360.jpg/600x600bb.jpg" },
  { id: "d31", title: "Outros Espaço",                               year: 2021, kind: "secondary", type: "album",  tracks: 10, band: "Rodrigo Brandão & Sun Ra Arkestra",                cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c5/87/99/c5879978-757c-5ee5-f8a8-4b64ce4a3501/0732535842090.jpg/600x600bb.jpg" },
  { id: "d32", title: "Saturnian Queen of the Sun Ra Arkestra",      year: 2019, kind: "secondary", type: "album",  tracks: 17, band: "June Tyson & Sun Ra and his Arkestra",             cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/4c/de/0f/4cde0fbe-aa02-eaff-08ce-f21eb6c2752d/MH-8014_June.jpg/600x600bb.jpg" },
]

// Top Albums rail — picked from the real discography below so the
// rail covers map 1:1 onto the same release sleeves on Discography.
const TOP_ALBUMS = (
  ["d1", "d2", "d11", "d3", "d7", "d8", "d12", "d20"] as const
).map(id => {
  const r = DISCOGRAPHY.find(x => x.id === id)!
  return { id: r.id, title: r.title, cover: r.cover, artist: "Sun Ra", year: r.year }
})

const PRODUCTS = [
  { id: "p1", title: "Space Is the Place — Vinyl Reissue",       price: "32 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
  { id: "p2", title: "Lanquidity (Deluxe 4LP Box)",              price: "120 $", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
  { id: "p3", title: "Arkestra Tour Tee — Black",                price: "35 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
  { id: "p4", title: "Saturn Records Cap",                       price: "28 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
  { id: "p5", title: "Cosmic Equation Poster",                   price: "18 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
  { id: "p6", title: "Space Is the Place Tote Bag",              price: "22 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
  { id: "p7", title: "Sun Ra Arkestra Enamel Pin",              price: "12 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
  { id: "p8", title: "Astro-Black Mythology Hoodie",            price: "65 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
]

// 2×2 composite covers for the Curated Playlists row.
const COMPOSITE_POOL = [
  "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/af/5c/40/af5c40a1-54b1-855d-3da2-f875efbd8372/06UMGIM04169.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/200x200bb.jpg",
]
const composite = (offset: number) => [0, 1, 2, 3].map(i => COMPOSITE_POOL[(offset + i) % COMPOSITE_POOL.length])

const CURATED_PLAYLISTS = [
  { id: "cp1", title: "Sun Ra Spiritual",          songCount: 34, owner: "Sarah K",  covers: composite(0) },
  { id: "cp2", title: "Cosmic Jazz Mornings",      songCount: 42, owned: true,       covers: composite(1) },
  { id: "cp3", title: "Astro Black Sessions",      songCount: 18, owner: "Marcus W", covers: composite(2) },
  { id: "cp4", title: "Arkestra Live",             songCount: 27, owner: "Léa M",    covers: composite(3) },
  { id: "cp5", title: "Saturn-bound",              songCount: 51, owner: "Otto K",   covers: composite(4) },
  { id: "cp6", title: "Spiritual Jazz Cornerstones", songCount: 38, owner: "Hana N", covers: composite(0) },
  { id: "cp7", title: "Outer Space Ways",          songCount: 29, owner: "Théo R",          covers: composite(2) },
  { id: "cp8", title: "Heliocentric Worlds",       songCount: 44, owner: "Muza Editorial",  covers: composite(1) },
]

const SIMILAR_ARTISTS = [
  { id: "sa1", name: "John Coltrane",   image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/John_Coltrane_1963_cropped_ver2.jpg/500px-John_Coltrane_1963_cropped_ver2.jpg" },
  { id: "sa2", name: "Alice Coltrane",  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Alice_Coltrane_1972.jpg/500px-Alice_Coltrane_1972.jpg" },
  { id: "sa3", name: "Pharoah Sanders", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Pharoah_Sanders_photo.jpg/500px-Pharoah_Sanders_photo.jpg" },
  { id: "sa4", name: "Yusef Lateef",    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Yusef_Lateef.jpg/500px-Yusef_Lateef.jpg" },
  { id: "sa5", name: "Don Cherry",      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Don_Cherry_in_2010.jpg/500px-Don_Cherry_in_2010.jpg" },
  { id: "sa6", name: "Anthony Braxton", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Anthony_braxton_5268134w.jpg/500px-Anthony_braxton_5268134w.jpg" },
  { id: "sa7", name: "Shabaka Hutchings", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shabaka_Hutchings_Sons_of_Kemet_Oslo_Jazzfestival_2018_%28223102%29.jpg/500px-Shabaka_Hutchings_Sons_of_Kemet_Oslo_Jazzfestival_2018_%28223102%29.jpg" },
  { id: "sa8", name: "Theon Cross",      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Theon_Cross_at_Ljubljana%2C_May_2015.jpg/500px-Theon_Cross_at_Ljubljana%2C_May_2015.jpg" },
]

export type ArtistSong = (typeof TOP_SONGS)[number]
export type ArtistRelease = (typeof DISCOGRAPHY)[number]

export interface ArtistProfile {
  name: string
  cover: string
  bio: string
  topSongs: ArtistSong[]
  discography: ArtistRelease[]
  topAlbums: { id: string; title: string; cover: string; artist: string; year: number }[]
  products: { id: string; title: string; price: string; cover: string }[]
  playlists: { id: string; title: string; songCount: number; owner?: string; owned?: boolean; covers: string[] }[]
  similar: { id: string; name: string; image: string }[]
}

const SUN_RA: ArtistProfile = {
  ...ARTIST,
  topSongs: TOP_SONGS,
  discography: DISCOGRAPHY,
  topAlbums: TOP_ALBUMS,
  products: PRODUCTS,
  playlists: CURATED_PLAYLISTS,
  similar: SIMILAR_ARTISTS,
}

interface ArtistSeed {
  slug: string
  name: string
  prefix: string
  cover: string
  bio: string
  similar: string[]
  /** title, original year, track count, 600px sleeve */
  releases: [string, number, number, string][]
  /** title, album, year, duration, 200px sleeve */
  songs: [string, string, number, string, string][]
}

const SEEDS: ArtistSeed[] = [
{
  "slug": "john-coltrane",
  "name": "John Coltrane",
  "prefix": "jc",
  "cover": "https://upload.wikimedia.org/wikipedia/commons/1/14/John_Coltrane_1963_cropped_ver2.jpg",
  "bio": "John Coltrane (September 23, 1926 – July 17, 1967) was an American saxophonist, bandleader and composer. He came up through the bands of Dizzy Gillespie and Miles Davis, then led one of the defining quartets of the 1960s, moving from the harmonic density of Giant Steps to the devotional, free-reaching music of A Love Supreme and his final years.",
  "similar": [
    "Pharoah Sanders",
    "Alice Coltrane",
    "Eric Dolphy",
    "McCoy Tyner",
    "Sonny Rollins",
    "Miles Davis",
    "Thelonious Monk",
    "Archie Shepp"
  ],
  "releases": [
    [
      "Blue Train",
      1957,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Soultrane",
      1958,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/3b/e3/3e/3be33e63-5f6e-8157-97e2-68cf8bed1dab/00888072349735.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Giant Steps",
      1960,
      7,
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4e/2f/8b/4e2f8b1f-7e14-1ce4-1c76-4683b1b9173d/603497847549.jpg/600x600bb.jpg"
    ],
    [
      "My Favorite Things",
      1961,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/38/49/44/384944a8-297f-0844-77da-1ae3b976c457/603497893119.jpg/600x600bb.jpg"
    ],
    [
      "Olé Coltrane",
      1962,
      3,
      "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/48/c3/72/48c37285-db49-09c7-3635-8945d8a1152d/603497893102.jpg/600x600bb.jpg"
    ],
    [
      "Ballads",
      1963,
      22,
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d3/df/2d/d3df2d33-99b9-2edd-e7e7-9ee13bceb0db/06UMGIM14021.rgb.jpg/600x600bb.jpg"
    ],
    [
      "John Coltrane and Johnny Hartman",
      1963,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2b/6c/b7/2b6cb70e-8e01-1d96-f8f8-23aa73d5d7c2/06UMGIM09995.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Crescent",
      1964,
      5,
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/91/b6/bb/91b6bb11-26ab-13fb-95aa-67abec45aa5d/15UMGIM36230.rgb.jpg/600x600bb.jpg"
    ],
    [
      "A Love Supreme",
      1965,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Ascension",
      1966,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/49/39/f6/4939f68e-00a5-49f4-9642-57020b789e19/00602547491763.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Meditations",
      1966,
      5,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/ab/97/78/ab97788c-e153-15ab-bbfb-13e2d16b2367/00602517920378.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Kulu Sé Mama",
      1967,
      3,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/ff/88/a6/ff88a694-92e6-6a12-afd0-7c67bf76f58a/00602517920347.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Expression",
      1967,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/97/2c/fe/972cfe14-d37d-e1fb-fa55-2cb0c8e411dd/00602527768274.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Interstellar Space",
      1974,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/b0/0a/82/b00a8242-72b9-4584-173e-349c3e91b6c1/00731454341523.rgb.jpg/600x600bb.jpg"
    ]
  ],
  "songs": [
    [
      "Acknowledgement",
      "A Love Supreme",
      1965,
      "7:48",
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/200x200bb.jpg"
    ],
    [
      "My Favorite Things",
      "My Favorite Things",
      1961,
      "2:47",
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/38/49/44/384944a8-297f-0844-77da-1ae3b976c457/603497893119.jpg/200x200bb.jpg"
    ],
    [
      "Giant Steps",
      "Giant Steps",
      1960,
      "4:47",
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4e/2f/8b/4e2f8b1f-7e14-1ce4-1c76-4683b1b9173d/603497847549.jpg/200x200bb.jpg"
    ],
    [
      "Naima",
      "Giant Steps",
      1960,
      "4:25",
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4e/2f/8b/4e2f8b1f-7e14-1ce4-1c76-4683b1b9173d/603497847549.jpg/200x200bb.jpg"
    ],
    [
      "Blue Train",
      "Blue Train",
      1957,
      "8:58",
      "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Moment's Notice",
      "Blue Train",
      1957,
      "9:08",
      "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Lonnie's Lament",
      "Crescent",
      1964,
      "10:15",
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/91/b6/bb/91b6bb11-26ab-13fb-95aa-67abec45aa5d/15UMGIM36230.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Crescent",
      "Crescent",
      1964,
      "8:42",
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/91/b6/bb/91b6bb11-26ab-13fb-95aa-67abec45aa5d/15UMGIM36230.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Say It",
      "Ballads",
      1963,
      "4:17",
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d3/df/2d/d3df2d33-99b9-2edd-e7e7-9ee13bceb0db/06UMGIM14021.rgb.jpg/200x200bb.jpg"
    ]
  ]
},
{
  "slug": "herbie-hancock",
  "name": "Herbie Hancock",
  "prefix": "hh",
  "cover": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Herbie_Hancock_2023.jpg",
  "bio": "Herbie Hancock (born April 12, 1940) is an American pianist, keyboardist, bandleader and composer. A member of Miles Davis's second great quintet and a Blue Note leader in his twenties, he went on to reshape jazz-funk with Head Hunters, put a turntable on the charts with Rockit, and win the Grammy for Album of the Year with River: The Joni Letters.",
  "similar": [
    "Wayne Shorter",
    "Miles Davis",
    "Chick Corea",
    "Ron Carter",
    "Tony Williams",
    "Keith Jarrett",
    "Bill Evans",
    "Freddie Hubbard"
  ],
  "releases": [
    [
      "Takin' Off",
      1962,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/69/a6/20/69a62043-8901-787f-afef-3e310f2deb0c/00602537821594.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Empyrean Isles",
      1964,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/54/49/9d/54499dbd-8b9c-4081-7f53-23e533d8be3d/00602537465316.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Maiden Voyage",
      1965,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/64/b6/04/64b6040c-a931-0a5c-6b7c-82e0dd5c3d4c/19UMGIM73745.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Speak Like a Child",
      1968,
      7,
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/21/b8/21/21b8210f-3539-d2c3-3827-bc4d686d1085/13UMGIM19882.rgb.jpg/600x600bb.jpg"
    ],
    [
      "The Prisoner",
      1969,
      5,
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/66/37/39/663739c2-97b5-9db9-aa38-884967a1619f/00602537650026.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Mwandishi",
      1971,
      3,
      "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/e9/81/82/e98182a5-8771-c081-4ea0-1bd84fa10ae4/093624754121.jpg/600x600bb.jpg"
    ],
    [
      "Head Hunters",
      1973,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4f/e5/f5/4fe5f511-462e-e87b-0711-d4e42809fb17/dj.goshfswo.jpg/600x600bb.jpg"
    ],
    [
      "Thrust",
      1974,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/23/86/ec/2386ecc2-07a8-a190-fc0f-67539fb4bee1/dj.kfbtszgl.jpg/600x600bb.jpg"
    ],
    [
      "Man-Child",
      1975,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Features124/v4/8c/5a/5e/8c5a5e00-99f9-e61e-00a0-3e32f058e03f/dj.irhlelse.jpg/600x600bb.jpg"
    ],
    [
      "Sunlight",
      1978,
      5,
      "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/e7/41/4c/e7414ccb-3aae-322d-01a3-b58df43daea6/dj.cpycospf.jpg/600x600bb.jpg"
    ],
    [
      "Future Shock",
      1983,
      7,
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/80/bc/3f/80bc3fd0-44b9-266a-ad03-088acd54f034/dj.qxuqsbxw.jpg/600x600bb.jpg"
    ],
    [
      "Gershwin's World",
      1998,
      14,
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/84/05/68/8405683a-4b4c-2f53-f7cd-a371ecb9b981/00602547331359.rgb.jpg/600x600bb.jpg"
    ],
    [
      "River: The Joni Letters",
      2007,
      10,
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/f8/2a/63/f82a63ef-6473-50b7-1d2d-05beac979daa/00602527883397.rgb.jpg/600x600bb.jpg"
    ],
    [
      "The Imagine Project",
      2010,
      10,
      "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/a9/fd/23/a9fd234c-b5f6-b69e-faf0-9e3ed77ab974/884977621235.tif/600x600bb.jpg"
    ]
  ],
  "songs": [
    [
      "Cantaloupe Island",
      "Empyrean Isles",
      1964,
      "5:33",
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/54/49/9d/54499dbd-8b9c-4081-7f53-23e533d8be3d/00602537465316.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Maiden Voyage",
      "Maiden Voyage",
      1965,
      "4:49",
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/64/b6/04/64b6040c-a931-0a5c-6b7c-82e0dd5c3d4c/19UMGIM73745.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Chameleon",
      "Head Hunters",
      1973,
      "15:44",
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4f/e5/f5/4fe5f511-462e-e87b-0711-d4e42809fb17/dj.goshfswo.jpg/200x200bb.jpg"
    ],
    [
      "Watermelon Man",
      "Head Hunters",
      1973,
      "6:30",
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4f/e5/f5/4fe5f511-462e-e87b-0711-d4e42809fb17/dj.goshfswo.jpg/200x200bb.jpg"
    ],
    [
      "Sly",
      "Head Hunters",
      1973,
      "10:21",
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4f/e5/f5/4fe5f511-462e-e87b-0711-d4e42809fb17/dj.goshfswo.jpg/200x200bb.jpg"
    ],
    [
      "Dolphin Dance",
      "Maiden Voyage",
      1965,
      "9:19",
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/64/b6/04/64b6040c-a931-0a5c-6b7c-82e0dd5c3d4c/19UMGIM73745.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Rockit",
      "Future Shock",
      1983,
      "5:28",
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/80/bc/3f/80bc3fd0-44b9-266a-ad03-088acd54f034/dj.qxuqsbxw.jpg/200x200bb.jpg"
    ],
    [
      "Actual Proof",
      "Thrust",
      1974,
      "9:41",
      "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/23/86/ec/2386ecc2-07a8-a190-fc0f-67539fb4bee1/dj.kfbtszgl.jpg/200x200bb.jpg"
    ],
    [
      "Speak Like a Child",
      "Speak Like a Child",
      1968,
      "7:48",
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/21/b8/21/21b8210f-3539-d2c3-3827-bc4d686d1085/13UMGIM19882.rgb.jpg/200x200bb.jpg"
    ],
    [
      "One Finger Snap",
      "Empyrean Isles",
      1964,
      "7:17",
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/54/49/9d/54499dbd-8b9c-4081-7f53-23e533d8be3d/00602537465316.rgb.jpg/200x200bb.jpg"
    ]
  ]
},
{
  "slug": "charles-mingus",
  "name": "Charles Mingus",
  "prefix": "cm",
  "cover": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Charles_Mingus_1976_cropped.jpg",
  "bio": "Charles Mingus (April 22, 1922 – January 5, 1979) was an American double bassist, pianist, bandleader and composer. He wrote for his bands the way Ellington wrote for his, with gospel, blues and collective improvisation in the same breath, and his Jazz Workshop produced Mingus Ah Um and the suite The Black Saint and the Sinner Lady.",
  "similar": [
    "Eric Dolphy",
    "Duke Ellington",
    "Thelonious Monk",
    "Max Roach",
    "Charlie Parker",
    "Roland Kirk",
    "Sun Ra",
    "Miles Davis"
  ],
  "releases": [
    [
      "Pithecanthropus Erectus",
      1956,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/9f/fe/24/mzi.erofcrhm.jpg/600x600bb.jpg"
    ],
    [
      "The Clown",
      1957,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/cc/01/b8/mzi.xxfrxghi.jpg/600x600bb.jpg"
    ],
    [
      "Mingus Ah Um",
      1959,
      9,
      "https://is1-ssl.mzstatic.com/image/thumb/Music2/v4/de/3d/f3/de3df34f-9628-4a61-c14c-d0187fac484c/5099749523128.jpg/600x600bb.jpg"
    ],
    [
      "Mingus Dynasty",
      1960,
      10,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/46/40/3a/mzi.oyszqqqz.jpg/600x600bb.jpg"
    ],
    [
      "Blues & Roots",
      1960,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/57/77/07/57770753-df60-41ab-01b3-ff3db1da1220/603497900206.jpg/600x600bb.jpg"
    ],
    [
      "Oh Yeah",
      1962,
      10,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/e3/f4/6d/mzi.rbljrjdk.jpg/600x600bb.jpg"
    ],
    [
      "The Black Saint and the Sinner Lady",
      1963,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Mingus Mingus Mingus Mingus Mingus",
      1964,
      8,
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/e5/a1/b5/e5a1b58a-6f95-7161-3f54-cd89f1fe5006/06UMGIM04311.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Let My Children Hear Music",
      1972,
      7,
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ad/ca/d0/adcad012-aba2-7ff2-2fbb-2f0eba25e005/074644891027.jpg/600x600bb.jpg"
    ],
    [
      "Changes One",
      1975,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/18/5e/d4/mzi.xbaamrgw.jpg/600x600bb.jpg"
    ],
    [
      "Changes Two",
      1975,
      5,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/c5/4e/23/mzi.zsrzvots.jpg/600x600bb.jpg"
    ],
    [
      "Cumbia & Jazz Fusion",
      1978,
      4,
      "https://is1-ssl.mzstatic.com/image/thumb/Features/v4/4f/be/b6/4fbeb69a-2bee-cb2b-9cae-5fb898e2c38b/dj.lhjoszyy.jpg/600x600bb.jpg"
    ]
  ],
  "songs": [
    [
      "Goodbye Pork Pie Hat",
      "Mingus Ah Um",
      1959,
      "5:44",
      "https://is1-ssl.mzstatic.com/image/thumb/Music2/v4/de/3d/f3/de3df34f-9628-4a61-c14c-d0187fac484c/5099749523128.jpg/200x200bb.jpg"
    ],
    [
      "Better Git It in Your Soul",
      "Mingus Ah Um",
      1959,
      "7:24",
      "https://is1-ssl.mzstatic.com/image/thumb/Music2/v4/de/3d/f3/de3df34f-9628-4a61-c14c-d0187fac484c/5099749523128.jpg/200x200bb.jpg"
    ],
    [
      "Fables of Faubus",
      "Mingus Ah Um",
      1959,
      "8:13",
      "https://is1-ssl.mzstatic.com/image/thumb/Music2/v4/de/3d/f3/de3df34f-9628-4a61-c14c-d0187fac484c/5099749523128.jpg/200x200bb.jpg"
    ],
    [
      "Boogie Stop Shuffle",
      "Mingus Ah Um",
      1959,
      "5:02",
      "https://is1-ssl.mzstatic.com/image/thumb/Music2/v4/de/3d/f3/de3df34f-9628-4a61-c14c-d0187fac484c/5099749523128.jpg/200x200bb.jpg"
    ],
    [
      "Moanin'",
      "Blues & Roots",
      1960,
      "8:02",
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/57/77/07/57770753-df60-41ab-01b3-ff3db1da1220/603497900206.jpg/200x200bb.jpg"
    ],
    [
      "Wednesday Night Prayer Meeting",
      "Blues & Roots",
      1960,
      "5:42",
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/57/77/07/57770753-df60-41ab-01b3-ff3db1da1220/603497900206.jpg/200x200bb.jpg"
    ],
    [
      "Haitian Fight Song",
      "The Clown",
      1957,
      "12:01",
      "https://is1-ssl.mzstatic.com/image/thumb/Music/cc/01/b8/mzi.xxfrxghi.jpg/200x200bb.jpg"
    ],
    [
      "II B.S.",
      "Mingus Mingus Mingus Mingus Mingus",
      1964,
      "4:48",
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/e5/a1/b5/e5a1b58a-6f95-7161-3f54-cd89f1fe5006/06UMGIM04311.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Hog Callin' Blues",
      "Oh Yeah",
      1962,
      "7:25",
      "https://is1-ssl.mzstatic.com/image/thumb/Music/e3/f4/6d/mzi.rbljrjdk.jpg/200x200bb.jpg"
    ]
  ]
},
{
  "slug": "wayne-shorter",
  "name": "Wayne Shorter",
  "prefix": "ws",
  "cover": "https://upload.wikimedia.org/wikipedia/commons/8/81/Wayne-Shorter_in_Amsterdam%2C_1980.jpg",
  "bio": "Wayne Shorter (August 25, 1933 – March 2, 2023) was an American saxophonist and composer. He wrote for Art Blakey's Jazz Messengers and Miles Davis's second quintet, recorded a run of Blue Note albums led by Speak No Evil, co-founded Weather Report, and kept leading a searching acoustic quartet into his eighties.",
  "similar": [
    "Herbie Hancock",
    "Miles Davis",
    "Freddie Hubbard",
    "Joe Henderson",
    "Art Blakey",
    "Lee Morgan",
    "Jaco Pastorius",
    "John Coltrane"
  ],
  "releases": [
    [
      "Night Dreamer",
      1964,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/0c/94/3d/0c943d84-52c8-c012-c1cf-aefc54b5ece4/00602537483983.rgb.jpg/600x600bb.jpg"
    ],
    [
      "JuJu",
      1965,
      7,
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/86/77/08/86770876-1f94-8be0-056a-93d16b2643d5/13UMGIM28468.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Speak No Evil",
      1966,
      7,
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4f/26/3c/4f263c51-4053-4ca9-602b-47816398c45a/13UAEIM18774.rgb.jpg/600x600bb.jpg"
    ],
    [
      "The All Seeing Eye",
      1966,
      5,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/ba/24/f8/ba24f853-e607-303b-4592-8187b2c38439/00602537483624.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Adam's Apple",
      1967,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/62/41/71/62417181-ff5a-1262-3537-9bb1d09cb836/00602537429752.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Schizophrenia",
      1969,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/1d/9b/20/1d9b2089-ce02-3e8b-ee1d-78725fe7d8c8/00602537484447.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Super Nova",
      1969,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/03/1d/7c/031d7cbb-5b4a-001d-ae0e-2f82dccbbf46/00602537483570.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Odyssey of Iska",
      1971,
      5,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/d0/95/0b/d0950b34-9990-7448-e693-1c57b7c6d70a/00602537484430.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Native Dancer",
      1975,
      9,
      "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/0d/9e/37/0d9e3719-ddc0-f932-75b0-a359977952b2/886443433724.jpg/600x600bb.jpg"
    ],
    [
      "Atlantis",
      1985,
      9,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/99/7a/77/997a7775-9fa8-94be-05f0-e6b9b436a7fe/886443433748.jpg/600x600bb.jpg"
    ],
    [
      "Phantom Navigator",
      1987,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/59/7f/5a/597f5ab5-d59a-50f5-ec06-3ce3a8f873fc/886443433762.jpg/600x600bb.jpg"
    ],
    [
      "High Life",
      1995,
      9,
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/9c/b5/b3/9cb5b305-4a53-7f9f-b349-1a38100bc4d0/00731452922427.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Footprints Live!",
      2002,
      8,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/2b/07/50/2b075037-a1d4-139c-79bf-916cd24d84f9/00731458967927.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Without a Net",
      2013,
      9,
      "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c7/10/e3/c710e36c-a9f4-f210-5a30-345d40881755/05099972167458.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Emanon",
      2018,
      11,
      "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b9/7f/f8/b97ff829-e363-788d-64c8-1809ae31af54/00602577399497.rgb.jpg/600x600bb.jpg"
    ]
  ],
  "songs": [
    [
      "Speak No Evil",
      "Speak No Evil",
      1966,
      "8:23",
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4f/26/3c/4f263c51-4053-4ca9-602b-47816398c45a/13UAEIM18774.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Witch Hunt",
      "Speak No Evil",
      1966,
      "8:11",
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4f/26/3c/4f263c51-4053-4ca9-602b-47816398c45a/13UAEIM18774.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Infant Eyes",
      "Speak No Evil",
      1966,
      "6:54",
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4f/26/3c/4f263c51-4053-4ca9-602b-47816398c45a/13UAEIM18774.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Fee-Fi-Fo-Fum",
      "Speak No Evil",
      1966,
      "5:54",
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4f/26/3c/4f263c51-4053-4ca9-602b-47816398c45a/13UAEIM18774.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Footprints",
      "Adam's Apple",
      1967,
      "8:55",
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/62/41/71/62417181-ff5a-1262-3537-9bb1d09cb836/00602537429752.rgb.jpg/200x200bb.jpg"
    ],
    [
      "JuJu",
      "JuJu",
      1965,
      "8:29",
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/86/77/08/86770876-1f94-8be0-056a-93d16b2643d5/13UMGIM28468.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Yes or No",
      "JuJu",
      1965,
      "6:39",
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/86/77/08/86770876-1f94-8be0-056a-93d16b2643d5/13UMGIM28468.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Night Dreamer",
      "Night Dreamer",
      1964,
      "7:15",
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/0c/94/3d/0c943d84-52c8-c012-c1cf-aefc54b5ece4/00602537483983.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Ponta de Areia",
      "Native Dancer",
      1975,
      "5:15",
      "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/0d/9e/37/0d9e3719-ddc0-f932-75b0-a359977952b2/886443433724.jpg/200x200bb.jpg"
    ],
    [
      "Dance Cadaverous",
      "Speak No Evil",
      1966,
      "6:45",
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4f/26/3c/4f263c51-4053-4ca9-602b-47816398c45a/13UAEIM18774.rgb.jpg/200x200bb.jpg"
    ]
  ]
},
{
  "slug": "pharoah-sanders",
  "name": "Pharoah Sanders",
  "prefix": "ps",
  "cover": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Pharoah_Sanders_photo.jpg",
  "bio": "Pharoah Sanders (October 13, 1940 – September 24, 2022) was an American saxophonist. He played in John Coltrane's last groups and worked with Sun Ra before making spiritual jazz his own on Karma and Thembi, and more than fifty years on he closed his recording life with Promises, made with Floating Points and the London Symphony Orchestra.",
  "similar": [
    "John Coltrane",
    "Alice Coltrane",
    "Sun Ra",
    "Albert Ayler",
    "Archie Shepp",
    "Yusef Lateef",
    "Don Cherry",
    "Kamasi Washington"
  ],
  "releases": [
    [
      "Tauhid",
      1967,
      3,
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/7a/2a/ab/7a2aabaa-e590-d637-b6b4-3f3f2f9ba4fc/06UMGIM01889.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Karma",
      1969,
      2,
      "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Jewels of Thought",
      1970,
      2,
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/cf/bb/20/cfbb20af-9157-3471-0b0d-124ca79a8fbf/06UMGIM00752.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Deaf Dumb Blind",
      1970,
      2,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/2e/96/94/2e96940d-62bb-f3e3-c106-f3d306f3361c/00011105026529.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Thembi",
      1971,
      6,
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/31/d5/ec/31d5ec35-5cc0-088d-8725-3b97ba51434c/06UMGIM01890.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Black Unity",
      1972,
      1,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/3e/9f/78/3e9f7862-d020-e55f-7bc1-0b024236431c/00011105021920.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Live at the East",
      1972,
      3,
      "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/93/74/19/937419ba-71f9-f002-5250-e5c1beac9b76/19UMGIM36408.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Village of the Pharoahs",
      1973,
      7,
      "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/b8/8b/14/b88b1416-ff41-5c99-051f-4d4d9c74cd6f/00602498594858.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Elevation",
      1974,
      5,
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/ea/e8/30/eae83027-98bc-f619-d5e6-1edf9be43441/00602498802793.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Love in Us All",
      1974,
      2,
      "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/85/6f/28/856f28f7-f74b-9302-98a3-fcd1848eee43/19UMGIM36415.rgb.jpg/600x600bb.jpg"
    ],
    [
      "Pharoah",
      1977,
      3,
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/6e/0e/b4/6e0eb485-2cc8-f2d7-e123-eac40ec75f02/680899009027.jpg/600x600bb.jpg"
    ],
    [
      "Journey to the One",
      1980,
      10,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/91/17/dd/mzi.lycnzbku.jpg/600x600bb.jpg"
    ],
    [
      "Welcome to Love",
      1991,
      10,
      "https://is1-ssl.mzstatic.com/image/thumb/Music/96/87/a2/mzi.uxxnyhrp.jpg/600x600bb.jpg"
    ],
    [
      "Promises",
      2021,
      9,
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/af/dc/6b/afdc6b88-b275-de4e-3098-63dff171dffb/680899009720.jpg/600x600bb.jpg"
    ]
  ],
  "songs": [
    [
      "The Creator Has a Master Plan",
      "Karma",
      1969,
      "8:53",
      "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Thembi",
      "Thembi",
      1971,
      "7:04",
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/31/d5/ec/31d5ec35-5cc0-088d-8725-3b97ba51434c/06UMGIM01890.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Astral Traveling",
      "Thembi",
      1971,
      "5:50",
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/31/d5/ec/31d5ec35-5cc0-088d-8725-3b97ba51434c/06UMGIM01890.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Upper Egypt & Lower Egypt",
      "Tauhid",
      1967,
      "6:03",
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/7a/2a/ab/7a2aabaa-e590-d637-b6b4-3f3f2f9ba4fc/06UMGIM01889.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Love Is Everywhere",
      "Love in Us All",
      1974,
      "5:18",
      "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/85/6f/28/856f28f7-f74b-9302-98a3-fcd1848eee43/19UMGIM36415.rgb.jpg/200x200bb.jpg"
    ],
    [
      "You've Got to Have Freedom",
      "Journey to the One",
      1980,
      "6:52",
      "https://is1-ssl.mzstatic.com/image/thumb/Music/91/17/dd/mzi.lycnzbku.jpg/200x200bb.jpg"
    ],
    [
      "Harvest Time",
      "Pharoah",
      1977,
      "20:24",
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/6e/0e/b4/6e0eb485-2cc8-f2d7-e123-eac40ec75f02/680899009027.jpg/200x200bb.jpg"
    ],
    [
      "Hum-Allah-Hum-Allah-Hum-Allah",
      "Jewels of Thought",
      1970,
      "15:10",
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/cf/bb/20/cfbb20af-9157-3471-0b0d-124ca79a8fbf/06UMGIM00752.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Elevation",
      "Elevation",
      1974,
      "18:01",
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/ea/e8/30/eae83027-98bc-f619-d5e6-1edf9be43441/00602498802793.rgb.jpg/200x200bb.jpg"
    ],
    [
      "Colors",
      "Karma",
      1969,
      "5:37",
      "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/200x200bb.jpg"
    ]
  ]
}
]

const OWNERS = ["Sarah K", "Marcus W", "L\u00e9a M", "Otto K", "Hana N", "Muza Editorial"]

/* Same shape as Sun Ra's hand-written page, derived from a seed so another
   artist is a data entry rather than a copy of a screen. Products and
   playlists are mock on every profile; the names come from the artist's own
   records so the rails read as theirs. */
function buildProfile(s: ArtistSeed): ArtistProfile {
  const discography: ArtistRelease[] = s.releases.map(([title, year, tracks, cover], i) => ({
    id: `${s.prefix}-d${i + 1}`, title, year, kind: "album", type: "album", tracks, band: s.name, cover,
  }))
  const thumbs = discography.map(r => r.cover.replace("600x600bb", "200x200bb"))
  const composite = (offset: number) => [0, 1, 2, 3].map(i => thumbs[(offset + i * 3) % thumbs.length])
  // The newest sleeves first would lead with late records; the seed order is
  // chronological, so the rail runs from the middle of the career outward.
  const featured = [...discography].sort((a, b) => Math.abs(a.year - discography[Math.floor(discography.length / 2)].year) - Math.abs(b.year - discography[Math.floor(discography.length / 2)].year)).slice(0, 8)
  const lead = featured[0]
  const next = featured[1]
  return {
    name: s.name,
    cover: s.cover,
    bio: s.bio,
    topSongs: s.songs.map(([title, album, year, duration, cover], i) => ({ id: `${s.prefix}-s${i + 1}`, cover, title, album, year, duration })),
    discography,
    topAlbums: featured.map(r => ({ id: r.id, title: r.title, cover: r.cover, artist: s.name, year: r.year })),
    products: [
      { id: `${s.prefix}-p1`, title: `${lead.title} \u2014 Vinyl Reissue`, price: "32 $", cover: lead.cover },
      { id: `${s.prefix}-p2`, title: `${next.title} \u2014 Vinyl Reissue`, price: "34 $", cover: next.cover },
      { id: `${s.prefix}-p3`, title: `${s.name} Tee \u2014 Black`, price: "35 $", cover: lead.cover },
      { id: `${s.prefix}-p4`, title: `${s.name} Tote Bag`, price: "22 $", cover: next.cover },
    ],
    playlists: [`${s.name} Essentials`, `${lead.title} and After`, `${s.name}: Deep Cuts`, `Late Night ${s.name}`, `${s.name} Live`, `Starting with ${s.name}`].map((title, i) => ({
      id: `${s.prefix}-cp${i + 1}`, title, songCount: 18 + i * 7, owner: OWNERS[i % OWNERS.length], covers: composite(i * 2),
    })),
    // Only artists with a real portrait: `artistImage` is undefined otherwise.
    similar: s.similar.flatMap(name => {
      const image = artistImage(name)
      return image ? [{ id: slugify(name), name, image }] : []
    }),
  }
}

const PROFILES: Record<string, ArtistProfile> = {
  "sun-ra": SUN_RA,
  ...Object.fromEntries(SEEDS.map(s => [s.slug, buildProfile(s)])),
}

// Register every artist's releases and playlists so their cards resolve to
// real synthesized detail pages rather than the default album. Runs once at
// module load; `registerAlbums` never overwrites a curated catalog entry.
for (const p of Object.values(PROFILES)) {
  registerAlbums(p.discography.map(r => ({
    id: r.id, title: r.title, cover: r.cover,
    artist: r.band ?? p.name, year: r.year })))
  registerPlaylists(p.playlists.map(x => ({
    id: x.id, title: x.title, covers: x.covers,
    songCount: x.songCount, owner: x.owner, owned: x.owned })))
}

export function getArtistProfile(slug?: string | null): ArtistProfile {
  return (slug && PROFILES[slug]) || SUN_RA
}
