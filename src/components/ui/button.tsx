"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — pill shape, Founders Grotesk, smooth transitions
  // Note: font weight is set per-size (sm = font-normal, all others = font-medium)
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent bg-clip-padding whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 pb-px",
  {
    variants: {
      variant: {
        // Primary — deep blue
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover",
        // Secondary — light surface, always solid foreground text
        secondary:
          "bg-secondary text-foreground hover:bg-secondary-hover",
        // Outline — border only, primary text
        outline:
          "border-border bg-background text-foreground hover:bg-muted hover:border-foreground/30",
        // Primary outline — border, primary text
        "outline-primary":
          "border-border bg-background text-primary hover:bg-muted hover:border-foreground/30",
        // Ghost — bg-clip-border so fill reaches the outer edge
        ghost:
          "hover:bg-accent text-foreground bg-clip-border",
        // Link
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
        // Destructive
        destructive:
          "bg-destructive text-white hover:bg-destructive/85",
      },
      size: {
        // Figma node 37:931 — exact px values:
        //   sm:      h-8  (32px) · px-3  · text-xs · font-normal
        //   default: h-10 (40px) · px-[18px] · text-sm · font-medium  ← matches input/select/datepicker
        //   lg:      h-11 (44px) · px-[34px] · text-sm · font-medium
        //   xl:      h-12 (48px) · px-10 · text-sm · font-medium
        //   icon:    size-10 (40px)
        //   icon-sm: size-8  (32px)
        //   icon-lg: size-11 (44px)
        //   icon-xl: size-12 (48px)
        default:    "h-10 px-[18px] text-sm font-medium",
        sm:         "h-8 px-3 text-xxs font-normal",
        lg:         "h-11 px-[34px] text-sm font-medium",
        xl:         "h-12 px-10 text-sm font-medium",
        icon:       "size-10",
        "icon-sm":  "size-8",
        "icon-lg":  "size-11",
        "icon-xl":  "size-12",
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
