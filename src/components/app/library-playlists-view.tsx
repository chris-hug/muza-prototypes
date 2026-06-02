"use client"

/*
 * LibraryPlaylistsView — the user's saved + own playlists.
 *
 * Grid of <PlaylistCard>s with a <PlaylistCreateCard> as the first
 * tile. Same component used everywhere a playlist surfaces.
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 8956:97666
 *   · 5-column grid on desktop, "Create New Playlist" leads the grid
 *   · Mix of `owned` (My own playlist) and not-owned (Another user's
 *     playlist) cards
 *   · 2×2 composite covers using album art from the playlist's tracks
 */

import { useState } from "react"

import { PlaylistCard } from "@/components/ui/playlist-card"
import { PlaylistCreateCard } from "@/components/ui/playlist-create-card"
import { PlaylistListTable, PlaylistMobileList, LibrarySortMenu } from "@/components/app/media-list-table"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { SingleSelect } from "@/components/ui/single-select"
import { LayoutGrid, List, ListFilter } from "lucide-react"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { useUserLibrary } from "@/lib/user-library"
import { useLibraryView } from "@/lib/use-library-view"
import { useLibrarySort, compareLibrary } from "@/lib/use-library-sort"
import { useFooterNav } from "@/lib/use-media-query"

export interface SavedPlaylist {
  id:        string
  title:     string
  /** 4 album-cover URLs assembled into the 2×2 composite. */
  covers:    string[]
  songCount: number
  owner?:    string
  owned?:    boolean
}

// Cover pool — reused across playlists so the 2×2 composites look
// like real playlists (each tile sources its art from album covers
// already in the user's library). Real wiring would derive from
// each playlist's actual track list.
const COVER = (path: string) =>
  `https://is1-ssl.mzstatic.com/image/thumb/${path}/200x200bb.jpg`

// 31 real album covers resolved via `scripts/fetch-playlist-pool.mjs`
// from the iTunes Search API. Each playlist deterministically picks
// 4 of these for its 2×2 composite (see `pickCovers`).
const POOL: string[] = [
  COVER("Music115/v4/13/07/89/1307897d-b463-5a49-0af9-d8d895259c84/D000000002855.jpg"),
  COVER("Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg"),
  COVER("Music128/v4/49/39/f6/4939f68e-00a5-49f4-9642-57020b789e19/00602547491763.rgb.jpg"),
  COVER("Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg"),
  COVER("Music126/v4/6e/0e/b4/6e0eb485-2cc8-f2d7-e123-eac40ec75f02/680899009027.jpg"),
  COVER("Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg"),
  COVER("Music123/v4/80/7c/60/807c60e1-a0eb-633c-0041-29b6c8d25d9d/20CRGIM21623.rgb.jpg"),
  COVER("Music124/v4/71/f2/e3/71f2e3e0-b799-3315-9f91-ea9bfebb58db/mzi.isjazqfb.jpg"),
  COVER("Music115/v4/01/0b/96/010b9654-4059-150f-8650-38f94faa62cf/20CRGIM21278.rgb.jpg"),
  COVER("Music126/v4/af/dc/6b/afdc6b88-b275-de4e-3098-63dff171dffb/680899009720.jpg"),
  COVER("Music211/v4/54/ec/e9/54ece95f-de54-e6a7-0b1a-6a8eee947443/24UM1IM25320.rgb.jpg"),
  COVER("Music126/v4/d2/c6/ef/d2c6efa8-08f8-9486-57e1-c460fa2964af/cover.jpg"),
  COVER("Music122/v4/e8/e0/90/e8e090fb-10ba-a0f8-c719-ce347b658bbc/075597908541.jpg"),
  COVER("Music115/v4/6c/6b/98/6c6b98d3-6de6-5d2c-ab83-d87377615a26/603784912073.jpg"),
  COVER("Music221/v4/4a/2d/6f/4a2d6f89-f204-8f91-9812-f9bd203e33b0/cover.jpg"),
  COVER("Music124/v4/cb/c7/1d/cbc71df4-e2b7-4ea4-7edb-563a9aaf7b31/00602537433919.rgb.jpg"),
  COVER("Music115/v4/e4/bb/bc/e4bbbc7f-2e8a-27f5-fa0b-ef620523b8d3/20CRGIM23889.rgb.jpg"),
  COVER("Music/7f/9f/d6/mzi.vtnaewef.jpg"),
  COVER("Music116/v4/9b/e1/63/9be1630c-486d-760c-76cf-04282174700a/074646577424.jpg"),
  COVER("Music124/v4/56/51/c5/5651c5da-4b5e-f19f-6a55-8f2137be75f5/5099706551225.jpg"),
  COVER("Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg"),
  COVER("Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg"),
  COVER("Music114/v4/4f/e5/f5/4fe5f511-462e-e87b-0711-d4e42809fb17/dj.goshfswo.jpg"),
  COVER("Music125/v4/39/da/45/39da45ea-0a55-8668-0a84-4017b45fb13e/dj.rzbgoyft.jpg"),
  COVER("Music114/v4/4e/2f/8b/4e2f8b1f-7e14-1ce4-1c76-4683b1b9173d/603497847549.jpg"),
  COVER("Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg"),
  COVER("Music3/v4/d1/93/80/d1938039-e9ad-4200-a926-4b0b94e8f01f/603497893751.jpg"),
  COVER("Music114/v4/24/65/64/2465645a-7d7f-63a9-e0bb-097cdc6bd6a8/19UMGIM32054.rgb.jpg"),
  COVER("Music124/v4/ec/fe/82/ecfe82b7-b821-b318-17ad-512b9cd1717b/s06.afpdcbhn.jpg"),
  COVER("Features/v4/6f/09/84/6f098449-23bc-4c33-a9fd-6da9887aba45/dj.yrbzojng.jpg"),
  COVER("Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg"),
]

