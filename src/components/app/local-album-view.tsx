"use client"

/*
 * LocalAlbumView — the page for one of the listener's own albums (a folder of
 * files on this computer or a server, see local-library).
 *
 * The catalog album page, minus what is about a release on muza: no buy, no
 * heart, no Share, no credits, no rails of related releases (the files carry
 * no such data). What it adds is the way back to muza — "Also on muza" /
 * "Owned on muza" in the CTA slot when the files match a release — and the
 * source in the meta line, with the reason when it is not connected.
 */

import { MediaHeader } from "@/components/ui/media-header"
import { DetailMoreButton } from "@/components/ui/detail-more-button"
import { LocalSongRows } from "@/components/app/local-song-rows"
import { usePublishDetailHeader } from "@/lib/detail-actions"
import { useFooterNav } from "@/lib/use-media-query"
import { usePlayer } from "@/lib/player"
import { useLocalActions } from "@/lib/use-local-actions"
import { localPlayingFrom, type LocalAlbum } from "@/lib/local-library"

export function LocalAlbumView({ album }: { album: LocalAlbum }) {
  const l = useLocalActions()(album)
  const player = usePlayer()
  const footerNav = useFooterNav()
  const isThis = !!player.track && player.playingFrom === localPlayingFrom(album)

  const menu = {
    kind: "album" as const,
    title: album.title,
    subtitle: album.artist,
    cover: album.cover,
    meta: l.label,
    ...l.menu,
  }
  usePublishDetailHeader({ title: album.title, menu })

  return (
    <div className="@container relative w-full px-page pt-6 pb-24 max-w-[1480px] min-[1920px]:max-w-[1716px] mx-auto flex flex-col gap-10">
      {!footerNav && (
        <DetailMoreButton {...menu} className="absolute top-6 right-1 @min-[560px]:hidden" />
      )}

      <MediaHeader
        variant="album"
        cover={album.cover}
        title={album.title}
        owner={album.artist}
        year={album.year}
        onOwnerClick={l.onGoToArtist}
        playing={isThis && player.playing}
        shuffleActive={player.shuffle}
        onPlay={() => (isThis ? player.toggle() : l.play())}
        onShuffle={() => {
          const turningOn = !player.shuffle
          player.toggleShuffle()
          if (turningOn && !isThis) l.play()
        }}
        local={{
          detail: l.detail,
          unavailable: !l.available,
          match: l.match,
          onOpenOnMuza: l.onOpenOnMuza,
          menu: l.menu,
        }}
      />

      <LocalSongRows albums={[album]} numbered />
    </div>
  )
}
