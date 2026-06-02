"use client"

/*
 * Detail-header bridge — lets a media detail page (Album / Playlist /
 * Artist, rendered deep in the scroll container) publish what the
 * floating mobile chrome should show: the title (for the collapse-on-
 * scroll bar) and, optionally, the overflow "…" menu config.
 *
 * The page calls `usePublishDetailHeader(config)`; the chrome reads
 * `useDetailHeader()`. Null when the current page isn't a detail page.
 */

import * as React from "react"
import type { DetailMoreButtonProps } from "@/components/ui/detail-more-button"

export type DetailMenu = Omit<
  DetailMoreButtonProps,
  "className" | "triggerVariant" | "triggerSize" | "triggerIcon"
>

export interface DetailHeaderConfig {
  /** Shown in the collapse-on-scroll title bar. */
  title: string
  /** Optional "…" overflow menu. Omit for back-only pages (Artist). */
  menu?: DetailMenu
  /** Source of the artwork the floating chrome sits over. The chrome
   *  samples its top strip to flip the back / "…" icons to the legible
   *  mode (dark icons over a light cover, light over a dark one). */
  coverSrc?: string
}

const Ctx = React.createContext<{
  config: DetailHeaderConfig | null
  setConfig: (c: DetailHeaderConfig | null) => void
}>({ config: null, setConfig: () => {} })

export function DetailActionsProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<DetailHeaderConfig | null>(null)
  return <Ctx.Provider value={{ config, setConfig }}>{children}</Ctx.Provider>
}

/** Chrome reads this to render the floating back / "…" / title bar. */
export function useDetailHeader(): DetailHeaderConfig | null {
  return React.useContext(Ctx).config
}

/*
 * Detail pages publish their header config; cleared on unmount.
 *
 * The handler closures (onAdd, …) are rebuilt every render, so we keep
 * the latest config in a ref and publish ONE stable object (getters for
 * display fields, wrapper fns for handlers). The published object's
 * identity never changes, so re-running the effect just re-sets the same
 * reference — React bails out, no setState loop.
 */
export function usePublishDetailHeader(config: DetailHeaderConfig) {
  const { setConfig } = React.useContext(Ctx)
  const ref = React.useRef(config)
  ref.current = config

  const stable = React.useMemo<DetailHeaderConfig>(() => {
    // Forward EVERY DetailMenu field via live getters / wrapper handlers so
    // the chrome-rendered "…" sheet is identical to the in-page one. Missing
    // a field here silently drops it (e.g. a stale whitelist once swallowed
    // `covers`, `meta`, and the library binding — collage + Save broke).
    const menu: DetailMenu = {
      get kind() { return ref.current.menu?.kind },
      get title() { return ref.current.menu?.title ?? ref.current.title },
      get subtitle() { return ref.current.menu?.subtitle },
      get cover() { return ref.current.menu?.cover },
      get covers() { return ref.current.menu?.covers },
      get meta() { return ref.current.menu?.meta },
      get owned() { return ref.current.menu?.owned },
      get inLibrary() { return ref.current.menu?.inLibrary },
      get isPrivate() { return ref.current.menu?.isPrivate },
      get libraryType() { return ref.current.menu?.libraryType },
      get libraryId() { return ref.current.menu?.libraryId },
      get libraryName() { return ref.current.menu?.libraryName },
      get librarySong() { return ref.current.menu?.librarySong },
      onAdd: () => ref.current.menu?.onAdd?.(),
      onAddMusic: () => ref.current.menu?.onAddMusic?.(),
      onEdit: () => ref.current.menu?.onEdit?.(),
      onPlayRadio: () => ref.current.menu?.onPlayRadio?.(),
      onAddToPlaylist: () => ref.current.menu?.onAddToPlaylist?.(),
      onPlayNext: () => ref.current.menu?.onPlayNext?.(),
      onAddToQueue: () => ref.current.menu?.onAddToQueue?.(),
      onMakePrivate: () => ref.current.menu?.onMakePrivate?.(),
      onGoToArtist: () => ref.current.menu?.onGoToArtist?.(),
      onGoToLabel: () => ref.current.menu?.onGoToLabel?.(),
      onArtistInfo: () => ref.current.menu?.onArtistInfo?.(),
      onRemove: () => ref.current.menu?.onRemove?.(),
      onReport: () => ref.current.menu?.onReport?.(),
      onShowInfo: () => ref.current.menu?.onShowInfo?.(),
    }
    return {
      get title() { return ref.current.title },
      get menu() { return ref.current.menu ? menu : undefined },
      get coverSrc() { return ref.current.coverSrc },
    }
  }, [])

  const hasMenu = !!config.menu
  const m = config.menu
  React.useEffect(() => {
    setConfig(stable)
    return () => setConfig(null)
  }, [setConfig, stable, config.title, hasMenu, config.coverSrc, m?.inLibrary, m?.owned, m?.kind, m?.libraryId])
}