// Pick 4 stable covers from the pool given a seed string — same seed
// always returns the same 4, so the composite is consistent per
// playlist across re-renders.
function pickCovers(seed: string): string[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  const start = Math.abs(h) % POOL.length
  return [
    POOL[(start + 0) % POOL.length],
    POOL[(start + 3) % POOL.length],
    POOL[(start + 7) % POOL.length],
    POOL[(start + 11) % POOL.length],
  ]
}

export const SAVED_PLAYLISTS: SavedPlaylist[] = [
  // ── Blue Note ────────────────────────────────────────────────────────────
  { id: "p01", title: "Blue Note Essentials",          covers: pickCovers("bn-essentials"),    songCount: 64, owned: true       },
  { id: "p02", title: "Blue Note Late Night",          covers: pickCovers("bn-late-night"),    songCount: 28, owner: "Sarah K"  },
  { id: "p03", title: "Hancock & Shorter Sessions",    covers: pickCovers("hancock-shorter"),  songCount: 36, owner: "Marcus W" },
  // ── Impulse! ─────────────────────────────────────────────────────────────
  { id: "p04", title: "Impulse! Spiritual Jazz",       covers: pickCovers("impulse-spirit"),   songCount: 47, owned: true       },
  { id: "p05", title: "Coltrane Years on Impulse",     covers: pickCovers("coltrane-impulse"), songCount: 52, owner: "Léa M"    },
  { id: "p06", title: "Pharoah & Alice — Impulse Era", covers: pickCovers("pharoah-alice"),    songCount: 19, owner: "Tomás R"  },
  // ── Strata-East ──────────────────────────────────────────────────────────
  { id: "p07", title: "Strata-East Deep Cuts",         covers: pickCovers("strata-deep"),      songCount: 31, owner: "Ingrid H" },
  { id: "p08", title: "Gil Scott-Heron Brian Jackson", covers: pickCovers("gsh-bj"),           songCount: 22, owner: "Caleb O"  },
  // ── Justin Time ──────────────────────────────────────────────────────────
  { id: "p09", title: "Justin Time — Canadian Jazz",   covers: pickCovers("justin-canada"),    songCount: 38, owner: "Hana N"   },
  { id: "p10", title: "Diana Krall Early Years",       covers: pickCovers("krall-early"),      songCount: 24, owner: "James O"  },
  // ── Evidence ─────────────────────────────────────────────────────────────
  { id: "p11", title: "Evidence Reissues",             covers: pickCovers("evidence"),         songCount: 44, owner: "Yuki T"   },
  { id: "p12", title: "Monk on Evidence",              covers: pickCovers("monk-evidence"),    songCount: 17, owned: true       },
  // ── Cross-label moods ────────────────────────────────────────────────────
  { id: "p13", title: "Modal Jazz Meditations",        covers: pickCovers("modal-meditation"), songCount: 51, owner: "Elena P"  },
  { id: "p14", title: "Hard Bop Hustle",               covers: pickCovers("hard-bop"),         songCount: 67, owner: "Niamh O"  },
  // ── More Blue Note ───────────────────────────────────────────────────────
  { id: "p15", title: "Sidewinder Boogaloo",           covers: pickCovers("sidewinder"),       songCount: 32, owner: "Theo P"   },
  { id: "p16", title: "Joe Henderson Years",           covers: pickCovers("joe-hen"),          songCount: 41, owner: "Ines V"   },
  { id: "p17", title: "Andrew Hill Departures",        covers: pickCovers("andrew-hill"),      songCount: 29, owner: "Saul O"   },
  { id: "p18", title: "Horace Silver Soul",            covers: pickCovers("horace-silver"),    songCount: 35, owner: "Mira C"   },
  // ── More Impulse! ────────────────────────────────────────────────────────
  { id: "p19", title: "Alice Coltrane Cosmos",         covers: pickCovers("alice-cosmos"),     songCount: 27, owned: true       },
  { id: "p20", title: "Vanguard Live Sessions",        covers: pickCovers("vanguard"),         songCount: 22, owner: "Jules B"  },
  { id: "p21", title: "Free Jazz Liberations",         covers: pickCovers("free-liberations"), songCount: 33, owner: "Otis R"   },
  { id: "p22", title: "Impulse! Big Bands",            covers: pickCovers("impulse-big"),      songCount: 18, owner: "Selma A"  },
  // ── More Strata-East ─────────────────────────────────────────────────────
  { id: "p23", title: "Strata-East Rarities",          covers: pickCovers("strata-rare"),      songCount: 14, owner: "Noé L"    },
  { id: "p24", title: "Stanley Cowell Workshop",       covers: pickCovers("cowell"),           songCount: 21, owner: "Aïda K"   },
  { id: "p25", title: "Charles Tolliver Pages",        covers: pickCovers("tolliver"),         songCount: 16, owner: "Bart M"   },
  // ── More Justin Time ─────────────────────────────────────────────────────
  { id: "p26", title: "Diana Krall Standards",         covers: pickCovers("krall-std"),        songCount: 28, owner: "Sofia G"  },
  { id: "p27", title: "Oliver Jones Trio Sessions",    covers: pickCovers("oliver-trio"),      songCount: 19, owner: "Reza N"   },
  { id: "p28", title: "Ranee Lee Vocal Jazz",          covers: pickCovers("ranee-vocal"),      songCount: 24, owner: "Liam F"   },
  // ── More Evidence ────────────────────────────────────────────────────────
  { id: "p29", title: "Cecil Taylor Conquests",        covers: pickCovers("cecil"),            songCount: 12, owner: "Mae T"    },
  { id: "p30", title: "Roland Kirk Reeds",             covers: pickCovers("kirk-reeds"),       songCount: 30, owner: "Bram W"   },
  // ── Spiritual / Free Jazz ────────────────────────────────────────────────
  { id: "p31", title: "Spiritual Jazz Mornings",       covers: pickCovers("spirit-morn"),      songCount: 42, owned: true       },
  { id: "p32", title: "Pharoah Sanders Anthology",     covers: pickCovers("pharoah-antho"),    songCount: 38, owner: "Yara K"   },
  { id: "p33", title: "Astral Travel",                 covers: pickCovers("astral"),           songCount: 26, owner: "Nico R"   },
  { id: "p34", title: "Cosmic Vibrations",             covers: pickCovers("cosmic-vibe"),      songCount: 33, owner: "Esme V"   },
  { id: "p35", title: "Mantras & Meditations",         covers: pickCovers("mantras"),          songCount: 17, owner: "Aiko F"   },
  // ── Hard Bop & Boogaloo ──────────────────────────────────────────────────
  { id: "p36", title: "Boogaloo Boulevard",            covers: pickCovers("boogaloo"),         songCount: 45, owner: "Dante M"  },
  { id: "p37", title: "Hammond B3 Heat",               covers: pickCovers("hammond"),          songCount: 36, owner: "Cleo R"   },
  { id: "p38", title: "Funky Soul Jazz",               covers: pickCovers("funky-soul"),       songCount: 52, owner: "Brian H"  },
  // ── Vocal Jazz ───────────────────────────────────────────────────────────
  { id: "p39", title: "Ella & Sarah",                  covers: pickCovers("ella-sarah"),       songCount: 41, owner: "Pia O"    },
  { id: "p40", title: "Vocalese Workshop",             covers: pickCovers("vocalese"),         songCount: 23, owner: "Idris L"  },
  { id: "p41", title: "Smoky Ballads",                 covers: pickCovers("ballads"),          songCount: 34, owned: true       },
  // ── Contemporary ─────────────────────────────────────────────────────────
  { id: "p42", title: "London Jazz Renaissance",       covers: pickCovers("london-jazz"),      songCount: 48, owner: "Ari S"    },
  { id: "p43", title: "Comet Is Coming",               covers: pickCovers("comet"),            songCount: 14, owner: "Tess M"   },
  { id: "p44", title: "Nubya & Friends",               covers: pickCovers("nubya-friends"),    songCount: 19, owner: "Caleb W"  },
  { id: "p45", title: "Shabaka Studies",               covers: pickCovers("shabaka"),          songCount: 22, owner: "Mira N"   },
  { id: "p46", title: "Nala Sinephro Drift",           covers: pickCovers("nala-drift"),       songCount: 11, owned: true       },
  { id: "p47", title: "Makaya Beats",                  covers: pickCovers("makaya"),           songCount: 28, owner: "Tomé J"   },
  { id: "p48", title: "Robert Glasper Frequencies",    covers: pickCovers("glasper-freq"),     songCount: 32, owner: "Bea R"    },
  { id: "p49", title: "Floating Points & Strings",     covers: pickCovers("floating-strings"), songCount: 15, owner: "Luc T"    },
  { id: "p50", title: "Thundercat & Co.",              covers: pickCovers("thundercat"),       songCount: 27, owner: "Greta P"  },
  // ── Listening Moods ──────────────────────────────────────────────────────
  { id: "p51", title: "Sunday Morning Brew",           covers: pickCovers("sunday-brew"),      songCount: 24, owned: true       },
  { id: "p52", title: "Late Night Subway",             covers: pickCovers("subway"),           songCount: 31, owner: "Otto K"   },
  { id: "p53", title: "Rainy Day Sessions",            covers: pickCovers("rainy"),            songCount: 26, owner: "Vera S"   },
  { id: "p54", title: "Headphone Trips",               covers: pickCovers("headphones"),       songCount: 19, owner: "Iggy L"   },
  { id: "p55", title: "Dinner Party Smoke",            covers: pickCovers("dinner-smoke"),     songCount: 38, owned: true       },
  { id: "p56", title: "Coffee Shop Cuts",              covers: pickCovers("coffee-shop"),      songCount: 22, owner: "Anya P"   },
  { id: "p57", title: "Driving North",                 covers: pickCovers("driving-north"),    songCount: 17, owner: "Kai S"    },
  { id: "p58", title: "Afterhours Lounge",             covers: pickCovers("afterhours"),       songCount: 35, owner: "Mira H"   },
  { id: "p59", title: "Bossa & Cocktails",             covers: pickCovers("bossa-cocktail"),   songCount: 29, owner: "Tomás R"  },
  { id: "p60", title: "Tape Hiss & Vinyl Crackle",     covers: pickCovers("tape-hiss"),        songCount: 41, owned: true       },
]

