"use client"

/*
 * UserAccountProvider — shared, app-level state for the user's
 * listening tier, play counts, and artist context. Sibling to
 * `UserLibraryProvider`; both live under the app shell.
 *
 *   · `tier` drives access-gating: anonymous users get a hard cap
 *     of 3 plays per track over their lifetime; subscribers stream
 *     freely; everyone still pays separately for "for purchase"
 *     items (those flow through `UserLibraryProvider`).
 *
 *   · `playCounts` tracks how many times each track has been started
 *     by this account, persisted via `record(trackId)`. Used by the
 *     `canListen` helper to decide whether the next play attempt
 *     trips the subscription paywall.
 *
 *   · `uploaded*` sets identify items this account uploaded as an
 *     artist — drives the my-album vs album (and my-playlist vs
 *     playlist) routing decision on click.
 */

import {
  createContext, useCallback, useContext, useMemo, useState,
  type ReactNode,
} from "react"

export type SubscriptionTier =
  | "anonymous"   // signed in but no subscription — 3-play cap
  | "premium"     // active paid subscription
  | "cancelled"   // was premium, downgraded — same as anonymous

/** Hard ceiling on lifetime plays per track for anonymous /
 *  cancelled users. Tunable in one place — both `canListen` and the
 *  "X plays left" affordance read from it. */
export const ANONYMOUS_PLAY_LIMIT = 3

export interface CanListenResult {
  allowed: boolean
  /** Plays remaining BEFORE the next press fires. 0 means the next
   *  press will hit the cap. `Infinity` for subscribers. */
  remaining: number
  /** Reason for `allowed=false`. Lets the caller decide which
   *  upsell to surface. */
  reason?: "anonymous-cap-reached"
}

interface UserAccountContextValue {
  tier: SubscriptionTier
  setTier: (tier: SubscriptionTier) => void

  /** How many times the user has started this track. */
  playsFor: (trackId: string) => number

  /** What would happen if the user pressed play right now? */
  canListen: (trackId: string) => CanListenResult

  /** Mark a play. Increments `playsFor(trackId)`. No-op for
   *  subscribers (their counter doesn't matter; gating skips them
   *  entirely). Returns `true` when the play was actually allowed
   *  (the caller can use this to decide whether to start audio or
   *  open the paywall). */
  recordPlay: (trackId: string) => boolean

  /** Reset play counts — used after subscribing, so the
   *  experience starts clean. */
  resetPlayCounts: () => void

  /** Album / playlist IDs the user uploaded as an artist. Drives
   *  my-album / my-playlist routing + edit affordances. */
  uploadedAlbumIds:    Set<string>
  uploadedPlaylistIds: Set<string>
  isOwnerOfAlbum:    (id: string) => boolean
  isOwnerOfPlaylist: (id: string) => boolean
}

const UserAccountContext = createContext<UserAccountContextValue | null>(null)

interface UserAccountProviderProps {
  /** Optional seed — surfaces that need a specific tier for demo
   *  (e.g. the design-system kitchen sink) can override. */
  initialTier?: SubscriptionTier
  /** Optional seed for play counts. Lets demo surfaces simulate
   *  "2 plays already used" without clicking through. */
  initialPlayCounts?: Record<string, number>
  /** Items this account uploaded — typically pulled from the
   *  artist profile. */
  uploadedAlbumIds?:    ReadonlyArray<string>
  uploadedPlaylistIds?: ReadonlyArray<string>
  children: ReactNode
}

export function UserAccountProvider({
  initialTier        = "anonymous",
  initialPlayCounts  = {},
  uploadedAlbumIds    = [],
  uploadedPlaylistIds = [],
  children,
}: UserAccountProviderProps) {
  const [tier, setTier] = useState<SubscriptionTier>(initialTier)
  const [counts, setCounts] = useState<Record<string, number>>(initialPlayCounts)

  const uploadedAlbumSet    = useMemo(() => new Set(uploadedAlbumIds),    [uploadedAlbumIds])
  const uploadedPlaylistSet = useMemo(() => new Set(uploadedPlaylistIds), [uploadedPlaylistIds])

  const playsFor = useCallback((trackId: string) => counts[trackId] ?? 0, [counts])

  const canListen = useCallback<UserAccountContextValue["canListen"]>((trackId) => {
    if (tier === "premium") return { allowed: true, remaining: Infinity }
    const used = counts[trackId] ?? 0
    const remaining = Math.max(0, ANONYMOUS_PLAY_LIMIT - used)
    if (remaining > 0) return { allowed: true, remaining }
    return { allowed: false, remaining: 0, reason: "anonymous-cap-reached" }
  }, [tier, counts])

  const recordPlay = useCallback<UserAccountContextValue["recordPlay"]>((trackId) => {
    // Subscribers never trip the cap and don't need their counts
    // tracked — short-circuit.
    if (tier === "premium") return true
    const used      = counts[trackId] ?? 0
    if (used >= ANONYMOUS_PLAY_LIMIT) return false
    setCounts(prev => ({ ...prev, [trackId]: (prev[trackId] ?? 0) + 1 }))
    return true
  }, [tier, counts])

  const resetPlayCounts = useCallback(() => setCounts({}), [])

  const value = useMemo<UserAccountContextValue>(() => ({
    tier,
    setTier,
    playsFor,
    canListen,
    recordPlay,
    resetPlayCounts,
    uploadedAlbumIds:    uploadedAlbumSet,
    uploadedPlaylistIds: uploadedPlaylistSet,
    isOwnerOfAlbum:    (id) => uploadedAlbumSet.has(id),
    isOwnerOfPlaylist: (id) => uploadedPlaylistSet.has(id),
  }), [tier, playsFor, canListen, recordPlay, resetPlayCounts, uploadedAlbumSet, uploadedPlaylistSet])

  return (
    <UserAccountContext.Provider value={value}>
      {children}
    </UserAccountContext.Provider>
  )
}

export function useUserAccount(): UserAccountContextValue {
  const v = useContext(UserAccountContext)
  if (!v) throw new Error("useUserAccount must be used inside <UserAccountProvider>")
  return v
}
