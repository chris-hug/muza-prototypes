---
title: Toast
source: src/components/ui/toast.tsx
related: [dialog, player-bar]
usage:
  - Add to playlist — confirmation | /?page=Playlists
  - Playlist editor — saved / undo | /?page=Playlists
  - Purchases — download started | /?page=Purchases
---

A toast is a short, self-dismissing acknowledgement that something the user
just did went through — "Saved to Library", "3 songs added". It registers and
leaves; it never holds a decision. On a phone it is a slim **bar at the bottom**,
on desktop the familiar **top-right card**. Built on `@base-ui/react/toast`.

## Setup and usage

`ToastProvider` wraps the app once and `ToastViewport` sits inside it; from
then on `useToast()` works in any component below the provider. The shell is
`app/root.tsx` — there is no `layout.tsx` in this app — and that is where
both are mounted (`app/root.tsx:44–47`).

```tsx
// Once, in the app shell — app/root.tsx.
<ToastProvider>
  {children}
  <ToastViewport />
</ToastProvider>

// Anywhere inside it.
const { add } = useToast()
add({ title: "Track uploaded!", type: "success" })
```

`useToast()` is Base UI's `useToastManager()` re-exported, so `add` takes the
Base UI toast object: `title`, `description`, `type`, `timeout`, `data`.

Wrong: a toast that asks a question. "Delete this playlist? [Undo]" is a
confirm dressed as a confirmation — that is an [alert dialog](alertdialog.md).
The toast's Undo is for reversing something already done.

## One line on a phone, at the control step

The phone toast is `h-12` and a **pill** — the same box AND the same shape as
the `lg` field it lands on, in the same 12px gutter, so it reads as that
control rather than as a card parked over it. (18px was tried, on the theory
that the rounder shape is the smaller one and would cover the field's corners.
True, and it still looked like a different object.) That is what lets it land ON the control
it is answering (the search field at the foot of a sheet) and cover it
outright: measured, the toast is `[12, 434, 363, 482]` against the field's
`[13, 433, 362, 481]`, a pixel of bleed on every side. It carries `shadow-xl`,
because it is now sitting on top of another control rather than beside it.

Its timer is the toast's own **background running out**: a full-bleed `--muted`
fill, `origin-left`, receding under the text and clipped by the pill. Not a
rule — 3px of detail on a 48px control, and along a pill's curve it clips to a
sliver. Not a translucent wash either, which reads as a disabled toast.
`--muted` is the palette's recessive surface, so it says "time" without
competing with the icon, the one colour a toast is allowed. The text and icon
carry `relative`, since a positioned box paints over static ones and the fill
would otherwise run across the words.

The **description is desktop-only** (`hidden md:block`) and the title
truncates. A confirmation
is a glance, not a panel — on a 375px screen a two-line card with 18px of
padding took a fifth of the screen to say "added", and the title already says
it. Anything that does not fit in one line is not a toast.

## Types

The `type` picks the **icon only**. Every toast shares one neutral shell
(`border-border bg-popover`) regardless of type, so a toast never looks like an
`Alert` — the icon carries the meaning and the surface stays quiet.

| `type` | Icon | Colour |
|---|---|---|
| `default` | `InfoIcon` | `text-muted-foreground` |
| `success` | `CheckCircleIcon` | `text-green-600 dark:text-green-400` |
| `error` | `AlertCircleIcon` | `text-destructive` |
| `warning` | `AlertCircleIcon` | `text-yellow-600 dark:text-yellow-400` |
| `info` | `InfoIcon` | `text-blue-600 dark:text-blue-400` |
| `loading` | inline spinner SVG (`animate-spin`) | `text-muted-foreground` |

Icons are `size-4 shrink-0 self-center md:self-start md:mt-[3px]`: **centred on
a phone**, where the toast is one 48px line and the icon has a single line to
sit against — pinned there it read as crooked. On desktop it is pinned to the
top of the row and nudged down so the glyph sits on the title's x-height centre
instead of floating between title and description when the description wraps. The action
and close buttons carry the same `self-start mt-[3px]` so all three columns
share one baseline.

## Where it sits

```tsx
// ToastViewport
"fixed z-[100] flex flex-col gap-2 outline-none"
// phone → a bar along the TOP
"inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] bottom-auto w-auto"
// sm and up → the top-right card
"md:inset-x-auto md:right-4 md:top-4 md:bottom-auto md:w-[380px] md:max-w-[calc(100vw-2rem)]"
```

**Phone — the TOP of the screen.** `inset-x-3`, 8px under the safe-area inset,
full width, over everything the app draws.

It lived at the bottom for most of its life, thumb-side, where platform
snackbars sit. On a phone the bottom is also where every control a toast is
answering sits: a sheet's search field, its confirming action, the tab bar,
the mini player. Whatever the toast cleared it covered something else, and the
arithmetic for "just above the control" changed with the keyboard, the screen
and the sheet — it was tried as a `max()` of the keyboard and the tab bar, then
as a `--toast-anchor` a sheet published from its own measured field, and each
version was right in one state and wrong in the next. **The top of a phone
holds a title and nothing you press.**

The keyboard never reaches it either, which is the rest of what that cost: no
`--kb` term, no anchor, no measurement. The one thing it does cover is a
sheet's own title bar, for the seconds it lives.

## Behaviour

### Dismissal

- **Auto-dismiss.** `ToastProvider` defaults `timeout` to `TOAST_DEFAULT_MS`
  (5000ms). Every toast clears itself; nothing depends on the user closing it.
