"use client"

/*
 * FileField — the form control for "choose a file".
 *
 * A file picker is a FIELD. It sits in a form, it is labelled like one, it has
 * to be the same height as the inputs above it and it has to say what it is
 * holding once something has been chosen. The browser's own control does none
 * of that in a way a design system can use: `<input type="file">` renders a
 * button whose text, size and position belong to the platform, and the parts
 * you can style (`::file-selector-button`) are not the parts that matter.
 *
 * So the native input is `sr-only` and a `<label>` wraps it. That is the whole
 * trick, and it is why this is not a `Button` beside an `Input`:
 *
 *   · a label wrapping an input forwards every click on ANY part of the row to
 *     the input, so the filename text and the empty space open the dialog too;
 *   · the input stays real, so the form, `accept`, and validation still work;
 *   · `sr-only` (not `hidden`) keeps it focusable, which is why the shell can
 *     answer the keyboard at all.
 *
 * The shell then takes the field recipe from the ladder — the same height,
 * radius, border and hover as `Input`, `focus-ring-within` because the focus
 * lands on the child, and `state-fade` so the colours move like everything
 * else.
 */

import * as React from "react"
import { Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { CONTROL_SIZE, type ControlSize } from "@/lib/control-size"

/* The trigger pill per step, and the shell padding that keeps its shoulder
 * EVEN on all three sides.
 *
 * The number to match is the vertical gap, and it is not the difference
 * between the two heights. The shell's 48px includes its 1px border, so the
 * room inside is 46 and a 40px pill centres with 3px of padding above and
 * below — 4px from the outer edge once the border is counted. So the left
 * padding is 3px too, and the pill then sits 4px from every edge it touches.
 * Measured: left 4, top 4, bottom 4. It was 6px (`pl-1.5`) before, which read
 * as the pill hanging off-centre — the kind of two-pixel wrongness a pill
 * inside a pill makes impossible to miss.
 *
 * 3px on every step, because every step keeps the same 8px height difference.
 * The right side is deliberately NOT 3: that edge is text, and text takes the
 * field's own horizontal padding. */
const PILL: Record<ControlSize, { pill: string; pad: string }> = {
  sm:      { pill: "h-6  px-2.5 text-2xsmall", pad: "pl-[3px] pr-3" },
  default: { pill: "h-8  px-3   text-xsmall",  pad: "pl-[3px] pr-4" },
  lg:      { pill: "h-10 px-4   text-xsmall",  pad: "pl-[3px] pr-5" },
}

export interface FileFieldProps
  extends Omit<React.ComponentProps<"input">, "size" | "type" | "className"> {
  /** Height + type step. `lg` like every other field. */
  size?: ControlSize
  /** The trigger's words. Say what is being uploaded, not "Browse…". */
  label?: string
  /** The chosen file's name. Controlled: the caller owns it, because the
   *  caller is what has to do something with the file. */
  fileName?: string | null
  /** Shown while nothing is chosen. */
  placeholder?: string
  className?: string
}

export function FileField({
  size = "lg",
  label = "Choose file",
  fileName,
  placeholder = "No file chosen",
  className,
  ...props
}: FileFieldProps) {
  const step = PILL[size]
  return (
    <label
      data-slot="file-field"
      data-size={size}
      className={cn(
        "flex items-center gap-3 rounded-full border border-border bg-background cursor-pointer",
        "hover:border-foreground/30 state-fade focus-within:border-ring focus-ring-within",
        CONTROL_SIZE[size],
        step.pad,
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 shrink-0 rounded-full font-medium",
          "bg-secondary text-secondary-foreground",
          step.pill,
        )}
      >
        <Upload className="size-3.5" />
        {label}
      </span>
      {/* The filename is the field's VALUE, so it reads like one: muted while
          empty, foreground once there is something to name. */}
      <span
        className={cn(
          "flex-1 min-w-0 truncate text-xsmall",
          fileName ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {fileName ?? placeholder}
      </span>
      <input type="file" className="sr-only" {...props} />
    </label>
  )
}
