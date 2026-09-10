---
title: Artist Card
source: src/components/ui/artist-card.tsx
related: [album-card, playlist-card, card-rail, responsive]
usage:
  - Library › Artists | /?page=Artists
  - Artist › Similar Artists | /?page=Artist
---

An `ArtistCard` is a round portrait over a centred name — the tile an artist
gets wherever artists are listed as tiles: Library › Artists, the Similar
Artists rail, a search shelf, the people on an album or playlist page. It is
one plain `<button>`: the whole card opens the artist profile, and that is its
only action — no hover cluster, no menu, no long press.

## Anatomy

| Part | Classes | Why |
|---|---|---|
| Card | `<button>` · `group/artist link-underline-group flex flex-col gap-0 text-center w-full min-w-0 rounded-lg focus-ring` | no width of its own; the grid cell or rail `<li>` decides |
| Track | `aspect-square w-full p-[5%]` | the same square an Album Card's cover occupies, so a row of mixed cards keeps its columns; the circle is inset by **5% a side** (a 90% diameter) with padding, not a percentage width, so the `<img>` always fills its box exactly and a portrait-aspect thumbnail never renders as an oval |
| Portrait | `aspect-square w-full rounded-full object-cover transition-[filter] group-hover/artist:brightness-75` | darkens on hover — the same direction as the gradient on Album / Playlist Card (the image gets darker on interaction, never lighter) |
| Placeholder | `rounded-full bg-muted flex items-center justify-center group-hover/artist:bg-accent` around a `LogoMark` at `w-2/5 text-secondary` | the branded fallback, in a circle; see "Missing portrait" |
| Name | `text-xsmall font-normal leading-5 text-foreground truncate`, `link-underline mx-auto` — the CARD carries `link-underline-group`, so hovering anywhere on it wipes the name's underline in from the left; a `group-hover:` variant cannot do this, because it compiles into the name's own `:hover` | the media-tile title type (17px, normal weight); one line, ellipsis |

Figma: file `L9yw4Yaec9YtAXGxP8q4fu` › "Record Cover", Type=Artist —
`20157:4701` default, `20157:4733` hover (visually identical to default: the
Artist variant deliberately has no play / add / more cluster). Natural frame
192 × 216: a 192px image over a 24px single-line name.

| Prop | What it does |
|---|---|
| `name` | required; the label and the `alt` |
| `image` | portrait URL; omitted, empty, or failing to load → the placeholder |
| `onClick` | the one action — hosts pass `openArtist(slugify(name))` |
| `className` | extra classes on the outer button (a width override in a non-grid host) |

## Usage

```tsx
// Library › Artists — `.grid-cards` on the <ul>, one card per <li>.
<div className="@container">
  <ul className="grid-cards">
    {artists.map(a => (
      <li key={a.id}>
        <ArtistCard name={a.name} image={a.image} onClick={() => openArtist(slugify(a.name))} />
      </li>
    ))}
  </ul>
</div>

// A rail cell — the Similar Artists shelf on an artist page.
<CardRail title="Similar Artists">
  <li><ArtistCard name="Alice Coltrane" image={…} onClick={…} /></li>
</CardRail>
```

Used by Library › Artists (`library-artists-view.tsx`) and the library's All
tab, the artist page's Similar Artists rail (`artist-profile-view.tsx`), the
Artists shelf and tab on search (`search-results-view.tsx`), and the people
rails on album and playlist detail pages.

## Sizing

The **column** decides, through the parent: a `.grid-cards` track
(`minmax(143px, 220px)`, see [Responsive](responsive.md#the-column-ladder))
or a [Card Rail](card-rail.md) `<li>`. The card itself is fixed, no steps —
`w-full min-w-0` and nothing that reads its own width. The circle's inset is a
percentage, so it scales with the track: 7px a side at the 143px floor, 11px at
the 220px cap.

## Behaviour

- **Click / tap → `onClick`.** The card does not navigate on its own; every
  host wires `openArtist`. Being a native `<button>`, it is in the tab order,
  activates on Enter and Space, and shows the `ring-ring/50` focus ring.
- **Hover is pointer-only.** `group-hover:` is wrapped in
  `@media (hover: hover)` by Tailwind v4, so the portrait never stays darkened
  after a tap on a touch screen.
- **No long press, no `onMore`, no menu.** An artist has a menu on its detail
  page ([Detail Menu](detail-more-button.md)); the tile offers only the way
  there.

## Missing portrait

The card keeps its own `failed` flag: `onError` on the `<img>` flips it, and
the circle becomes the placeholder — `bg-muted` with the muza mark in
**solid** `text-secondary` (no alpha, so the three overlapping circles read as
one flat shape rather than darkening where they cross). This is the same
language as [`CoverArt`](../../src/components/ui/cover-art.tsx) for albums and
songs, drawn in a circle; the card does not go through `CoverArt` because
`CoverArt` is square. An artist with no portrait therefore reads as
intentional, never as a broken image.

## State and motion

**Hover belongs to the CARD.** It carries `group/artist link-underline-group`; the name carries `link-underline`, so the underline wipes in from the left over 140ms when the pointer is anywhere on the card. A Tailwind `group-hover:` variant cannot do this — it compiles into the name's own `:hover`.

**Keyboard focus is `focus-ring`** — a 2px `outline` at 20% of `--ring`, no offset. One utility for every control in the app, so tabbing through a form looks like one system; pointer clicks show nothing (`outline-none` + `:focus-visible`).

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, not a tinted neutral: a tinted edge picks up the surface under it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius. Here it sits on the circular portrait, where a pale press photo would otherwise bleed into the page.

## Open questions

- home.tsx's former intro said the circle is "inset to ~80% of the track" ·
  source pads `p-[5%]` (artist-card.tsx:61), a 90% diameter. Documented as 90%.
- artist-card.tsx:46–48 says `gap-0` "matches AlbumCard / PlaylistCard so the
  name sits at the same vertical position as their titles" · both of those
  cards use `gap-1` (album-card.md "Spacing"; playlist-card.tsx:123). With the
  5% bottom inset the name sits `5% of the track` below its circle (7–11px)
  where a cover's title sits 4px below the cover — close at the 143px floor,
  7px lower at the 220px cap.
- artist-card.tsx:20–21 lists "Explore / Artists" and "fans also liked" rails
  as hosts · no such surfaces exist in `src/`; the hosts are the six files
  listed above.
