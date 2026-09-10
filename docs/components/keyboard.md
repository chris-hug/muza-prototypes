---
title: Keyboard
status: new
source: src/lib/use-keyboard-inset.ts
related: [dialog, drawer, gesture, responsive, toast]
usage:
  - not a component — how the app knows the on-screen keyboard is there
summary:
  - **iOS shrinks the VISUAL viewport and leaves the LAYOUT viewport alone**, so no media query can see the keyboard and `100vh` keeps reporting the full screen.
  - **`--kb`** is the height of the keyboard plus its accessory bar, published on the root; **`data-kb="open"`** is the flag for what a length cannot express.
  - **Measured: 495px of layout, 169px visible** on an iPhone in Brave. Every sheet decision with a field in it is downstream of that number.
  - **`svh`, never `dvh`** — the dynamic unit reports the height with the browser chrome collapsed.
  - **Android needs none of this**: `interactive-widget=resizes-content` in the viewport meta does it declaratively, so `--kb` stays 0 there.
contract:
  - "[touch] **The keyboard is measured, not guessed.** `--kb` and `data-kb=\"open\"` are published by `useKeyboardInset`; a media query cannot see the squeeze, because the layout viewport does not shrink. Cap sheet heights with `svh` — never `vh` or `dvh` — and scope any `max-h` of your own to `md:`."
---

The on-screen keyboard is invisible to CSS. iOS shrinks the **visual**
viewport — the part you can see — and leaves the **layout** viewport, which is
what `position: fixed`, `100vh` and every media query are measured against,
exactly as it was. So a `max-height` query cannot see the squeeze, a sheet
anchored to `bottom: 0` is anchored to the bottom of a screen the keyboard is
now covering, and nothing in the cascade knows.

`useKeyboardInset` measures it and publishes two things on the root:

- **`--kb`** — the height of the keyboard *plus its accessory bar*, in pixels;
  `0px` when there is none.
- **`data-kb="open"`** — a flag, for the decisions that are not a length: which
  bands give up their padding, which second line of an empty state goes.

## The number

Measured on an iPhone in Brave, which is the machine this was built against:

| | |
|---|---|
| Layout viewport | **495px** |
| Visible above the keyboard | **169px** |
| Taken by keyboard + accessory bar | **326px** |

169px is the budget a sheet with a field in it actually has. Against it, a
48px bar and an 80px action band leave a 48px field 41px to live in — which is
why the bands give up padding under `data-kb="open"` and no control gives up
size.

## The measurement, and the two that were wrong

```
hidden = window.innerHeight − visualViewport.height
```

with hysteresis — **open above 80, closed below 40** — so a keyboard that
resizes itself mid-life (a language switch, the predictive bar appearing)
doesn't flicker the layout.

Two earlier versions failed on the device and are worth not repeating:

- **`document.documentElement.clientHeight` instead of `innerHeight`.** Reads
  the layout viewport, which is the thing that does not change. The sheet
  collapsed.
- **Subtracting `visualViewport.offsetTop`.** Correct while the page is
  scrolled by the keyboard, wrong the moment it is not: the *second* keyboard
  opening reported `0`, and the search field sat behind the keyboard again.

A "is a field focused?" guard was tried too, and re-broke the reopen case for
a third reason. The lesson each time was the same: **do not make the
measurement depend on timing.** It samples on a settle curve instead — 0, 100,
250, 450 and 700ms after `focusin`, `focusout` and `orientationchange` — and
takes the reading, not the event.

## Two pins that are not optional

**The window.** Every measurement also does `window.scrollTo(0, 0)`. iOS
scrolls the *page* to reveal a focused caret, and once the keyboard closes the
page is left offset — which reads as the app header having vanished.

**The sheet's own box.** `overflow-hidden` stops a *finger* scrolling a box,
not the browser: focusing a field near the bottom makes the engine scroll the
nearest scrollable ancestor to reveal the caret, and an `overflow: hidden` box
still qualifies. The bands of a sheet are positioned against the popup, so all
of them went up with it — a blank sheet with a field at the bottom. Scrolling
it back is the only reliable answer; the engine does this without an event we
can decline.

## `svh`, not `vh` and not `dvh`

On iOS the **dynamic** viewport unit reports the height with the browser
chrome *collapsed*. A sheet sized to `100dvh` therefore overflows the top of
the screen while the URL bar is still expanded, and its header scrolls off
under the chrome. `svh` is the small (chrome-visible) viewport, which always
fits.

The sheet's cap is `calc(100svh - var(--kb, 0px) - 8px)`, and anything that
sets its own height has to use the same formula or hand it back to one:

- **A call site's own `max-h` wins over the class** (twMerge, last one), so a
  `max-h-[90vh]` must be scoped to `md:` — 90% of the layout viewport is not a
  number iOS shrinks.
- **A measured pixel height must be temporary.** The sheet's grow-on-first-
  scroll detent animates from a measured height, then hands `height` and
  `max-height` back to the formula, or the grown sheet stays that tall when
  the keyboard arrives and puts its own header 318px above the top of the
  screen.

## When the sheet shrinks, find the field again

There is no event for "the keyboard finished opening". Focus scrolls a field
into view while the sheet is still full height — usually nothing to do, so
nothing happens — and *then* the sheet collapses to the 170px above the
keyboard, keeping the scroll offset it had. What is on screen is then whatever
happened to be at that offset.

What there *is* an event for is "this box changed size", and that is the thing
that actually breaks the scroll position. `DialogContent` keeps a
`ResizeObserver` on the popup: while a field inside it holds focus, any change
to the popup's height re-reveals that field with
`scrollIntoView({ block: "center" })` — centred, because a band this short has
no room for the browser's default nearest-edge answer. Deferred a frame, since
scrolling from inside a resize callback is both ignored and a loop-detection
warning, and the observer's first report (the size the sheet opened at) is
skipped.

## Android does this without us

`interactive-widget=resizes-content` in the viewport meta makes Chrome shrink
the **layout** viewport for the keyboard, which is what iOS declines to do. So
on Android the ordinary CSS is already correct, `visualViewport.height` tracks
`innerHeight`, and `--kb` stays `0`. None of the machinery above runs.

The same meta must **not** carry `user-scalable=no` or `maximum-scale=1`:
blocking pinch-zoom is a WCAG 1.4.4 failure, and the double-tap delay it is
usually there to prevent is better answered by `touch-action: manipulation`.

## Reading it on the device

`KeyboardProbe` ships in the app and renders nothing unless the URL carries
`?kbdebug`. It prints `client`, `inner`, `vv`, `offsetTop`, `--kb` and the
window scroll, four times a second, in the top-left — because the keyboard,
the sheet and the sheet's bottom edge are all at the bottom, which is the part
being measured. `client − vv − top` should equal `--kb`, and `--kb` should
equal the keyboard plus its accessory bar.

## Open questions

- The hysteresis pair (80 / 40) and the settle samples are tuned against one
  device and one browser. Nothing has checked them on a small iPhone, on
  iPadOS, or with a third-party keyboard that has its own toolbar.
- `--kb` includes the accessory bar because that is what the sheet has to
  clear. Nothing distinguishes the two, so a design that wanted to sit *under*
  the accessory bar could not.
