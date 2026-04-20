"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — pill shape, Founders Grotesk, smooth transitions
  // Note: font weight is set per-size (sm = font-normal, all others = font-medium)
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border bg-clip-padding whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 pb-px",
  {
    variants: {
      variant: {
        // Primary — deep blue
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
        // Secondary — light surface, always solid foreground text
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        // Outline — border + frosted-glass fill. On a solid background this
        // is indistinguishable from the old solid-fill outline; on varied
        // backdrops (photos, gradients) the 20% bg + backdrop-blur reveal a
        // proper glass effect.
        outline:
          "border-border bg-background/20 backdrop-blur-lg text-foreground hover:bg-muted hover:border-foreground/30",
        // Primary outline — same glass treatment, primary text colour.
        "outline-primary":
          "border-border bg-background/20 backdrop-blur-lg text-primary hover:bg-muted hover:border-foreground/30",
        // Ghost — bg-clip-border so fill reaches the outer edge
        ghost:
          "border-transparent hover:bg-accent text-foreground bg-clip-border",
        // Link
        link:
          "border-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
        // Destructive
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/85",
      },
      size: {
        // Figma node 37:931 — exact px values:
        //   sm:      h-8  (32px) · px-3  · text-xsmall · font-normal
        //   default: h-10 (40px) · px-[18px] · text-small · font-medium  ← matches input/select/datepicker
        //   lg:      h-12 (48px) · px-10 · text-small · font-medium
        //   icon:    size-10 (40px)
        //   icon-sm: size-8  (32px)
        //   icon-lg: size-12 (48px)
        default:    "h-10 px-[18px] text-small font-medium",
        sm:         "h-8 px-3 text-2xsmall font-normal",
        lg:         "h-12 px-10 text-small font-medium",
        icon:       "size-10",
        "icon-sm":  "size-8",
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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
