"use client"

/*
 * RailListView — every item of a CardRail as a plain list, one row each. The
 * same page shape as Artist › Top Songs › Show all: on phones the title and
 * back chevron are the generic mobile header's, on desktop the Topbar carries
 * the back, so the page prints its own title.
 */

import { useSearchParams } from "react-router"

import { SearchRow } from "@/components/app/search-results-view"
import { getRailList } from "@/lib/rail-list"
import { useFooterNav } from "@/lib/use-media-query"

export function RailListView() {
  const footerNav = useFooterNav()
  const [params] = useSearchParams()
  const list = getRailList(params.get("list"))
  return (
    <div className="@container mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] w-full px-page pt-8 pb-12">
      {!footerNav && list && (
        <div className="mb-6">
          <h1 className="text-2xlarge font-medium text-foreground tracking-tight">{list.title}</h1>
          {list.subtitle && <p className="text-small text-muted-foreground">{list.subtitle}</p>}
        </div>
      )}
      {list ? (
        <ul className="flex flex-col gap-2">
          {list.items.map(r => <li key={r.id}><SearchRow r={r} /></li>)}
        </ul>
      ) : (
        <p className="text-small text-muted-foreground">This list is no longer available.</p>
      )}
    </div>
  )
}
