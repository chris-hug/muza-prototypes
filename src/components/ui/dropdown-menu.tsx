"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"
import { ChevronRightIcon, CheckIcon } from "lucide-react"
import { useIsMobile } from "@/lib/use-media-query"
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet"

// On mobile every dropdown menu is presented as a bottom sheet instead
// of a popover (bigger touch targets, thumb-reachable, native-feeling).
// The Root swaps to a Drawer and flags the subtree via this context, so
// Trigger / Content / Item / Separator / Label each render their sheet
// equivalent. Desktop (the default "dropdown" mode) is untouched.
const MenuModeContext = React.createContext<"dropdown" | "sheet">("dropdown")

function DropdownMenu({ open, onOpenChange, defaultOpen, children, ...props }: MenuPrimitive.Root.Props) {
  const mobile = useIsMobile()
  if (mobile) {
    return (
      <MenuModeContext.Provider value="sheet">
        <Sheet
          swipeDirection="down"
          open={open as boolean | undefined}
          onOpenChange={onOpenChange as ((open: boolean) => void) | undefined}
          defaultOpen={defaultOpen as boolean | undefined}
        >
          {children}
        </Sheet>
      </MenuModeContext.Provider>
    )
  }
  return (
    <MenuModeContext.Provider value="dropdown">
      <MenuPrimitive.Root
        data-slot="dropdown-menu"
        open={open}
        onOpenChange={onOpenChange}
        defaultOpen={defaultOpen}
        {...props}
      >
        {children}
      </MenuPrimitive.Root>
    </MenuModeContext.Provider>
  )
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  const mode = React.useContext(MenuModeContext)
  if (mode === "sheet") {
    return <SheetTrigger data-slot="dropdown-menu-trigger" {...(props as React.ComponentProps<typeof SheetTrigger>)} />
  }
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  children,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const mode = React.useContext(MenuModeContext)
  if (mode === "sheet") {
    return (
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "rounded-t-2xl px-2 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] max-h-[80vh]",
          className,
        )}
      >
        {/* Drag handle — affordance for swipe-to-dismiss. */}
        <div aria-hidden className="mx-auto mb-2 h-1 w-9 shrink-0 rounded-full bg-border" />
        <SheetTitle className="sr-only">Actions</SheetTitle>
        <div className="flex flex-col overflow-y-auto">{children}</div>
      </SheetContent>
    )
  }
  return (
    <MenuPrimitive.Portal keepMounted>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          // Contain pointer/click events. React bubbles synthetic events
          // through the COMPONENT tree, so without this a menu item's
          // pointerup would bubble (via the portal) up to an ancestor
          // card's tap-to-open gesture and wrongly navigate.
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          className={cn("z-50 max-h-(--available-height) min-w-44 w-max origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95", className )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean
}) {
  const mode = React.useContext(MenuModeContext)
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        mode === "sheet"
          ? "px-3 pt-2 pb-1 text-xsmall font-normal text-muted-foreground"
          : "px-2.5 py-1.5 text-xsmall font-normal text-muted-foreground data-inset:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  children,
  onClick,
  disabled,
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  const mode = React.useContext(MenuModeContext)
  if (mode === "sheet") {
    // Big tappable row inside the bottom sheet; selecting it closes the
    // sheet (SheetClose) and runs the item's handler.
    return (
      <SheetClose
        disabled={disabled}
        render={
          <button
            type="button"
            onClick={onClick as React.MouseEventHandler<HTMLButtonElement> | undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-normal text-foreground text-left transition-colors active:bg-muted [@media(hover:hover)]:hover:bg-muted outline-none focus-visible:bg-muted disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
              variant === "destructive" && "text-destructive [&_svg]:text-destructive",
              className,
            )}
          />
        }
      >
        {children}
      </SheetClose>
    )
  }
  return (
    <MenuPrimitive.Item
      onClick={onClick}
      disabled={disabled}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-base font-normal outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.Item>
  )
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-base font-normal outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:pl-8 data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn("w-auto min-w-[96px] rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95", className )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-lg py-1.5 pr-8 pl-2.5 text-base font-normal outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon
          />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-lg py-1.5 pr-8 pl-2.5 text-base font-normal outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon
          />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  const mode = React.useContext(MenuModeContext)
  if (mode === "sheet") {
    return <div data-slot="dropdown-menu-separator" className={cn("my-1 h-px bg-border", className)} />
  }
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xsmall tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
