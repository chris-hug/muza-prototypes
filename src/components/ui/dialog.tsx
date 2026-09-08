"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

// ─── Shared chrome class strings ─────────────────────────────────────────────
//
// Single source of truth for Dialog visuals. Both the live `DialogContent`
// (rendered through the portal) and the static `DialogPreview` (rendered
// inline for kitchen-sink / docs) consume the same constants — change one,
// both update.
//
// `dialogChromeClass` is everything that's NOT the fixed-positioning of the
// modal itself (size, surface, padding, typography). `dialogPositionClass`
// is the centred-fixed positioning. The live Popup uses both; the inline
// preview uses only the chrome.

export const dialogChromeClass =
  // `overflow-hidden` is the safety-net: it keeps any inner content
  // (long item titles, wide tables) from pushing the dialog past its
  // `max-w` cap and dragging the footer's negative margins with it.
  // Gutter is 12px on phones (matching `--page-px` at that width), 24px from
  // `sm` up. A bottom sheet spans the whole screen, so a 24px gutter costs
  // 48px of a 320–375px width — enough to squeeze list rows noticeably.
  // Desktop dialogs are narrow and floating, where 24 still reads right.
  // 8px between bands on a phone, 20px from `sm` up. A sheet is the whole
  // screen and its bands already read as separate — the title, the tabs,
  // the list — so the gap only has to keep them from touching; anything
  // more is rows the list doesn't get. Desktop modals are small and
  // floating, where the wider rhythm still reads.
  "grid w-full max-w-[calc(100%-2rem)] gap-2 sm:gap-5 rounded-xl sm:rounded-2xl bg-popover p-3 sm:p-6 text-small text-popover-foreground border border-border outline-none overflow-hidden sm:max-w-sm"

// App-wide rule: every Dialog is a BOTTOM SHEET on mobile and a centered
// modal on desktop (sm+). Mobile → pinned to the bottom edge, full-width,
// top-rounded, slides up. Desktop → centered, zooms in. Baked in here so
// every Dialog gets it for free; individual dialogs only override their
// desktop width (`sm:max-w-*`) / height. Applied AFTER `dialogChromeClass`
// in `DialogContent` so this positioning + the mobile rounding/width win
// over the chrome's defaults (twMerge: last wins).
const dialogDesktopPositionClass =
  // desktop (sm+) → centered modal
  "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm sm:rounded-2xl sm:max-h-none sm:overflow-hidden " +
  "sm:[scroll-padding-top:0px] sm:[scroll-padding-bottom:0px] " +
  "sm:data-open:slide-in-from-bottom-0 sm:data-open:zoom-in-95"

export const dialogPositionClass =
  "fixed z-50 duration-100 data-open:animate-in data-open:fade-in-0 " +
  // mobile → bottom sheet, sitting ON TOP of the on-screen keyboard (`--kb`,
  // published by `useKeyboardInset`; 0 when there is none) and capped to the
  // space that leaves, scrolling internally. Anchoring to `bottom: 0` would
  // park the sheet BEHIND the keyboard on iOS (it shrinks the visual
  // viewport, not the layout one).
  //
  // This is the right shape for pickers and lists. It is the WRONG shape for
  // a form whose primary action lives in the footer: on a phone with browser
  // chrome the keyboard leaves ~200px, which title + field + footer do not
  // fit in. Forms use `mobile="form"` (`dialogFormPositionClass`) instead.
  "inset-x-0 bottom-[var(--kb,0px)] top-auto translate-x-0 translate-y-0 max-w-full rounded-b-none rounded-t-2xl " +
  // `svh`, NOT `dvh`: on iOS the DYNAMIC viewport unit reports the height
  // with the browser chrome COLLAPSED, so while the URL bar is expanded a
  // sheet sized to `100dvh` overflows the top of the screen and its header
  // scrolls off under the chrome. `svh` is the small (chrome-visible)
  // viewport, which always fits.
  "max-h-[calc(100svh-var(--kb,0px)-8px)] overflow-y-auto " +
  // The sticky footer floats OVER the scrolling content, so the browser's
  // "scroll the focused field into view" would park a field underneath it.
  // `scroll-padding-bottom` reserves the footer's height for that scroll.
  "[scroll-padding-bottom:8rem] " +
  "data-open:slide-in-from-bottom-4 data-open:zoom-in-100 " +
  dialogDesktopPositionClass

