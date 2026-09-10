"use client"

/*
 * RadioCard — the repeating "big selectable card" pattern used across
 *   · EditReleaseDialog     (Monetisation: streaming / purchase)
 *   · UploadMusicDialog     (StepMonetisation: streaming / purchase)
 *   · ShopMyProducts        ("Create Listing" product type picker)
 *
 * Layout: radio dot · neutral icon circle · (title + optional description) ·
 * optional children shown below a full-width separator (e.g. the price
 * inputs on the Purchase card).
 *
 * Active state is signalled by the border + the radio dot only; the icon
 * circle always stays neutral (`bg-secondary`) so the card doesn't shout when
 * selected. That border is not swapped on — it is DRAWN: a `.card-sweep`
 * overlay grows a conic gradient out from the point that was pressed, in both
 * directions at once, and settles into exactly the border colour (see the
 * comment above the return, and `.card-sweep` in app.css).
 *
 * Usage — must be wrapped in a <RadioCardGroup>:
 *   <RadioCardGroup value={period} onValueChange={setPeriod}>
 *     <RadioCard value="streaming" icon={<Radio />} title="For streaming"
 *                description="Anyone on Muza can listen" />
 *     <RadioCard value="purchase"  icon={<ShoppingBag />} title="For purchase"
 *                description="Fans pay to unlock">
 *       {/ expanded content — always visible, not gated on selection /}
 *     </RadioCard>
 *   </RadioCardGroup>
 */

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTick } from "@/lib/use-tick"

// ─── RadioCardGroup — thin wrapper over RadioGroup that applies the
//   card-friendly gap. Exported so callers don't have to import RadioGroup
//   separately. ─────────────────────────────────────────────────────────────

export function RadioCardGroup({
  value, onValueChange, className, children,
}: {
  value:          string
  onValueChange:  (v: string) => void
  className?:     string
  children:       ReactNode
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={v => onValueChange(v)}
      className={cn("w-full flex flex-col gap-3", className)}
    >
      {children}
    </RadioGroup>
  )
}

// ─── RadioCard ───────────────────────────────────────────────────────────

interface RadioCardProps {
  value:        string
  selected:     boolean
  onSelect:     () => void
  icon:         ReactNode
  title:        string
  description?: string
  /** Optional content rendered below a full-width separator. Always
   *  visible (not gated on selection). Useful for the Purchase card's
   *  price inputs. Clicks inside this region don't bubble up to the
   *  card's `onSelect`. */
  children?:    ReactNode
  className?:   string
}

export function RadioCard({
  value, selected, onSelect,
  icon, title, description,
  children, className,
}: RadioCardProps) {
  /* The card is the tap target — the whole thing, not the 16px dot — so the
     card owns the tick. `RadioGroupItem` drives its own spring from its own
     click, which covers a bare radio in a form but never fires when the press
     landed on the title, the icon or the padding, and then the dot filled in
     without moving. Since the item spreads incoming props AFTER its own
     `tickProps`, the `data-anim` handed down here wins for every path.

     A direct click on the dot still arrives here by bubbling, so both routes
     run one and the same spring rather than two that can drift apart. Clicks
     inside `children` stop propagating and correctly tick nothing. */
  const { tickProps, tick } = useTick()

  /* Where the ring starts being drawn: the angle from the card's centre to
     the point that was pressed, so the line grows out from under the finger
     rather than from a fixed corner.
     
     `atan2(dx, -dy)` and not the usual `atan2(dy, dx)`: conic-gradient counts
     from 12 o'clock clockwise, while screen coordinates run x-right / y-DOWN.
     Swapping the arguments and negating y turns one into the other.
     
     `null` for a keyboard selection — `detail === 0` means no pointer, and
     `clientX/Y` would be 0,0 (the window's top-left), which would start the
     sweep off the card entirely. The CSS falls back to 12 o'clock. */
  const [from, setFrom] = useState<number | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.detail === 0) setFrom(null)
    else {
      const r = e.currentTarget.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width  / 2)
      const dy = e.clientY - (r.top  + r.height / 2)
      setFrom((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360)
    }
    tick()
    onSelect()
  }

  /* The selected ring is DRAWN, not swapped: `.card-sweep` fills a conic
     gradient over ~340ms, in BOTH directions from the press point at once (see
     app.css). Both the drawn ring and the settled border are foreground at
     20%, so what the sweep leaves behind IS the selected border rather than a
     second, brighter line on top of it — the two alphas have to be changed
     together or the sweep ends on a visible step in brightness. `key` remounts the overlay on each
     selection so the animation replays. */
  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex flex-col rounded-lg border cursor-pointer",
        "transition-[border-color] duration-[130ms] ease-[cubic-bezier(0.2,0,0,1)]",
        selected ? "border-foreground/20" : "border-border hover:border-foreground/30",
        className,
      )}
    >
      {selected && (
        <span
          aria-hidden="true"
          key={`sweep-${value}-${from ?? "kb"}`}
          className="card-sweep"
          style={from == null ? undefined : { "--card-sweep-from": `${from}deg` } as React.CSSProperties}
        />
      )}
      <div className="flex items-center gap-4 px-4 py-5">
        <RadioGroupItem value={value} {...tickProps} />
        <div className="shrink-0 size-10 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground [&_svg]:size-4">
          {icon}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-small font-medium text-foreground leading-snug">{title}</span>
          {description && (
            <span className="text-xsmall text-muted-foreground leading-snug">{description}</span>
          )}
        </div>
      </div>
      {children && (
        <>
          <div className="border-t border-border" />
          <div
            /* The expanded band breathes more than the header does, and by a
               lot: 40px between blocks, 32px top and bottom. Each block here
               is a labelled field with its own toggle beside the label, so at
               the old 28px the label row of one block sat as close to the
               field above it as to its own. Space is the only thing saying
               which label belongs to which input. */
            className="flex flex-col gap-10 px-6 py-8"
            onClick={e => e.stopPropagation()}
          >
            {children}
          </div>
        </>
      )}
    </div>
  )
}
