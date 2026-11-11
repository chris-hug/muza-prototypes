/*
 * shop-listings — products published from the Studio listing editor, so the
 * buyer side can show them: first on the artist's Shop tab and Products rail,
 * then on the product page with every image the seller uploaded.
 *
 * In memory on purpose. The uploaded images are `blob:` URLs, which belong
 * to this tab and die on reload; storing them would hand the next visit a
 * product whose pictures do not load. A reload clears what was published,
 * which is the honest version of what a prototype can keep.
 */

import { useSyncExternalStore } from "react"

import type { ShopProduct } from "@/lib/shop-product"

/** A published listing is a buyer-side product; `artist` names the artist
 *  page it is listed on. */
export type PublishedListing = ShopProduct

let listings: PublishedListing[] = []
const listeners = new Set<() => void>()

/** Adds the listing, or replaces the one with the same id (Save Changes). */
export function publishListing(l: PublishedListing) {
  listings = [l, ...listings.filter(x => x.id !== l.id)]
  listeners.forEach(fn => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export function usePublishedListings(): PublishedListing[] {
  return useSyncExternalStore(subscribe, () => listings, () => listings)
}
