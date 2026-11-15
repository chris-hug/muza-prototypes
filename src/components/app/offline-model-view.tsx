"use client"

/*
 * OfflineModelView — a concept overview for the team (`?page=OfflineModel`):
 * what plays without a connection, shown case by case as the real album card
 * beside its real ⋯ menu, with two sentences each. The model itself lives in
 * `src/lib/offline.ts` and `src/lib/local-library.ts`. Not linked from the
 * app's navigation (like MenuOptions).
 *
 * Cards and menus, not a table: the first version was a matrix of every
 * property and read as too complicated. What the team needs to see is what
 * the listener sees. The headline says what the page is — a concept overview,
 * a proposal built in the prototype, not a spec of shipped behaviour.
 *
 * Its own in-memory library (as MenuOptions has), so a visitor's stored
 * library cannot change the purchase states the page exists to show.
 */

import { AlbumCard } from "@/components/ui/album-card"
import { DetailMenuSurface } from "@/components/ui/detail-more-button"
import { useToast } from "@/components/ui/toast"
import { FilesPurchaseProvider } from "@/components/app/files-purchase-provider"
import { getAlbumDetail } from "@/lib/album-catalog"
import { UserLibraryProvider } from "@/lib/user-library"
import { getLocalAlbum, SHOW_IN_FOLDER } from "@/lib/local-library"
import { useLocalActions } from "@/lib/use-local-actions"
import { SimulatedDevice } from "@/lib/offline"

const SEED = {
  a14: { added: true, purchased: true, tier: "stream" as const },
  a03: { added: true, purchased: true, tier: "download" as const },
  a09: { added: true, purchased: true, tier: "download" as const },
}