// `mobile="form"` — the full-screen FORM sheet (Apple Music "New Playlist").
// Anchored to the TOP of the screen and filling it, with the actions in a
// `DialogActionBar` along the top edge where the keyboard can never reach
// them; the field sits near the top; the body scrolls under the bar. The
// sheet still ends at `--kb`, so the browser's scroll-focused-field-into-view
// has a real box to scroll within while the keyboard is up. This removes the
// height budget instead of negotiating with it.
//
// The chrome's padding/gap are zeroed on mobile: the bar is full-bleed and
// `DialogFormBody` re-applies the 12px gutter. Desktop is the same centered
// modal as everything else — the bar hides, the ordinary header/footer show.
export const dialogFormPositionClass =
  "fixed z-50 duration-100 data-open:animate-in data-open:fade-in-0 " +
  "inset-x-0 top-0 bottom-[var(--kb,0px)] translate-x-0 translate-y-0 max-w-full max-h-none rounded-none " +
  // `overflow-hidden`, NOT `auto`: the sheet is three bands — sticky bar,
  // scrolling body, action row — and only the BODY scrolls. If the popup
  // itself scrolled, a sticky action row would overlay whatever passed under
  // it (it covered the privacy toggle) instead of the body ending above it.
  "flex flex-col gap-0 p-0 overflow-hidden " +
  "[scroll-padding-top:4rem] [scroll-padding-bottom:1rem] " +
  "data-open:slide-in-from-bottom-4 data-open:zoom-in-100 " +
  "sm:grid sm:gap-5 sm:p-6 " +
  dialogDesktopPositionClass

// The form sheet's top bar: Cancel · title · primary action. Same frosted
// glass as `MobileHeader` (it IS a mobile header, for a modal), sticky so
// the actions stay put while the body scrolls beneath. Mobile only.
export const dialogActionBarClass =
  // No rule under the bar: the sheet is one surface, and a hairline right
  // under the title reads as a header that isn't there.
  "sticky top-0 z-10 shrink-0 frosted-glass " +
  "flex items-center justify-between gap-2 min-h-12 px-1 pt-[max(4px,env(safe-area-inset-top))] pb-1 " +
  "sm:hidden"

// Body of a form sheet on mobile: restores the chrome's gutter + gap that
// `dialogFormPositionClass` zeroed, clears the home indicator at the bottom.
// On desktop it dissolves into the modal's own grid (`display: contents`).
export const dialogFormBodyClass =
  // `flex-1 min-h-0 overflow-y-auto` — the body is the only scrolling band.
  // `gap-3` (not the desktop 20px): on a phone every gap competes with the
  // keyboard for the same ~200px.
  "flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto p-3 sm:contents sm:overflow-visible"

// The form sheet's action row: the confirming button pinned below the body,
// never overlapping it (the body scrolls, this doesn't). Full-bleed surface
// so scrolled content can't show through, and it clears the home indicator.
// Mobile only — desktop uses the ordinary `DialogFooter`.
export const dialogFormActionsClass =
  "shrink-0 bg-popover px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:hidden"

/*
 * The scrolling list band of a sheet. `-mx-2` (and NO matching padding):
 * `MediaListItem` brings its own `pl-2`, so a symmetric `px-2` would push
 * every cover 8px past the gutter and out of line with the title, the
 * field and the footer. Letting the rows' hover surface bleed into the
 * gutter is the point of the negative margin.
 *
 * Height comes from flex — `flex-1 min-h-0` inside a `flex flex-col`
 * sheet — never a `vh` cap, which can't know what the other bands cost.
 */
export const dialogListClass =
  "flex flex-col min-w-0 flex-1 min-h-0 overflow-y-auto -mx-2"

// `text-small` (19px): a sheet title sits on the same line as the ✕ and
// reads as a label for the screen, not a headline — 21px crowded it.
export const dialogTitleClass =
  "font-heading text-small leading-none font-medium"

export const dialogDescriptionClass =
  "text-small text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground"

/*
 * Header: [leading control] then the title stack, both starting on the
 * sheet's gutter line — the same left edge as the rows, the field and the
 * footer below it. A back control takes its OWN line rather than sitting
 * beside the title: inline it would indent the title by its own width and
 * nothing underneath would line up.
 *
 * Everything is left-aligned, phones included. A centred title reads as a
 * screen header, but it breaks the one vertical edge the sheet otherwise
 * holds, and a title that grows then shifts against fixed content below.
 */
// `min-h-8` matches the close button, so a title-only header is exactly as
// tall as one with a control in it — and no more: on a phone the space
// above the title is rows the list doesn't get.
export const dialogHeaderClass = "flex flex-col items-start gap-1 min-w-0 min-h-8 justify-center"
// `pr-8` keeps a long title clear of the ✕, which is positioned absolutely
// in the sheet's corner and so takes no space of its own.
export const dialogHeaderStackClass = "w-full min-w-0 flex flex-col gap-1.5 pr-8"
export const dialogHeaderSpacerClass = "size-8 shrink-0 sm:hidden"

// Negative margins must match the chrome's padding at BOTH sizes, or the
// full-bleed footer stops reaching the edges. `pb` also clears the iOS home
// indicator, so the actions sit at the bottom of the sheet without the OS
// handle overlapping them.
export const dialogFooterClass =
  "-mx-3 -mb-3 sm:-mx-6 sm:-mb-6 mt-2 flex flex-col-reverse gap-2 rounded-b-xl sm:rounded-b-2xl border-t bg-muted " +
  // Sticky on mobile so the actions never scroll out of reach when the sheet
  // is short. `bottom` cancels the footer's own negative margin so it parks
  // flush with the sheet's edge. The sheet itself already clears the keyboard,
  // so no `--kb` here. Desktop doesn't scroll: static.
  "sticky bottom-[-0.75rem] z-10 sm:static " +
  "px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:p-6 sm:flex-row sm:justify-end"

