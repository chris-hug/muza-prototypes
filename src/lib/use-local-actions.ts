"use client"

/*
 * useLocalActions — what a local album's menu, card and page can do, built in
 * one place so the card kebab, the list row, the table row, the album page and
 * the phone sheet all offer the same thing (the menu rule: one menu per kind;
 * local files are their own kind).
 *
 * "Show in Finder" (Explorer on Windows, see SHOW_IN_FOLDER) is a toast in the prototype: it would hand the folder to the
 * operating system, which a browser page cannot do. "Open on muza", "Show
 * credits" and "Go to artist" exist only when the files matched a catalog
 * release.
 */

import { useCallback } from "react"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { useToast } from "@/components/ui/toast"
import { usePlayer } from "@/lib/player"
import { useCredits } from "@/lib/credits-context"
import {
  localSource, localLabel, SHOW_IN_FOLDER, localDetail, localPlayingFrom, useLocalMatch, useLocalState, useLocalAlbums,
  type LocalAlbum, type LocalTrack,
} from "@/lib/local-library"

export function useLocalActions() {
  const { openAlbum, openArtist, openLocalSettings } = useMediaNav()
  // Subscribing re-renders every caller when a source is reconnected,
  // removed or rescanned, or matching is switched off.
  const { matching } = useLocalState()
  const { add: toast } = useToast()
  const player = usePlayer()
  const matchOf = useLocalMatch()
  const credits = useCredits()

  return useCallback((album: LocalAlbum) => {
    const source = localSource(album)
    const match = matchOf(album)
    // No folder to show on a phone or tablet (SHOW_IN_FOLDER is null there),
    // so no handler — and every menu drops a row without one.
    const onShowInFolder = SHOW_IN_FOLDER ? () => toast({
      title: SHOW_IN_FOLDER,
      description: `${source.name} › ${source.path}/${album.folder}`,
    }) : undefined
    const matched = matching && !!album.match
    const onOpenOnMuza = matched ? () => openAlbum(album.match!.key) : undefined
    const onGoToArtist = matched ? () => openArtist(slugify(album.artist)) : undefined
    // Credits only where the files matched a release: they are that
    // release's credits. Tags rarely carry them, and a half list from the
    // tags would read as the whole story.
    const onShowCredits = matched ? () => credits.open(album.match!.key) : undefined
    // A source that is off is reconnected in Settings › Local music, where
    // its state and the reason sit; the library only points there.
    const onReconnect = source.available ? undefined : () => openLocalSettings(source.id)
    const play = (track?: LocalTrack) => {
      if (!source.available) {
        toast({
          title: "Can't play right now",
          description: `${source.name} is not connected.`,
          data: { actionLabel: "Reconnect", onAction: () => openLocalSettings(source.id) },
        })
        return
      }
      const t = track ?? album.tracks[0]
      if (t) player.play({ title: t.title, artist: album.artist, album: album.title, image: album.cover, totalTime: t.duration }, localPlayingFrom(album))
    }
    return {
      source,
      match,
      available: source.available,
      label: localLabel(album),
      detail: localDetail(album),
      open: () => openAlbum(album.id),
      play,
      onShowInFolder,
      onOpenOnMuza,
      onGoToArtist,
      onShowCredits,
      onReconnect,
      /** Spread into DetailMenu / DetailMoreButton / DetailMenuItems. */
      menu: { local: { onShowInFolder, onOpenOnMuza, onShowCredits, onReconnect }, onGoToArtist },
    }
  }, [credits, matching, matchOf, openAlbum, openArtist, openLocalSettings, player, toast])
}

/** "Go to local copy" for a catalog release the listener also has in their
 *  own files: opens the matched local album. Undefined when there is none
 *  (no copy, source removed, local files or matching switched off), so a
 *  menu row built on it disappears on its own. Keyed by the release's title
 *  or page key, which every song menu and album page has to hand. */
export function useLocalCopy(album?: string): (() => void) | undefined {
  const { matching } = useLocalState()
  const albums = useLocalAlbums()
  const { openAlbum } = useMediaNav()
  if (!album || !matching) return undefined
  const key = slugify(album)
  const copy = albums.find(a => a.match && (a.match.key === key || slugify(a.title) === key))
  return copy ? () => openAlbum(copy.id) : undefined
}
