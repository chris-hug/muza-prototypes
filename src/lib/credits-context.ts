"use client"

/*
 * Credits dialog context — lives in /lib so any component (incl. /ui
 * primitives like the card menus) can call `useCredits()` without
 * importing the /app dialog. The CreditsProvider (in app/credits-dialog)
 * supplies the real `open`; outside a provider it's a no-op.
 */

import { createContext, useContext } from "react"

export interface CreditsContextValue {
  /** Open the credits dialog for an album key (title slug or library id). */
  open: (albumKey: string) => void
}

export const CreditsContext = createContext<CreditsContextValue>({ open: () => {} })

export function useCredits() {
  return useContext(CreditsContext)
}
