import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// Competitor research: how streaming apps show credits.
// Recorded 12 Nov 2026 in each service's web player, signed in, on one album
// (Robert Glasper Experiment — Black Radio) and one song ("Afro Blue"), so
// every capture shows the same data. Each GIF is a step-by-step capture
// (~1 s per step), not a screen recording. Mobile only where the web player
// allows it: Spotify blocks its phone web player, Deezer serves the desktop
// layout squeezed, Qobuz refuses widths under 1024px. Apple Music is missing
// (not signed in).

export function meta() {
  return [{ title: "Credits in streaming apps · muza research" }]
}

type Capture = {
  src: string
  app: string
  device: "Desktop" | "Mobile"
  note: string
  /** Sharp still of the credits view itself, recorded 1:1 (no scaling, no
   *  GIF palette). Long modals are stitched from several scroll positions. */
  still: string
}

const SONG: Capture[] = [
  {
    src: "01-spotify-desktop-song.gif", still: "spotify-song.png", app: "Spotify", device: "Desktop",
    note: "Track ⋯ → View credits. A scrolling modal for one song: Artist, Composition, Production & Engineering, then Performers with instruments at the very bottom.",
  },
  {
    src: "02-youtube-desktop-song.gif", still: "youtube-song.png", app: "YouTube Music", device: "Desktop",
    note: "Track ⋯ → View song credits. Small modal: cover, title, year; Performed by, Written by, Produced by. No instruments.",
  },
  {
    src: "03-yt-mobile-song.gif", still: "youtube-mobile-song.png", app: "YouTube Music", device: "Mobile",
    note: "Same modal on the phone. Fits on one screen, nothing to scroll.",
  },
  {
    src: "04-deezer-desktop-song.gif", still: "deezer-song.png", app: "Deezer", device: "Desktop",
    note: "Track ⋯ → See song credits. The menu turns into Writer and Composer. Nothing else.",
  },
  {
    src: "05-tidal-desktop-song.gif", still: "tidal-song.png", app: "Tidal", device: "Desktop",
    note: "Track → Credits opens the album credits page, scrolled to the song. Song bar sticks under a compact album header.",
  },
  {
    src: "06-tidal-mobile-song.gif", still: "tidal-mobile-song.png", app: "Tidal", device: "Mobile",
    note: "Same on the phone: lands on the song inside the album credits. Every role, one per row; the song bar stays pinned while you scroll on into the next songs.",
  },
  {
    src: "09-qobuz-desktop-song.gif", still: "qobuz-song.png", app: "Qobuz", device: "Desktop",
    note: "Track ⋮ → Credits opens the album credits dialog with that song expanded. Name, role list, ℗ line.",
  },
]

const ALBUM: Capture[] = [
  {
    src: "07-tidal-desktop-album.gif", still: "tidal-album.png", app: "Tidal", device: "Desktop",
    note: "Credits button under the album header. Big cover banner, then one card per song with every role; two columns on desktop.",
  },
  {
    src: "08-tidal-mobile-album.gif", still: "tidal-mobile-album.png", app: "Tidal", device: "Mobile",
    note: "Same page, one column. The album Credits button is hidden on mobile web; you reach it through a song.",
  },
  {
    src: "10-qobuz-desktop-album.gif", still: "qobuz-album.png", app: "Qobuz", device: "Desktop",
    note: "ⓘ in the album header. Dialog: cover and facts left, all songs right, each one collapsed until opened.",
  },
]

const MATRIX = [
  { app: "Spotify",       song: "Modal, one song",               album: "—",                    players: "Yes, at the bottom" },
  { app: "YouTube Music", song: "Modal, one song",               album: "—",                    players: "Names only" },
  { app: "Deezer",        song: "Popover, writers only",         album: "—",                    players: "No" },
  { app: "Tidal",         song: "Album page, scrolled to song",  album: "Page, card per song",  players: "Yes, every role" },
  { app: "Qobuz",         song: "Album dialog, song expanded",   album: "Dialog, song list",    players: "Partly" },
]