export function LibraryPlaylistsView() {
  // SPA navigation: tapping a playlist → `?page=Playlist&playlist=<slug>`.
  // The slug threads into PlaylistDetailView, which resolves it via the
  // playlist catalog (rich for the demo, synthesized for the rest).
  const { openPlaylist } = useMediaNav()
  // Status filter (scalable dropdown) + persisted/shared view.
  const [status, setStatus] = useState<"all" | "yours" | "saved">("all")
  const [view, setView] = useLibraryView()
  const footerNav = useFooterNav()
  const [sort] = useLibrarySort()
  const library = useUserLibrary()

  const filtered = SAVED_PLAYLISTS.filter(p => {
    // In the library if it's yours (owned) or saved in the store. Toggling
    // a playlist's heart off on its detail page removes it here.
    const inLib = p.owned || library.inLibrary("playlist", slugify(p.title))
    if (!inLib) return false
    if (status === "yours") return !!p.owned
    if (status === "saved") return !p.owned
    return true
  })
  // Mobile sort drives the order; desktop keeps source/table order.
  const playlists = footerNav
    ? [...filtered].sort(compareLibrary(sort, p => p.title))
    : filtered
  return (
    <div className="flex-1 overflow-auto">
      {/* `@container` lives on the grid wrapper below, not here — see
           the Albums view: a query container traps absolutely-positioned
           descendants (the list table's floating bulk bar). */}
      <div className="mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-page pt-8 pb-12">
        {/* Mobile: header already shows "Library" + active pill. */}
        {!footerNav && (
          <h1 className="text-2xlarge font-medium text-foreground tracking-tight mb-4">
            Playlists
          </h1>
        )}
        {/* Toolbar — filters left, view switch right (see Albums). */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Desktop = status filter; mobile = sort menu. */}
          <div className="flex items-center gap-2 min-w-0">
            {footerNav ? (
              <LibrarySortMenu />
            ) : (
              <SingleSelect
                value={status}
                onChange={setStatus}
                icon={<ListFilter className="size-4" />}
                options={[
                  { value: "all",   label: "All playlists" },
                  { value: "yours", label: "Created by you" },
                  { value: "saved", label: "Saved" },
                ]}
              />
            )}
          </div>
          {/* Tile / list view switch. */}
          <ToggleGroup
            size="sm"
            value={[view]}
            onValueChange={(v) => { if (v[0]) setView(v[0] as "grid" | "list") }}
            aria-label="View mode"
          >
            <Toggle value="grid" aria-label="Tile view">
              <LayoutGrid className="size-3.5" />
            </Toggle>
            <Toggle value="list" aria-label="List view">
              <List className="size-3.5" />
            </Toggle>
          </ToggleGroup>
        </div>

        {view === "grid" ? (
          <div className="@container">
            <ul className="grid-cards">
              {/* Create card only shows in the unfiltered / "yours" views. */}
              {status !== "saved" && (
                <li>
                  <PlaylistCreateCard />
                </li>
              )}
              {playlists.map(p => (
                <li key={p.id}>
                  <PlaylistCard
                    title={p.title}
                    covers={p.covers}
                    songCount={p.songCount}
                    owner={p.owner}
                    owned={p.owned}
                    inLibrary={!p.owned}
                    onTitleClick={() => openPlaylist(slugify(p.title))}
                    onPlay={() => openPlaylist(slugify(p.title))}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : footerNav ? (
          <PlaylistMobileList playlists={playlists} />
        ) : (
          <PlaylistListTable playlists={playlists} />
        )}
      </div>
    </div>
  )
}
