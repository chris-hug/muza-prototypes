"use client"

/*
 * useLocalActions — what an imported album's menu, card and page can do,
 * built in one place so the card kebab, the list row, the table row, the album
 * page and the phone sheet all offer the same thing (the menu rule: one menu
 * per kind; imported music is its own kind).
 *
 * Four things, and only these:
 *  - "Save offline" / "Remove offline copy" — where the files are not on the
 *    device in hand (see onThisDevice). Not "Download": that word belongs to
 *    an owned album's paid "Download files", and the two are different acts.
 *  - "Show in Finder" (Explorer on Windows, see SHOW_IN_FOLDER) — a toast in
 *    the prototype: it would hand the folder to the operating system, which a
 *    browser page cannot do.
 *  - play.
 *  - "Reconnect" when the source is off: to Settings › Imported music, on
 *    that source's row, where its state sits and it is reconnected.
 * No "Open on muza", credits or "Go to artist": imported music is not linked
 * to the catalog (see local-library).
 */

import { useCallback } from "react"
import { useMediaNav } from "@/lib/media-nav"
import { useToast } from "@/components/ui/toast"
import { usePlayer } from "@/lib/player"
import {
  localSource, localLabel, SHOW_IN_FOLDER, localDetail, localPlayingFrom, useLocalState,
  onThisDevice, isPlayable, isSavedOffline, localSources,
  type LocalAlbum, type LocalTrack,
} from "@/lib/local-library"

export function useLocalActions() {
  const { openAlbum, openLocalSettings } = useMediaNav()
  // Subscribing re-renders every caller when a source changes or a copy is
  // saved offline or removed.
  useLocalState()
  const { add: toast } = useToast()
  const player = usePlayer()

  return useCallback((album: LocalAlbum) => {
    const source = localSource(album)
    const playable = isPlayable(album)
    const saved = isSavedOffline(album)
    // No folder to show on a phone or tablet (SHOW_IN_FOLDER is null there),
    // so no handler — and every menu drops a row without one.
    const onShowInFolder = SHOW_IN_FOLDER ? () => toast({
      title: SHOW_IN_FOLDER,
      description: `${source.name} › ${source.path}/${album.folder}`,
    }) : undefined
    // Offered only where the files are elsewhere. Saving needs the source
    // to answer — there is nothing to copy from a machine that is off.
    const offlineable = !onThisDevice(source)
    const onSaveOffline = offlineable && !saved && source.available ? () => {
      localSources.setOffline(album.id, true)
      toast({ title: "Saved offline", description: album.title, type: "success" })
    } : undefined
    const onRemoveOffline = offlineable && saved ? () => {
      localSources.setOffline(album.id, false)
      toast({ title: "Offline copy removed", description: album.title })
    } : undefined
    // A source that is off (and no copy saved) is reconnected in Settings ›
    // Imported music, where its state and the reason sit; the library only
    // points there — from the album page's CTA, the ⋯ and the play toast.
    const onReconnect = source.available || saved ? undefined : () => openLocalSettings(source.id)
    const play = (track?: LocalTrack) => {
      if (!playable) {
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
      available: playable,
      savedOffline: saved,
      label: localLabel(album),
      detail: localDetail(album),
      open: () => openAlbum(album.id),
      play,
      onShowInFolder,
      onSaveOffline,
      onRemoveOffline,
      onReconnect,
      /** Spread into DetailMenu / DetailMoreButton / DetailMenuItems. */
      menu: { local: { onReconnect, onShowInFolder, onSaveOffline, onRemoveOffline } },
    }
  }, [openAlbum, openLocalSettings, player, toast])
}
