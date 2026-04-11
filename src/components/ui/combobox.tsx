"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Combobox ─────────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 430:4114
//
// A searchable dropdown select. Built on @base-ui/react/combobox.
//
// Usage:
//   <Combobox>
//     <ComboboxTrigger placeholder="Select genre…" />
//     <ComboboxContent>
//       <ComboboxItem value="hip-hop">Hip-Hop</ComboboxItem>
//       <ComboboxItem value="electronic">Electronic</ComboboxItem>
//     </ComboboxContent>
//   </Combobox>
// ─────────────────────────────────────────────────────────────────────────────

const Combobox = ComboboxPrimitive.Root

const ComboboxValue = ComboboxPrimitive.Value

interface ComboboxTriggerProps {
  placeholder?: string
  className?: string
  showSearchIcon?: boolean
}

function ComboboxTrigger({ className, placeholder, showSearchIcon = true }: ComboboxTriggerProps) {
  return (
    <ComboboxPrimitive.InputGroup
      className={cn(
        "relative flex w-full items-center",
        "rounded-full border border-border bg-background",
        "h-10 px-3 pt-[6px] pb-[10px] gap-2",
        "hover:border-foreground/30",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "transition-colors",
        className
      )}
    >
      {showSearchIcon && <SearchIcon className="size-4 shrink-0 text-muted-foreground pointer-events-none translate-y-[2px]" />}
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent text-base font-normal text-foreground outline-none",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
      <ComboboxPrimitive.Trigger
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        <ChevronDownIcon className="size-4 translate-y-[2px]" />
      </ComboboxPrimitive.Trigger>
    </ComboboxPrimitive.InputGroup>
  )
}

function ComboboxContent({
  className,
  children,
  sideOffset = 4,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, "sideOffset">) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        className="isolate z-50"
        sideOffset={sideOffset}
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "isolate z-50 w-(--anchor-width) min-w-48",
            "origin-(--transform-origin) overflow-hidden",
            "rounded-xl bg-popover p-1 text-popover-foreground",
            "shadow-md ring-1 ring-foreground/10",
            "duration-100",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            className
          )}
          {...props}
        >
          <ComboboxPrimitive.List>{children}</ComboboxPrimitive.List>
          <ComboboxPrimitive.Empty className="py-4 text-center text-sm text-muted-foreground">
            No results found.
          </ComboboxPrimitive.Empty>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn("", className)}
      {...props}
    />
  )
}

function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-group-label"
      className={cn("px-2.5 py-1.5 text-xs font-normal text-muted-foreground", className)}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  hideIndicator,
  ...props
}: ComboboxPrimitive.Item.Props & { hideIndicator?: boolean }) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2",
        "rounded-lg px-2.5 py-1.5",
        "text-base font-normal outline-none select-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      {!hideIndicator && (
        <ComboboxPrimitive.ItemIndicator className="ml-auto">
          <CheckIcon className="size-4" />
        </ComboboxPrimitive.ItemIndicator>
      )}
    </ComboboxPrimitive.Item>
  )
}

function ComboboxSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  Combobox,
  ComboboxValue,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxSeparator,
}
