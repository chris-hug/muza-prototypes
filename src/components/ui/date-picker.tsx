"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/use-media-query"
import { sheetPositionerClass, sheetPopupClass } from "@/components/ui/dialog"
import { CONTROL_SIZE, CONTROL_PAD_Y, type ControlSize } from "@/lib/control-size"
import { Button } from "@/components/ui/button"

// ─── Date Picker ──────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 302:6273
//
// A popover-based date picker. Renders a calendar grid built from scratch
// with Muza tokens — no external date library required.
//
// Usage:
//   const [date, setDate] = React.useState<Date | undefined>()
//   <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function formatDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  /** Height + type step — the shared control ladder (`sm` 32 · `default` 40 ·
   *  `lg` 48), so the trigger lines up with the Button beside it. */
  size?: ControlSize
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  id,
  size = "lg",
}: DatePickerProps) {
  const mobile = useIsMobile()
  const today = new Date()
  const [viewYear, setViewYear] = React.useState(
    value ? value.getFullYear() : today.getFullYear()
  )
  const [viewMonth, setViewMonth] = React.useState(
    value ? value.getMonth() : today.getMonth()
  )

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  function selectDay(day: number) {
    const selected = new Date(viewYear, viewMonth, day)
    onChange?.(selected)
  }

  function clearDate() {
    onChange?.(undefined)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  // Build calendar grid cells (blanks + days)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null)

  const isSelected = (day: number) =>
    value
      ? value.getFullYear() === viewYear &&
        value.getMonth() === viewMonth &&
        value.getDate() === day
      : false

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        id={id}
        disabled={disabled}
        data-size={size}
        className={cn(
          "flex w-full items-center justify-between gap-2",
          "rounded-full border border-border hover:border-foreground/30 bg-background",
          "font-normal",
          // Height, type and the optical lift come from the shared ladder.
          // The calendar glyph sits inside the right padding, so the box is
          // symmetric and one step tighter than a plain field.
          CONTROL_SIZE[size],
          CONTROL_PAD_Y[size],
          { sm: "px-2.5", default: "px-3", lg: "px-4" }[size],
          "transition-colors outline-none select-none",
          "focus-visible:border-ring focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="truncate">
          {value ? formatDate(value) : placeholder}
        </span>
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground translate-y-[2px]" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal keepMounted>
        {/* Below the presentation gate the calendar is a BOTTOM SHEET, like
            every other popup in the app: a 288px card floating beside a
            full-width field is a desktop shape, and on a phone it lands
            wherever the field happens to sit rather than where the thumb is.
            Same recipe as `Select` — it moved into `dialog.tsx` so the two
            cannot drift. */}
        {mobile && (
          <PopoverPrimitive.Backdrop className="fixed inset-0 z-40 bg-foreground/20 data-open:animate-in data-open:fade-in-0" />
        )}
        <PopoverPrimitive.Positioner
          className={cn("isolate z-50", mobile && sheetPositionerClass)}
          sideOffset={mobile ? 0 : 6}
          side="bottom"
          align="start"
        >
          <PopoverPrimitive.Popup
            className={cn(
              "w-72 rounded-xl bg-popover border border-border p-4",
              "shadow-md ring-1 ring-foreground/10",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "duration-150 outline-none",
              // The sheet is full width, so the calendar grid inside gets the
              // room instead of staying pinned to a 288px card.
              mobile && cn(sheetPopupClass, "p-4 data-open:zoom-in-100 data-open:slide-in-from-bottom-4"),
            )}
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-accent text-foreground transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <span className="text-small font-medium text-foreground">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-accent text-foreground transition-colors"
                aria-label="Next month"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-center h-8 text-xsmall font-medium text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, i) =>
                day === null ? (
                  <div key={`blank-${i}`} />
                ) : (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-lg text-small transition-colors",
                      isSelected(day)
                        ? "bg-primary text-primary-foreground font-medium"
                        : isToday(day)
                        ? "border border-border text-foreground hover:bg-accent"
                        : "text-foreground hover:bg-accent",
                    )}
                  >
                    {day}
                  </button>
                )
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="text-xsmall"
                onClick={() => {
                  const t = new Date()
                  setViewYear(t.getFullYear())
                  setViewMonth(t.getMonth())
                  selectDay(t.getDate())
                }}
              >
                Today
              </Button>
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xsmall text-muted-foreground"
                  onClick={clearDate}
                >
                  Clear
                </Button>
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { DatePicker }
