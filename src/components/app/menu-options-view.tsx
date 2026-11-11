"use client"

/*
 * MenuOptionsView — a page for the team (`?page=MenuOptions`): which option
 * each menu shows, and when. A page rather than a document so it can't drift:
 * the three menus are the real `DetailMenuSurface` off the real catalog.
 *
 * Its own in-memory library, because a visitor's stored library could have any
 * album in any state, and the page exists to show three specific ones. Not
 * linked from the app's navigation.
 */

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DetailMenuSurface } from "@/components/ui/detail-more-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FilesPurchaseProvider } from "@/components/app/files-purchase-provider"
import { getAlbumDetail } from "@/lib/album-catalog"
import { UserLibraryProvider, useUserLibrary } from "@/lib/user-library"

// The three purchase states, off the real catalog and store.
const SEED = {
  a14: { added: true, purchased: true, tier: "stream" as const },
  a09: { added: true, purchased: true, tier: "download" as const },
}

const STATES = [
  { id: "a01", heading: "Not purchased", when: "You can listen, but you don't own it. No option for files, and none for offline.", note: "Example: Maiden Voyage" },
  { id: "a14", heading: "Purchased for listening", when: "Owned. The files are available for the difference in price.", note: "Example: Glass Bead Game. Download files opens checkout." },
  { id: "a09", heading: "Files paid for", when: "Owned, with the lossless files.", note: "Example: The Black Saint and the Sinner Lady" },
]

const Y = "Yes", N = "No"
const MATRIX: [string, string, string, string, string, string][] = [
  ["Copy link", Y, Y, Y, Y, Y],
  ["Save to library", Y, "No, it's already yours", Y, Y, Y],
  ["Save offline", "Purchased or uploaded", "Only the songs you own", "Only the songs you own", "If you own its album", N],
  ["Download files", "Purchased only, see above", N, N, N, N],
  ["Add to a playlist", "Where available", N, N, "Not in your own playlist", N],
  ["Credits", Y, N, N, Y, N],
  ["Go to album / playlist", "Not on its own page", "Not on its own page", "Not on its own page", "Not on the album page", N],
  ["Go to artist", Y, N, N, "Not on the artist page", N],
  ["Go to owner", N, N, "Where available", N, N],
  ["Add music, Edit info, Make private", N, Y, N, N, N],
  ["Delete playlist", N, Y, N, N, N],
  ["Play radio, Artist info", N, N, N, N, Y],
  ["Report", Y, N, Y, Y, Y],
]

function Menu({ id, heading, when, note }: (typeof STATES)[number]) {
  const a = getAlbumDetail(id)
  return (
    <article className="flex min-w-0 flex-col gap-3">
      <h3 className="text-large font-medium leading-tight text-foreground">{heading}</h3>
      <p className="text-small text-muted-foreground min-h-14">{when}</p>
      <DetailMenuSurface
        kind="album"
        title={a.title}
        subtitle={a.artist}
        cover={a.cover}
        meta={String(a.year)}
        libraryType="album"
        libraryId={id}
        libraryName={a.title}
        onGoToArtist={() => {}}
        className="w-full"
      />
      <p className="text-2xsmall text-muted-foreground">{note}</p>
    </article>
  )
}

function Page() {
  const library = useUserLibrary()
  // Only the albums you own can be offline, so the switch only moves those.
  const owned = STATES.filter(s => library.isPurchased(s.id))
  const allOffline = owned.every(s => library.isOffline("album", s.id))
  const setAll = (on: boolean) => owned.forEach(s => {
    if (library.isOffline("album", s.id) !== on) library.toggleOffline("album", s.id)
  })

  return (
    <div
      className="mx-auto flex w-full max-w-[1120px] flex-col gap-14 px-page pt-8 pb-12"
    >
      <header className="flex flex-col gap-3">
        <h1 className="text-2xlarge font-medium tracking-tight text-foreground text-balance">What the album menu shows</h1>
        <p className="text-large text-muted-foreground max-w-[65ch]">
          The ⋯ menu of an album depends on what you bought. Save offline and Download files are only there once it is yours.
        </p>
      </header>

      <section className="flex flex-col gap-5">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">Three purchase states, three menus</h2>
        <div className="flex items-center gap-3">
          <Switch id="offline" checked={allOffline} onCheckedChange={setAll} />
          <Label htmlFor="offline">Albums you own are saved offline</Label>
        </div>
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          {STATES.map(s => <Menu key={s.id} {...s} />)}
        </div>
        <p className="text-small text-muted-foreground max-w-[65ch]">
          If an album doesn't offer files, or there is no difference to pay, Download files – $x doesn't appear.
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">Two words, two things</h2>
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          <div className="flex flex-col gap-1">
            <h3 className="text-large font-medium text-foreground">Offline</h3>
            <p className="text-small text-muted-foreground">Saved in the app on this device, playable without internet. Only for music that is yours: albums you bought or uploaded and their songs. A playlist saves the songs in it that you own. Streamed music stays online for now.</p>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-large font-medium text-foreground">Files</h3>
            <p className="text-small text-muted-foreground">The lossless files that are yours to keep. "Download" only appears where you actually get files, and always with the word "files".</p>
          </div>
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-5">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">All menus at a glance</h2>
        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                {["Option", "Album", "Your playlist", "Saved playlist", "Song", "Artist"].map(h => <TableHead key={h}>{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {MATRIX.map(([option, ...cells]) => (
                <TableRow key={option}>
                  <TableCell className="font-medium whitespace-nowrap">{option}</TableCell>
                  {cells.map((c, i) => (
                    <TableCell key={i} className={c.startsWith("No") ? "text-muted-foreground whitespace-normal" : "whitespace-normal"}>{c}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-small text-muted-foreground max-w-[65ch]">
          On an album you uploaded yourself, the Credits tile is replaced by Edit, and Report is gone. These menus are the real components: the rows work, and nothing you change here leaves this page.
        </p>
      </section>
    </div>
  )
}

export function MenuOptionsView() {
  return (
    <div className="flex-1 overflow-auto">
      <UserLibraryProvider seed={SEED} persist={false}>
        <FilesPurchaseProvider>
          <Page />
        </FilesPurchaseProvider>
      </UserLibraryProvider>
    </div>
  )
}
