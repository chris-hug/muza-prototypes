"use client"

/*
 * Search panel — what the focused search field drops down, here with a
 * query typed ("col"), so it lists suggestions. With an empty query it
 * lists the recent searches instead, and renders nothing when there are
 * none, which is why this frame does not show that state: recents are the
 * viewer's own, read from localStorage.
 *
 * This file is a CALL SITE, not a copy: it renders the real `SearchPanel`,
 * which sources its rows from `search-catalog` itself. The host positions
 * it — the desktop Topbar anchors it under the field at the field's width,
 * which is what the 320px box stands in for. `onPick` would submit the
 * query in the app.
 */

import { SearchPanel } from "@/components/ui/search-panel"

export default function SearchPanelExample() {
  return (
    <div className="w-[320px]">
      <SearchPanel query="col" onPick={() => {}} />
    </div>
  )
}
