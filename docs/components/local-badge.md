---
title: Imported Badge
source: src/components/ui/local-badge.tsx
related: [purchased-badge, badge, album-card, media-header, media-list-item, song-list-item]
usage:
  - Album card, last line | /?page=Albums
  - Imported album page, own line under the meta | /?page=Album&album=local-song-for-my-father
---

`LocalBadge` is the "Imported" mark: music from the listener's own files
rather than the muza catalog. The same `Badge` as "Owned"
([purchased-badge](purchased-badge.md)) — `variant="secondary"`,
`shape="square-xs"`, the word only. The code says "local"; the listener
sees "Imported" (the `IMPORTED` constant in `local-library`), because the
same files show on the phone, where they are not local at all.

## Anatomy

```tsx
<LocalBadge />                               // Imported
<LocalBadge savedOffline />                  // Imported + offline mark
<LocalBadge unavailable onReconnect={go} />  // broken Imported + "Reconnect"
```

- **Badge** — filled (`bg-accent`). **Broken** when `unavailable` (the source
  is off and no copy is saved): the same badge with a 6px `bg-warning` dot
  before the word, `gap-1`. Picked from nine variants at real size. Glyphs
  lost — a plug, a broken link and an X were too much detail (or the wrong
  meaning) at 18px — and an outlined, muted badge read as disabled rather
  than "needs you". `--warning` (amber) was added for this: `destructive` is
  for delete only.
- **Offline mark** — `OfflineMark` (a `size-3.5` `CircleArrowDown`, exported
  from the same file) after the badge when `savedOffline`. The same mark
  follows "Owned" for downloaded files (`PurchasedBadge offline`).
- **Reconnect** — when `onReconnect` is passed, a "Reconnect" text button
  (`link-underline`, `focus-ring`) follows the badge in place of `detail`.
  "Not connected" said what was wrong and left you there; the link is what to
  do about it. It stops propagation, so on a card it never also opens the
  album.
- **Detail** — plain muted text after the badge, shown only without
  `onReconnect` (e.g. a list row's text meta says "Imported · Not
  connected").

## Sizing

Fixed: the badge is 18px tall and `shrink-0`; the reason text truncates.
Inline — it reads none of the three measures.

## Behaviour

`onReconnect` is the only behaviour: the click opens Settings › Imported
music on that source's row (`useLocalActions`). Everything else is display.
