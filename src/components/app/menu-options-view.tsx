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

import { DetailMenuSurface } from "@/components/ui/detail-more-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FilesPurchaseProvider } from "@/components/app/files-purchase-provider"
import { getAlbumDetail } from "@/lib/album-catalog"
import { UserLibraryProvider } from "@/lib/user-library"
import { getLocalAlbum } from "@/lib/local-library"
import { useLocalActions } from "@/lib/use-local-actions"

// The three purchase states, off the real catalog and store.
const SEED = {
  a14: { added: true, purchased: true, tier: "stream" as const },
  a09: { added: true, purchased: true, tier: "download" as const },
}

const STATES = [
  { id: "a01", heading: "Not purchased", when: "You can listen, but you don't own it. No option for files.", note: "Example: Maiden Voyage" },
  { id: "a14", heading: "Purchased for listening", when: "Owned. The files are available for the difference in price.", note: "Example: Glass Bead Game. Download files opens checkout." },
  { id: "a09", heading: "Files paid for", when: "Owned, with the lossless files.", note: "Example: The Black Saint and the Sinner Lady" },
]

const Y = "Yes", N = "No"
// The last column is imported music (album or song from your own files).
// It is not a release on muza and is not matched to one, so sharing, saving,
// credits, the artist and reporting are gone; what it gains is "Save offline"
// where the files are elsewhere, and the folder on a computer.
const MATRIX: [string, string, string, string, string, string, string][] = [
  ["Copy link", Y, Y, Y, Y, Y, "No, nobody else can open it"],
  ["Save to library", Y, "No, it's already yours", Y, Y, Y, "No, it's in your library by being imported"],
  ["Download files", "Purchased only, see above", N, N, N, N, N],
  ["Save offline / Remove offline copy", N, N, N, N, N, "Where the files are on another device (album; songs save their album)"],
  ["Add to a playlist", "Where available", N, N, "Not in your own playlist", N, "Songs"],
  ["Credits", Y, N, N, Y, N, "No, not matched to a release"],
  ["Show in Finder / Explorer", N, N, N, N, N, "On a computer"],
  ["Go to album / playlist", "Not on its own page", "Not on its own page", "Not on its own page", "Not on the album page", N, "Songs, to their imported album"],
  ["Go to artist", Y, N, N, "Not on the artist page", N, "No, not matched to an artist"],
  ["Go to owner", N, N, "Where available", N, N, N],
  ["Add music, Edit info, Make private", N, Y, N, N, N, N],
  ["Delete playlist", N, Y, N, N, N, N],
  ["Play radio, Artist info", N, N, N, N, Y, N],
  ["Report", Y, N, Y, Y, Y, N],
]

const LOCAL_STATES = [
  { id: "local-song-for-my-father", heading: "On another device", note: "Example: Song for My Father, on the home server. Save offline keeps a copy here. (The server is off, so the row waits until it answers.)" },
  { id: "local-kitchen-tapes", heading: "Saved offline", note: "Example: Kitchen Tapes, Vol. 1. Plays with the server off; Remove offline copy frees the space." },
  { id: "local-rehearsals-2024", heading: "On this computer", note: "Example: Rehearsals 2024, in a folder on this Mac. Nothing to save: the files are here." },
]

function LocalMenu({ id, heading, note }: (typeof LOCAL_STATES)[number]) {
  const album = getLocalAlbum(id)!
  const l = useLocalActions()(album)
  return (
    <article className="flex min-w-0 flex-col gap-3">
      <h3 className="text-large font-medium leading-tight text-foreground">{heading}</h3>
      <DetailMenuSurface
        kind="album"
        title={album.title}
        subtitle={album.artist}
        cover={album.cover}
        meta={l.label}
        {...l.menu}
        className="w-full"
      />
      <p className="text-2xsmall text-muted-foreground">{note}</p>
    </article>
  )
}

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
  return (
    <div
      className="mx-auto flex w-full max-w-[1120px] flex-col gap-14 px-page pt-8 pb-12"
    >
      <header className="flex flex-col gap-3">
        <h1 className="text-2xlarge font-medium tracking-tight text-foreground text-balance">What the album menu shows</h1>
        <p className="text-large text-muted-foreground max-w-[65ch]">
          The ⋯ menu of an album depends on what you bought, and on whether it is on muza at all or in your own files. Download files is only there once it is yours.
        </p>
      </header>

      <section className="flex flex-col gap-5">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">Three purchase states, three menus</h2>
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          {STATES.map(s => <Menu key={s.id} {...s} />)}
        </div>
        <p className="text-small text-muted-foreground max-w-[65ch]">
          If an album doesn't offer files, or there is no difference to pay, Download files – $x doesn't appear.
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">Imported music</h2>
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          {LOCAL_STATES.map(s => <LocalMenu key={s.id} {...s} />)}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">Two words, two things</h2>
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          <div className="flex flex-col gap-1">
            <h3 className="text-large font-medium text-foreground">Save offline</h3>
            <p className="text-small text-muted-foreground">For imported music: keep a copy on this device, free, so it plays without a connection to the computer or server that holds it.</p>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-large font-medium text-foreground">Download files</h3>
            <p className="text-small text-muted-foreground">For music bought on muza: the lossless files that are yours to keep, paid for. "Download" only appears where you actually get files, and always with the word "files".</p>
          </div>
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-5">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">All menus at a glance</h2>
        <div className="overflow-x-auto">
          <Table className="min-w-[1040px]">
            <TableHeader>
              <TableRow>
                {["Option", "Album", "Your playlist", "Saved playlist", "Song", "Artist", "Imported"].map(h => <TableHead key={h}>{h}</TableHead>)}
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
