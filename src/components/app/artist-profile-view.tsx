"use client"

/*
 * ArtistProfileView — the artist landing page.
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 8971:98256.
 *
 * Layout (top → bottom):
 *   1. Full-bleed hero — backdrop photo + dark gradient overlay,
 *      back-arrow, name (huge), short bio with "read more", plus a
 *      row of action buttons (Play, Artist radio, Share, More).
 *   2. Sticky tab strip — Overview / Discography / Products.
 *   3. Content sections (in order):
 *        · Top Songs        (2-column SongListItem grid)
 *        · Top Albums       (CardRail of AlbumCards)
 *        · Products         (CardRail of ProductCards)
 *        · Curated Playlists (CardRail of PlaylistCards)
 *        · Similar Artists   (CardRail of ArtistCards)
 *
 * Section header pattern matches the rest of the home: separator
 * line + title-left + ◀ ▶ + "Show all" right. CardRail already
 * delivers that exact treatment; we only render a manually-styled
 * header for the Top Songs section because its body is a grid, not
 * a horizontal scroll rail.
 */

import * as React from "react"
import { useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, LayoutGrid, List, MoreHorizontal, Radio, Heart, ListPlus, Disc3, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { ContentTypeBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MultiSelect } from "@/components/ui/multi-select"
import { Separator } from "@/components/ui/separator"
import { SingleSelect } from "@/components/ui/single-select"
import { TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlbumCardMenuItems } from "@/components/ui/cover-card-menu"
import { useUserLibrary } from "@/lib/user-library"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
import { albumMetaFor, libraryIdForTitle } from "@/lib/album-meta"
import { ShareButton, ShareMenuItems } from "@/components/ui/share-button"
import { useCredits } from "@/lib/credits-context"
import { hasAlbumDetail, registerAlbums } from "@/lib/album-catalog"
import { hasPlaylistDetail, registerPlaylists } from "@/lib/playlist-catalog"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { useFooterNav } from "@/lib/use-media-query"
import { usePlayer } from "@/lib/player"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { AlbumCard } from "@/components/ui/album-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { PlaylistCard } from "@/components/ui/playlist-card"
import { ProductCard } from "@/components/ui/product-card"
import { SongListItem } from "@/components/ui/song-list-item"
import { CoverPlayButton } from "@/components/ui/cover-play-button"
import { PlayFilledAlt, PauseFilledAlt } from "@/components/ui/transport-icons"
import { CardRail } from "@/components/app/card-rail"
import { usePublishDetailHeader } from "@/lib/detail-actions"

// ─── Mock data ──────────────────────────────────────────────────────────────
//
// Sun Ra is the example artist in the Figma. The data below is
// hand-curated jazz content so the layout reads as a real profile.

const ARTIST = {
  name:   "Sun Ra",
  cover:  "https://miro.medium.com/v2/resize:fit:4800/format:webp/1*lGV1JcK0hYHFLvyimbVK5Q.jpeg",
  bio:    "Sun Ra (born Herman Poole Blount; May 22, 1914 – May 30, 1993) was an American jazz composer, bandleader, piano and synthesizer player, and poet known for his experimental music, cosmic philosophy, prolific output and theatrical performances.",
}

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
  { id: "s1",  cover: COVER_SPACE,      title: "Space Is the Place",       album: "Space Is the Place",                       year: 1973, duration: "21:14", badge: "Title track" },
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
type ReleaseKind = "album" | "single" | "ep" | "remix" | "secondary"
type ReleaseType = "album" | "single" | "ep"
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
]