export function OfflineModelView() {
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

// ─── One case: card, menu, words ────────────────────────────────────────────

function Case({ title, card, menu, children }: {
  title: string
  card: React.ReactNode
  menu: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <article className="flex flex-col gap-4 border-t border-border pt-6">
      <h3 className="text-large font-medium text-foreground">{title}</h3>
      <div className="grid gap-6 items-start grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] @min-[760px]:grid-cols-[200px_280px_1fr]">
        <div className="w-full max-w-[220px]">{card}</div>
        <div className="w-full max-w-[320px]">{menu}</div>
        <div className="flex flex-col gap-2 text-small text-muted-foreground max-w-[52ch]">{children}</div>
      </div>
    </article>
  )
}

function CatalogCase({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const a = getAlbumDetail(id)
  return (
    <Case
      title={title}
      card={<AlbumCard cover={a.cover} title={a.title} artist={a.artist} year={a.year} purchased inLibrary className="w-full" />}
      menu={
        <DetailMenuSurface
          kind="album" title={a.title} subtitle={a.artist} cover={a.cover} meta={String(a.year)}
          libraryType="album" libraryId={id} libraryName={a.title}
          onGoToArtist={() => {}} className="w-full"
        />
      }
    >
      {children}
    </Case>
  )
}

function ImportedCase({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const album = getLocalAlbum(id)!
  const l = useLocalActions()(album)
  return (
    <Case
      title={title}
      card={<AlbumCard local={album} cover={album.cover} title={album.title} artist={album.artist} year={album.year} className="w-full" />}
      menu={
        <DetailMenuSurface
          kind="album" title={album.title} subtitle={album.artist} cover={album.cover} meta={l.label}
          {...l.menu} className="w-full"
        />
      }
    >
      {children}
    </Case>
  )
}

/** The phone, simulated: the same imported album as on the MacBook, seen
 *  from a device that does not hold the files — so its menu offers Save
 *  offline and no Show in Finder. The card is the real one. */
function PhoneCase() {
  const album = getLocalAlbum("local-cool-struttin")!
  const { add: toast } = useToast()
  return (
    <Case
      title="Imported from a folder on your MacBook — seen on your phone"
      card={<AlbumCard local={album} cover={album.cover} title={album.title} artist={album.artist} year={album.year} className="w-full" />}
      menu={
        <DetailMenuSurface
          kind="album" title={album.title} subtitle={album.artist} cover={album.cover} meta="Imported"
          local={{ onSaveOffline: () => toast({ title: "Saved offline", description: album.title, type: "success" }) }}
          className="w-full"
        />
      }
    >
      <p>Cool Struttin' sits in a folder on your MacBook. Your phone streams it from the MacBook — only while the MacBook is on and online.</p>
      <p><span className="text-foreground">Save offline</span> keeps a copy on your phone, so it plays there even when the MacBook is off or you have no connection. Free. Only muza plays the copy.</p>
    </Case>
  )
}

function Page() {
  return (
    <div className="@container mx-auto flex w-full max-w-[1120px] flex-col gap-16 px-page pt-8 pb-12">
      {/* Hierarchy: what the page IS is the headline ("Concept overview");
          the topic is its subtitle; the rest is muted. The kind of page as a
          small kicker above the topic read as a caption, and the topic as
          the headline — which made the page look like product UI. */}
      <header className="flex flex-col gap-4">
        <h1 className="text-3xlarge font-medium tracking-tight text-foreground text-balance">Concept overview</h1>
        <p className="text-xlarge font-medium text-foreground text-balance">Offline: owned and imported music</p>
        <p className="text-large text-muted-foreground max-w-[65ch]">
          How muza decides what plays without a connection, and what the listener sees for it. Only files you have play offline — bought on muza, or imported from your own folders.
        </p>
        <p className="text-small text-muted-foreground max-w-[65ch]">
          A proposal, built in the prototype. Each case is the real album card next to its real ⋯ menu, with what it means beside it. The menus work. The setting: you are on your MacBook, which holds your music folders; a home server holds more; you also use muza on your phone.
        </p>
      </header>

      <section className="flex flex-col gap-8">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">Bought on muza</h2>

        <CatalogCase id="a14" title="Owned to stream — on any device">
          <p>Bought to listen on muza. Plays on your MacBook and your phone, never without a connection.</p>
          <p>To have it offline you buy the files, for the difference: <span className="text-foreground">Download files – $x</span>.</p>
        </CatalogCase>

        <CatalogCase id="a03" title="Owned with files — not yet downloaded on your MacBook">
          <p><span className="text-foreground">Download files</span> puts them on your MacBook, from muza. Free — the files are paid for.</p>
          <p>On the MacBook they land in Music › muza, a normal folder any player can open. On your phone the same button saves them inside the muza app.</p>
        </CatalogCase>

        <CatalogCase id="a09" title="Owned with files — downloaded on your MacBook">
          <p>The mark after "Owned": the files are on your MacBook, so it plays there offline.</p>
          <p><span className="text-foreground">Remove download</span> deletes the MacBook's copy; the purchase stays. Your phone downloads its own copy from muza — it never needs the MacBook to be on.</p>
        </CatalogCase>

        <SimulatedDevice device="phone">
          <CatalogCase id="a09" title="Owned with files — downloaded on your MacBook, seen on your phone">
            <p>The same album on your phone: "Owned", no mark. The MacBook's download does not count here — downloads are per device.</p>
            <p>It streams from muza while you are online. <span className="text-foreground">Download files</span> fetches the phone's own copy from muza, free; the MacBook does not need to be on. The files in the MacBook's Music › muza never show up as "Imported" on the phone: muza knows they are this release.</p>
          </CatalogCase>
        </SimulatedDevice>
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">Imported (your own files)</h2>

        <ImportedCase id="local-rehearsals-2024" title="Imported from a folder on your MacBook — seen on the MacBook">
          <p>Rehearsals 2024 sits in ~/Music/My recordings on your MacBook. The files are right there, so it plays offline. Nothing to save.</p>
          <p>The menu has only <span className="text-foreground">{SHOW_IN_FOLDER ?? "Show in Finder"}</span>, which opens that folder.</p>
        </ImportedCase>

        <PhoneCase />

        <ImportedCase id="local-kitchen-tapes" title="Imported from the home server — saved offline on your MacBook">
          <p>Kitchen Tapes sits on your home server, which is switched off. A copy is saved on your MacBook, so it still plays. The mark after "Imported" says so.</p>
          <p><span className="text-foreground">Remove offline copy</span> deletes the MacBook's copy; the files on the home server stay.</p>
        </ImportedCase>

        <ImportedCase id="local-song-for-my-father" title="Imported from the home server — server off, nothing saved">
          <p>Song for My Father sits on the same home server, which is off, and no copy is saved on your MacBook — so it cannot play. The amber dot: it needs you, nothing is lost.</p>
          <p><span className="text-foreground">Reconnect</span> (after the badge, and first in the menu) opens Settings › Imported music at the home server's row, where you reconnect it once it is switched on.</p>
        </ImportedCase>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-xlarge font-medium tracking-tight text-foreground">In short</h2>
        <ul className="flex flex-col gap-2 text-small text-muted-foreground max-w-[70ch]">
          <li><span className="text-foreground">Download files</span> — files bought on muza, downloaded from muza to each device you choose; yours to keep, any player plays them.</li>
          <li><span className="text-foreground">Save offline</span> — a copy of imported music on a device that does not hold the files (your phone; any device for the home server); only muza plays it.</li>
          <li><span className="text-foreground">Offline filter</span> (Library › Albums and Songs) — everything that plays on the device in your hand without a connection. Hidden when it would show exactly what Imported shows.</li>
          <li><span className="text-foreground">Not linked to muza</span> — imported music has no credits, artist link or "Also on muza": that would need matching files to releases, which was decided against.</li>
        </ul>
      </section>
    </div>
  )
}
