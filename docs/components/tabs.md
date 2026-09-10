---
title: Tabs
source: src/components/ui/tabs.tsx
related: [togglegroup, button, search, player-overlay]
usage:
  - Artist profile (Overview / Discography / Shop) | /?page=Artist
  - Library (Albums / Artists / Songs / Playlists) | /?page=Albums
  - Studio sub-nav | /?page=Music
---

`Tabs` switches one region between a few named views — a page's sections
(Artist: Overview / Discography / Shop), a list's status filter (Library:
All / Owned / Downloaded), a panel's modes (Player: Lyrics / Now listening /
Up next). Three looks, one primitive: a **segmented** control, an
**underline** strip, and standalone **pills**.

## Anatomy

```tsx
<Tabs value={tab} onValueChange={setTab}>
  <TabsList variant="line">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="discography">Discography</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
</Tabs>
```

Four parts over `@base-ui/react/tabs`. `Tabs` is `group/tabs flex gap-2`,
column for the horizontal orientation, so a list and its content stack 8px
apart. `TabsList` sets `data-variant` and (for the segment only)
`data-size`; every trigger style is keyed off those through
`group-data-[…]/tabs-list`, which is why one `TabsTrigger` serves all three
looks with no prop of its own (`tabs.tsx:146–197`). `TabsContent` is
`flex-1 text-small outline-none`.

Shared by every trigger: `inline-flex items-center justify-center gap-1.5
whitespace-nowrap font-medium … pb-px`, the `focus-visible` ring, `disabled`
at 50%, and svg children at 16px. The `pb-px` is the same 1px optical lift
`Button`, `Chip` and `Badge` carry — Founders Grotesk sits high in a centred
box without it (`DESIGN_SYSTEM.md` › the 2px lift).

### `default` — the segmented control

| Part | Classes | Why |
|---|---|---|
| List | `inline-flex w-fit rounded-full bg-muted p-1 text-muted-foreground gap-0` | a muted pill that holds the tabs; `w-fit`, and it does **not** scroll — a segment is a fixed set |
| Trigger | `flex-1 h-full rounded-full border border-transparent`, `text-muted-foreground hover:text-foreground` | `flex-1` shares the pill evenly. The transparent border **reserves the 1px** so the active state can colour it without the neighbours shifting |
| Active | `data-active:bg-background data-active:border-border/40 data-active:text-foreground`, dark `bg-input/30` | the selected segment is a raised card inside the muted pill |

`size` exists only here (`data-size` is set only for `default`, `:132`):

| `size` | List height | Trigger | Type |
|---|---|---|---|
| `sm` | `h-[40px]` | `px-3` | `text-2xsmall font-normal` |
| `default` | `h-12` (48px) | `px-6` | `text-small font-normal` |
| `lg` | `h-[52px]` | `px-8` | `text-small font-medium` |

Note the weights: `font-normal` at `sm` and default, `font-medium` only at
`lg`, overriding the base `font-medium`. A segment at rest is quieter than a
line tab.

### `line` — the underline strip

| Part | Classes | Why |
|---|---|---|
| List | `rounded-none bg-transparent gap-3 text-muted-foreground max-w-full overflow-x-auto`, scrollbar hidden | a full-width strip (Settings' five tabs, Search's categories) can overflow a phone, so it **scrolls sideways** with no scrollbar; `max-w-full` is what lets an `inline-flex` notice it is overflowing |
| Trigger | `rounded-none px-[18px] pb-1.5 pt-0 text-small text-muted-foreground hover:text-foreground` | 18px sides: the gap between two labels reads as 36 + the list's `gap-3` |
| Underline | `after:absolute after:inset-x-0 after:h-px after:bg-foreground after:opacity-0`, active `after:opacity-100` | a 1px ink line under the label, faded in rather than mounted. Pinned `after:bottom-0` here (the base is `-bottom-px`) because the scrolling list clips `overflow-y` and would cut a line 1px outside |
| Active | `data-active:text-foreground` | ink text plus the line, nothing else |

