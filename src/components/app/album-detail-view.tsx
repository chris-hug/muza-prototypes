"use client"

/*
 * AlbumDetailView — full-page album detail surface. Composes the
 * shared `MediaHeader` + a list of `SongListItem`s in `trackNumber`
 * mode + a "More from this artist" rail at the bottom.
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 2840:112964
 * (Album Detail view — default — responsive ≥ 1280).
 *
 * The album shown is driven by the `?album=<library-id>` query param,
 * looked up in `album-catalog`. Unknown / missing ids fall back to the
 * default album (A Love Supreme). Library cards thread their id straight
 * into the param, so the same component renders any catalog album.
 */

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { DetailMoreButton } from "@/components/ui/detail-more-button"
import { usePublishDetailHeader } from "@/lib/detail-actions"
import { useFooterNav } from "@/lib/use-media-query"

import { Button } from "@/components/ui/button"
import { MediaHeader } from "@/components/ui/media-header"
import { SongListItem } from "@/components/ui/song-list-item"
import { AlbumCard } from "@/components/ui/album-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { PlaylistCard } from "@/components/ui/playlist-card"
import { CardRail } from "@/components/app/card-rail"
import { PurchaseAlbumDialog } from "@/components/app/purchase-album-dialog"
import { useUserLibrary } from "@/lib/user-library"
import { useUserAccount } from "@/lib/user-account"
import { albumMetaFor, libraryIdForTitle } from "@/lib/album-meta"
import { getAlbumDetail, hasAlbumDetail } from "@/lib/album-catalog"
import { hasPlaylistDetail } from "@/lib/playlist-catalog"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { usePlayer } from "@/lib/player"
import { useCredits } from "@/lib/credits-context"
import {
  SubscriptionPromptDialog,
  SubscriptionCheckoutDialog,
} from "@/components/app/subscription-dialogs"


// "Playlists with John Coltrane" — curated lists that include the
// album's primary artist. Composite covers driven by 4 album thumbs
// each so PlaylistCard can render its 2×2 grid. 9 items so the rail
// always exceeds the visible column count.
const PL_COVER_POOL = [
  "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3b/30/51/3b305111-c28a-80ad-1f1d-6e89fb4fa2af/13ULAIM49306.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg",
] as const

// Pick four cover URLs from the pool starting at offset `i` so each
// playlist gets a unique-looking composite without hand-typing 36
// strings.
const pickCovers = (i: number): string[] => [
  PL_COVER_POOL[i % PL_COVER_POOL.length],
  PL_COVER_POOL[(i + 1) % PL_COVER_POOL.length],
  PL_COVER_POOL[(i + 2) % PL_COVER_POOL.length],
  PL_COVER_POOL[(i + 3) % PL_COVER_POOL.length],
]

const PLAYLISTS_WITH_ARTIST = [
  { id: "p1", title: "Modal Jazz Meditations",   songCount: 42, owner: "Muza Editorial", covers: pickCovers(0) },
  { id: "p2", title: "Coltrane Years on Impulse!", songCount: 28, owner: "Muza Editorial", covers: pickCovers(1) },
  { id: "p3", title: "Late Night Improvisations",  songCount: 35, owner: "Jules",          covers: pickCovers(2) },
  { id: "p4", title: "Hard Bop Hustle",             songCount: 50, owner: "Mira",           covers: pickCovers(3) },
  { id: "p5", title: "Spiritual Jazz Essentials",   songCount: 31, owner: "Muza Editorial", covers: pickCovers(4) },
  { id: "p6", title: "Sheets of Sound",             songCount: 24, owner: "Alex",           covers: pickCovers(5) },
  { id: "p7", title: "Saxophone Greats",            songCount: 60, owner: "Muza Editorial", covers: pickCovers(0) },
  { id: "p8", title: "Free Jazz Frontiers",         songCount: 22, owner: "Noa",            covers: pickCovers(2) },
  { id: "p9", title: "Post-Bop Heroes",             songCount: 38, owner: "Muza Editorial", covers: pickCovers(4) },
] as const

