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

Icons are `size-4 shrink-0 self-start mt-[3px]`: pinned to the top of the row
and nudged down so the glyph sits on the title's x-height centre instead of
floating between title and description when the description wraps. The action
and close buttons carry the same `self-start mt-[3px]` so all three columns
share one baseline.

## Where it sits

```tsx
// ToastViewport
"fixed z-[100] flex flex-col gap-2 outline-none"
// phone → a bar along the bottom
"inset-x-3 bottom-[calc(112px+env(safe-area-inset-bottom)+var(--kb,0px))] w-auto"
// sm and up → the top-right card
"md:inset-x-auto md:right-4 md:top-4 md:bottom-auto md:w-[380px] md:max-w-[calc(100vw-2rem)]"
```

**Phone — a bottom bar.** Every major player puts its confirmations at the
bottom: thumb-side, and out of the content's way. The bar spans the width with
a 12px inset (`inset-x-3`) and is lifted by three things at once:

```text
footer tab bar        pt-2 (8px) + h-12 (48px)   =  56px
mini player bar       h-[56px]                    =  56px
                                                    112px
+ env(safe-area-inset-bottom)   the iOS home indicator
+ var(--kb, 0px)                the on-screen keyboard, when open
```

The 112px is the player shell (and, between 608 and 767 — bottom bar still, tab bar gone — it also clears the desktop player bar's `bottom-5` + 80px = 100px) — the footer nav and the mini player that rests
flush on top of it (`app-player.tsx` pins the mini bar at
`bottom-[calc(56px+max(10px,env(safe-area-inset-bottom)))]`). The safe-area
term keeps the bar above the home indicator.

**A known, accepted 10px overlap.** The footer pads its bottom with
`max(10px, env(safe-area-inset-bottom))` and the mini bar sits on that, so the
shell's top edge is really `112px + max(10px, inset)`, while the toast lifts
by `112px + inset`. On a notched phone (inset ≥ 10px) the two are flush. On a
phone with no home indicator (inset 0) the toast's bottom edge overlaps the
mini bar by 10px. That is accepted and not treated as a defect: a toast
clears itself in 2.5–5s, so the overlap is momentary and on a shrinking set
of devices, and it is not worth a second `max()` in the lift. `--kb` matters because iOS does
not shrink the layout viewport when the keyboard opens — a `fixed; bottom: 0`
element sits *behind* the keyboard — so anything anchored to the bottom adds
the keyboard height. `--kb` is published by
[`useKeyboardInset`](src/lib/use-keyboard-inset.ts) and stays 0 on Chrome and
Android, where `interactive-widget=resizes-content` in the viewport meta
resizes the layout viewport natively.

**Desktop — top-right.** From `md` (768) the horizontal inset is released
(`md:inset-x-auto`), the bar becomes a `380px` card at `right-4 top-4`, and
`md:bottom-auto` cancels the phone anchor. `md:max-w-[calc(100vw-2rem)]` keeps
the card inside a narrow desktop window with the same 16px margin on each side.

**`viewport-fit=cover` is mandatory** in the viewport meta (`app/root.tsx`).
Without it `env(safe-area-inset-*)` resolves to **0** everywhere, so the toast's
lift — and every other safe-area pad in the app: mobile header, footer nav,
player shell, dialog footers — is silently a no-op on notched phones. Nothing
errors; the bar just sits under the home indicator.

## Sizing

Reads the **window**, one step: **768** (`md:`), the presentation gate —
the same gate `useIsMobile()` reads. Below it the viewport is a bar the
width of the window minus `inset-x-3`; from 768 it is a fixed **380px** card.
No column or box step: a toast is chrome, and where it sits is decided by the
window alone. `ToastPreview` is `w-[380px] max-w-full`, so in a narrow frame
it fills the column, in a wide one it is the desktop card.

## Shape — compact on phones, a card on desktop

```tsx
// toastShellClass
"relative flex w-full items-start gap-2.5"
"rounded-xl border border-border bg-popover px-3 py-3 md:px-4 md:pt-4 md:pb-[18px] shadow-lg"
"text-popover-foreground transition-[transform,opacity] duration-200"
```

| | Phone | `md` (768) and up |
|---|---|---|
| Padding | `px-3 py-3` (12px) | `px-4 pt-4 pb-[18px]` (16 / 16 / 18px) |
| Width | full width minus `inset-x-3` | `380px` |
| Close button | hidden | shown |

A confirmation is a glance, not a panel. Two stacked lines with the desktop
padding took a visible slice of a small screen, so phones get the slimmer bar;
desktop keeps the roomier card because there it sits beside the content rather
than over it.

Title and description are both `text-small leading-5`; the title adds
`font-medium`, the description `text-muted-foreground`. The text column is
`flex-1 min-w-0` so a long title truncates or wraps inside the bar instead of
pushing the action button out of it.

## Behaviour

### Dismissal

- **Auto-dismiss.** `ToastProvider` defaults `timeout` to 5000ms. Every toast
  clears itself; nothing depends on the user closing it.
- **Swipe.** Base UI's `ToastRoot` defaults `swipeDirection` to
  `['down', 'right']`, so a toast can be flicked away on touch without
  `toast.tsx` configuring anything.
- **Close button — desktop only** (`hidden md:flex`). On a phone the toast
  auto-dismisses and can be swiped, and a dismiss target would compete for
  width with the message itself on a bar that is already only
  `100vw - 24px` wide. Platform snackbars do not carry one either.

## Duration — `TOAST_CONFIRM_MS`

```tsx
export const TOAST_CONFIRM_MS = 2500

add({ title: "3 songs added", type: "success", timeout: TOAST_CONFIRM_MS })
```

Two durations, chosen by what the toast has to do:

| Duration | For | Why |
|---|---|---|
| `TOAST_CONFIRM_MS` (2.5s) | plain confirmations — "added", "created", "saved" | the user already saw the result; the toast only has to register. Platform snackbars sit around 2–3s. |
| default (5s) | messages carrying an **action** (Undo) or a consequence worth reading | 2.5s is too short to read a line *and* reach a button. |

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
