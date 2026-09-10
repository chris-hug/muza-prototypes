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
 * `?scope=` as it would on Explore.
 *
 * Desktop-and-up only, and the frame's chips say so. This view is the
 * BODY half of the search screen: below the chrome gate (608) the query
 * field and the scope switcher move into `MobileAppHeader`, and what is
 * left here is the pill tabs and the results. The mobile pattern is that
 * pair, not this file narrowed — and since the view's own switch is
 * Tailwind's `sm:` (a window media query), a narrower frame could not
 * flip it anyway; it would only crush the desktop layout.
 */

import { SearchResultsView } from "@/components/app/search-results-view"

export default function SearchBasicExample() {
  return <SearchResultsView query="coltrane" />
}
