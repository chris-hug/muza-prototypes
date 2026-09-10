import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { Field } from "@base-ui/react/field"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { CONTROL_SIZE, CONTROL_PAD_X, CONTROL_PAD_Y, type ControlSize } from "@/lib/control-size"

// ─── Input ────────────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 65:533
//
// Spec:
//   bg-background · border border-border · rounded-full
//   text-small font-normal · placeholder:text-muted-foreground
//   height: 40px (h-10)
//
// When `hint` is provided, the field wraps in a base-ui Field.Root so the
// hint inherits its id and the input gets `aria-describedby` automatically.
// `hintTone="error"` uses Field.Error so screen readers treat it as a
// validation message.
// ─────────────────────────────────────────────────────────────────────────────

/* `size` is omitted from the native props: on an `<input>` that attribute is a
   NUMBER (visible character width), and ours is the design-system ladder. */
interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  /** Helper / constraint text rendered tightly below the field. Use for
   *  things like "$20 or more", "Used as your URL slug", "Max 280 chars". */
  hint?: React.ReactNode
  /** Tone of the hint. `error` flips it destructive and routes through
   *  Field.Error (announced as a validation message by screen readers). */
  hintTone?: "default" | "error"
  /** Height + type size. The same ladder as `Button` and `SelectTrigger`, so a
   *  field lines up with the button next to it. */
  size?: ControlSize
  /** Leading glyph inside the field (e.g. a search icon). Adds left padding. */
  startIcon?: React.ReactNode
  /** Shows a clear (✕) button whenever `value` is non-empty. */
  onClear?: () => void
}

/*
 * Size ladder — the SAME steps as `Button` and `SelectTrigger`, so a field and
 * the button beside it are one row rather than two guesses:
 *
 *   sm       h-8  (32px)  text-2xsmall
 *   default  h-10 (40px)  text-small
 *   lg       h-12 (48px)  text-small
 *
 * The default text size used to be `text-base` (21px) while every other form
 * control sat at `text-small` (19px) — `button.tsx` even claimed the match in
 * a comment ("matches input/select/datepicker") that was not true of Input.
 * The product had already voted: `text-small font-normal` appeared 42 times at
 * call sites, across nine files, purely to undo this default. Those overrides
 * are now redundant and should go as their files are touched.
 */
const SIZE_CLS: Record<ControlSize, string> = {
  sm:      cn(CONTROL_SIZE.sm,      CONTROL_PAD_X.sm,      CONTROL_PAD_Y.sm),
  default: cn(CONTROL_SIZE.default, CONTROL_PAD_X.default, CONTROL_PAD_Y.default),
  lg:      cn(CONTROL_SIZE.lg,      CONTROL_PAD_X.lg,      CONTROL_PAD_Y.lg),
}

const FIELD_CLS =
  // Layout
  "w-full min-w-0 " +
  // Shape
  "rounded-full border border-border hover:border-foreground/30 " +
  // Surface — the optical-centring padding comes from the ladder (it differs
  // per step), so FIELD_CLS carries only what every step shares.
  "bg-background " +
  // Typography
  "font-normal text-foreground " +
  "placeholder:text-muted-foreground " +
  // Transitions
  "transition-colors outline-none " +
  // File input
  "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-small file:font-medium file:text-foreground " +
  // Focus
  "focus-visible:border-ring focus-ring " +
  // Disabled
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 " +
  // Invalid
  "aria-invalid:border-destructive invalid-ring " +
  "dark:aria-invalid:border-destructive/50"

const HINT_CLS = "text-2xsmall leading-snug"

function Input({
  className, type, size = "lg", hint, hintTone = "default", startIcon, onClear, ...props
}: InputProps) {
  const showClear = !!onClear && !!props.value

  let field = (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        FIELD_CLS,
        SIZE_CLS[size],
        // Reserve room for the affordances that overlay the field.
        startIcon && "pl-10",
        showClear && "pr-10",
        className,
      )}
      {...props}
    />
  )

  // Leading icon and/or trailing clear — both overlay the field, so wrap it
  // in a relative box. Purely additive: without either prop nothing changes.
  if (startIcon || onClear) {
    // `min-w-0` so the wrapper can shrink inside grid/flex parents (a grid item
    // defaults to min-width:auto and would otherwise force overflow).
    field = (
      <div data-slot="input-affordances" className="relative w-full min-w-0">
        {startIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4"
          >
            {startIcon}
          </span>
        )}
        {field}
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:text-foreground [&_svg]:size-4"
          >
            <X />
          </button>
        )}
      </div>
    )
  }

  // No hint → bare field, zero impact on existing call-sites.
  if (!hint) return field

  // With hint → base-ui Field.Root provides the context that wires the
  // hint's id into the input's `aria-describedby` automatically. Errors
  // route through Field.Error so screen readers treat them as validation.
  return (
    <Field.Root data-slot="input-wrapper" className="flex flex-col gap-1.5 w-full">
      {field}
      {hintTone === "error" ? (
        <Field.Error
          data-slot="input-hint"
          match={true}
          className={cn(HINT_CLS, "text-destructive")}
        >
          {hint}
        </Field.Error>
      ) : (
        <Field.Description
          data-slot="input-hint"
          className={cn(HINT_CLS, "text-muted-foreground")}
        >
          {hint}
        </Field.Description>
      )}
    </Field.Root>
  )
}

export { Input }
export type { InputProps }