The list draws **no** border of its own; a strip that should sit on a rule
adds `border-b border-border` at the call site (`search-results-view.tsx:123`).

### `pill` — standalone pills

| Part | Classes |
|---|---|
| List | as `line` but `gap-1.5` |
| Trigger | `rounded-full h-[38px] px-[18px] text-small font-medium text-muted-foreground hover:bg-muted hover:text-foreground` |
| Active | `data-active:bg-accent data-active:text-foreground` |

The pill fills with `accent` when selected — the same fill a highlighted menu
row uses — where a `Chip` would fill with `secondary`. A pill tab is a
*view* switch; a chip is a *filter* toggle.

### `autoCenter`

A scrolling list keeps the **active tab centred**: on mount and on every
change of `data-active` (a `MutationObserver`, `:98–125`) it scrolls so the
active trigger sits mid-strip — except the first tab, which is pinned to
the start so no empty space is revealed before it. The segment never
scrolls, so it is a no-op there. Pass `autoCenter={false}` for a free
filter row where the user should be able to rest on *any* tab
(`library-albums-view.tsx:191`, `report-view.tsx:352`).

## Usage

```tsx
// Library › Albums — the status filter, desktop and tablet only
{footerNav ? <LibrarySortMenu /> : (
  <Tabs value={status} onValueChange={v => setStatus(v as Status)}>
    <TabsList variant="line" autoCenter={false}>
      <TabsTrigger value="all">All albums</TabsTrigger>
      <TabsTrigger value="owned">Owned</TabsTrigger>
      <TabsTrigger value="downloaded">Downloaded</TabsTrigger>
    </TabsList>
  </Tabs>
)}
```

Every app call site is **controlled** (`value` + `onValueChange`): the tab
is state the page owns — a URL param on Shop and Explore, a filter store in
the Library. `onValueChange` hands back the string; cast it to the union.

Where each look is used:

| Look | Where |
|---|---|
| segment | Report's metric switch (`report-view.tsx:372`, with `border border-border` added); Wallet's Withdraw / Transfer (`transfer-view.tsx:27`, `size="lg"`, `w-full`, with icons) |
| line | Artist profile, Library status filters, Settings and Shop page nav, Search categories |
| pill | Player overlay (`player-overlay.tsx:775`, triggers `font-normal!`), Report's period row |

## Sizing

Fixed, no steps of its own — no `@container`, no `md:`. What varies is by
**overflow** and by the **window** at the call site:

- `line` and `pill` lists scroll horizontally when wider than their column;
  the segment never does.
- The Library's status tabs exist from the **608** chrome gate up
  (`useFooterNav()` swaps in `LibrarySortMenu` below it) — with the tab bar
  present the strip competes with the content-type nav.
- Search's category tabs are `hidden sm:block`, with `MobilePillTabs`
  below `sm` — see Open questions.

## Behaviour

Keyboard is base-ui's: arrow keys move between triggers (activating on
focus), Home / End jump to the ends, and `TabsContent` panels are tabbable
regions. `data-active` on the trigger drives every active style; the
`MutationObserver` above watches the same attribute.

## Motion — one mark, and it travels

All three variants draw their active mark with a single `Tabs.Indicator` on
the list, positioned over the active trigger and slid between them.

| | |
|---|---|
| Element | one `span[role=presentation]`, `absolute`, `z-0` behind the labels (which carry `relative z-10`) |
| Position | `translate-x-[var(--active-tab-left,0px)]` · `w-[var(--active-tab-width,0px)]` — base-ui publishes both inline |
| Transition | `translate, width, transform` · **260ms** · `cubic-bezier(0.2,0,0,1)` |
| The mark | `line` a hairline at `bottom-0`; `default` the `bg-background` pill; `pill` the `bg-accent` fill |

