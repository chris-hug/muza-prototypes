"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── Tabs ─────────────────────────────────────────────────────────────────────
//
// Figma sources:
//   Variant 1 (pill/segment): nodes 19829:35, 19829:30
//   Variant 2 (underline):    node 21002:3836
//
// Variants:
//   default — pill/segment style: tabs sit inside a muted rounded container
//   line    — underline style: bottom border indicator, transparent container
//   pill    — each tab is its own rounded-full pill with bg on active
// ─────────────────────────────────────────────────────────────────────────────

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center",
  {
    variants: {
      variant: {
        // Pill/segment — tabs inside a muted background container
        default:
          "rounded-full bg-muted p-1 text-muted-foreground gap-0",
        // Underline — transparent container, bottom-border active indicator
        line:
          "rounded-none bg-transparent gap-2 text-muted-foreground",
        // Pill — each tab is its own pill (no container background)
        pill:
          "rounded-none bg-transparent gap-1.5 text-muted-foreground",
      },
      size: {
        sm:      "",
        default: "",
        lg:      "",
      },
    },
    compoundVariants: [
      { variant: "default", size: "sm",      className: "h-[40px]" },
      { variant: "default", size: "default", className: "h-12" },
      { variant: "default", size: "lg",      className: "h-[52px]" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  size = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-size={variant === "default" ? size : undefined}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Base
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-all outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        // ── Default variant (segment/pill within muted bg) ──────────────
        "group-data-[variant=default]/tabs-list:flex-1 group-data-[variant=default]/tabs-list:h-full",
        "group-data-[variant=default]/tabs-list:rounded-full",
        // Size-specific padding & typography (only applied when variant=default since data-size is only set then)
        "group-data-[size=sm]/tabs-list:px-3 group-data-[size=sm]/tabs-list:text-xxs group-data-[size=sm]/tabs-list:font-normal",
        "group-data-[size=default]/tabs-list:px-6 group-data-[size=default]/tabs-list:text-sm group-data-[size=default]/tabs-list:font-normal",
        "group-data-[size=lg]/tabs-list:px-8 group-data-[size=lg]/tabs-list:text-sm group-data-[size=lg]/tabs-list:font-medium",
        "group-data-[variant=default]/tabs-list:text-muted-foreground",
        "group-data-[variant=default]/tabs-list:hover:text-foreground",
        // Active: white bg + border
        "group-data-[variant=default]/tabs-list:data-active:bg-background",
        "group-data-[variant=default]/tabs-list:data-active:border group-data-[variant=default]/tabs-list:data-active:border-border",
        "group-data-[variant=default]/tabs-list:data-active:text-foreground",
        // Dark active
        "dark:group-data-[variant=default]/tabs-list:data-active:bg-input/30",

        // ── Line/underline variant ──────────────────────────────────────
        "group-data-[variant=line]/tabs-list:rounded-none",
        "group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:pb-3 group-data-[variant=line]/tabs-list:pt-0",
        "group-data-[variant=line]/tabs-list:text-sm",
        "group-data-[variant=line]/tabs-list:text-muted-foreground",
        "group-data-[variant=line]/tabs-list:hover:text-foreground",
        // Active: just foreground text + bottom border
        "group-data-[variant=line]/tabs-list:data-active:text-foreground",
        "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        // The underline indicator
        "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity",

        // ── Pill variant ────────────────────────────────────────────────
        "group-data-[variant=pill]/tabs-list:rounded-full",
        "group-data-[variant=pill]/tabs-list:h-[38px] group-data-[variant=pill]/tabs-list:px-[18px]",
        "group-data-[variant=pill]/tabs-list:text-sm group-data-[variant=pill]/tabs-list:font-medium",
        "group-data-[variant=pill]/tabs-list:text-muted-foreground",
        "group-data-[variant=pill]/tabs-list:hover:bg-muted",
        "group-data-[variant=pill]/tabs-list:hover:text-foreground",
        "group-data-[variant=pill]/tabs-list:data-active:bg-accent",
        "group-data-[variant=pill]/tabs-list:data-active:text-foreground",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
