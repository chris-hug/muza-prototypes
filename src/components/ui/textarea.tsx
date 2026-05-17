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

const FIELD_CLS =
  "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-small dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

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
