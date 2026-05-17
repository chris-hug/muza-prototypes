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
  "grid w-full max-w-[calc(100%-2rem)] gap-5 rounded-xl sm:rounded-2xl bg-popover p-6 text-small text-popover-foreground border border-border outline-none overflow-hidden sm:max-w-sm"

export const dialogPositionClass =
  "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"

export const dialogTitleClass =
  "font-heading text-base leading-none font-medium"

export const dialogDescriptionClass =
  "text-small text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground"

export const dialogHeaderClass = "flex flex-col gap-2"

export const dialogFooterClass =
  "-mx-6 -mb-6 mt-2 flex flex-col-reverse gap-2 rounded-b-xl sm:rounded-b-2xl border-t bg-muted p-6 sm:flex-row sm:justify-end"

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
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(dialogPositionClass, dialogChromeClass, className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
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

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(dialogHeaderClass, className)}
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

function DialogPreviewHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(dialogHeaderClass, className)} {...props} />
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
