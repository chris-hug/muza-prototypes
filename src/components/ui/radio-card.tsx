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
 * Active state is signalled by a darker border + the radio dot only; the
 * icon circle always stays neutral (`bg-secondary`) so the card doesn't
 * shout when selected.
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

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex flex-col rounded-lg border transition-colors cursor-pointer",
        selected ? "border-foreground" : "border-border hover:border-foreground/30",
        className,
      )}
    >
      <div className="flex items-center gap-4 px-4 py-5">
        <RadioGroupItem value={value} />
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
            className="flex flex-col gap-7 px-6 py-7"
            onClick={e => e.stopPropagation()}
          >
            {children}
          </div>
        </>
      )}
    </div>
  )
}
