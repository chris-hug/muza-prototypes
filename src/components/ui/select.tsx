"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { CONTROL_SIZE, CONTROL_PAD_Y, type ControlSize } from "@/lib/control-size"
import { useIsMobile } from "@/lib/use-media-query"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

/*
 * Below the presentation gate a Select opens as a BOTTOM SHEET, the way every
 * menu in the app does. It used to be the exception: a 9rem dropdown anchored
 * to its trigger, with 1.5-line rows, on a touch screen.
 *
 * Unlike `DropdownMenu`, this is done by RESTYLING the primitive rather than
 * swapping the root for a `Sheet`. A menu is a list of commands, so swapping
 * it costs nothing; a Select owns a VALUE — `Select.Value` renders the chosen
 * item's text, typeahead jumps to it, `ItemIndicator` ticks it. Re-housing all
 * of that in a Sheet would mean re-implementing it, and the copy would drift.
 *
 * The one thing in the way is that Base UI positions the popup with an inline
 * `style`. An `!important` declaration in a stylesheet beats a non-important
 * inline style, which is what these arbitrary utilities are for — the sheet
 * geometry wins, the behaviour is untouched.
 */
const sheetPositionerClass =
  // Tailwind v4 marks a utility important with a TRAILING `!`, not with
  // `!important` inside the brackets — the latter silently produces no rule.
  "[position:fixed]! [inset:auto_0_0_0]! [transform:none]! " +
  "[min-width:0]! [max-width:100%]! [width:100%]!"

const sheetPopupClass =
  "[width:100%]! [max-width:100%]! [max-height:75svh]! " +
  "rounded-b-none rounded-t-2xl border-t border-border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] " +
  "shadow-[0_-8px_32px_rgba(0,0,0,0.18)]"

/*
 * Label map — why the trigger showed "a01" instead of "A Love Supreme".
 *
 * Base UI's `Select.Value` renders the raw VALUE unless the root is given an
 * `items` map of value → label. Not one of the eleven `Select`s in this repo
 * passed one, so every trigger printed its own id back at you the moment
 * something was picked — and a `defaultValue` showed an id from the start.
 *
 * Fixing it at eleven call sites would fix it eleven times and let the twelfth
 * bring it back, so the map is built here instead, by walking the elements
 * handed to `<Select>` and reading each `SelectItem`'s `value` and children.
 *
 * It has to be the ELEMENT TREE and not a mount-time registry: the popup is
 * not rendered while the Select is closed (`keepMounted` on the Portal does
 * not change that), so items have never mounted when the trigger first paints.
 * JSX children exist as objects either way, so this sees them all — including
 * the ones inside a `SelectGroup`, hence the recursion.
 */
function collectItemLabels(
  node: React.ReactNode,
  into: Record<string, React.ReactNode> = {},
): Record<string, React.ReactNode> {
  React.Children.forEach(node, child => {
    if (!React.isValidElement(child)) return
    const props = child.props as { value?: unknown; children?: React.ReactNode }
    if (child.type === SelectItem && props.value != null) {
      into[String(props.value)] = props.children
    }
    if (props.children) collectItemLabels(props.children, into)
  })
  return into
}

const SelectLabelsContext = React.createContext<Record<string, React.ReactNode>>({})

function Select({ children, ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  const items = React.useMemo(() => collectItemLabels(children), [children])
  return (
    <SelectLabelsContext.Provider value={items}>
      {/* `items` is passed too, and not only for the label: it is what lets
          typeahead match on "A Love Supreme" rather than on "a03". */}
      <SelectPrimitive.Root items={items} {...props}>
        {children}
      </SelectPrimitive.Root>
    </SelectLabelsContext.Provider>
  )
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, children, placeholder, ...props }: SelectPrimitive.Value.Props) {
  const labels = React.useContext(SelectLabelsContext)
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      placeholder={placeholder}
      {...props}
    >
      {/* `items` alone is not enough. It resolves the value the Select STARTS
          with, but once the user picks something the primitive reads the label
          off the selected item — and that item unmounts with the popup, so the
          trigger fell back to the raw id the moment the list closed. Resolving
          it here works in both cases, because the map comes from the element
          tree rather than from anything mounted.

          Passing a render function takes placeholder duty over from the
          primitive, so the empty case is handled first. A caller's own node or
          function still wins over all of it. */}
      {children ?? ((value: unknown) => {
        if (value == null || value === "") return placeholder
        const key = String(value)
        return key in labels ? labels[key] : (value as React.ReactNode)
      })}
    </SelectPrimitive.Value>
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: ControlSize
}) {
  const mobile = useIsMobile()
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // The shared form-control recipe — see the "Form controls" section of
        // DESIGN_SYSTEM.md. (This line claimed `rounded-xl, text-base` for years
        // while the class beside it said `rounded-full` and `text-small`.)
        "flex w-fit items-center justify-between gap-1.5 rounded-full border border-border hover:border-foreground/30 bg-background pr-2 font-normal whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        /* Height + type + the optical lift come from the shared ladder, so a
           trigger is the same row as the Input and the Button beside it. Only
           the LEFT padding is taken from it — the right edge is `pr-2`, flush
           to the chevron, at every step. */
        CONTROL_SIZE[size],
        CONTROL_PAD_Y[size],
        { sm: "pl-3", default: "pl-4", lg: "pl-5" }[size],
        /* Full width on a phone. `w-fit` above is a desktop habit: it sizes
           the control to its longest option, which on a 296px column leaves a
           stubby pill in a form whose every other field runs edge to edge —
           and a tap target narrower than it needs to be. Placed AFTER the base
           string so tailwind-merge drops `w-fit`, and BEFORE `className` so a
           caller can still override it. */
        mobile && "w-full",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none relative top-[2px] size-4 text-muted-foreground transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  const mobile = useIsMobile()
  return (
    <SelectPrimitive.Portal keepMounted>
      <>
      {/* The scrim, and the primitive's own — not a hand-rolled div, so it
          keeps the open/close state and the click-to-dismiss that come with
          it. A sheet covers most of the screen, so the page behind it has to
          recede; a dropdown anchored to its trigger needs no separation, so
          on desktop this renders nothing. */}
      {mobile && (
        <SelectPrimitive.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-150 data-open:opacity-100 data-closed:opacity-0" />
      )}
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className={cn("isolate z-50", mobile && sheetPositionerClass)}
      >
        {/* Width: at LEAST the trigger, never exactly the trigger. It was
            `w-(--anchor-width)`, so the list inherited the trigger's width —
            and the trigger is `w-fit`, sized to whatever happens to be
            selected. Pick a short album and the popup shrank to it, clipping
            "A Love Supreme" and "Maiden Voyage" mid-word, because the item
            text is `whitespace-nowrap` inside an `overflow-x-hidden` popup.
            The floor keeps it from being narrower than its trigger; the cap
            keeps a long title from running to the screen edge. */}
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn("relative isolate z-50 max-h-(--available-height) min-w-[max(9rem,var(--anchor-width))] max-w-[min(28rem,var(--available-width))] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            mobile && sheetPopupClass,
            className)}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
      </>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xsmall text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  const mobile = useIsMobile()
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-lg py-1.5 pr-8 pl-3 text-small font-normal outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        /* A finger needs more than a 1.5-line row. Same 44px-ish target the
           bottom-sheet menu rows use, so the two surfaces feel like one. */
        mobile && "min-h-11 py-2.5 pl-4 pr-10",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 items-center gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
