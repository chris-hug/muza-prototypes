# ClickUp tickets — cycle 04: library, playlists & menu system (DRAFT for review)

Everything from the current prototype push that Nevo needs, in the same format
as the existing tickets (ref [Toolbar (new)](https://app.clickup.com/t/86c9vgfhx)).
**Nothing is in ClickUp yet.**

## Where things go

List 03 is healthy — 36 of 51 done, both 🔴 urgents closed. So:

- **Part A — edit in place** in `Component wire up 03` (901523705209). These
  tickets exist and are still `to do`; adding a **Changed** block costs
  nothing and keeps one ticket per component.
- **Part B — new list** `Component wire-up 04 — library, playlists & menus`,
  space `90155818066`, folder `hidden`. Everything net-new, plus revisions of
  tickets that are already **closed** (editing a closed ticket is invisible —
  use the `Revision:` prefix, precedent: *Revision: Dialog & Alert Dialog*).

Creation settings: status `to do` · assignee Nevo · Reviewer = Chris ·
name suffix `(new)` / `(updated)` / `Revision:`.

**Not ticketed** — prototype-only, no staging equivalent: Home resize perf,
Experiments page, topbar cart-in-avatar-menu, DS sidebar search, our
content-type badge removal.

## Stack note (corrects an earlier assumption)

muza-lit-library is on **Tailwind v4** (4.1.16 + `@tailwindcss/vite`), same as
the prototype — container queries are native, no plugin and no v3→v4 migration.
The breakpoint drift was a custom `--breakpoint-sm: 600px` plus `useIsMobile`
keyed to 600 instead of 768; both fixed. Live values: `sm` 640 ·
`useIsMobile` <768 (component swaps only) · `useFooterNav` 608 ·
`useSidebarAutoCollapsed` 1069.

## Card Rail — likely root cause of the remaining clipping

`CardRail` is already ported and shared (`app/components/app/card-rail.tsx`),
so "only search was fixed" isn't quite the diagnosis. From Nevo's own notes,
the surfaces that still clip differ in **what wraps the rail**, not in the rail:

- `@container` was added to **Home + Explore** only. Container queries need an
  `@container` ancestor — without one, `@min-[…]` never resolves and cards fall
  back to their min width and clip. Album / Artist / Playlist detail pages need
  the same wrapper.
- `StackPreview` uses `CardRail` **collapsed** but `grid-cards` **expanded**.
- **Track stacks still use the Embla carousel**, not `CardRail`.

Worth stating in the ticket so he checks wrappers and stack modes rather than
re-reading the rail component.

---

# Part A — Changed blocks for existing list-03 tickets

## Detail More Button (new) → [86ca8pme0](https://app.clickup.com/t/86ca8pme0)

**Changed.**
The "…" menu is now **one menu per media kind**, shared by every surface — a
card's "…", a list row's "…" and the detail page's "…" show the same items for
the same object. Only context rows are gated out. Full matrix:

| Row | Album | Playlist (yours) | Playlist (saved) | Artist | Song |
|---|---|---|---|---|---|
| Share (adaptive) | tile | tile | tile | tile | ✓ |
| Save / Remove from library | tile | — | tile | tile | ✓ |
| Credits | tile *(in-list if owned)* | — | — | — | ✓ "Show credits" |
| Edit / Edit info | owned | tile | — | — | — |
| Add music | — | tile | — | — | — |
| Play radio | — | — | — | tile | — |
| Make private / public | — | ✓ | — | — | — |
| Add to a playlist | ✓ | — | — | — | ✓ |
| Play next · Add to queue | if wired | if wired | if wired | if wired | — |
| Go to album / playlist | ✓ | ✓ | ✓ | — | ✓ |
| Go to artist | ✓ | — | — | — | ✓ |
| Go to owner | — | — | ✓ | — | — |
| Go to label | ✓ | — | — | — | — |
| Artist info | — | — | — | ✓ | — |
| Delete playlist | — | ✓ destructive | — | — | — |
| Report | if not owned | — | ✓ | ✓ | ✓ |

**Rules.**
- Context gating is the ONLY per-surface difference: no "Go to album" on the
  album page, no "Go to artist" on the artist page, no "Add to a playlist"
  inside your own playlist.
- **Labels are fixed:** "Save to library" / "Remove from library" — never
  "Add". Short forms "Save" / "Remove" on the mobile sheet tiles only.
- **A row with no handler is dropped**, so no surface ever shows a dead item.
- **A playlist you own is never savable** — it's in your library by
  definition. Owners get Edit / Delete; the header shows Edit, not a heart.
- **Playlists navigate to their OWNER, not an artist** — different action key.
- **Save must bind to the same library key everywhere.** Albums key by catalog
  id, not by title slug; playlists and artists by slug. A card writing to a
  different key than its detail page is why hearts silently desync.
- How you factor this in code is your call — one shared builder is how we did
  it, but the contract is the matrix and the copy, not the implementation.

---

## Song Rail (new) → [86cawyy0f](https://app.clickup.com/t/86cawyy0f)

**Status note.** Per Nevo's comment on the Responsiveness ticket, a shared
`app/components/app/song-rail.tsx` already exists in muza-lit-library and both
Search and Artist › Top Songs feed it. So this is a **verify pass**, not a
build — close it once the checks below pass.

**Changed.**
Same fluid-column model as Card Rail (see that ticket). Rows are stacked 3 per
column; the column ladder is **1 col** default → **2** at ≥692 → **3** at
≥1164, widths derived from the list's own 100% so columns line up with the
card columns at the same page width.

**Rules.**
- Steps on **container** width, not viewport — must re-flow when the sidebar
  collapses.
- Chevrons are a pointer affordance: hidden on touch and below 692, and only
  shown once the rail actually overflows.
- "Show all" is optional — Artist › Top Songs has none.

---

## Paywall (new) ⭐ → [86ca8pmuu](https://app.clickup.com/t/86ca8pmuu)

**Changed.**
Amount picker reworked since the ticket was written:
- **$0 and the $1 minimum are gone.**
- Three pills — **$5 / $10 / $20**, `$10` preselected — plus a full-width
  "choose your own" field.
- Secondary action **"Try a free month"** → free-month checkout mode: no
  charge, no card, `$0 today`.
- One shared amount picker for both modes; the DS page shows paid + free side
  by side.

---

## Sidebar (updated) → [86ca8pmd3](https://app.clickup.com/t/86ca8pmd3)

**Changed.**
The "+" next to **My Playlists** opens the Create Playlist flow — both the
expanded header row and the collapsed rail button. Same entry point the mobile
Library header "+" and the Playlists grid tile use (see *Create Playlist /
Add Music*).

---

# Part B — new tickets (list 04)

## Library views (new) ⭐

> **Resources**
> DS: [Album Card](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#album-card) · [List Table](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#list-table) · [Tabs](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#tabs)
> Source: [`library-albums-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/library-albums-view.tsx) · [`library-artists-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/library-artists-view.tsx) · [`library-playlists-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/library-playlists-view.tsx) · [`library-songs-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/library-songs-view.tsx)

**Used in:** Library › Albums · Artists · Songs · Playlists

**Not to be confused with Search results.** Search is a different surface and
is already done (*Revision: Search — All-tab shelf composition*): there, All is
a hero + shelves and each specific tab is a flat list. **Library does not
follow that** — see the grid rule below.

**Summary.**
The four Library views on staging have no filter, no sort and no search. Per
Nevo's comment on the Responsiveness ticket the shared `grid-cards` column
ladder is already wired for albums / artists / playlists — so the grid itself
may be done; this ticket is about everything layered on top of it.

**Rules**
- **Grid**, not a list, for Albums / Artists / Playlists — the shared column
  ladder `304→2 · 464→3 · 692→4 · 928→5 · 1164→6 · 1500→7`, container-based
  (same map as Card Rail, so a card in a grid and a card in a rail sit on the
  same column track). *Verify this is live before treating it as work.*
- **Status tabs**, not a dropdown — Playlists (All / By you / Saved), Albums
  (All / Owned / Downloaded), Songs (All / Downloaded). **Desktop only**: on
  mobile the strip competes with the content-type nav and reads as clutter.
- **In-library search** — one shared query behind the view, so the desktop
  field and the mobile header field drive the same filter. Clear it when
  leaving Library: a collapsed mobile field must never leave a hidden filter
  applied.
- **Playlist cards carry a byline** — "By you" for your own, "By {name}" for
  saved ones. It's the only way to tell them apart at a glance.
- **Songs / Playlists tables**: an **Added** column with sort, and a **create
  row** leading the list (same pattern as Studio's upload row).

---

## Create Playlist / Add Music (new) ⭐

> **Resources**
> Source: [`create-playlist-dialog.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/create-playlist-dialog.tsx) · [`add-music-dialog.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/add-music-dialog.tsx) · [`create-playlist-context.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/create-playlist-context.ts) · [`nav-row.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/nav-row.tsx) · [`media-icons.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/media-icons.tsx)

**Used in:** sidebar "+" · mobile Library header "+" · Playlists grid tile ·
playlist detail "Add music" row

**Summary.**
Two-step flow — **New Playlist** (cover tile, name, "Keep private" setting
row) chaining into **Add music**. Built entirely from existing DS components;
the whole thing is wire-up-ready in the prototype.

**Use**
```plain
const createPlaylist = useCreatePlaylist()
<Button onClick={createPlaylist.open}>New playlist</Button>
```

**Rules**
- **One flow behind a context** — every entry point calls the same `open()`.
  No per-surface copies.
- **Typing in Add music switches to full global search**, not a local filter:
  content-type **pills**, songs selectable as rows with a trailing checkbox,
  containers as nav rows.
- **You can't add a playlist to a playlist** — only songs are selectable.
- **"Add music" row** leads your own playlist's track list in the stacked
  layout (< 560 container): a normal list row — tinted circle with the
  add-music glyph, then the label. Never a filled button inside a row.
- Dialogs are the standard responsive dialog: bottom sheet on mobile, centred
  modal on desktop, `sm:max-w-[max(32rem,50vw)]`.

---

## Add to a playlist (new)

> Source: [`add-to-playlist-dialog.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/add-to-playlist-dialog.tsx) · [`add-to-playlist-context.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/add-to-playlist-context.ts)

**Summary.**
The picker behind the "Add to a playlist" menu row: your own playlists, a
"New playlist" entry that hands off to the Create flow, and a filter field
once there are more than 6.

**Rules**
- Offered for **songs and albums only** — never for a playlist.
- Hidden when you're already inside the playlist you'd be adding to.
- Same context pattern: `useAddToPlaylist().open(item)`.

---

## Menu system — one menu per media kind (new) ⭐

**Summary.**
The umbrella ticket for the matrix in *Detail More Button*. Every "…" surface
links here. The point isn't a shared component — it's that the same object
offers the same actions, with the same words, wherever you meet it.

**Rules**
- The matrix in *Detail More Button* is the contract.
- Copy is fixed ("Save to library" / "Remove from library", "Add to a
  playlist", "Show credits", "Go to artist" / "Go to owner").
- Any new surface that shows a "…" adopts the matrix — it doesn't invent rows.

---

## Revision: Song List Item / Media List Item

> Existing tickets (both **closed**): [Song List Item (updated)](https://app.clickup.com/t/86ca8pma4) · [Media List Item (new)](https://app.clickup.com/t/86ca8pm9y)

**Summary.**
The row components need a second pass — the current staging rows don't match
the DS and are the base for every list view in this cycle.

**Rules**
- Every song row carries the **song menu** from the matrix, with context
  gating — same rows on album, playlist, search, artist Top Songs and library.
- `MediaListItem` takes a **trailing slot** (used for the selection checkbox
  in Add music), inset 24px from the row edge.
- **No content-type badge in the subtitle row** — the tabs above already name
  the type.
- Rows are **draggable** (needed by the playlist editor, below) — a private
  drag payload type so only in-app rows are accepted as drops.

---

## Revision: Share — one adaptive action

> Existing ticket (**closed**): [Share Button (updated)](https://app.clickup.com/t/86ca8pmeu)

**Summary.**
Share is **one row / one button**, not a two-item menu.

**Rules**
- Where the Web Share API exists → opens the **native OS sheet**, labelled
  "Share…" with the share icon.
- Everywhere else → **copies the link**, labelled "Copy link" with the link
  icon, and toasts.
- Never both. The native sheet already offers copy alongside AirDrop /
  messaging, so a separate Copy-link row is dead weight.
- Same behaviour standalone (header button) and inside a "…" menu.

---

## Revision: Media Header — mobile action row

> Existing ticket (**closed** 17 Jul, before this change landed):
> [Media Header (new)](https://app.clickup.com/t/86ca8pmcg)

**Summary.**
On mobile the header's action row is **Play · Shuffle · Save (heart) · Info**.
Share is **not** in the row — it moved into the "…" menu.

**Rules**
- The trailing two icons are **Save** (heart, fills when saved) and **Info**
  (opens credits). Share lives in the "…" sheet with the rest of the actions.
- **Playlists have no release credits → no Info**, leaving just the heart.
- Owned items swap the heart for **Edit**.
- Applies to the stacked layout only (< 560 container); wider tiers keep the
  horizontal action cluster with "…" pinned right.

**Related.** Your 🟠 "missing media-header ⋯" item is the same surface — worth
fixing together, since the row only makes sense if the "…" is present to hold
what moved out of it.

---

## Studio — Send Feedback (new)

**Summary.**
An outline **"Send Feedback"** button in Studio opening a small dialog:
textarea + Cancel / Send feedback.

**Rules**
- Standard responsive dialog (sheet on mobile, modal on desktop).
- Outline button, not primary — it's a secondary affordance.

---

## Playlist edit drawer (new) — desktop

> Source: [`playlist-edit-drawer.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/playlist-edit-drawer.tsx) · [`playlist-editor-context.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/playlist-editor-context.ts) · [`use-resizable-width.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/use-resizable-width.ts)

**Summary.**
Owner-only **Edit** on a playlist docks a panel on the right that persists
across navigation — browse to Home, search, open any album, and drag tracks
into the playlist still held in the drawer. The desktop counterpart to the
mobile "Add music" sheet.

**Rules**
- **Docked, not an overlay** — it takes width from the content instead of
  covering it, and survives route changes.
- Drag payload uses a **private type** so only in-app rows are droppable.
- **Resizable** from its left edge; width remembered, and re-clamped to the
  current viewport on restore and on resize (a width stored on a wide screen
  must not crush a narrow one).
- **⤢ expands the drawer into the full playlist page** — navigation commits
  while the panel covers the view, so the destination renders at its final
  width (no flash of the old page, no narrow→wide snap).
- The in-list "Add music" row is hidden while the drawer is editing that same
  playlist — both do the same job.

*Lower priority than the rest of Part B — it's the one genuinely new feature
rather than a gap or a fix.*

---

# Suggested order

🔴 **Urgent**
- Card Rail — finish the remaining 4 surfaces *(re-opened)*

🟠 **High**
- Library views ⭐
- Revision: Song List Item / Media List Item
- Menu system + Detail More Button matrix
- Footer Nav · Edit Release Dialog · Credits Dialog · media-header "…" · Paywall *(existing 🟠)*

🟡 **Normal**
- Create Playlist / Add Music · Add to a playlist
- Revision: Share
- Song Rail
- Studio Send Feedback
- Topbar · Sidebar · Search Panel · dialog base · Search data *(existing verify pass)*

⚪ **Low**
- Playlist edit drawer
