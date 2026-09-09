---
title: Skeleton
source: src/components/ui/skeleton.tsx
related: [album-card, song-list-item, spinner]
usage:
  - nothing yet — the prototype has no loading states to fill
---

`Skeleton` is a pulsing `bg-muted` block that holds a component's place while its data is still on the way — a title line, a cover, an avatar — so the layout it stands in for does not jump when the real thing arrives.

## Anatomy

One `<div>`: `animate-pulse rounded-md bg-muted`, and nothing else. `muted` is the token for a barely-visible structural fill (the slider track wears it too — `DESIGN_SYSTEM.md`, token rules), so a skeleton reads as *space reserved*, never as content. Everything else is the caller's:

| Shape | Classes on the `Skeleton` | Stands in for |
|---|---|---|
| Text line | a height and a width — `h-3.5 w-2/5`, `h-3 w-24` | title, artist, meta |
| Pill action | `h-9 w-28 rounded-full` | a `Button` |
| Avatar | `size-12 rounded-full` | an artist avatar |
| Cover | `size-44 rounded-xs` | an album cover — the image-container radius is 2px, so the placeholder takes it too |

The default `rounded-md` corner is for text lines. A placeholder for something with its own radius — a pill, a circle, a cover — overrides it, so the outline matches the thing it is holding for.

## Usage

```tsx
<div className="flex flex-col gap-2.5">
  <Skeleton className="size-44 rounded-xs" />   {/* cover */}
  <Skeleton className="h-3.5 w-36" />            {/* title */}
  <Skeleton className="h-3 w-24" />              {/* artist */}
</div>
```

Size it from the component it replaces, read off that component's own classes — a `SongListItem` cover is `size-12`, an `AlbumCard` cover is `aspect-square w-full` — so nothing shifts on swap. An action in flight gets a `Spinner`, not a skeleton: a skeleton is a promise about a *shape*.

## Sizing

Fixed, no steps. A skeleton has no width of its own; it takes what the caller gives it and reflows only as that container does — a `w-full` cover placeholder inside a card grid follows the grid's column ladder, a `w-64` text block does not.

## Behaviour

None. It is non-interactive and says nothing to assistive tech. The pulse is Tailwind's `animate-pulse`; nothing in `app.css` gates it on `prefers-reduced-motion`.

## Open questions

- `album-card-skeleton.tsx` and `playlist-card-skeleton.tsx` hand-roll their bars as `bg-muted animate-pulse rounded-xs` instead of rendering `Skeleton`, so a text line is `rounded-xs` (2px) there and `rounded-md` here — two radii for one placeholder.
- Neither card skeleton is rendered anywhere (`grep AlbumCardSkeleton src app` finds only the definition), and `Skeleton` itself renders only on the design-system page: the prototype has no loading state that uses any of the three.
