import * as React from "react"

import { cn } from "@/lib/utils"

// ─── Textarea ─────────────────────────────────────────────────────────────────
//
// Mirrors Input's `hint` / `hintTone` API so helper + validation copy is
// consistent across form controls. base-ui has no Textarea primitive (and
// wrapping a native textarea in Field.Control intercepts its `value` /
// `placeholder` props), so we wire `aria-describedby` to the hint manually
// via `useId` — same a11y outcome, no prop hijacking.
// ─────────────────────────────────────────────────────────────────────────────

interface TextareaProps extends React.ComponentProps<"textarea"> {
  /** Helper / constraint text rendered tightly below the field. */
  hint?: React.ReactNode
  /** `error` flips it destructive. */
  hintTone?: "default" | "error"
}

/*
 * The shared form-control recipe, minus the two things a textarea is not.
 *
 * KEEPS its own: `rounded-lg` rather than `rounded-full` (a pill cannot hold
 * more than one line), and no `size` prop — the ladder is about matching the
 * button beside you, and a textarea has no peer to match. `min-h-16` (64px)
 * is a floor that reads as "more than one line" before anything is typed;
 * `field-sizing-content` grows it from there.
 *
 * TAKES everything else, which it did not until now. Four values had drifted,
 * all of them visible the moment a Textarea sits under an Input in the same
 * form — which is the only place it ever sits:
 *
 *   border-input  → border-border   a lighter border than the field above it
 *   bg-transparent → bg-background  the family paints its surface
 *   px-2.5 (10px) → px-4 (16px)     the placeholder started 6px to the left
 *   (none)        → hover:border-foreground/30
 */
const FIELD_CLS =
  "flex field-sizing-content min-h-16 w-full rounded-lg border border-border hover:border-foreground/30 bg-background px-4 py-2 text-small font-normal transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

const HINT_CLS = "text-2xsmall leading-snug"

function Textarea({ className, hint, hintTone = "default", "aria-describedby": ariaDescribedBy, ...props }: TextareaProps) {
  const hintId = React.useId()
  const describedBy = hint
    ? [ariaDescribedBy, hintId].filter(Boolean).join(" ")
    : ariaDescribedBy

  const field = (
    <textarea
      data-slot="textarea"
      aria-describedby={describedBy}
      aria-invalid={hintTone === "error" ? true : props["aria-invalid"]}
      className={cn(FIELD_CLS, className)}
      {...props}
    />
  )

  if (!hint) return field

  return (
    <div data-slot="textarea-wrapper" className="flex flex-col gap-1.5 w-full">
      {field}
      <p
        id={hintId}
        data-slot="textarea-hint"
        className={cn(
          HINT_CLS,
          hintTone === "error" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {hint}
      </p>
    </div>
  )
}

export { Textarea }
export type { TextareaProps }