- **A timer bar says how long is left** — a 2px rule along the bottom edge in
  `brand-500`, emptying left to right over the toast's own `timeout`
  (`toastTimer`, linear: it is a clock, not a motion). Brand rather than a
  neutral because it is the one moving thing on a surface that is otherwise
  deliberately quiet, and it should read as the product's own clock. Without it every dismissal is a surprise, and
  a reader waits for something that was never going to stay. It pauses with
  the toast on hover (`group/toasts`), matching Base UI's own timer.
- **Swipe.** `swipeDirection={['up', 'right']}` — up on a phone, where the
  toast is at the top edge, right on desktop, where the card is at the right. It is Base UI's default too; naming it keeps the gesture honest if a
  placement moves. The shell is `touch-none` so the page behind cannot take
  the gesture instead.
- **Close button — desktop only** (`hidden md:flex`). On a phone the toast
  auto-dismisses and can be swiped, and a dismiss target would compete for
  width with the message itself on a bar that is already only
  `100vw - 24px` wide. Platform snackbars do not carry one either.

## Duration — `TOAST_CONFIRM_MS`

```tsx
export const TOAST_CONFIRM_MS = 3000

add({ title: "3 songs added", type: "success", timeout: TOAST_CONFIRM_MS })
```

Two durations, chosen by what the toast has to do:

| Duration | For | Why |
|---|---|---|
| `TOAST_CONFIRM_MS` (3s) | plain confirmations — "added", "created", "saved" | the user already saw the result; the toast only has to register, and the timer bar makes the three seconds legible rather than abrupt. |
| `TOAST_DEFAULT_MS` (5s) | messages carrying an **action** (Undo) or a consequence worth reading | 3s is too short to read a line *and* reach a button. |

The constant exists so a confirmation reads and clears at **one known
duration** across the app, instead of each call site inventing its own
timeout. Used by `AddMusicDialog` ("N songs added") and
`CreatePlaylistDialog` ("Playlist created" / "Playlist updated").

## Action button

An optional inline action travels in `toast.data` and renders as a small
outlined button at the right of the bar:

```tsx
add({
  type: "success",
  title: "Saved to Library",
  description: "Blue Afternoon · Song",
  data: { actionLabel: "Undo", onAction: () => library.toggle(type, id, song) },
})
```

It is for **undo affordances on irreversible-feeling actions** — the toast
replaces a confirm dialog by making the action cheap to reverse instead of
expensive to start. Both `actionLabel` and `onAction` must be present or the
button is not rendered. Every library flip routes through
[`useLibraryToggle`](src/lib/use-library-toggle.ts) so the Undo toast is
identical everywhere; `OrderDetailView` uses the same slot for status-change
Undo, and `ShopMyProducts` for an "Open settings" shortcut.

The button is `text-xsmall font-medium`, `border-border`, `hover:bg-accent` —
a secondary control, deliberately quieter than the message it sits next to.
Leave a toast with an action on the 5s default.

## Wording

- Library toasts read **"Saved to Library"** / **"Removed from Library"** —
  the affordance is "Save", never "Add".
- Share: where the Web Share API is missing the row copies the link and
  toasts; where the native sheet exists, no toast — the sheet is the
  feedback.
- The description names the thing: `"Blue Afternoon · Song"`,
  `"Added to “Smoky Ballads”."` A toast that only says "Done" makes the user
  look back at the screen to find out what.

## Static preview

`ToastPreview` renders the same chrome as a live toast as a plain inline
`div` (`w-[380px] max-w-full`), so the design-system page can show every
variant without firing real toasts. It shares `toastShellClass`, the icon map
and `toastActionButtonClass` / `toastCloseButtonClass` with the live viewport,
so a chrome change updates both — no drift between the gallery and the app.

```tsx
<ToastPreview type="error" title="Upload failed"
  description="File format not supported. Please upload an MP3 or WAV file." />
```

## Exported constants

| Export | What it is |
|---|---|
| `ToastProvider` | Base UI provider, `timeout` defaults to 5000ms |
| `ToastViewport` | the positioned stack; renders icon, text, action, close |
| `useToast` | `useToastManager()` — `add`, `close`, `update`, `toasts` |
| `TOAST_CONFIRM_MS` | 2500 — timeout for a plain confirmation |
| `ToastPreview` | inline, portal-free rendering of one toast |
| `toastShellClass` | the shared surface, radius, padding |
| `toastActionButtonClass` / `toastCloseButtonClass` | the two buttons, shared with the preview |

## Focus

**Keyboard focus is `focus-ring`** — a 2px `outline` at 20% of `--ring`, no offset. One utility for every control in the app, so tabbing through a form looks like one system; pointer clicks show nothing (`outline-none` + `:focus-visible`).

## Open questions

- toast.tsx:33 (comment) says the old phone padding was "4px/18px" · the desktop classes that were kept are `px-4 pt-4 pb-[18px]` = 16/16/18px; "4px" is probably the Tailwind step, not pixels. Not migrated as a number.
- "Swipe" dismissal (DESIGN_SYSTEM.md, toast.tsx:49–50) is true only via Base UI's default `swipeDirection = ['down','right']` (`@base-ui/react` 1.3.0) — `toast.tsx` sets nothing (toast.tsx:111–115). A Base UI upgrade that changes the default would silently remove it; consider passing it explicitly.
- `ToastPreview` does not read `useIsMobile()`: its `md:` classes read the real browser, so at a 375 window chip it still shows the desktop padding and the close button while the live toast would be the slim bar with no ✕. `DialogPreview` restates its phone half for the chip (`dialogPreviewPhoneClass`); the toast preview has no equivalent.
- DESIGN_SYSTEM.md › "Toasts — mobile shape" now points here; its one kept rule is the duration split.
