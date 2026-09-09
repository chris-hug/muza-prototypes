---
title: ScrollArea
source: src/components/ui/scroll-area.tsx
related: [drawer, menu, command]
usage:
  - nothing — 14 files scroll with plain overflow-y-auto and the platform scrollbar
---

`ScrollArea` is a bounded region with a **drawn** scrollbar in place of the
browser's — a thin `foreground/20` thumb that appears only when the content
overflows, so a sidebar, a dropdown list or a code block does not carry
12–16px of native chrome down its edge. Everything else about scrolling is
still the browser's.

## Anatomy

```tsx
<ScrollArea className="h-[180px] w-[300px] rounded-xl border border-border">
  {children}
</ScrollArea>
```

Six parts over `@base-ui/react/scroll-area`, and the root mounts all of them
(`scroll-area.tsx:24–41`): a call site passes children and a size.

| Part | Own classes | Why |
|---|---|---|
| Root | `relative overflow-hidden` | the box; the scrollbars are positioned inside it |
| Viewport | `h-full w-full focus-visible:outline-none` | the element that actually scrolls; base-ui hides its native bar |
| Content | — | wraps children so the viewport can measure them |
| Scrollbar ×2 | `flex touch-none select-none transition-opacity p-0.5`; vertical `h-full w-2.5 border-l border-l-transparent`, horizontal `h-2.5 flex-col border-t border-t-transparent` | a 10px gutter with 2px padding, so the 6px thumb never touches the edge |
| Thumb | `relative flex-1 rounded-full bg-foreground/20 hover:bg-foreground/40` | a quiet pill; darkens under the pointer |
| Corner | `bg-transparent` | where two bars would meet |

`ScrollAreaScrollbar` is exported, but the root already renders both
orientations — a call site never adds one.

## Usage

```tsx
<ScrollArea className="h-full">
  <nav>…</nav>
</ScrollArea>
```

The **bound is the call site's job**: `h-…` or `max-h-…` on the root for
vertical scrolling, `w-…` for horizontal. Without one the root grows to its
content and there is nothing to scroll. Padding goes on the children, not
the root — the root is `overflow-hidden`, and padding on it would clip the
last row rather than space it.

Nothing in the app renders a `ScrollArea` today; the sidebar, the dialogs'
lists (`dialogListClass`) and the menus scroll natively.

## Sizing

Fixed, no steps. It is exactly as big as its `className` says.

## Behaviour

- A scrollbar is **unmounted** when its axis does not overflow
  (`keepMounted` is base-ui's default `false`), so a short list shows no
  bar at all.
- `touch-none` on the bar: a finger on the thumb drags the thumb; the
  viewport itself still pans normally.
- The viewport is focusable and scrolls with the keyboard as a native
  element does.

## Open questions

- `scroll-area.tsx:8–10` and the old page ("Scrollbars only show on
  hover/scroll") say the bar appears on hover · nothing implements that.
  base-ui exposes `data-hovering` / `data-scrolling` on the scrollbar for
  exactly this and leaves the styling to the consumer; the wrapper carries
  `transition-opacity` but no `opacity-0` at rest and no rule keyed to
  those attributes (`:52–55`), so the bar is visible whenever the content
  overflows. Either add `opacity-0 data-hovering:opacity-100
  data-scrolling:opacity-100`, or drop the claim.
- No call site in `src` or `app`. The header names sidebars and dropdowns
  as its uses; both scroll natively today.
