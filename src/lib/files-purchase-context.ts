"use client"

/*
 * Buying the lossless files of an album you already own for listening. In
 * /lib, like the create-playlist context, so the shared menu can offer it
 * without importing the /app dialog. Null outside a provider (the design-system
 * page), and the menu then drops the row: no provider, nowhere for it to go.
 */

import { createContext, useContext } from "react"

export interface FilesPurchaseContextValue {
  /** What the files still cost for this album, or undefined if nothing
   *  can be bought (no file tier, or no difference to pay). */
  priceFor: (albumId: string) => string | undefined
  open: (albumId: string) => void
}

export const FilesPurchaseContext = createContext<FilesPurchaseContextValue | null>(null)

export function useFilesPurchase() {
  return useContext(FilesPurchaseContext)
}