export function AlbumDetailView() {
  // The album shown is driven by `?album=<key>` (title slug or library
  // id); unknown keys fall back to the default. The in-page rails use
  // `useMediaNav` to hop to another album / playlist without leaving the
  // route.
  const [params] = useSearchParams()
  const { openAlbum, openPlaylist, openArtist } = useMediaNav()
  const credits = useCredits()
  const ALBUM = getAlbumDetail(params.get("album"))

  // Hopping between albums keeps the same route (page stays "Album"), so
  // the route shell's scroll-to-top (keyed on `page`) doesn't fire —
  // reset the scroll container ourselves whenever the album id changes.
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let el = rootRef.current?.parentElement
    while (el) {
      const oy = getComputedStyle(el).overflowY
      if (oy === "auto" || oy === "scroll") { el.scrollTop = 0; break }
      el = el.parentElement
    }
  }, [ALBUM.id])

  // Purchase dialog open state — the MediaHeader's `onBuy` flips
  // this true; `PurchaseAlbumDialog` flips it back via
  // `onOpenChange` (Cancel / Close / post-success auto-close).
  // `buyOpen` = standard purchase flow (album not yet owned).
  // `upgradeOpen` = pay-the-difference "add download" flow (stream-
  // tier owner adding the download license).
  const [buyOpen,           setBuyOpen]           = useState(false)
  const [upgradeOpen,       setUpgradeOpen]       = useState(false)
  const [paywallOpen,       setPaywallOpen]       = useState(false)
  const [subscribeOpen,     setSubscribeOpen]     = useState(false)
  const [subscribeAmount,   setSubscribeAmount]   = useState<string>("10")
  const library  = useUserLibrary()
  const player   = usePlayer()
  // This album is the active player source AND playing → header Play
  // button shows Pause.
  const isThisAlbumPlaying = player.playing && player.playingFrom === ALBUM.title
  const footerNav = useFooterNav()
  const account  = useUserAccount()
  // Gate a track-play attempt through the subscription cap. Anonymous
  // users get up to ANONYMOUS_PLAY_LIMIT plays per track; past that
  // the paywall opens instead of starting playback.
  const tryPlayTrack = (track: { id: string; title: string; duration?: string }) => {
    const result = account.canListen(track.id)
    if (!result.allowed) {
      setPaywallOpen(true)
      return
    }
    account.recordPlay(track.id)
    // Load the global player with this track (cover + artist from the
    // album header, since album-detail rows omit per-track art).
    player.play(
      {
        title:  track.title,
        artist: ALBUM.artist,
        album:  ALBUM.title,
        image:  ALBUM.cover,
        totalTime: track.duration,
        artistAvatar: ALBUM.artistAvatar,
      },
      ALBUM.title,
    )
  }
  const isPurchased    = library.isPurchased(ALBUM.id)
  const isDownloadable = library.entryFor(ALBUM.id)?.tier === "download"
  // Delta between stream and download prices — surfaces as the
  // upgrade CTA when the user owns the stream tier but not download.
  // Only show the affordance when the delta is actually positive; a
  // $0 delta means the tiers are priced the same, no upgrade fee.
  const rawUpgradeDelta = ALBUM.downloadPrice
    ? Math.max(
        0,
        Number((ALBUM.downloadPrice).replace(/[^0-9.]/g, "")) -
        Number((ALBUM.buyingPrice ?? "").replace(/[^0-9.]/g, "")),
      )
    : 0
  const canUpgradeToDownload = isPurchased && !isDownloadable && !!ALBUM.downloadPrice && rawUpgradeDelta > 0
  const upgradePriceStr = `$${rawUpgradeDelta.toFixed(2)}`

  // Overflow-menu config — shared by the in-page "…" (stacked layout)
  // and the floating mobile chrome's "…".
  const albumMenu = {
    kind: "album" as const,
    title: ALBUM.title,
    subtitle: ALBUM.artist,
    cover: ALBUM.cover,
    meta: String(ALBUM.year),
    // Save action binds to the global user-library store (same as the
    // header heart) so the two stay in sync and Save flips to Remove.
    libraryType: "album" as const,
    libraryId: ALBUM.id,
    libraryName: ALBUM.title,
    onGoToArtist: () => openArtist(slugify(ALBUM.artist)),
  }
  // No `coverSrc` — album covers are framed squares on the light page,
  // so the floating back / "…" sit over the light bg and stay dark.
  // (Luminance adaptation is only for the artist's full-bleed hero.)
  usePublishDetailHeader({ title: ALBUM.title, menu: albumMenu })

  return (
    <div ref={rootRef} className="@container relative w-full px-page pt-6 pb-24 max-w-[1480px] min-[1920px]:max-w-[1716px] mx-auto flex flex-col gap-10">
      {/* Back lives in the top bar (chrome), not the page gutter —
           see the shell's <Topbar onBack=…>. */}

      {/* "…" — opens a bottom sheet with the actions the MediaHeader's icon
           cluster carries. Stacked layout only (<560), and only off-phone;
           below 768 the slim detail header's "…" owns it. */}
      {!footerNav && (
        <DetailMoreButton
          {...albumMenu}
          className="absolute top-6 right-1 @min-[560px]:hidden"
        />
      )}

      {/* Header (300px tall) — the new component. When the user has
           already purchased this album the buy CTA is dropped (no
           dead disabled button) and the inline "Purchased" badge in
           the meta line carries the status instead. */}
      <MediaHeader
        variant="album"
        cover={ALBUM.cover}
        title={ALBUM.title}
        owner={ALBUM.artist}
        ownerAvatar={ALBUM.artistAvatar}
        format={ALBUM.format}
        year={ALBUM.year}
        onOwnerClick={() => openArtist(slugify(ALBUM.artist))}
        libraryType="album"
        libraryId={ALBUM.id}
        libraryName={ALBUM.title}
        playing={isThisAlbumPlaying}
        shuffleActive={player.shuffle}
        onPlay={() => {
          // If this album is already the active source, the header Play
          // button is a pause/resume toggle; otherwise start track 1.
          if (player.playingFrom === ALBUM.title && player.track) { player.toggle(); return }
          const t = ALBUM.tracks[0]; if (t) tryPlayTrack({ id: t.id, title: t.title, duration: t.duration })
        }}
        onShuffle={() => {
          // Toggle shuffle mode (synced with the player). Turning it ON
          // also starts playback — "shuffling" implies playing — so the
          // Play button flips to Pause. Resume if this album is loaded but
          // paused; otherwise start from the top.
          const turningOn = !player.shuffle
          player.toggleShuffle()
          if (!turningOn) return
          if (player.playingFrom === ALBUM.title && player.track) {
            if (!player.playing) player.toggle()
          } else {
            const t = ALBUM.tracks[0]; if (t) tryPlayTrack({ id: t.id, title: t.title, duration: t.duration })
          }
        }}
        hasBuyingOption={!isPurchased && !!ALBUM.buyingPrice}
        buyingPrice={ALBUM.buyingPrice}
        onBuy={() => setBuyOpen(true)}
        purchased={isPurchased}
        downloadable={isDownloadable}
        onDownload={() => {
          // Real wiring would trigger the download flow / signed URL
          // request. For the prototype we noop — UI presence is what
          // we're communicating.
        }}
        addDownloadPrice={canUpgradeToDownload ? upgradePriceStr : undefined}
        onAddDownload={() => setUpgradeOpen(true)}
      />

      {/* Mounted alongside the header so it can be opened by the
           "Unlock All Songs" CTA. On purchase the library store is
           mutated (auto-add + mark purchased) so every surface that
           lists this album picks up the badge automatically. */}
      <PurchaseAlbumDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        album={{
          cover:  ALBUM.cover,
          title:  ALBUM.title,
          artist: ALBUM.artist,
          year:   ALBUM.year,
          format: ALBUM.format,
        }}
        streamPrice={ALBUM.buyingPrice ?? ""}
        downloadPrice={ALBUM.downloadPrice}
        onPurchased={(tier) => library.purchase(ALBUM.id, tier)}
        onGoToLibrary={() => {
          setBuyOpen(false)
          // Navigate via the route shell's nav handler isn't wired
          // here, so just bounce through the search param.
          const url = new URL(window.location.href)
          url.searchParams.set("page", "Albums")
          window.history.replaceState(null, "", url.toString())
          window.dispatchEvent(new PopStateEvent("popstate"))
        }}
      />

      {/* Upgrade dialog — pay-the-difference add-download flow. Same
           dialog shell as the regular purchase, but in `upgradeMode`
           the tier picker is hidden and the cart line shows just the
           delta. Success → library.upgradeToDownload, which flips
           every surface (header CTA → "Download MP3", item meta
           remains "Owned"). */}
      <PurchaseAlbumDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        album={{
          cover:  ALBUM.cover,
          title:  ALBUM.title,
          artist: ALBUM.artist,
          year:   ALBUM.year,
          format: ALBUM.format,
        }}
        streamPrice={ALBUM.buyingPrice ?? ""}
        downloadPrice={ALBUM.downloadPrice}
        upgradeMode
        upgradePrice={upgradePriceStr}
        onUpgraded={() => library.upgradeToDownload(ALBUM.id)}
        onGoToLibrary={() => {
          setUpgradeOpen(false)
          const url = new URL(window.location.href)
          url.searchParams.set("page", "Albums")
          window.history.replaceState(null, "", url.toString())
          window.dispatchEvent(new PopStateEvent("popstate"))
        }}
      />

      {/* Subscription gating — fires when an anonymous user trips
           the 3-play cap. The prompt's "See plans" handoff opens the
           checkout dialog; success flips tier="premium" and resets
           play counts so listening resumes cleanly. */}
      <SubscriptionPromptDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        onSubscribe={(amount) => { setSubscribeAmount(amount); setSubscribeOpen(true) }}
      />
      <SubscriptionCheckoutDialog
        open={subscribeOpen}
        onOpenChange={setSubscribeOpen}
        initialAmount={subscribeAmount}
      />

      {/* Track list — SongListItem in trackNumber mode. 8px gap
           matches the Figma's 8px row gap (66 − 58 = 8). */}
      <ul className="flex flex-col gap-2">
        {ALBUM.tracks.map((t, i) => (
          <li key={t.id}>
            {/* Album-detail rows are single-line: just №, title and
                 duration. Artist / album / year are omitted — they're
                 identical for every track and already in the header. */}
            <SongListItem
              trackNumber={i + 1}
              title={t.title}
              duration={t.duration}
              // Album page: no per-track artist/album in the meta line (would
              // just repeat the header), so `album` is NOT passed — credits
              // come via `onInfo` instead. No "Go to album" (you're here);
              // "Go to artist" stays.
              hideGoToAlbum
              onArtistClick={() => openArtist(slugify(ALBUM.artist))}
              onInfo={() => credits.open(slugify(ALBUM.title))}
              playing={isThisAlbumPlaying && player.track?.title === t.title}
              onPlay={() => {
                // Same track again → pause/resume; otherwise load it.
                if (player.playingFrom === ALBUM.title && player.track?.title === t.title) { player.toggle(); return }
                tryPlayTrack({ id: t.id, title: t.title, duration: t.duration })
              }}
            />
          </li>
        ))}
      </ul>

      {/* "More from this artist" rail. Entries that map to a catalog
           album (via title → library id) are clickable through to their
           own detail page; the rest are decorative discography. */}
      <CardRail title={`More from ${ALBUM.artist}`} showAllLabel="All albums">
        {ALBUM.moreFrom.map(a => {
          const meta  = albumMetaFor(a.title)
          const libId = libraryIdForTitle(a.title)
          const key   = slugify(a.title)
          const linkable = hasAlbumDetail(key)
          return (
            <li key={a.title}>
              <AlbumCard
                cover={a.cover}
                title={a.title}
                artist={ALBUM.artist}
                year={meta.year ?? a.year}
                streamPrice={meta.streamPrice}
                downloadPrice={meta.downloadPrice}
                purchased={libId ? library.isPurchased(libId) : false}
                onTitleClick={linkable ? () => openAlbum(key) : undefined}
                onPlay={linkable ? () => openAlbum(key) : undefined}
              />
            </li>
          )
        })}
      </CardRail>

      {/* Playlists that feature this artist */}
      <CardRail title={`Playlists with ${ALBUM.artist}`} showAllLabel="All playlists">
        {PLAYLISTS_WITH_ARTIST.map(p => {
          const key = slugify(p.title)
          const linkable = hasPlaylistDetail(key)
          return (
            <li key={p.id}>
              <PlaylistCard
                title={p.title}
                covers={p.covers}
                songCount={p.songCount}
                owner={p.owner}
                onTitleClick={linkable ? () => openPlaylist(key) : undefined}
                onPlay={linkable ? () => openPlaylist(key) : undefined}
              />
            </li>
          )
        })}
      </CardRail>

      {/* Artists who played on the recording — `showAllLabel={null}`
           because the rail already lists every musician on the album
           (no "more" to show). `CardRail` also hides ◀ ▶ when the
           content fits, so when the row of 4 doesn't overflow there
           are no nav affordances at all. */}
      <CardRail title="Artists on this Album" showAllLabel={null}>
        {ALBUM.artistsOnAlbum.map(a => (
          <li key={a.name}>
            <ArtistCard name={a.name} image={a.image} onClick={() => openArtist(slugify(a.name))} />
          </li>
        ))}
      </CardRail>
    </div>
  )
}
