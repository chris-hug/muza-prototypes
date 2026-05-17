"use client"

/*
 * LibraryAlbumsView — the user's saved albums.
 *
 * Grid of <AlbumCard>s, one per saved album. Reuses the same card
 * component that surfaces on Explore, search results, and artist
 * discographies — so any styling change there propagates here.
 *
 * Figma: 8950:97663 (Albums Feed) — 5-column grid on desktop.
 */

import { AlbumCard } from "@/components/ui/album-card"

interface SavedAlbum {
  id:     string
  cover:  string
  title:  string
  artist: string
}

const COVER = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`

// Mock saved albums — curated releases from five specialist labels:
// Blue Note, Impulse!, Strata-East, Justin Time, Evidence. Title +
// artist pairs target real releases so `scripts/fetch-itunes-artwork.mjs`
// can populate covers on demand; on a lookup miss we fall back to
// picsum so the array still renders.
const SAVED_ALBUMS: SavedAlbum[] = [
  // ── Blue Note ────────────────────────────────────────────────────────────
  { id: "a01", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg",        title: "Maiden Voyage",                       artist: "Herbie Hancock"                  },
  { id: "a02", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg",        title: "Speak No Evil",                       artist: "Wayne Shorter"                   },
  { id: "a03", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg",        title: "Blue Train",                          artist: "John Coltrane"                   },
  { id: "a04", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg",          title: "Cool Struttin'",                      artist: "Sonny Clark"                     },
  { id: "a05", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3b/30/51/3b305111-c28a-80ad-1f1d-6e89fb4fa2af/13ULAIM49306.rgb.jpg/600x600bb.jpg",        title: "Empyrean Isles",                      artist: "Herbie Hancock"                  },
  { id: "a06", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg",        title: "Out to Lunch",                        artist: "Eric Dolphy"                     },
  // ── Impulse! ─────────────────────────────────────────────────────────────
  { id: "a07", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg",        title: "A Love Supreme",                      artist: "John Coltrane"                   },
  { id: "a08", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg",        title: "Karma",                               artist: "Pharoah Sanders"                 },
  { id: "a09", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg",        title: "The Black Saint and the Sinner Lady", artist: "Charles Mingus"                  },
  { id: "a10", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/12/1a/de/121adeea-7628-bbac-93ca-ac147822f5db/25UM1IM86773.rgb.jpg/600x600bb.jpg",        title: "Africa/Brass",                        artist: "John Coltrane"                   },
  { id: "a11", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/91/b6/bb/91b6bb11-26ab-13fb-95aa-67abec45aa5d/15UMGIM36230.rgb.jpg/600x600bb.jpg",        title: "Crescent",                            artist: "John Coltrane"                   },
  { id: "a12", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/af/5c/40/af5c40a1-54b1-855d-3da2-f875efbd8372/06UMGIM04169.rgb.jpg/600x600bb.jpg",        title: "Journey in Satchidananda",            artist: "Alice Coltrane"                  },
  // ── Strata-East ──────────────────────────────────────────────────────────
  { id: "a13", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/83/48/94/mzi.olnzcoeq.jpg/600x600bb.jpg",                                                       title: "Winter in America",                   artist: "Gil Scott-Heron & Brian Jackson" },
  { id: "a14", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/19/b3/86/19b386e1-550c-0ec4-868b-542cd02bc382/118212.jpg/600x600bb.jpg",                  title: "Glass Bead Game",                     artist: "Clifford Jordan"                 },
  { id: "a15", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d5/21/70/d5217051-3c92-7ec6-790b-770833a01727/118206.jpg/600x600bb.jpg",                  title: "Musa: Ancestral Streams",             artist: "Stanley Cowell"                  },
  { id: "a16", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/85/5b/7c/855b7cfe-30f7-5b6c-26bb-4dbfc2eeeca9/118214.jpg/600x600bb.jpg",                  title: "Izipho Zam",                          artist: "Pharoah Sanders"                 },
  // ── Justin Time ──────────────────────────────────────────────────────────
  { id: "a17", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/2f/fb/76/2ffb766d-f6f0-9ff1-ac5b-2ec8d4537f26/068944820054.png/600x600bb.jpg",            title: "Stepping Out",                        artist: "Diana Krall"                     },
  { id: "a18", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9a/8b/e4/9a8be477-c9e9-aab6-feba-eda6af96a4c1/068944003150.png/600x600bb.jpg",            title: "Just Friends",                        artist: "Oliver Jones"                    },
  // ↓ Maple Groove + Live at Birdland missed the iTunes lookup —
  //   keep picsum fallback so the grid still renders.
  { id: "a19", cover: COVER("maple-groove"),                                                                                                                          title: "Maple Groove",                        artist: "Ranee Lee"                       },
  { id: "a20", cover: COVER("live-birdland"),                                                                                                                         title: "Live at Birdland",                    artist: "Oliver Jones"                    },
  // ── Evidence ─────────────────────────────────────────────────────────────
  { id: "a21", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/f8/65/e9/f865e942-9d3d-c904-a936-bc8d9efd7dcf/mzi.knkkbqhj.jpg/600x600bb.jpg",            title: "Solo Monk",                           artist: "Thelonious Monk"                 },
  { id: "a22", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/1c/b1/f7/1cb1f7af-24fc-99a0-b6bb-190006de4c3a/25UMGIM84558.rgb.jpg/600x600bb.jpg",        title: "Rip, Rig and Panic",                  artist: "Roland Kirk"                     },
  { id: "a23", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/y2005/m10/d05/h01/mzi.dazjfjdt.jpg/600x600bb.jpg",                                              title: "Volunteered Slavery",                 artist: "Roland Kirk"                     },
  // ── Contemporary picks (the original "modern" set) ───────────────────────
  { id: "a24", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/13/07/89/1307897d-b463-5a49-0af9-d8d895259c84/D000000002855.jpg/600x600bb.jpg",           title: "Scenery",                             artist: "Ryo Fukui"                       },
  { id: "a25", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/71/f2/e3/71f2e3e0-b799-3315-9f91-ea9bfebb58db/mzi.isjazqfb.jpg/600x600bb.jpg",            title: "Apocalypse",                          artist: "Thundercat"                      },
  { id: "a26", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/01/0b/96/010b9654-4059-150f-8650-38f94faa62cf/20CRGIM21278.rgb.jpg/600x600bb.jpg",        title: "Source",                              artist: "Nubya Garcia"                    },
  { id: "a27", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/af/dc/6b/afdc6b88-b275-de4e-3098-63dff171dffb/680899009720.jpg/600x600bb.jpg",            title: "Promises",                            artist: "Floating Points"                 },
  { id: "a28", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e8/e0/90/e8e090fb-10ba-a0f8-c719-ce347b658bbc/075597908541.jpg/600x600bb.jpg",            title: "In These Times",                      artist: "Makaya McCraven"                 },
  { id: "a29", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4a/2d/6f/4a2d6f89-f204-8f91-9812-f9bd203e33b0/cover.jpg/600x600bb.jpg",                   title: "Under Tangled Silence",               artist: "Djrum"                           },
  { id: "a30", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/cb/c7/1d/cbc71df4-e2b7-4ea4-7edb-563a9aaf7b31/00602537433919.rgb.jpg/600x600bb.jpg",      title: "Black Radio",                         artist: "Robert Glasper"                  },
  // ── Blue Note (extended) ─────────────────────────────────────────────────
  { id: "a31", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/be/0b/f4/be0bf4c3-b69c-370b-2ade-d12a5a10ce77/00724349533257.rgb.jpg/600x600bb.jpg",      title: "The Sidewinder",                             artist: "Lee Morgan"                      },
  { id: "a32", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/47/0c/66/470c6637-381c-5ad9-073b-8b863d6fa965/00724349532953.rgb.jpg/600x600bb.jpg",      title: "Somethin' Else",                             artist: "Cannonball Adderley"             },
  { id: "a33", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7f/d0/cb/7fd0cbcc-3e89-4010-5cac-e91f1bb42909/19UMGIM60341.rgb.jpg/600x600bb.jpg",        title: "Song for My Father",                         artist: "Horace Silver"                   },
  { id: "a34", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a8/1d/3b/a81d3b00-0875-46d2-d5e2-208f075eddbb/13UMGIM23427.rgb.jpg/600x600bb.jpg",        title: "Page One",                                   artist: "Joe Henderson"                   },
  { id: "a35", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/5b/3e/15/5b3e151f-eda9-f16a-950e-e47f4114714c/00724349900752.jpg/600x600bb.jpg",          title: "Point of Departure",                         artist: "Andrew Hill"                     },
  // ── Impulse! (extended) ──────────────────────────────────────────────────
  { id: "a36", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/bc/fa/0c/bcfa0ca7-0f9e-3162-5f99-e093b0c1b410/06UMGIM07324.rgb.jpg/600x600bb.jpg",        title: "Live at the Village Vanguard",               artist: "John Coltrane"                   },
  { id: "a37", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/f1/55/cb/f155cb6d-c9d0-623e-114c-f80d8dcf049b/00731458951421.rgb.jpg/600x600bb.jpg",      title: "Universal Consciousness",                    artist: "Alice Coltrane"                  },
  { id: "a38", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/ab/97/78/ab97788c-e153-15ab-bbfb-13e2d16b2367/00602517920378.rgb.jpg/600x600bb.jpg",      title: "Meditations",                                artist: "John Coltrane"                   },
  { id: "a39", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/7a/2a/ab/7a2aabaa-e590-d637-b6b4-3f3f2f9ba4fc/06UMGIM01889.rgb.jpg/600x600bb.jpg",        title: "Tauhid",                                     artist: "Pharoah Sanders"                 },
  { id: "a40", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/81/11/37/811137ae-0f51-89f5-6e20-3c6fe0eacb7b/886446371481.jpg/600x600bb.jpg",            title: "The Far East Suite",                         artist: "Duke Ellington"                  },
  // ── Strata-East (extended) ───────────────────────────────────────────────
  { id: "a41", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/5b/12/7f/5b127f7e-6220-c5bb-755a-29bf01e35322/118213.jpg/600x600bb.jpg",                  title: "Live at Slugs'",                             artist: "Charles Tolliver"                },
  { id: "a42", cover: COVER("tribute-black-woman"),                                                                                                                   title: "Tribute to the Black Woman",                 artist: "Stanley Cowell"                  },
  { id: "a43", cover: COVER("alkebu-lan"),                                                                                                                            title: "Alkebu-Lan: Land of the Blacks",             artist: "Mtume Umoja Ensemble"            },
  // ── Justin Time (extended) ───────────────────────────────────────────────
  { id: "a44", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/0e/be/7e/0ebe7ed7-c556-09dd-5a01-3f242d89ca39/14UMGIM42658.rgb.jpg/600x600bb.jpg",        title: "Christmas Songs",                            artist: "Diana Krall"                     },
  { id: "a45", cover: COVER("watching-waiting"),                                                                                                                      title: "Watching, Waiting",                          artist: "Ranee Lee"                       },
  { id: "a46", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7c/b1/25/7cb125c0-e0a4-fa71-25c8-a9139d83765f/23CRGIM36131.rgb.jpg/600x600bb.jpg",        title: "A Summer Night in Munich",                   artist: "Oscar Peterson"                  },
  // ── Evidence (extended) ──────────────────────────────────────────────────
  { id: "a47", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/c4/ee/e2/c4eee23e-1ebd-e725-e45e-6e49d65d64ff/00724359084053.jpg/600x600bb.jpg",             title: "Conquistador!",                              artist: "Cecil Taylor"                    },
  { id: "a48", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/53/f2/10/mzi.voyxaexk.jpg/600x600bb.jpg",                                                       title: "Pieces of Time",                             artist: "Andrew Cyrille"                  },
  { id: "a49", cover: "https://is1-ssl.mzstatic.com/image/thumb/Features/v4/6f/09/84/6f098449-23bc-4c33-a9fd-6da9887aba45/dj.yrbzojng.jpg/600x600bb.jpg",             title: "Free Jazz",                                  artist: "Ornette Coleman"                 },
  // ── Contemporary (extended) ──────────────────────────────────────────────
  { id: "a50", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/b8/46/98b84638-476a-ea68-151f-e844017594de/5056614798067.png/600x600bb.jpg",           title: "Endlessness",                                artist: "Nala Sinephro"                   },
  { id: "a51", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/e4/57/42/e45742d5-0ac5-a3a5-9840-a54b8648d182/0801061032432.png/600x600bb.jpg",           title: "Space 1.8",                                  artist: "Nala Sinephro"                   },
  { id: "a52", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7a/65/c2/7a65c212-d5b8-2e3c-4d08-77bc4e4a65ac/3614970930488.jpg/600x600bb.jpg",           title: "Black Focus",                                artist: "Yussef Kamaal"                   },
  { id: "a53", cover: COVER("queen-reptile"),                                                                                                                         title: "Your Queen Is a Reptile",                    artist: "Sons of Kemet"                   },
  { id: "a54", cover: COVER("black-future"),                                                                                                                          title: "Black to the Future",                        artist: "Sons of Kemet"                   },
  { id: "a55", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b0/90/1d/b0901d41-49bf-22b9-f7a2-a9e1c15e244b/20UMGIM01600.rgb.jpg/600x600bb.jpg",        title: "We Are Sent Here by History",                artist: "Shabaka and the Ancestors"       },
  { id: "a56", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/3d/9d/36/3d9d36ec-d86c-98ee-e0ea-601fc6e32504/00602577388385.rgb.jpg/600x600bb.jpg",      title: "Trust in the Lifeforce of the Deep Mystery", artist: "The Comet Is Coming"             },
  { id: "a57", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/34/9c/a3/349ca34c-87b6-a0a3-874d-a9cb7209dbc3/5060180322892.jpg/600x600bb.jpg",           title: "Wisdom of Elders",                           artist: "Shabaka and the Ancestors"       },
  { id: "a58", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d9/8f/37/d98f3727-0c84-108d-a74e-0bcbf43928c3/4050538709391.jpg/600x600bb.jpg",           title: "Black Acid Soul",                            artist: "Lady Blackbird"                  },
  { id: "a59", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/e9/b9/9e/e9b99e73-58a5-1e31-f57c-b11e78419dcf/16UMGIM86249.rgb.jpg/600x600bb.jpg",        title: "Voodoo",                                     artist: "D'Angelo"                        },
  { id: "a60", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music42/v4/3a/6a/ce/3a6ace4c-91ab-0f91-055a-b54571ccb255/mzm.rjntwtot.jpg/600x600bb.jpg",             title: "Black Messiah",                              artist: "D'Angelo"                        },
]

export function LibraryAlbumsView() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="@container mx-auto max-w-[1528px] px-10 pt-8 pb-12">
        <h1 className="text-2xlarge font-medium text-foreground tracking-tight mb-6">
          Albums
        </h1>

        {/* Responsive grid driven by CONTAINER queries (not viewport)
             so column count reacts to the actual grid width regardless
             of sidebar open/closed state. The parent above has
             `@container` to register a query container; the grid
             below uses `@min-[Xpx]:` modifiers that observe that
             container's inline-size.

             Thresholds aligned to each N-col 220-cap (N×220+(N-1)×16)
             so the next column kicks in exactly when the current
             layout would otherwise sit at 220 with growing leftover.
             Avoids the "5 big cards centered → 6 big cards filling"
             snap that appears if the threshold lands later.
               · 2 cols at ≥304  (floor: 2×143+16)
               · 3 cols at ≥464  (floor: 3×143+2×16)
               · 4 cols at ≥692  (cap:   3×220+2×16)
               · 5 cols at ≥928  (cap:   4×220+3×16)
               · 6 cols at ≥1164 (cap:   5×220+4×16)
             Each track is `minmax(143px, 220px)` — cards are clamped
             to a 143 floor and 220 ceiling. Below the 2-col threshold
             the grid drops to a single column. */}
        <ul className="grid grid-cols-[repeat(1,minmax(143px,220px))] @min-[304px]:grid-cols-[repeat(2,minmax(143px,220px))] @min-[464px]:grid-cols-[repeat(3,minmax(143px,220px))] @min-[692px]:grid-cols-[repeat(4,minmax(143px,220px))] @min-[928px]:grid-cols-[repeat(5,minmax(143px,220px))] @min-[1164px]:grid-cols-[repeat(6,minmax(143px,220px))] gap-x-4 gap-y-6">
          {SAVED_ALBUMS.map(a => (
            <li key={a.id}>
              <AlbumCard
                cover={a.cover}
                title={a.title}
                artist={a.artist}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
