"use client"

/*
 * Search results — the Explore page body for a query, live: the scope
 * toggle and the category tabs filter, the rows navigate, the shelves
 * scroll. "coltrane" yields enough hits of enough kinds to show the All
 * composition: a Top result, a Song Rail, card rails.
 *
 * This file is a CALL SITE, not a copy: it renders the real
 * `SearchResultsView`. The view reads and writes its scope in the URL
 * through `useSearchNav()`, so switching scope here changes the page's
 * `?scope=` as it would on Explore. Set the frame to a phone width to see
 * the pill tabs and the heading give way to the mobile header's field.
 */

import { SearchResultsView } from "@/components/app/search-results-view"

export default function SearchBasicExample() {
  return <SearchResultsView query="coltrane" />
}
