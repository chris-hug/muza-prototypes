"use client"

/*
 * ChipInput — a chip-aware input. Two-tier flow:
 *
 *   1. Typing a comma turns the preceding text into a "pending" chip
 *      inside the input. Multiple chips can stack inside the input as
 *      the user types fast — "John, Mary, Bob," → three pending chips.
 *   2. Pressing Enter promotes ALL pending chips (plus any trailing
 *      typed text) to the host's committed list via `onCommit`.
 *
 * Other behavior:
 *   · Backspace on an empty input pops the last pending chip
 *   · Pasting comma-separated text creates multiple chips at once
 *   · Clicking anywhere on the wrapper focuses the input
 *
 * The visual treatment matches the project's standard rounded-full
 * input — same 40px height, border, focus ring. Pending chips inside use
 * the same `bg-muted` pill shape used by `<ChipDismiss>` so the
 * pending chips read as a less-final variant of the committed ones
 * sitting above.
 */

import { useRef, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CONTROL_STACK, type ControlSize } from "@/lib/control-size"

export interface ChipInputProps {
  /** Put on the inner `<input>` so a `<label htmlFor>` can point at it.
   *  Without this the control cannot be labelled at all — it is the one
   *  form control in the set that took no id, which is why every call site
   *  ended up with a caption floating above an anonymous field. */
  id?: string
  placeholder?: string
  /** Fires when the user presses Enter — receives every pending chip
   *  plus any trailing typed text as one batch. Host appends them to
   *  its committed list. */
  onCommit: (values: string[]) => void
  className?: string
  /** Height + type step — the shared control ladder (`sm` 32 · `default` 40 ·
   *  `lg` 48). Unlike the other controls this is a STARTING height: the pill
   *  grows by whole chip rows as they wrap. */
  size?: ControlSize
}

export function ChipInput({ id, placeholder, onCommit, className, size = "default" }: ChipInputProps) {
  const [pending, setPending] = useState<string[]>([])
  const [text,    setText]    = useState("")
  const ref = useRef<HTMLInputElement>(null)

  // Split a possibly-comma-laden string into (committedTokens, trailingText)
  // — everything before the final comma becomes chips, anything after
  // stays as the active typed text so the user can keep editing it.
  function ingest(raw: string) {
    if (!raw.includes(",")) {
      setText(raw)
      return
    }
    const parts = raw.split(",")
    const trailing = parts.pop() ?? ""
    const newChips = parts.map(s => s.trim()).filter(Boolean)
    if (newChips.length > 0) setPending(prev => [...prev, ...newChips])
    setText(trailing)
  }

  function commitAll() {
    const final = text.trim()
      ? [...pending, text.trim()]
      : pending
    if (final.length === 0) return
    onCommit(final)
    setPending([])
    setText("")
  }

  return (
    <div
      onClick={() => ref.current?.focus()}
      data-size={size}
      className={cn(
        // The height is built from the INSIDE OUT and lands exactly on the
        // shared ladder: every child (the pending chip and the field alike) is
        // `CONTROL_STACK[size].child`, and child + padding + 2px border is 32 /
        // 40 / 48. `min-h` is the floor rather than the thing doing the work —
        // it was the other way around for as long as this measured 46.5px.
        // A wrapped row adds one child height + the 6px gap, so the pill grows
        // in whole rows instead of drifting.
        "w-full rounded-full border border-border bg-background flex items-center flex-wrap gap-1.5 px-2 transition-colors cursor-text",
        CONTROL_STACK[size].min,
        CONTROL_STACK[size].pad,
        "hover:border-foreground/30",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className,
      )}
    >
      {pending.map((p, i) => (
        <span
          key={`${p}-${i}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-muted text-foreground pl-3 pr-1.5 text-2xsmall font-normal",
            CONTROL_STACK[size].child,
          )}
        >
          <span className="truncate max-w-[180px]">{p}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPending(prev => prev.filter((_, j) => j !== i))
              ref.current?.focus()
            }}
            aria-label={`Remove ${p}`}
            className="flex size-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10"
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        ref={ref}
        value={text}
        onChange={(e) => ingest(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commitAll()
          } else if (e.key === "Backspace" && text === "" && pending.length > 0) {
            // Pop the last pending chip — quick correction without
            // having to click the X.
            setPending(prev => prev.slice(0, -1))
          }
        }}
        onBlur={() => {
          // Soft-commit on blur so leaving the field doesn't drop the
          // user's chips into the void. Only fires if there's anything
          // to commit; an empty field is a no-op.
          if (pending.length > 0 || text.trim()) commitAll()
        }}
        placeholder={pending.length === 0 ? placeholder : ""}
        // A fixed child height and NOT vertical padding: the 19px line box is
        // 28.5px on its own, so any `py-*` here stacked on top of it and pushed
        // the whole control to 46.5px — 6.5px taller than every other field on
        // the page, with `min-h-10` powerless to stop it.
        className={cn(
          "flex-1 min-w-[80px] bg-transparent outline-none font-normal text-foreground placeholder:text-muted-foreground px-2 py-0",
          size === "sm" ? "text-2xsmall" : "text-small",
          CONTROL_STACK[size].child,
        )}
      />
    </div>
  )
}