Each trigger used to draw its own `::after` or its own fill and cross-fade
it, so the mark did not move — it vanished under the old tab and appeared
under the new one, and the eye lost the thread. The triggers keep only their
text colour; `line` explicitly suppresses its old underline
(`group-data-[variant=line]/tabs-list:after:hidden`) so two marks cannot
stack. [Toggle Group](togglegroup.md) does the same thing for the same
reason, though it has to measure itself.

260ms on the house curve, raised from 180ms on Tailwind's default ease. The
distance is why: on a narrow strip the mark travels ~60px and 180ms is plenty,
but a full-width artist header gives each tab a third of the page — measured
882px between "Shop" and "Overview" — and at 180ms that is roughly 2450px per
second, which reads as the line reappearing elsewhere rather than going there.
It is also the number the labels' own fade uses, so mark and text arrive
together.

The hairline under a `line` strip belongs to the LIST, not to the triggers.
The artist header used to give every trigger its own `border-b` —
`border-border` idle, `border-foreground` active — and three separate borders
have nothing to interpolate between: one crossfaded to grey while the next
crossfaded to white, which reads as the mark going out here and coming on over
there. The Indicator was underneath the whole time, doing the right thing
invisibly, with a foreground border sitting on top of it. A `border-b` on the
`TabsList` plus the Indicator alone is the arrangement that travels.

The triggers fade on `state-fade-quick` (200ms in, 100ms out), not on a
hand-written property list: the old one named `transform`, which in Tailwind
v4 covers neither `scale` nor `translate`, and `box-shadow`, which repaints
the focus ring frame by frame.

### `data-activation-direction` means "since the last click", not "measured"

Worth stating because reading it the other way is a live bug waiting to
happen — it already was one. base-ui sets `data-activation-direction="none"`
until the first **activation**, while publishing the geometry inline from the
very first paint. So a freshly rendered strip is fully measured and placed
while the attribute still says `none`.

The indicator used to carry `data-[activation-direction=none]:opacity-0`,
written as a guard against "flashing at width 0 before measurement". It was
really a guard against *ever having been clicked*: every tab strip in the app
rendered with the correct active label colour and no line or pill under it
until you touched one. The `0px` var fallbacks handle the unmeasured case on
their own — no geometry means no width means nothing to see — so the
attribute is now used for the thing it actually describes: with no direction
there is nothing to travel from, so the mark is *placed*
(`data-[activation-direction=none]:transition-none`) and every later move
eases.

## Focus

**Keyboard focus is `focus-ring`** — a 2px `outline` at 20% of `--ring`, no offset, the same one every control in the app draws; pointer clicks show nothing.

## Open questions

- `tabs.tsx:98–125`: the recentre effect has `[]` as its dependency list
  but reads `autoCenter` — a value that changes after mount is ignored, and
  the observer is never re-armed. Harmless today (every call site passes a
  constant) and worth `[autoCenter]`.
- The artist profile (`artist-profile-view.tsx:306–330`) hides the
  component's underline (`after:hidden`) and draws its own `border-b` per
  trigger with `data-active:border-foreground`, so the three equal-width
  tabs paint one continuous rule. That is a fourth look — "full-width
  line" — living only in a call site. Settings and Shop override
  differently again (`h-auto pb-0` on the list, `flex-none px-4 pb-3` on
  each trigger). Either `line` grows a `full` option or the doc should say
  the page-nav strip is always hand-tuned.
- `search-results-view.tsx:122–131` swaps `Tabs` for `MobilePillTabs` at
  `sm:` (640) · `responsive.md` says `sm:` may reflow in-page content and
  only `md:` / `useIsMobile()` (768) may swap a component. The Library does
  the same swap at 608 via `useFooterNav()`. Three different widths for
  "tabs become something else".
- `DESIGN_SYSTEM.md` › Library views says the status filters are
  "desktop only" · the source gates them on `useFooterNav()` (608), so they
  are present from the tablet band up.
- The old page demo showed a `line` list with `w-full justify-start
  border-b border-border` and a `TabsContent` beneath it; the frame keeps
  that as the Library shape. No app call site uses `TabsContent` with
  `line` except Settings and Shop.
