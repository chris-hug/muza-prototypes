"use client"

/*
 * PlaylistDetailView — full-page playlist surface. Composes the
 * shared `MediaHeader` (`variant="playlist"`) + a list of
 * `SongListItem`s in `cover` mode (every track is from a different
 * album, so the per-row cover thumb earns its space here, unlike
 * `AlbumDetailView` which uses the `trackNumber` mode).
 *
 * No buying option (playlists aren't purchased — they're collections
 * of tracks owned individually). No `format` field. Owner is the
 * user who curated the playlist.
 *
 * The playlist shown is driven by the `?playlist=<key>` query param,
 * looked up in `playlist-catalog` (one rich playlist + synthesized
 * detail for every library playlist). Cards thread their title slug
 * into the param so the same component renders any playlist.
 */

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { AddMusicIcon } from "@/components/ui/media-icons"
import { AddMusicDialog } from "@/components/app/add-music-dialog"
import { usePlaylistEditor } from "@/lib/playlist-editor-context"
import { DetailMoreButton } from "@/components/ui/detail-more-button"
import { usePublishDetailHeader } from "@/lib/detail-actions"
import { useFooterNav } from "@/lib/use-media-query"

import { MediaHeader } from "@/components/ui/media-header"
import { SongListItem } from "@/components/ui/song-list-item"
import { PlaylistCard } from "@/components/ui/playlist-card"
import { AlbumCard } from "@/components/ui/album-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { CardRail } from "@/components/app/card-rail"
import { hasAlbumDetail } from "@/lib/album-catalog"
import { getPlaylistDetail, hasPlaylistDetail } from "@/lib/playlist-catalog"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { usePlayer } from "@/lib/player"