const SIMILAR_ARTISTS = [
  { id: "sa1", name: "John Coltrane",   image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/John_Coltrane_1963_cropped_ver2.jpg/500px-John_Coltrane_1963_cropped_ver2.jpg" },
  { id: "sa2", name: "Alice Coltrane",  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Alice_Coltrane_1972.jpg/500px-Alice_Coltrane_1972.jpg" },
  { id: "sa3", name: "Pharoah Sanders", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Pharoah_Sanders_photo.jpg/500px-Pharoah_Sanders_photo.jpg" },
  { id: "sa4", name: "Yusef Lateef",    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Yusef_Lateef.jpg/500px-Yusef_Lateef.jpg" },
  { id: "sa5", name: "Don Cherry",      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Don_Cherry_in_2010.jpg/500px-Don_Cherry_in_2010.jpg" },
  { id: "sa6", name: "Anthony Braxton", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Anthony_braxton_5268134w.jpg/500px-Anthony_braxton_5268134w.jpg" },
]

// Register this artist's releases + curated playlists into the catalogs
// so their cards resolve to real synthesized detail pages (rather than
// the default fallback). Runs once at module load.
registerAlbums(
  DISCOGRAPHY.map(r => ({
    id: r.id, title: r.title, cover: r.cover,
    artist: r.band ?? ARTIST.name, year: r.year,
  })),
)
registerPlaylists(
  CURATED_PLAYLISTS.map(p => ({
    id: p.id, title: p.title, covers: p.covers,
    songCount: p.songCount, owner: p.owner, owned: p.owned,
  })),
)

// ─── View ───────────────────────────────────────────────────────────────────

export function ArtistProfileView() {
  const { openAlbum, openPlaylist, openArtist } = useMediaNav()
  const [tab, setTab] = useState("overview")
  const [bioOpen, setBioOpen] = useState(false)
  const library = useUserLibrary()
  const player = usePlayer()
  // This artist is the active player source AND playing → hero Play
  // button shows Pause.
  const isThisArtistPlaying = player.playing && player.playingFrom === ARTIST.name
  // Artist library key — the hero heart and the mobile "…" menu both bind
  // to the shared store by this id, so they stay in sync (and persist).
  const artistId = slugify(ARTIST.name)
  // On mobile (footer-nav active) the hero's Share + library buttons
  // collapse into the floating header's "…"; gated on the actual
  // footer-nav breakpoint, not Tailwind's `md`, so it stays in sync.
  const footerNav = useFooterNav()

  // Publish the title + cover + menu for the floating mobile chrome. On
  // mobile the hero's Share + Add-to-library buttons collapse into the
  // header's "…" (top-right, mirroring the back top-left); this config
  // drives that menu. The chrome samples `coverSrc` to flip the back icon
  // light/dark to stay legible over the hero photo.
  usePublishDetailHeader({
    title: ARTIST.name,
    coverSrc: ARTIST.cover,
    menu: {
      kind: "artist",
      title: ARTIST.name,
      subtitle: "Artist",
      cover: ARTIST.cover,
      // Save action binds to the global user-library store (same as the
      // hero heart) so the two stay in sync and Save flips to Remove.
      libraryType: "artist",
      libraryId: artistId,
      libraryName: ARTIST.name,
    },
  })

  // No `overflow-auto` here — the outer layout already owns the page
  // scroll. A second scroll container would break sticky positioning
  // for descendants like the Discography table head.
  return (
    <div className="flex-1">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      {/* `dark` flips the design tokens locally for everything inside
           the hero — text-foreground = light, bg-background = dark,
           border-border = dark border, etc. — so the standard
           Button outline variant (border-border + bg-background/20 +
           backdrop-blur) renders correctly on the dark photo backdrop
           without any per-button colour overrides. */}
      {/* Hero height is locked to the same growth ceilings as the
           inner content wrappers (the page-wide
           `max-w-[1480px] min-[1920px]:max-w-[1716px]` pattern).
           At each ceiling the natural aspect-[1072/400] gives:
             ·  tier 1: 1480 × 400/1072 ≈ 552px
             ·  tier 2: 1716 × 400/1072 ≈ 640px
           So the hero stops growing taller at exactly the same
           viewport widths where the rails stop growing wider. */}
      <section className="dark relative w-full aspect-[1072/400] min-h-[320px] max-h-[552px] min-[1920px]:max-h-[640px] overflow-hidden text-foreground">
        <img
          src={ARTIST.cover}
          alt={ARTIST.name}
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
        {/* Theme-agnostic dark gradient over the photo so the
             foreground content stays readable regardless of cover. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/40 to-black/80"
        />

        {/* Back lives in the top bar (chrome) — see the shell's <Topbar>. */}

        {/* Name + bio — pinned to bottom-left of the hero. */}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] w-full px-page pb-8 flex flex-col gap-4">
          <div className="max-w-3xl flex flex-col gap-3">
            <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-medium leading-[1.05] tracking-tight">
              {ARTIST.name}
            </h1>
            <p className={cn("text-small leading-6 text-foreground/90", !bioOpen && "line-clamp-3")}>
              {ARTIST.bio}{" "}
              <button
                type="button"
                onClick={() => setBioOpen(o => !o)}
                className="underline underline-offset-[3px] [text-decoration-thickness:1px] cursor-pointer"
              >
                {bioOpen ? "show less" : "read more"}
              </button>
            </p>
          </div>

          {/* Action row — Play (primary), Artist radio (outline), then
               circular Share + Add-to-library on the right. On mobile
               (max-md, the footer-nav breakpoint) the Share + library
               buttons collapse into the floating header's "…" instead,
               so they're hidden here. */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="lg"
                className="h-12 px-6 rounded-full"
                aria-pressed={isThisArtistPlaying}
                onClick={() => {
                  if (player.playingFrom === ARTIST.name && player.track) { player.toggle(); return }
                  const s = TOP_SONGS[0]; player.play(
                    { title: s.title, artist: ARTIST.name, album: s.album, image: s.cover, totalTime: s.duration, artistAvatar: ARTIST.cover },
                    ARTIST.name,
                  )
                }}
              >
                {isThisArtistPlaying ? <PauseFilledAlt className="size-4" /> : <PlayFilledAlt className="size-4" />}
                {isThisArtistPlaying ? "Pause" : "Play"}
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-6 rounded-full">
                <Radio />
                Artist radio
              </Button>
            </div>
            {!footerNav && (
              <div className="flex items-center gap-2">
                <ShareButton variant="outline" size="icon" title={ARTIST.name} text={ARTIST.name} />
                <LibraryHeartButton
                  type="artist"
                  id={artistId}
                  name={ARTIST.name}
                  variant="outline"
                  size="icon"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Tab strip ──────────────────────────────────────────────────
           Full-bleed muted band so the tabs sit visually attached to
           the hero. Inside it the TabsList re-aligns to the same
           centered max-w container the rest of the page uses, so the
           underline indicator + text columns line up with every
           section header below. Variant="line" gives the underline
           treatment per the design-system spec. */}
      {/* Figma spec (node 8971:98259): muted band, pt-4 only, three
           equal-width triggers (flex-1), each with its own bottom
           border — active = foreground colour, inactive = border
           colour. Together those baselines paint one continuous line
           across the strip with the active third reading darker. */}
      <div className="w-full bg-muted">
        <div className="@container w-full pt-4">
          <Tabs value={tab} onValueChange={setTab}>
            {/* h-9 matches the triggers' own height — the `line` variant
                 scrolls (overflow-x-auto), which forces overflow-y to clip;
                 a shorter list would cut off the triggers' bottom borders
                 (the active underline). */}
            <TabsList variant="line" className="w-full gap-0 h-9">
              <TabsTrigger
                value="overview"
                className="flex-1 h-9 items-start px-0 pt-0 pb-0 after:hidden border-b border-border data-active:border-foreground"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="discography"
                className="flex-1 h-9 items-start px-0 pt-0 pb-0 after:hidden border-b border-border data-active:border-foreground"
              >
                Discography
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="flex-1 h-9 items-start px-0 pt-0 pb-0 after:hidden border-b border-border data-active:border-foreground"
              >
                Shop
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Page-content wrapper. `@container` is set per-tab below
           rather than on this outer div because container-type breaks
           position: sticky for descendants (the discography list view
           needs a sticky table head against the page scroll). */}
      <div className="mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] w-full px-page">
        {tab === "overview" && (
          <div className="@container">
          <>
            <TopSongsRow songs={TOP_SONGS} />

            <CardRail title="Top Albums" showAllLabel="All albums">
              {TOP_ALBUMS.map(a => {
                const meta  = albumMetaFor(a.title)
                const libId = libraryIdForTitle(a.title)
                const key   = slugify(a.title)
                const linkable = hasAlbumDetail(key)
                return (
                  <li key={a.id}>
                    <AlbumCard
                      cover={a.cover}
                      title={a.title}
                      artist={a.artist}
                      year={meta.year ?? a.year}
                      streamPrice={meta.streamPrice}
                      downloadPrice={meta.downloadPrice}
                      purchased={libId ? library.isPurchased(libId) : false}
                      onTitleClick={linkable ? () => openAlbum(key) : undefined}
                      onPlay={linkable ? () => openAlbum(key) : undefined}
                      hideGoToArtist
                    />
                  </li>
                )
              })}
            </CardRail>

            <CardRail title="Products" showAllLabel="All products">
              {PRODUCTS.map(p => (
                <li key={p.id}>
                  <ProductCard cover={p.cover} title={p.title} price={p.price} />
                </li>
              ))}
            </CardRail>

            <CardRail title="Curated Playlists">
              {CURATED_PLAYLISTS.map(p => {
                const key = slugify(p.title)
                const linkable = hasPlaylistDetail(key)
                return (
                  <li key={p.id}>
                    <PlaylistCard
                      title={p.title}
                      covers={p.covers}
                      songCount={p.songCount}
                      owner={p.owner}
                      owned={p.owned}
                      onTitleClick={linkable ? () => openPlaylist(key) : undefined}
                      onPlay={linkable ? () => openPlaylist(key) : undefined}
                    />
                  </li>
                )
              })}
            </CardRail>

            <CardRail title="Similar Artists">
              {SIMILAR_ARTISTS.map(a => (
                <li key={a.id}><ArtistCard name={a.name} image={a.image} onClick={() => openArtist(slugify(a.name))} /></li>
              ))}
            </CardRail>
          </>
          </div>
        )}

        {tab === "discography" && (
          <DiscographyView releases={DISCOGRAPHY} artistName={ARTIST.name} />
        )}

        {tab === "products" && (
          <section className="flex flex-col gap-4">
            {/* Same header band as Discography — pt-8 + separator so
                 the grid sits at the matching vertical offset under
                 the tab strip. */}
            <div className="flex flex-col gap-2 pt-8">
              <Separator />
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(192px,1fr))] gap-x-4 gap-y-6">
              {PRODUCTS.map(p => (
                <li key={p.id}>
                  <ProductCard cover={p.cover} title={p.title} price={p.price} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="pb-24" />
      </div>
    </div>
  )
}

// ─── DiscographyView ────────────────────────────────────────────────────────
//
// Figma source: file dbSHgvquI2o4TFie2iAJxv › node 7510:237267.
//
// Toolbar (two rows):
//   1. Filter chip bar — All Releases (active by default) followed by
//      a chip per `ReleaseKind`. Each chip carries a small count badge
//      and only the kinds with content are rendered.
//   2. Left: sort dropdown (Recording date / Title / Type) opens a
//      menu. Right: grid/list view toggle (visual only for now —
//      always renders the grid).
//
// Body: AlbumCard grid sized like the Library/Albums grid so the
// rhythm matches the rest of the app.

type SortKey =
  | "year-desc"  | "year-asc"
  | "title-az"   | "title-za"
  | "tracks-desc" | "tracks-asc"

const KIND_LABEL: Record<ReleaseKind, string> = {
  album:       "Albums",
  "single": "Singles",
  ep:          "EPs",
  remix:       "Remixes",
  secondary:   "Secondary Role",
}


// Mirrors the Studio/Music sortable-header pattern: muted label by
// default, foreground when active, with an ArrowUp/Down icon for the
// current direction (faint ArrowUpDown hint shown on hover when not
// active).
function SortableHeader({
  label, isActive, dir, onClick,
}: { label: string; isActive: boolean; dir: "asc" | "desc" | null; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-0.5 min-w-0 overflow-hidden cursor-pointer group/sort select-none"
    >
      <span className={cn("text-xsmall font-normal truncate", isActive ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      {isActive
        ? (dir === "asc"
            ? <ArrowUp   className="size-3 shrink-0 text-foreground" />
            : <ArrowDown className="size-3 shrink-0 text-foreground" />)
        : <ArrowUpDown className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover/sort:opacity-50 transition-opacity" />}
    </button>
  )
}

function DiscographyView({
  releases, artistName,
}: { releases: typeof DISCOGRAPHY; artistName: string }) {
  const library = useUserLibrary()
  const { openAlbum } = useMediaNav()
  // Multi-select kind filter. Empty set means "no filter applied"
  // (i.e. show all releases) — keeps the menu's `Clear all` row in
  // sync with the visible-everything default.
  const [filter, setFilter] = useState<Set<ReleaseKind>>(new Set())
  const [sort, setSort]     = useState<SortKey>("year-desc")
  const [view, setView]     = useState<"grid" | "list">("grid")
  // Mock playback — single release at a time. Matches SongListItem's
  // local-toggle behaviour. Real wiring would lift this to a global
  // player store.
  const [playingId, setPlayingId] = useState<string | null>(null)
  const togglePlay = (id: string) =>
    setPlayingId(prev => (prev === id ? null : id))

  // Counts per kind for the chip badges. "All Releases" shows the total.
  const counts = useMemo(() => {
    const out: Record<ReleaseKind, number> = {
      album: 0, "single": 0, ep: 0, remix: 0, secondary: 0,
    }
    for (const r of releases) out[r.kind] += 1
    return out
  }, [releases])

  // Filter + sort pipeline. Kept as a single memo so re-renders only
  // recompute the visible grid when one of the controls changes.
  const visible = useMemo(() => {
    const filtered = filter.size === 0
      ? releases
      : releases.filter(r => filter.has(r.kind))
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "year-desc")   return b.year - a.year
      if (sort === "year-asc")    return a.year - b.year
      if (sort === "tracks-desc") return b.tracks - a.tracks
      if (sort === "tracks-asc")  return a.tracks - b.tracks
      if (sort === "title-za")    return b.title.localeCompare(a.title)
      return a.title.localeCompare(b.title)
    })
    return sorted
  }, [releases, filter, sort])

  // Only render chips for kinds that actually have entries.
  const kindEntries = (Object.keys(KIND_LABEL) as ReleaseKind[])
    .filter(k => counts[k] > 0)

  return (
    <section className="flex flex-col gap-4">
      {/* Header band — matches CardRail / TopSongsRow rhythm: pt-6 +
           separator + gap-2 to the row of controls below. That way
           Discography's first row sits at the same vertical offset
           below the tab strip as Overview's first section header. */}
      {/* One-row toolbar — separator on top, then [Filter] [Sort]
           on the left and the [Grid/List toggle] on the right. The
           SingleSelect (the sort one) is hidden on list view because the table header
           itself carries sortable controls there (same pattern as
           Studio/Music). */}
      <div className="flex flex-col gap-2 pt-8">
        <Separator />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MultiSelect
              label="All releases"
              selected={filter as Set<string>}
              onChange={next => setFilter(next as Set<ReleaseKind>)}
              options={kindEntries.map(k => ({
                value: k,
                label: (
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <span className="truncate">{KIND_LABEL[k]}</span>
                    <Badge shape="pill" variant="secondary">{counts[k]}</Badge>
                  </span>
                ),
              }))}
            />
            {view === "grid" && (
              <SingleSelect
                value={sort}
                onChange={setSort}
                label="Recording date"
                options={[
                  { value: "year-desc", label: "Recording date (newest)" },
                  { value: "year-asc",  label: "Recording date (oldest)" },
                  { value: "title-az",  label: "Title (A–Z)" },
                ]}
              />
            )}
          </div>

        <ToggleGroup
          value={[view]}
          onValueChange={vals => {
            const next = vals[0] as "grid" | "list" | undefined
            if (next) setView(next)
          }}
        >
          <Toggle value="grid" aria-label="Grid view">
            <LayoutGrid strokeWidth={1.5} />
          </Toggle>
          <Toggle value="list" aria-label="List view">
            <List strokeWidth={1.5} />
          </Toggle>
        </ToggleGroup>
        </div>
      </div>

      {view === "grid" ? (
        // Releases grid — same auto-fill template as Library/Albums so
        // card widths stay flush with the rest of the app.
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(192px,1fr))] gap-x-4 gap-y-6 pt-2">
          {visible.map(r => {
            const meta  = albumMetaFor(r.title)
            const libId = libraryIdForTitle(r.title)
            const key   = slugify(r.title)
            const linkable = hasAlbumDetail(key)
            return (
              <li key={r.id}>
                <AlbumCard
                  cover={r.cover}
                  title={r.title}
                  artist={artistName}
                  year={meta.year ?? r.year}
                  streamPrice={meta.streamPrice}
                  downloadPrice={meta.downloadPrice}
                  purchased={libId ? library.isPurchased(libId) : false}
                  onTitleClick={linkable ? () => openAlbum(key) : undefined}
                  onPlay={linkable ? () => openAlbum(key) : undefined}
                  hideGoToArtist
                />
              </li>
            )
          })}
        </ul>
      ) : (
        // List view — table with the columns the user asked for:
        // image · title · band · recorded · tracks · type.
        // Same `<TableHead>`/`<TableCell>` primitives used by
        // Studio/Music + Orders so visual rhythm carries through.
        // Single-line list table — mirrors Studio/Music chrome:
        // text-xsmall muted headers, text-small body, truncate
        // (no wrapping), border-b rows. Last column (Type) is
        // right-aligned.
        <div className="pt-2">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: 64 }} />
              <col />
              <col />
              <col style={{ width: 112 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 128 }} />
              <col style={{ width: 56 }} />
            </colgroup>
            {/* sticky on each <th> (rather than the <thead>) because
                 some browsers/table-fixed combos don't honour sticky
                 on thead. */}
            <thead className="[&_tr]:border-b [&_tr]:border-border [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background">
              <TableRow>
                <TableHead resizable={false} className="px-2" />
                <TableHead>
                  <SortableHeader
                    label="Title"
                    isActive={sort === "title-az" || sort === "title-za"}
                    dir={sort === "title-az" ? "asc" : sort === "title-za" ? "desc" : null}
                    onClick={() =>
                      setSort(sort === "title-az" ? "title-za" : "title-az")
                    }
                  />
                </TableHead>
                <TableHead>Band</TableHead>
                <TableHead resizable={false}>
                  <SortableHeader
                    label="Recorded"
                    isActive={sort === "year-desc" || sort === "year-asc"}
                    dir={sort === "year-desc" ? "desc" : sort === "year-asc" ? "asc" : null}
                    onClick={() =>
                      setSort(sort === "year-desc" ? "year-asc" : "year-desc")
                    }
                  />
                </TableHead>
                <TableHead resizable={false}>
                  <SortableHeader
                    label="Tracks"
                    isActive={sort === "tracks-desc" || sort === "tracks-asc"}
                    dir={sort === "tracks-desc" ? "desc" : sort === "tracks-asc" ? "asc" : null}
                    onClick={() =>
                      setSort(sort === "tracks-desc" ? "tracks-asc" : "tracks-desc")
                    }
                  />
                </TableHead>
                <TableHead resizable={false} className="text-right">Type</TableHead>
                <TableHead resizable={false} className="px-2" />
              </TableRow>
            </thead>
            <TableBody>
              {visible.map(r => {
                const playing = playingId === r.id
                return (
                // - py-1.5 + size-12 cover match SongListItem so a row
                //   in the table reads the same height as a Top Songs
                //   item.
                // - No border between rows; instead a `bg-muted` hover
                //   block applied per-cell so first/last cells can
                //   round their outside corners (tr doesn't clip
                //   border-radius).
                // - Cover renders the same play/wave/pause overlay
                //   states SongListItem uses, so the affordance reads
                //   the same in both list views.
                // - Active (playing) row stays bg-muted at rest so the
                //   current item is marked even without hover.
                <TableRow
                  key={r.id}
                  className={cn(
                    "group/row border-b-0 hover:bg-transparent",
                    "[&>td]:group-hover/row:bg-muted [&>td:first-child]:group-hover/row:rounded-l-md [&>td:last-child]:group-hover/row:rounded-r-md",
                    "[&_td]:py-1.5",
                    playing && "[&>td]:bg-muted [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md",
                  )}
                >
                  <TableCell className="px-2">
                    <CoverPlayButton
                      src={r.cover}
                      title={r.title}
                      playing={playing}
                      onToggle={() => togglePlay(r.id)}
                      hoverGroup="row"
                    />
                  </TableCell>
                  <TableCell className="text-small text-foreground whitespace-nowrap truncate">
                    <button
                      type="button"
                      className="text-left hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] outline-none cursor-pointer"
                    >
                      {r.title}
                    </button>
                  </TableCell>
                  <TableCell className="text-small text-muted-foreground whitespace-nowrap truncate">
                    <button
                      type="button"
                      className="text-left hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] outline-none cursor-pointer"
                    >
                      {r.band ?? artistName}
                    </button>
                  </TableCell>
                  <TableCell className="text-small text-muted-foreground tabular-nums whitespace-nowrap">
                    {r.year}
                  </TableCell>
                  <TableCell className="text-small text-muted-foreground tabular-nums whitespace-nowrap">
                    {r.tracks}
                  </TableCell>
                  <TableCell className="text-right">
                    <ContentTypeBadge type={r.type} />
                  </TableCell>
                  <TableCell className="px-2">
                    {/* Falafel/kebab menu — same items as the cover
                         card's "More options" menu, behind a plain
                         ghost icon-button trigger that fits a table
                         row. */}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={6}>
                        <AlbumCardMenuItems />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </table>
        </div>
      )}
    </section>
  )
}

// ─── TopSongsRow ────────────────────────────────────────────────────────────
//
// Horizontally-scrolling rail of song columns (max 3 rows per column).
// Header chrome (separator + title + ◀ ▶ + Show all) matches CardRail so
// the Artist page reads as one rhythm of section dividers.
//
// At default container width 1 column is visible; at @min-[692px] 2;
// at @min-[1164px] 3. The arrows scroll by clientWidth + gap (one
// page of visible columns) — same trick CardRail uses to land cleanly
// on a column boundary.
//
// Responsive behaviour mirrors CardRail: below 692px (phones + small
// tablets) the column is undersized so the next group peeks at the
// right edge (swipe cue), and the ◀ ▶ arrows are hidden on touch
// (`pointer-coarse`) / below 692. From 692 up: exact columns + arrows.

const ROWS_PER_COLUMN = 3

function TopSongsRow({ songs }: { songs: typeof TOP_SONGS }) {
  const scrollRef = useRef<HTMLUListElement>(null)
  const { openAlbum } = useMediaNav()
  const credits = useCredits()
  const player = usePlayer()
  const columns: (typeof songs)[] = []
  for (let i = 0; i < songs.length; i += ROWS_PER_COLUMN) {
    columns.push(songs.slice(i, i + ROWS_PER_COLUMN))
  }

  const scrollPage = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: dir * (el.clientWidth + gap), behavior: "smooth" })
  }

  return (
    <section className="flex flex-col gap-4 min-w-0 overflow-x-clip">
      <div className="flex flex-col gap-2 pt-6">
        <Separator />
        <div className="flex items-center justify-between">
          <h2 className="text-small font-medium text-foreground">Top Songs</h2>
          {/* ◀ ▶ are a pointer affordance only — hidden on touch
               (`pointer-coarse`) and below 692px, where the swipe peek
               (a cut-off next column) is the scroll cue instead. */}
          <div className="flex items-center gap-1 [@media(hover:none)]:!hidden @max-[692px]:hidden">
            <Button variant="outline" size="icon-sm" aria-label="Scroll Top Songs left"  onClick={() => scrollPage(-1)}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Scroll Top Songs right" onClick={() => scrollPage(1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <ul
        ref={scrollRef}
        className={
          "min-w-0 flex gap-6 items-start overflow-x-auto overflow-y-hidden " +
          "snap-x snap-proximity scroll-smooth " +
          "touch-pan-x overscroll-x-contain " +
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden " +
          "[&>li]:shrink-0 [&>li]:snap-start " +
          // 1 col default, 2 at ≥692, 3 at ≥1164 — column widths are
          // computed from the ul's own 100% so they line up with the
          // CardRail card columns sitting at the same page width.
          //
          // Mobile (< 692): the single column is undersized by 48px so
          // a ~24px sliver of the next column peeks at the right edge —
          // the swipe cue (matches CardRail's mobile peek; gap is 24px
          // here, so 48−24 ≈ 24px visible). From 692 up: exact columns
          // (no peek), arrows carry the scroll affordance.
          "[&>li]:w-[calc(100%-48px)] " +
          "@min-[692px]:[&>li]:w-[calc((100%-24px)/2)] " +
          "@min-[1164px]:[&>li]:w-[calc((100%-48px)/3)]"
        }
      >
        {columns.map((col, i) => (
          <li key={i}>
            <ul className="flex flex-col gap-1">
              {col.map(s => (
                <li key={s.id}>
                  <SongListItem
                    compact
                    cover={s.cover}
                    title={s.title}
                    album={s.album}
                    year={s.year}
                    badge={s.badge}
                    duration={s.duration}
                    playing={player.playing && player.playingFrom === ARTIST.name && player.track?.title === s.title}
                    onPlay={() => {
                      if (player.playingFrom === ARTIST.name && player.track?.title === s.title) { player.toggle(); return }
                      player.play(
                        { title: s.title, artist: ARTIST.name, album: s.album, image: s.cover, totalTime: s.duration, artistAvatar: ARTIST.cover },
                        ARTIST.name,
                      )
                    }}
                    onAlbumClick={hasAlbumDetail(slugify(s.album)) ? () => openAlbum(slugify(s.album)) : undefined}
                    menuItems={
                      <>
                        <ShareMenuItems title={s.title} />
                        <DropdownMenuItem onClick={() => {}}><Heart />Save to library</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {}}><ListPlus />Add to playlist</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => hasAlbumDetail(slugify(s.album)) && openAlbum(slugify(s.album))}
                        >
                          <Disc3 />Go to album
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => credits.open(slugify(s.album))}><Info />Show credits</DropdownMenuItem>
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}
