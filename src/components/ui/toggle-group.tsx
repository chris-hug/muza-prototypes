"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── ToggleGroup ──────────────────────────────────────────────────────────────
//
// Segmented control container — same chrome and dimensions as TabsList sm
// (h-[40px] muted track with p-1 inner padding). Toggle children inside
// auto-pick up matching height/padding via the group-data selector pattern,
// just like TabsTrigger does.
//
// Sizes mirror TabsList exactly:
//   sm      → h-[40px] · trigger px-3 · text-2xsmall · font-normal
//   default → h-12     · trigger px-6 · text-small   · font-normal
//   lg      → h-[52px] · trigger px-8 · text-small   · font-medium
//
// Modes:
//   single-select (default) — one Toggle pressed at a time, and the pressed
//                             pill TRAVELS between items (see below)
//   `multiple`              — any combination, so every pressed item keeps
//                             its own pill and nothing travels
// ─────────────────────────────────────────────────────────────────────────────

const toggleGroupVariants = cva(
  "group/toggle-group relative inline-flex w-fit items-center rounded-full bg-muted text-muted-foreground gap-0 p-1",
  {
    variants: {
      size: {
        sm:      "h-[40px]",
        default: "h-12",
        lg:      "h-[52px]",
      },
    },
    defaultVariants: { size: "sm" },
  },
)

interface ToggleGroupProps extends ToggleGroupPrimitive.Props,
  VariantProps<typeof toggleGroupVariants> {}

function ToggleGroup({
  className,
  size = "sm",
  children,
  ...props
}: ToggleGroupProps) {
  /*
   * The travelling pill — the same move Tabs made, for the same reason.
   *
   * Each Toggle used to draw its own `bg-background` pill and cross-fade it,
   * so the mark did not move: it switched off under one item and on under
   * the next, and the eye lost the thread between them. Here ONE element is
   * positioned over the pressed item from `--pressed-left` / `--pressed-width`
   * and slides, so the transition has something to interpolate.
   *
   * Unlike Tabs this cannot lean on a primitive: `@base-ui/react/tabs` ships
   * an `Indicator` part that publishes those two variables, and
   * `@base-ui/react/toggle-group` ships only the root. So the pressed child is
   * measured here — `offsetLeft` / `offsetWidth` against the root, which is
   * `relative`, with a MutationObserver for the press changing and a
   * ResizeObserver for the box changing under it (text reflow, a font
   * landing, the group being squeezed by its column).
   *
   * Only in single-select. With `multiple` several items are pressed at once
   * and one travelling pill cannot describe that, so those keep their own —
   * `data-travel` gates the swap and `toggle.tsx` reads it.
   *
   * 180ms ease-out, the number Tabs uses. The pill is a pointer, not an
   * event: any slower and the view it selects has already changed while it
   * is still sliding.
   */
  const travels = !props.multiple
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState<{ left: number; width: number } | null>(null)
  // Enabled one commit AFTER the first measurement, so the pill appears where
  // it belongs instead of sliding in from the left edge on mount.
  const [animate, setAnimate] = React.useState(false)

  React.useEffect(() => {
    const root = rootRef.current
    if (!root || !travels) return

    const measure = () => {
      const pressed = root.querySelector<HTMLElement>("[data-slot=toggle][data-pressed]")
      // Nothing pressed is a real state (`value` can be `[]`) — keep the last
      // geometry and let the indicator fade out rather than collapse to 0.
      if (!pressed) { setBox(null); return }
      setBox(prev =>
        prev && prev.left === pressed.offsetLeft && prev.width === pressed.offsetWidth
          ? prev
          : { left: pressed.offsetLeft, width: pressed.offsetWidth },
      )
    }

    measure()
    const mo = new MutationObserver(measure)
    mo.observe(root, { attributes: true, subtree: true, attributeFilter: ["data-pressed"], childList: true })
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    root.querySelectorAll("[data-slot=toggle]").forEach(el => ro.observe(el))
    return () => { mo.disconnect(); ro.disconnect() }
  }, [travels, children])

  React.useEffect(() => {
    if (box && !animate) setAnimate(true)
  }, [box, animate])

  return (
    <ToggleGroupPrimitive
      ref={rootRef}
      data-slot="toggle-group"
      data-size={size}
      data-travel={travels ? "true" : undefined}
      className={cn(toggleGroupVariants({ size }), className)}
      {...props}
    >
      {children}
      {travels && (
        <span
          aria-hidden="true"
          data-slot="toggle-group-indicator"
          style={box ? {
            // Kept as custom properties for the same reason Tabs does: the
            // class list stays static and only the two numbers change.
            "--pressed-left":  `${box.left}px`,
            "--pressed-width": `${box.width}px`,
          } as React.CSSProperties : undefined}
          className={cn(
            // `z-0` with the toggles' own `relative z-10` puts it BEHIND the
            // labels, so the fill does not cover its own text.
            "pointer-events-none absolute left-0 top-1 bottom-1 z-0 rounded-full bg-background shadow-sm",
            "w-[var(--pressed-width)] translate-x-[var(--pressed-left)]",
            animate && "transition-[translate,width,opacity] duration-[180ms] ease-out",
            // Nothing to point at before the first measurement, and nothing
            // while no item is pressed — otherwise it flashes at width 0.
            !box && "opacity-0",
          )}
        />
      )}
    </ToggleGroupPrimitive>
  )
}

export { ToggleGroup, toggleGroupVariants }
