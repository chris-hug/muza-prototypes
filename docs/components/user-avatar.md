---
title: User Avatar
source: src/components/ui/user-avatar.tsx
related: [avatar, mobile-header]
usage:
  - Topbar profile menu trigger | /?page=Home
  - Settings → Account hero | /?page=Settings
---

`UserAvatar` is the signed-in user's placeholder portrait: a disc whose
colour and initials both come from the username, so the same person lands
on the same swatch in the topbar, the mobile header and the Settings hero,
every session, with no image to load. A portrait that *is* an image is the
plain [Avatar](avatar.md).

## Anatomy

One `<div>` (`user-avatar.tsx:37–46`):

```tsx
"size-10 rounded-full flex items-center justify-center font-medium leading-none select-none text-small"
```

with `backgroundColor` and `color` set inline from the palette. That is
the whole component — no image, no fallback state, no base-ui.

| Prop | Does |
|---|---|
| `username` | seeds **both** the initials and the colour hash |
| `initials` | overrides the derived letters (an emoji, a curated short label) |
| `label` | the `aria-label`; defaults to `username` |
| `className` | the size and the type step — see Sizing |

### Initials

`initialsFromUsername` (`src/lib/avatar.ts`) takes the first alphanumeric
character of each `-` / `_` / whitespace-separated segment, at most two,
uppercased: `Chris-123` → `C1`, `naomi-smith` → `NS`, `jordan` → `J`. Digits
count, so a handle with a number in it shows the number — deliberate, it is
what distinguishes `alex_99` from `alex`.

### Colour

`pickAvatarColor` hashes the string (a 31-multiplier rolling hash) into
`AVATAR_PALETTE`: **15** bg/fg pairs — Sage, Sand, Sky, Clay, Mauve, Moss,
Taupe, Blush, Rose, Lilac, Honey, Ochre, Mint, Coral, Sea — soft, earthy
tints chosen to sit with Muza's warm-olive `secondary`. Each pair is tuned
for at least 4.5:1 on the initials. They are literal values in `avatar.ts`,
not theme tokens, and do not change with dark mode: the disc is the same
colour on both themes, which is what makes it recognisable as "me" across
them.

## Usage

```tsx
// Topbar — topbar.tsx:220: the profile menu's trigger
<DropdownMenuTrigger aria-label="Open profile menu" className="rounded-full …">
  <UserAvatar username={CURRENT_USERNAME} className={avatarClassName} />
</DropdownMenuTrigger>

// Settings › Account hero — settings-view.tsx:275
<UserAvatar username={CURRENT_USERNAME} className="size-16 sm:size-20 text-large sm:text-xlarge" />
```

The mobile header renders the same `ProfileMenu` at `size-9`
(`mobile-app-header.tsx:46`). The Settings hero overlays a `size-7`
"edit" button on its bottom-right corner; that button is the hero's, not
the avatar's.

## Sizing

Fixed, no steps of its own. The diameter is `className`, and the **type
step must come with it** — the component sets `text-small` for its 40px
default and nothing scales automatically:

```text
size-7   28px  text-2xsmall
size-9   36px  (default text-small)
size-10  40px  text-small         ← default
size-16  64px  text-large
size-20  80px  text-xlarge
```

The Settings hero steps 64 → 80 at `sm:` — an in-page reflow of content,
which is what `sm:` is for ([responsive.md](responsive.md) › Tailwind's
screens); it presents nothing differently.

## Behaviour

None. It is not a button and not an image; the topbar makes it a trigger by
wrapping it. `select-none` keeps a long-press on the phone from selecting
the initials.

## The edge

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, not a tinted neutral: a tinted edge picks up the surface under it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius.

## Open questions

- `avatar.ts:4` says "10 soft, earthy tones" · the array holds **15**
  (`avatar.ts:14–28`). The old page demo printed the real count from
  `AVATAR_PALETTE.length`; the comment did not keep up.
- `aria-label` on a plain `<div>` with no `role` (`user-avatar.tsx:38`) —
  most screen readers skip a name on a generic element, so the initials are
  read as text ("NS") and the username is not. `role="img"` would make the
  label carry; in the topbar the wrapping trigger's own label covers it, in
  the Settings hero nothing does.
- The palette is ≥ 4.5:1 by the lib's comment; nothing checks it. A test
  over the 15 pairs is cheap.
- `UserAvatar` takes no `size` prop while `Avatar` has one with three steps.
  Two avatars, two size APIs — see [Avatar › Open questions](avatar.md).
