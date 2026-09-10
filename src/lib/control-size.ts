/*
 * The control size ladder — one source for every form control and Button.
 *
 * Three steps, and the promise is simple: a control at `lg` is the same height
 * and the same type size as any other control at `lg`, so a field and the
 * button beside it are one row rather than two guesses.
 *
 *   sm       h-8   32px   text-2xsmall  16px
 *   default  h-10  40px   text-small    19px
 *   lg       h-12  48px   text-small    19px   ← what a field renders at
 *
 * `lg` is the step a form control takes when nobody chooses: `Input`,
 * `SelectTrigger`, `Combobox`, `ChipInput`, `DatePicker` and `InputSelect`
 * all default to it, and every button inside a form block is set to match.
 * `default` is still on the ladder and still reachable by prop — it was the
 * desktop-first number for something you type into on a phone.
 *
 * Type stops climbing at `default`. 19px is the body size of the whole form
 * family; `lg` is a bigger TARGET, not bigger text, and a 21px control label
 * beside a 19px one would reintroduce exactly the mismatch this ladder was
 * built to remove. `sm` drops one step to 16px because 19px in a 32px box
 * leaves no optical room.
 *
 * This module holds no horizontal padding for the *pill* controls: what sits
 * on the right edge differs per control (a chevron flush at `pr-2`, a search
 * icon on the left, nothing at all), so each one composes its own edge from
 * `PAD_X` or writes it directly. Height and type are the part that must match,
 * and that part lives here.
 *
 * Anything with a `size` prop writes it back as `data-size`, so the ladder can
 * be read off the DOM — that is how the design-system page measures a row of
 * controls without knowing which component drew each one.
 */

export type ControlSize = "sm" | "default" | "lg"

/** Height + type step. The part that MUST match across controls. */
export const CONTROL_SIZE: Record<ControlSize, string> = {
  sm: "h-8 text-2xsmall",
  default: "h-10 text-small",
  lg: "h-12 text-small",
}

/** Symmetric padding for a field with nothing on its edges. Grows with the
 *  pill so the text never drifts toward the curve. */
export const CONTROL_PAD_X: Record<ControlSize, string> = {
  sm: "px-3",
  default: "px-4",
  lg: "px-5",
}

/*
 * The 2px optical lift, per step.
 *
 * Founders Grotesk sits low in its em box, so symmetric padding leaves the
 * glyphs visibly below the centre of a pill. Every control in the family
 * corrects it by moving 2px of padding from the bottom to the top — that is
 * what `pt-[6px] pb-[10px]` is on a 40px field, and these are the same
 * correction at the other two heights.
 */
export const CONTROL_PAD_Y: Record<ControlSize, string> = {
  sm: "pt-1 pb-[6px]",
  default: "pt-[6px] pb-[10px]",
  lg: "pt-[10px] pb-[14px]",
}

/*
 * For controls whose height is built UP from their children rather than
 * declared — `ChipInput` is the only one — the child height and the wrapper
 * padding that lands the sum exactly on the ladder:
 *
 *   sm       24 + 2 + 4  + 2 border = 32
 *   default  28 + 3 + 7  + 2 border = 40
 *   lg       36 + 3 + 7  + 2 border = 48
 *
 * `min-h` is then a floor, not the thing doing the work. `ChipInput` measured
 * 46.5px for exactly as long as it was the other way around.
 */
export const CONTROL_STACK: Record<ControlSize, { min: string; pad: string; child: string }> = {
  sm:      { min: "min-h-8",  pad: "pt-[2px] pb-[4px]", child: "h-6" },
  default: { min: "min-h-10", pad: "pt-[3px] pb-[7px]", child: "h-7" },
  lg:      { min: "min-h-12", pad: "pt-[3px] pb-[7px]", child: "h-9" },
}
