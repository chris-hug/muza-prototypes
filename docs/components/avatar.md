---
title: Avatar
source: src/components/ui/avatar.tsx
related: [user-avatar, artist-card, badge]
usage:
  - Mobile header — account | /?page=Home
  - Purchases — buyer row | /?page=Purchases
  - Shop settings — store owner | /?page=Shop
---

`Avatar` is the round portrait with an initials fallback — a seller on an
order, a shop logo, a person in a credits row — with an optional badge in
its corner and a stacked group form for "and three others". The current
user's own avatar is a different component, [User Avatar](user-avatar.md),
which derives its colour and initials from the username instead of loading
an image.

## Anatomy

```tsx
<Avatar size="lg">
  <AvatarImage src={seller.avatarUrl} alt={seller.name} />
  <AvatarFallback>JC</AvatarFallback>
  <AvatarBadge><Check /></AvatarBadge>
</Avatar>
```

Six parts over `@base-ui/react/avatar` (`AvatarBadge`, `AvatarGroup` and
`AvatarGroupCount` are plain elements):

| Part | Own classes | Why |
|---|---|---|
| `Avatar` | `group/avatar relative flex size-8 shrink-0 rounded-full select-none` + an `after:` ring | the root is the 32px disc; `shrink-0` so a flex row never squashes it into an ellipse |
| the `after:` ring | `after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten` | a hairline drawn **over** the image, blended so it darkens a light photo edge in light mode and lightens it in dark — an image with a white background still has an edge |
| `AvatarImage` | `aspect-square size-full rounded-full object-cover` | fills the disc, cropped centre |
| `AvatarFallback` | `flex size-full items-center justify-center rounded-full bg-muted text-small text-muted-foreground`, `text-xsmall` at `sm` | shown until the image loads, or instead of it. `text-small` (19px) in a 32px disc is two initials with 6px either side |
| `AvatarBadge` | `absolute right-0 bottom-0 z-10 rounded-full bg-primary text-primary-foreground ring-2 ring-background` | a status dot in the corner: 8px at `sm` (glyph hidden), 10px default, 12px at `lg`, the `ring-background` cutting it out of the disc |
| `AvatarGroup` | `flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background` | overlaps its children by 8px and gives each a background-coloured ring so the stack reads as separate coins |
| `AvatarGroupCount` | the fallback's look (`bg-muted text-small text-muted-foreground`) at the group's size, `ring-2 ring-background` | the "+4" coin at the end of a stack |

### Sizes

`size` is a prop on the root, and every part follows it through
`group-data-[size=…]/avatar`:

| `size` | Disc | Fallback type | Badge |
|---|---|---|---|
| `sm` | `size-6` (24px) | `text-xsmall` | 8px, no glyph |
| `default` | `size-8` (32px) | `text-small` | 10px, 8px glyph |
| `lg` | `size-10` (40px) | `text-small` | 12px, 8px glyph |

`AvatarGroupCount` reads the group's size with
`group-has-data-[size=…]/avatar-group`, so a `lg` stack gets a `lg` count
coin without being told.

## Usage

```tsx
// A seller on an order — purchase-detail-view.tsx:427
<Avatar className="size-9 shrink-0">
  <AvatarImage src={shopAvatarUrl(seller.name)} alt={seller.name} />
  <AvatarFallback className="text-2xsmall font-medium">{shopInitials(seller.name)}</AvatarFallback>
</Avatar>
```

Always give `AvatarImage` an `alt` and keep an `AvatarFallback` under it —
the fallback is what shows for the first frames and for a broken URL. For
the signed-in user, use `UserAvatar`; for an artist in a card, `ArtistCard`
has its own portrait.

## Sizing

Fixed, no steps: three named sizes, plus whatever `className` overrides. It
reads nothing about the window.

## Behaviour

`AvatarImage` reports its load state through base-ui; the fallback renders
while `loading` and on `error`, and is replaced when the image arrives.
Nothing is interactive — to make an avatar a trigger, wrap it (the topbar
wraps `UserAvatar` in `DropdownMenuTrigger`).

## The edge

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, not a tinted neutral: a tinted edge picks up the surface under it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius.

## Open questions

- No call site passes `size`. The app's three (`purchase-detail-view.tsx:427`
  `size-9`, `purchases-view.tsx:597` `size-8`, `shop-settings-view.tsx:227`
  `size-16`) and the old page demo (`size-7` / `size-12` / `size-16`) all
  resize with `className`, so the fallback's `sm` type step and the badge's
  three sizes never engage, and the type is re-set by hand each time
  (`text-2xsmall`, `text-base`). Either the prop grows the sizes the app
  actually uses, or it goes.
- The old page demo coloured its "+4" coin `bg-neutral-800 text-neutral-100`
  — primitive palette tokens, not semantic ones — where `AvatarGroupCount`
  already exists for exactly that coin.
- `mobile-app-header.tsx:46` defines a local `const Avatar = () =>
  <ProfileMenu avatarClassName="size-9" />`. Same name, different
  component (it renders `UserAvatar`). Rename to avoid the grep collision.
- The `after:` ring uses `mix-blend-darken` / `lighten` so it never disappears
  against an image edge. On the initials fallback (`bg-muted`) the blended
  hairline is near-invisible in both themes — intended, or should the
  fallback carry a plain `border-border`?
