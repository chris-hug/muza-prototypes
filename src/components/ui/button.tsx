"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — pill shape, Founders Grotesk, smooth transitions
  // Note: font weight is set per-size (sm = font-normal, all others = font-medium)
  // The press is a COLOUR step, never geometry. Each variant darkens one
  // stop past its own hover, so hover and press stay distinguishable and the
  // button never moves.
  //
  // Geometry was tried twice and measured out both times. A scale is a ratio,
  // and this ladder runs 24px to 398px wide: at a flat 0.97 the narrowest
  // button's edge travelled 0.36px and the widest 5.97px. Staggering the
  // factor per size equalised the height and left the real fault — inside ONE
  // button the contents spread, because every point moves in proportion to its
  // distance from the centre. Measured on Pagination's "Previous" (118 x 40):
  // the chevron at the left edge travelled 2.01px, the label beside it 0.30px,
  // so it read as the icon sliding rather than the button shrinking. A 1px
  // nudge fixes the spread but is its own kind of cheap.
  //
  // Colour has no size. A 24px icon button and a 398px call to action answer
  // with exactly the same step. Both references measured do the same: TIDAL
  // transitions `color, background-color` and has no geometric press at all;
  // Apple Music has 30 `:active` rules of which 19 are background and exactly
  // one is a transform — `scale(0.9)` on a 24px square transport button, the
  // one shape where a scale cannot spread.
  //
  // The transition itself now lives in `state-fade` (app.css) — the same one
  // every bespoke control uses, so hover and press read identically whether
  // you are over a Button or over a menu item next to it. `box-shadow` is
  // deliberately kept out of that list: the focus ring is a box-shadow, so
  // listing it repaints the ring region frame by frame under every press.
  //
  // Every button presses, menu and dialog triggers included.
  // `disabled:opacity-50` is the base answer and the right one for a button
  // made of ink — link, ghost, outline. The three FILLED variants override it
  // with `.disabled-solid` (app.css), which mixes the same result out of
  // colour instead: opacity would make the pill translucent, and a
  // translucent pill is only "faded" when something solid happens to be
  // behind it. See the rule for why that kept coming back.
  "group/button press-ripple relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full border bg-clip-padding whitespace-nowrap state-fade outline-none select-none focus-visible:border-ring focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 pb-px",
  {
    variants: {
      variant: {
        // Primary — deep blue
        default:
          "disabled-solid [--solid-fill:var(--primary)] [--solid-ink:var(--primary-foreground)] " +
          "border-transparent bg-primary text-primary-foreground [--hover-fill:var(--primary-hover)] [--press-fill:var(--primary-active)] [--press-ink:color-mix(in_srgb,var(--primary-foreground)_60%,transparent)]",
        // Secondary — light surface, always solid foreground text
        secondary:
          "disabled-solid [--solid-fill:var(--secondary)] [--solid-ink:var(--secondary-foreground)] " +
          "border-transparent bg-secondary text-secondary-foreground [--hover-fill:var(--secondary-hover)] [--press-fill:var(--press-on-secondary)] [--press-ink:color-mix(in_srgb,var(--secondary-foreground)_60%,transparent)]",
        // Outline — border + frosted-glass fill. On a solid background this
        // is indistinguishable from the old solid-fill outline; on varied
        // backdrops (photos, gradients) the 20% bg + backdrop-blur reveal a
        // proper glass effect.
        outline:
          "border-border bg-background/20 backdrop-blur-lg text-foreground [--hover-fill:var(--muted)] hover:border-foreground/30 active:border-foreground/30 [--press-fill:var(--press-on-muted)] [--press-ink:color-mix(in_srgb,var(--foreground)_60%,transparent)]",
        // Primary outline — same glass treatment, primary INK (legible on
        // dark — see --primary-text), not the solid-fill --primary.
        "outline-primary":
          "border-border bg-background/20 backdrop-blur-lg text-primary-text [--hover-fill:var(--muted)] hover:border-foreground/30 active:border-foreground/30 [--press-fill:var(--press-on-muted)] [--press-ink:color-mix(in_srgb,var(--primary-text)_60%,transparent)]",
        // Ghost — bg-clip-border so fill reaches the outer edge
        ghost:
          "border-transparent [--hover-fill:var(--accent)] text-foreground bg-clip-border [--press-fill:var(--press-on-accent)] [--press-ink:color-mix(in_srgb,var(--foreground)_60%,transparent)]",
        // Link — primary INK (legible on dark)
        link:
          "border-transparent text-primary-text link-underline [--press-ink:color-mix(in_srgb,var(--primary-text)_60%,transparent)]",
        // Destructive
        destructive:
          "disabled-solid [--solid-fill:var(--destructive)] [--solid-ink:var(--destructive-foreground)] " +
          "border-transparent bg-destructive text-destructive-foreground [--hover-fill:var(--destructive-hover)] [--press-fill:var(--destructive-active)] [--press-ink:color-mix(in_srgb,var(--destructive-foreground)_60%,transparent)]",
      },
      size: {
        // Figma node 37:931 — exact px values:
        //   sm:      h-8  (32px) · px-3  · text-2xsmall · font-normal
        //   default: h-10 (40px) · px-[18px] · text-small · font-medium  ← the shared
        //            form-control ladder: Input, SelectTrigger, Textarea, ChipInput,
        //            DatePicker and Combobox all sit at h-10 / text-small here.
        //   lg:      h-12 (48px) · px-10 · text-small · font-medium
        //   icon:    size-10 (40px)
        //   icon-sm: size-8  (32px)
        //   icon-lg: size-12 (48px)
        // The 40px size carries an OPTICAL centring, not a geometric one.
        // Founders Grotesk at 19/28.5 puts the cap block 17.53px below the top
        // of the pill and the baseline 10.50px above the bottom — measured, on
        // this font, in this size. Centred by the line box, so the browser is
        // right and it still reads 3.5px low, because the eye centres on the
        // caps and not on the ascender/descender space around them.
        // `padding-bottom` shifts a centred flex child up by half its value,
        // and the base already spends 1px of it: 3px = 1px up. 2px was tried
        // first and read as too high — the caps clear the optical centre and
        // the descenders ("Primary", "y") drag the eye back down, so the label
        // ends up fighting itself. 1px is the whole correction. Only this
        // size: `sm`/`lg` are a different metric, and the icon sizes have no
        // baseline to answer to.
        default:    "h-10 px-[18px] text-small font-medium pb-[3px]",
        sm:         "h-8 px-3 text-2xsmall font-normal",
        lg:         "h-12 px-10 text-small font-medium",
        icon:       "size-10",
        // 32px visual, 40×40 hit area via pseudo-element (skill: 40×40 min).
        // The `relative` on the base + `after:absolute -inset-1` extends the
        // clickable region by 4px on each side without affecting layout.
        "icon-sm":  "size-8 after:absolute after:-inset-1 after:content-['']",
        "icon-lg":  "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      // `link` is text, not a box: it must shed the size class's height and
      // padding. Doing it inside the variant does NOT work — cva emits the
      // variant classes BEFORE the size classes, so tailwind-merge drops the
      // variant's `h-auto`/`p-0` and the link ends up 40px tall with 18px of
      // side padding. Appending here puts it last, where it wins.
      className={cn(
        buttonVariants({ variant, size }),
        variant === "link" && size !== "default" && "h-auto p-0",
        // …but it still has to sit on the SAME baseline as the pills it stands
        // next to. Shedding the height makes the link a 30.5px box in a row of
        // 40px ones, and `items-center` then centres the smaller box: measured
        // 2.5px below every other label. The pills buy their 1px of optical
        // lift with `padding-bottom`; the link buys the matching 1.5px the same
        // way, since half of its own bottom padding is exactly what a centred
        // box gives back. Spelled out as four sides rather than `p-0` plus a
        // `pb-*` patch: tailwind-merge keeps both, and the shorthand wins in
        // the emitted sheet, so the patch measured as zero. Default size only,
        // like the lift itself.
        variant === "link" && size === "default" && "h-auto px-0 pt-0 pb-[3px]",
        className,
      )}
      {...props}
    />
  )
}

export { Button, buttonVariants }