function Shot({ file, alt, narrow, native }: { file: string; alt: string; narrow?: boolean; native?: boolean }) {
  return (
    <a
      href={`/research/credits/${file}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-start justify-center rounded-xl bg-muted p-3"
    >
      <img
        src={`/research/credits/${file}`}
        alt={alt}
        loading="lazy"
        className={native ? "max-w-full rounded-xs" : narrow ? "w-full max-w-[375px] rounded-xs" : "w-full rounded-xs"}
      />
    </a>
  )
}

function CaptureCard({ c }: { c: Capture }) {
  const mobile = c.device === "Mobile"
  // The flow (GIF) beside a sharp still of where it ends. The GIFs are
  // step captures from a downscaled browser pane plus a 256-colour palette,
  // so their small credit text goes soft; the still is recorded at 1:1 and
  // is the one to read. Either opens on its own when clicked.
  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="flex max-w-2xl flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-small font-medium text-foreground">{c.app}</span>
          <Badge variant="secondary">{c.device}</Badge>
        </div>
        <p className="text-xsmall text-muted-foreground">{c.note}</p>
      </figcaption>
      <div className="grid gap-4 lg:grid-cols-2">
        <Shot file={c.src} alt={`${c.app} credits flow, ${c.device.toLowerCase()}`} narrow={mobile} />
        {/* Never upscaled: shown at its recorded size or smaller. */}
        <Shot file={c.still} alt={`${c.app} credits, still`} native />
      </div>
    </figure>
  )
}

function Section({ title, lead, items }: { title: string; lead: string; items: Capture[] }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xlarge font-medium text-foreground">{title}</h2>
        <p className="text-small text-muted-foreground max-w-2xl">{lead}</p>
      </div>
      <div className="flex flex-col gap-16">
        {items.map((c) => <CaptureCard key={c.src} c={c} />)}
      </div>
    </section>
  )
}

export default function ResearchCredits() {
  return (
    // The root shell sets `body { overflow: hidden }` (the app scrolls inside
    // its own panes), so a standalone page must be its own scroller.
    <main className="h-full overflow-y-auto bg-background">
      <div className="px-page mx-auto flex max-w-[1440px] flex-col gap-16 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-xsmall text-muted-foreground">muza research · 12 Nov 2026</p>
          <h1 className="text-3xlarge font-bold leading-tight tracking-tight text-foreground">Credits in streaming apps</h1>
          <p className="text-small text-muted-foreground max-w-2xl">
            How five services show who played what. Same album everywhere (Robert Glasper Experiment, <em>Black Radio</em>), same song (“Afro Blue”), recorded in each web player.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-xlarge font-medium text-foreground">At a glance</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App</TableHead>
                <TableHead>Song credits</TableHead>
                <TableHead>Album credits</TableHead>
                <TableHead>Musicians + instruments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MATRIX.map((r) => (
                <TableRow key={r.app}>
                  <TableCell className="font-medium text-foreground">{r.app}</TableCell>
                  <TableCell>{r.song}</TableCell>
                  <TableCell className={r.album === "—" ? "text-muted-foreground" : undefined}>{r.album}</TableCell>
                  <TableCell>{r.players}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <Separator />

        <Section
          title="Song credits"
          lead="Opened from a song's ⋯ menu. Spotify, YouTube and Deezer show that one song in a small modal. Tidal and Qobuz open the whole album's credits and jump to the song."
          items={SONG}
        />

        <Separator />

        <Section
          title="Album credits"
          lead="Only Tidal and Qobuz have them. Spotify, YouTube Music and Deezer have no album-level credits at all."
          items={ALBUM}
        />

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="text-xlarge font-medium text-foreground">What it means for muza</h2>
          <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-5 text-small text-muted-foreground">
            <li><span className="text-foreground">The mainstream pattern is one song in one modal.</span> No album view behind it. Spotify's is the fullest of the three, with musicians and instruments, but you have to scroll to the bottom to find them.</li>
            <li><span className="text-foreground">Only the hi-fi apps have album credits</span>, and both read song by song, like a booklet.</li>
            <li><span className="text-foreground">Tidal has the richest data</span> (every instrument, every engineer); Qobuz misses players on the same song.</li>
            <li><span className="text-foreground">Nobody merges the album</span> into one person-by-person list with instruments. That is still open ground.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
