"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── Tabs ─────────────────────────────────────────────────────────────────────
//
// Figma sources:
//   Variant 1 (pill/segment): nodes 19829:35, 19829:30
//   Variant 2 (underline):    node 21002:3836
//
// Variants:
//   default — pill/segment style: tabs sit inside a muted rounded container
//   line    — underline style: bottom border indicator, transparent container
//   pill    — each tab is its own rounded-full pill with bg on active
// ─────────────────────────────────────────────────────────────────────────────

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center",
  {
    variants: {
      variant: {
        // Pill/segment — tabs inside a muted background container. A
        // fixed segmented control, so it does NOT scroll.
        default:
          // `bg-muted`, not `bg-muted`: this is a PLATE. `--muted` is
          // translucent in dark — a hovered row is meant to lift, not to
          // switch on — and a track that lets the page through shows every
          // rule and edge it happens to sit over. The opaque twin is the same
          // colour, stated as the other job.
          "rounded-full bg-muted p-1 text-muted-foreground gap-0",
        /* Underline — transparent container, bottom-border active indicator.
           Full-width tab strips like this can overflow a phone (e.g. Settings'
           five tabs), so they scroll horizontally with the scrollbar hidden —
           every tab stays reachable by swipe. `max-w-full` lets the inline-flex
           know when it's overflowing.

           `overflow-y-hidden` is not decoration: a box that is `auto` on one
           axis is `auto` on BOTH, and the strip overflows its content box
           vertically by a pixel (the tabs are 36px inside a 35px content box —
           the hairline the strip owns is a border, which `clientHeight` leaves
           out). One pixel is enough to make the whole tab bar draggable up and
           down, which is what it was doing on the artist page. */
        line:
          "rounded-none bg-transparent gap-3 text-muted-foreground max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden " +
          /* The strip's hairline, as a BACKGROUND rather than a border.
             A border sits outside the content box, where the indicator —
             clipped to the scroll box — cannot reach it: the travelling mark
             floated a pixel above the line it is supposed to be part of. As
             the last pixel of the background it occupies exactly the row the
             indicator is pinned to, so the mark sits ON the line and covers
             it as it passes. It is also painted against the padding box, so
             it does not scroll away with the tabs like an absolute child
             would. Call sites no longer add `border-b`. */
          "bg-[linear-gradient(to_top,var(--color-border)_1px,transparent_1px)]",
        // Pill — each tab is its own pill (no container background). Same
        // horizontal-scroll treatment as `line`, and the same cross-axis pin.
        pill:
          "rounded-none bg-transparent gap-1.5 text-muted-foreground max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      },
      size: {
        sm:      "",
        default: "",
        lg:      "",
      },
    },
    compoundVariants: [
      { variant: "default", size: "sm",      className: "h-[40px]" },
      { variant: "default", size: "default", className: "h-12" },
      { variant: "default", size: "lg",      className: "h-[52px]" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  size = "default",
  autoCenter = true,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants> & {
  /** Auto-scroll the active tab to centre when the strip overflows.
   *  Disable for free-scrolling filter rows where the user should be able
   *  to swipe to (and rest on) ANY tab, not just the active one. */
  autoCenter?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  // When the list scrolls (overflowing tab strips on mobile), keep the
  // ACTIVE tab horizontally centred — except the very first tab, which
  // stays pinned to the start (centring it would push the strip right and
  // reveal empty space before it). The `default` segmented variant never
  // scrolls, so this is a no-op there. base-ui toggles the active tab's
  // `data-active` attribute; a MutationObserver re-centres on each change.
  React.useEffect(() => {
    if (!autoCenter) return
    const list = ref.current
    if (!list) return

    const recenter = () => {
      if (list.scrollWidth <= list.clientWidth) return // not scrollable
      const active = list.querySelector<HTMLElement>('[data-active], [aria-selected="true"]')
      if (!active) return
      const tabs = list.querySelectorAll('[role="tab"]')
      // First tab → pin to the start; nothing before it to reveal.
      if (active === tabs[0]) {
        list.scrollTo({ left: 0, behavior: "smooth" })
        return
      }
      const target = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2
      list.scrollTo({ left: Math.max(0, target), behavior: "smooth" })
    }

    recenter()
    const observer = new MutationObserver(recenter)
    observer.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-active", "aria-selected"],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      data-variant={variant}
      data-size={variant === "default" ? size : undefined}
      className={cn("relative", tabsListVariants({ variant, size }), className)}
      {...props}
    >
      {props.children}
      {/* The travelling underline, `line` variant only.
       *
       * Each trigger used to draw its own `::after` and cross-fade it, so the
       * mark did not move: it vanished under the old tab and appeared under
       * the new one, and the eye lost the thread between them. Base UI's
       * `Indicator` is ONE element positioned over the active tab from
       * `--active-tab-left` / `--active-tab-width`, so the same mark travels
       * and the transition has something to interpolate.
       *
       * 260ms on the house curve, up from 180ms on Tailwind's default ease.
       * The distance is the reason: on a narrow DS strip the mark moves 60px
       * and 180ms is plenty, but on a full-width artist header each tab is a
       * third of the page — measured 882px of travel between Shop and
       * Overview — and at 180ms that is roughly 2450px per second, which the
       * eye reads as the line reappearing somewhere else rather than going
       * there. Same number as the tab labels' own fade, so the mark and the
       * text arrive together. */}
      <TabsPrimitive.Indicator
        className={cn(
          // Shared: one element, positioned over the active tab and sliding
          // between them. `z-0` with the triggers' own `relative` puts it
          // BEHIND the labels, so a filled indicator does not cover its text.
          "pointer-events-none absolute left-0 z-0",
          // `0px` fallbacks, so an indicator with no measurement yet is zero
          // wide — invisible on its own terms. This used to be an opacity
          // guard on `data-[activation-direction=none]`, which reads like
          // "not measured yet" and is not: Base UI sets that attribute to
          // `none` until the first ACTIVATION, and it publishes the geometry
          // inline from the very first paint. So a freshly rendered strip was
          // fully measured and placed, and hidden anyway — the label took its
          // active colour while the mark under it stayed invisible until you
          // clicked something. Which is the whole point of the mark.
          "w-[var(--active-tab-width,0px)] translate-x-[var(--active-tab-left,0px)]",
          "transition-[translate,width,transform] duration-[260ms] ease-[cubic-bezier(0.2,0,0,1)]",
          // The attribute is still worth reading — just for the other thing.
          // With no activation yet there is no previous position to travel
          // FROM, so the mark is placed, not animated; every later move has a
          // direction and eases.
          "data-[activation-direction=none]:transition-none",
          // The mark itself, per variant. `line` is a hairline under the
          // label; `default` and `pill` are the FILL that used to belong to
          // the active trigger — moved here so it travels instead of
          // switching on in one place and off in another.
          variant === "line" && "bottom-0 h-px rounded-full bg-foreground",
          variant === "default" &&
            "top-1 bottom-1 rounded-full border border-border/40 bg-background dark:bg-input/30",
          variant === "pill" && "top-0 bottom-0 rounded-full bg-accent",
        )}
      />
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Base — `pb-px` matches the optical-center nudge used on Button;
        // Founders Grotesk sits visually high in a flex-centered box without it.
        // `state-fade-quick`, the same fade a list row uses: a tab strip is
        // swept across, not arrived at, so it runs at the row pace (200ms in,
        // 100ms out) rather than a Button's 440ms. It also replaces a hand-
        // written property list that had been wrong for a while — it named
        // `transform`, which in Tailwind v4 covers neither `scale` nor
        // `translate`, and `box-shadow`, which repaints the focus ring frame
        // by frame — and it brings the house curve, where the old list still
        // ran on Tailwind's default easing.
        "relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium state-fade-quick outline-none pb-px",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:border-ring focus-ring",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        // ── Default variant (segment/pill within muted bg) ──────────────
        "group-data-[variant=default]/tabs-list:flex-1 group-data-[variant=default]/tabs-list:h-full",
        "group-data-[variant=default]/tabs-list:rounded-full",
        // Reserve the 1px border slot on every trigger (transparent at rest)
        // so the active state can swap colour without shifting layout.
        // Without this, toggling `border` on/off adds ±1px on each side and
        // neighbouring tabs wiggle when selection changes.
        "group-data-[variant=default]/tabs-list:border group-data-[variant=default]/tabs-list:border-transparent",
        // Size-specific padding & typography (only applied when variant=default since data-size is only set then)
        "group-data-[size=sm]/tabs-list:px-3 group-data-[size=sm]/tabs-list:text-2xsmall group-data-[size=sm]/tabs-list:font-normal",
        "group-data-[size=default]/tabs-list:px-6 group-data-[size=default]/tabs-list:text-small group-data-[size=default]/tabs-list:font-normal",
        "group-data-[size=lg]/tabs-list:px-8 group-data-[size=lg]/tabs-list:text-small group-data-[size=lg]/tabs-list:font-medium",
        "group-data-[variant=default]/tabs-list:text-muted-foreground",
        "group-data-[variant=default]/tabs-list:hover:text-foreground",
        // Active: white bg + visible border colour (border width is always on)
        // (fill moved to the travelling Indicator)
        "group-data-[variant=default]/tabs-list:data-active:text-foreground",
        // Dark active

        // ── Line/underline variant ──────────────────────────────────────
        "group-data-[variant=line]/tabs-list:rounded-none",
        "group-data-[variant=line]/tabs-list:px-[18px] group-data-[variant=line]/tabs-list:pb-1.5 group-data-[variant=line]/tabs-list:pt-0",
        "group-data-[variant=line]/tabs-list:text-small",
        "group-data-[variant=line]/tabs-list:text-muted-foreground",
        // Hover is the TEXT, nothing else. A fill was tried here and is wrong:
        // a `line` tab is a word with a rule under it, and a plate appearing
        // behind the word turns it into a button it is not.
        "group-data-[variant=line]/tabs-list:hover:text-foreground",
        // Active: just foreground text + bottom border
        "group-data-[variant=line]/tabs-list:data-active:text-foreground",
        // `line` no longer draws its own underline — the travelling
        // `Indicator` on the list does, so two marks do not stack.
        "group-data-[variant=line]/tabs-list:after:hidden",
        // The underline indicator. Default sits 1px BELOW the trigger
        // (`-bottom-px`) to overlap the container's hairline; but the
        // scrollable line/pill list clips overflow-y, which would cut that
        // 1px. So for line/pill the indicator is pinned to `bottom-0` — and
        // the strip's hairline is drawn INSIDE that same pixel (see
        // `tabsListVariants`), so the two coincide instead of stacking.
        "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity",
        "group-data-[variant=line]/tabs-list:after:bottom-0 group-data-[variant=pill]/tabs-list:after:bottom-0",

        // ── Pill variant ────────────────────────────────────────────────
        "group-data-[variant=pill]/tabs-list:rounded-full",
        "group-data-[variant=pill]/tabs-list:h-[38px] group-data-[variant=pill]/tabs-list:px-[18px]",
        "group-data-[variant=pill]/tabs-list:text-small group-data-[variant=pill]/tabs-list:font-medium",
        "group-data-[variant=pill]/tabs-list:text-muted-foreground",
        "group-data-[variant=pill]/tabs-list:hover:bg-muted",
        "group-data-[variant=pill]/tabs-list:hover:text-foreground",
        "group-data-[variant=pill]/tabs-list:data-active:text-foreground",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-small outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