export function PlaylistDetailView() {
  const [params] = useSearchParams()
  const { openAlbum, openPlaylist, openArtist } = useMediaNav()
  const PLAYLIST = getPlaylistDetail(params.get("playlist"))
  const footerNav = useFooterNav()
  const player = usePlayer()
  // This playlist is the active player source AND playing.
  const isThisPlaylistPlaying = player.playing && player.playingFrom === PLAYLIST.title

  // Load a playlist track into the global player ("playing from" = the
  // playlist name). Tracks here carry their own cover / artist / album.
  const playFromPlaylist = (t: { title: string; artist: string; album: string; cover: string; duration?: string }) =>
    player.play(
      { title: t.title, artist: t.artist, album: t.album, image: t.cover, totalTime: t.duration },
      PLAYLIST.title,
    )

  // Hopping between playlists keeps the route, so the shell's
  // scroll-to-top (keyed on `page`) doesn't fire — reset it ourselves.
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let el = rootRef.current?.parentElement
    while (el) {
      const oy = getComputedStyle(el).overflowY
      if (oy === "auto" || oy === "scroll") { el.scrollTop = 0; break }
      el = el.parentElement
    }
  }, [PLAYLIST.id])

  // Owner "You" = self-created (Edit/Delete); anything else = saved.
  const owned = PLAYLIST.owner === "You"
  const [addMusicOpen, setAddMusicOpen] = useState(false)
  // Edit (owner-only) opens the docked drawer you can drag tracks into from
  // anywhere in the app.
  const playlistEditor = usePlaylistEditor()
  // The drawer already offers adding tracks (drag-and-drop), so the in-list
  // "Add music" row would be a duplicate affordance while it's editing THIS
  // playlist. Another playlist in the drawer doesn't affect this one.
  const editingThis = playlistEditor.target?.key === slugify(PLAYLIST.title)
  const openEditor = () => playlistEditor.open({
    key:    slugify(PLAYLIST.title),
    title:  PLAYLIST.title,
    covers: PLAYLIST.covers,
  })
  const playlistMenu = {
    kind: "playlist" as const,
    title: PLAYLIST.title,
    subtitle: owned ? "You" : `by ${PLAYLIST.owner}`,
    cover: PLAYLIST.cover ?? PLAYLIST.covers?.[0],
    covers: PLAYLIST.covers,
    meta: `${PLAYLIST.tracks.length} tracks`,
    owned,
    // Save action binds to the global user-library store (same as the
    // header heart) so the two stay in sync and Save flips to Remove.
    libraryType: "playlist" as const,
    libraryId: slugify(PLAYLIST.title),
    libraryName: PLAYLIST.title,
    // Playlists navigate to their OWNER (not an artist); useDetailActions reads
    // `onGoToOwner` for the playlist kind. Only others' playlists have one.
    onGoToOwner: owned ? undefined : () => openArtist(slugify(PLAYLIST.owner)),
    onEdit: owned ? openEditor : undefined,
  }
  // No `coverSrc` — playlist covers are framed on the light page, so the
  // floating back / "…" stay dark (luminance adaptation is artist-only).
  usePublishDetailHeader({ title: PLAYLIST.title, menu: playlistMenu })

  return (
    <div ref={rootRef} className="@container relative w-full px-page pt-6 pb-24 max-w-[1480px] min-[1920px]:max-w-[1716px] mx-auto flex flex-col gap-10">
      {/* Back lives in the top bar (chrome) — see the shell's <Topbar>. */}

      {/* "…" — opens the actions bottom sheet. Stacked layout only (<560),
           and only off-phone; below 768 the slim detail header owns "…". */}
      {!footerNav && (
        <DetailMoreButton
          {...playlistMenu}
          className="absolute top-6 right-1 @min-[560px]:hidden"
        />
      )}

      {/* Header — `playlist` variant: no format, no buying option,
           owner field is the curator user name. */}
      <MediaHeader
        // Your own playlist is already in your library by definition — the
        // `my-playlist` variant swaps the save heart for Edit.
        variant={owned ? "my-playlist" : "playlist"}
        cover={PLAYLIST.cover}
        covers={PLAYLIST.covers}
        title={PLAYLIST.title}
        owner={PLAYLIST.owner}
        ownerAvatar={PLAYLIST.ownerAvatar}
        onOwnerClick={() => openArtist(slugify(PLAYLIST.owner))}
        // Owner-only Edit → opens the docked editor drawer (desktop).
        onEdit={openEditor}
        libraryType="playlist"
        libraryId={slugify(PLAYLIST.title)}
        libraryName={PLAYLIST.title}
        year={PLAYLIST.trackMeta}
        playing={isThisPlaylistPlaying}
        shuffleActive={player.shuffle}
        onPlay={() => {
          if (player.playingFrom === PLAYLIST.title && player.track) { player.toggle(); return }
          const t = PLAYLIST.tracks[0]; if (t) playFromPlaylist(t)
        }}
        onShuffle={() => {
          // Toggle shuffle mode (synced with the player). Turning it ON
          // also starts playback — "shuffling" implies playing — so the
          // Play button flips to Pause. Resume if this playlist is loaded
          // but paused; otherwise start from the top.
          const turningOn = !player.shuffle
          player.toggleShuffle()
          if (!turningOn) return
          if (player.playingFrom === PLAYLIST.title && player.track) {
            if (!player.playing) player.toggle()
          } else {
            const t = PLAYLIST.tracks[0]; if (t) playFromPlaylist(t)
          }
        }}
      />

      {/* Track list — `cover` mode (tracks span many albums, so
           per-row covers earn their space). The album name links
           through to that album's detail page when it resolves. */}
      <ul className="flex flex-col gap-2">
        {/* "Add music" — leads the list for your OWN playlist while the header
             is in its STACKED layout (container < 560, same breakpoint the
             floating "…" uses), so filling it is the first thing in reach.
             Wider layouts have room for the action elsewhere. */}
        {owned && !editingThis && (
          <li className="@min-[560px]:hidden">
            {/* Sits as a normal list row (Figma 5953:182065): a secondary
                 tinted circle carrying the bespoke add-music glyph, then the
                 label — same rhythm as the song rows it leads. */}
            <button
              type="button"
              onClick={() => setAddMusicOpen(true)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted active:bg-muted outline-none focus-visible:bg-muted"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                <AddMusicIcon className="size-4" />
              </span>
              <span className="text-base text-foreground">Add music</span>
            </button>
          </li>
        )}
        {PLAYLIST.tracks.map(t => {
          const albumKey = slugify(t.album)
          return (
            <li key={t.id}>
              <SongListItem
                cover={t.cover}
                title={t.title}
                artist={t.artist}
                album={t.album}
                year={t.year}
                duration={t.duration}
                playing={isThisPlaylistPlaying && player.track?.title === t.title}
                onPlay={() => {
                  if (player.playingFrom === PLAYLIST.title && player.track?.title === t.title) { player.toggle(); return }
                  playFromPlaylist(t)
                }}
                onArtistClick={() => openArtist(slugify(t.artist))}
                onAlbumClick={hasAlbumDetail(albumKey) ? () => openAlbum(albumKey) : undefined}
                // Own playlist → hide "Add to playlist" (it's already here).
                hideAddToPlaylist={owned}
              />
            </li>
          )
        })}
      </ul>

      {/* Featured Albums — the distinct source albums the playlist's
           tracks are drawn from. (Better name than "Albums in this
           playlist": parallels "Featured Artists".) */}
      <CardRail title="Featured Albums" showAllLabel={null}>
        {PLAYLIST.featuredAlbums.map(a => {
          const key = slugify(a.title)
          const linkable = hasAlbumDetail(key)
          return (
            <li key={a.title}>
              <AlbumCard
                cover={a.cover}
                title={a.title}
                artist={a.artist}
                year={a.year}
                onTitleClick={linkable ? () => openAlbum(key) : undefined}
                onPlay={linkable ? () => openAlbum(key) : undefined}
                onArtistClick={() => openArtist(slugify(a.artist))}
              />
            </li>
          )
        })}
      </CardRail>

      <CardRail title="Featured Artists" showAllLabel="All artists">
        {PLAYLIST.featuredArtists.map(a => (
          <li key={a.name}>
            <ArtistCard name={a.name} image={a.image} onClick={() => openArtist(slugify(a.name))} />
          </li>
        ))}
      </CardRail>

      <CardRail title="Similar Playlists" showAllLabel="All playlists">
        {PLAYLIST.similarPlaylists.map(p => {
          const key = slugify(p.title)
          const linkable = hasPlaylistDetail(key)
          return (
            <li key={p.title}>
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

      <CardRail title={`More from ${PLAYLIST.owner}`} showAllLabel="All playlists">
        {PLAYLIST.moreFrom.map(p => {
          const key = slugify(p.title)
          const linkable = hasPlaylistDetail(key)
          return (
            <li key={p.title}>
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

      <AddMusicDialog
        open={addMusicOpen}
        onOpenChange={setAddMusicOpen}
        playlistName={PLAYLIST.title}
      />
    </div>
  )
}
