"use client"

/*
 * Offline — what plays on this device with no connection, and how it got
 * there. The model, in one place (the team page `?page=OfflineModel` draws
 * it as a table):
 *
 *  · Owned, streaming only — never offline. You bought the right to listen
 *    on muza, not files.
 *  · Owned with files — "Download files" puts the files on this device: on a
 *    computer into a folder (Music › muza by default) any player can open;
 *    on a phone into the app's own storage. Downloads are per device: the
 *    MacBook's download does not make the album offline on the phone, which
 *    shows "Owned" without the mark and offers its own "Download files"
 *    (until then it streams from muza, online). Once
 *    the files are bought, every device downloads them again for free —
 *    from muza, which sold them and can always deliver them, never from
 *    another of your devices (a phone as a server is off half the time).
 *    muza delivered those files, so it knows which release they are: they
 *    stay "Owned" with the offline mark, and do NOT show up a second time as
 *    "Imported" — not on the MacBook, not streamed to the phone. No
 *    matching needed.
 *  · Imported — on the device that holds the folder it is offline by being
 *    there. Anywhere else (the phone, or any device for a server's folder)
 *    "Save offline" keeps a copy inside muza; it plays only in muza.
 *
 * Two words because they are two acts: "Download files" gives you files you
 * own and can use anywhere; "Save offline" keeps a copy muza plays.
 *
 * Per device and per session in the prototype: a real app keeps this on the
 * device, which is the point — the phone's downloads are not the Mac's.
 */

import { createContext, createElement, useContext, useSyncExternalStore } from "react"
import { useToast } from "@/components/ui/toast"
import { useUserLibrary } from "@/lib/user-library"
import {
  HANDHELD, isSavedOffline, localSource, onThisDevice, useLocalState, type LocalAlbum,
} from "@/lib/local-library"

// ─── Downloads of owned files, per device ───────────────────────────────────
// Library ids, per device. The app is always "this" device; the concept page
// (`?page=OfflineModel`) wraps a case in <SimulatedDevice device="phone"> to
// show the same album as the phone sees it — downloaded on the MacBook,
// not on the phone. Seeded with one album on this device so the mark shows
// without downloading.
export type Device = "this" | "phone"
const DeviceContext = createContext<Device>("this")
export const SimulatedDevice = ({ device, children }: { device: Device; children: React.ReactNode }) =>
  createElement(DeviceContext.Provider, { value: device }, children)
export const useDevice = () => useContext(DeviceContext)

let downloads: Record<Device, string[]> = { this: ["a09"], phone: [] }
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const deviceDownloads = {
  /** On this device (the app's). */
  has: (libraryId: string, device: Device = "this") => downloads[device].includes(libraryId),
  set(libraryId: string, on: boolean, device: Device = "this") {
    const rest = downloads[device].filter(id => id !== libraryId)
    downloads = { ...downloads, [device]: on ? [...rest, libraryId] : rest }
    listeners.forEach(l => l())
  },
}

/** The downloads of the device in context; re-renders on any change. */
export function useDeviceDownloads(): readonly string[] {
  const device = useDevice()
  const all = useSyncExternalStore(subscribe, () => downloads, () => downloads)
  return all[device]
}

/** Where "Download files" puts them, in the words a toast uses. */
export const DOWNLOAD_PLACE = HANDHELD ? "this device" : "Music › muza"

// ─── Plays offline here ─────────────────────────────────────────────────────

/** An imported album plays offline on this device: its files are here, or a
 *  copy is saved. */
export const importedOffline = (album: LocalAlbum) =>
  onThisDevice(localSource(album)) || isSavedOffline(album)

/** The "Offline" filter: shown only when it would show something, and
 *  something other than "Imported" does. On the computer that holds every
 *  folder, with nothing downloaded, Offline and Imported are the same list —
 *  a second chip for it would be noise. */
export function useOfflineFilterShown(localAlbums: LocalAlbum[]): boolean {
  useLocalState()
  const dl = useDeviceDownloads()
  const importedHere = localAlbums.filter(importedOffline)
  const anything = dl.length > 0 || importedHere.length > 0
  const sameAsImported = dl.length === 0 && importedHere.length === localAlbums.length
  return anything && !sameAsImported
}

// ─── Download files: the act, for every surface that offers it ──────────────

/** "Download files" / "Remove download" for an album bought with files.
 *  Undefined when it does not apply (not bought with files), so a menu row
 *  built on it disappears on its own. Downloading needs no payment here:
 *  the files are bought; this device just fetches its copy from muza. */
export function useDownloadFiles() {
  const device = useDevice()
  useDeviceDownloads()
  const { add: toast } = useToast()
  const library = useUserLibrary()
  return (libraryId: string | undefined, title: string) => {
    if (!libraryId || library.entryFor(libraryId)?.tier !== "download") return undefined
    const downloaded = deviceDownloads.has(libraryId, device)
    return {
      downloaded,
      download: downloaded ? undefined : () => {
        deviceDownloads.set(libraryId, true, device)
        toast({ title: `Downloaded to ${device === "phone" ? "your phone" : DOWNLOAD_PLACE}`, description: `${title} · plays offline on this device`, type: "success" })
      },
      remove: downloaded ? () => {
        deviceDownloads.set(libraryId, false, device)
        toast({ title: "Download removed", description: `${title} · still yours, download it again any time` })
      } : undefined,
    }
  }
}