// ─── Live Dialog (portal-rendered, modal) ────────────────────────────────────

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  mobile = "sheet",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  /** Phone presentation. `sheet` (default) — bottom sheet, actions in the
   *  footer. `form` — full-screen sheet anchored top, actions in a
   *  `DialogActionBar`; use for anything with a text field whose primary
   *  action must survive the keyboard. Desktop is identical either way. */
  mobile?: "sheet" | "form"
}) {
  const form = mobile === "form"
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        data-mobile={mobile}
        className={cn(dialogChromeClass, form ? dialogFormPositionClass : dialogPositionClass, className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                // The form sheet's bar carries Cancel — no X on phones there.
                // Vertically centred on the HEADER ROW, not on the sheet's
                // corner — it sits at the gutter, exactly where the row
                // starts, so title and ✕ share a centre line. `right-2`
                // keeps it nearer the edge than the gutter, where a 32px
                // target wants to be.
                className={cn("absolute top-3 right-2 sm:top-6", form && "max-sm:hidden")}
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({
  className, children, leading, ...props
}: React.ComponentProps<"div"> & {
  /** Optional control at the left edge — a back chevron on a drilled-in
   *  step. Without one the slot still holds its width on a phone, so the
   *  title doesn't shift when a step gains or loses it. */
  leading?: React.ReactNode
}) {
  return (
    <div data-slot="dialog-header" className={cn(dialogHeaderClass, className)} {...props}>
      {/* Optical, not box, alignment: an icon button is 32px around a 16px
          glyph, so its box hangs 8px left for the glyph to land on the same
          line as the content below. */}
      {leading && <span className="shrink-0 -ml-2">{leading}</span>}
      <div className={dialogHeaderStackClass}>{children}</div>
    </div>
  )
}

/*
 * DialogActionBar — the top bar of a `mobile="form"` sheet on phones:
 * `leading` (Cancel) · title · `trailing` (the primary action, as a text
 * button). Hidden from `sm` up, where the ordinary DialogHeader / DialogFooter
 * take over — so a form renders BOTH, gated by `useIsMobile()`, never two
 * `DialogTitle`s at once.
 */
function DialogActionBar({
  className,
  leading,
  trailing,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  leading?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div
      data-slot="dialog-action-bar"
      className={cn(dialogActionBarClass, className)}
      {...props}
    >
      <div className="flex min-w-0 shrink-0 items-center">{leading}</div>
      {/* Title centred on the bar, not between the two buttons, so it
          doesn't drift when Cancel and the action differ in width. */}
      <div className="absolute inset-x-0 pointer-events-none flex justify-center px-20">
        {children}
      </div>
      <div className="flex min-w-0 shrink-0 items-center justify-end">{trailing}</div>
    </div>
  )
}

function DialogFormBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-form-body"
      className={cn(dialogFormBodyClass, className)}
      {...props}
    />
  )
}

/**
 * DialogFormActions — the confirming action of a `mobile="form"` sheet,
 * pinned below the scrolling body. Renders nothing on desktop, where
 * `DialogFooter` does the job.
 */
function DialogFormActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-form-actions"
      className={cn(dialogFormActionsClass, className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(dialogFooterClass, className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(dialogTitleClass, className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(dialogDescriptionClass, className)}
      {...props}
    />
  )
}

// ─── Static preview (kitchen-sink + design docs) ─────────────────────────────
//
// Renders the same visual chrome as a live Dialog, but as an inline styled
// div — no portal, no backdrop, no fixed positioning. Use to show every
// dialog variant at a glance in documentation. Shares the chrome class
// constants with the live components, so chrome changes update both.
//
// Inside, you compose with `DialogPreviewHeader` / `DialogPreviewTitle` /
// `DialogPreviewDescription` / `DialogPreviewFooter` — these are plain
// elements styled with the same class constants the real components use.

function DialogPreview({
  className,
  children,
  showCloseButton = true,
}: {
  className?: string
  children: React.ReactNode
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-preview"
      className={cn("relative", dialogChromeClass, className)}
    >
      {children}
      {showCloseButton && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2"
          aria-label="Close (preview)"
        >
          <XIcon />
        </Button>
      )}
    </div>
  )
}

function DialogPreviewHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn(dialogHeaderClass, className)} {...props}>
      <div className={dialogHeaderStackClass}>{children}</div>
    </div>
  )
}

function DialogPreviewTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn(dialogTitleClass, className)} {...props} />
}

function DialogPreviewDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn(dialogDescriptionClass, className)} {...props} />
}

function DialogPreviewFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(dialogFooterClass, className)} {...props} />
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogActionBar,
  DialogFormBody,
  DialogFormActions,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  // Preview helpers (static, inline)
  DialogPreview,
  DialogPreviewHeader,
  DialogPreviewTitle,
  DialogPreviewDescription,
  DialogPreviewFooter,
}
