"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

// ─── Toast ────────────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 301:4623
//
// Built on @base-ui/react/toast.
//
// Setup: wrap the app shell (`app/root.tsx` here) with <ToastProvider>.
//        Place <ToastViewport /> inside it.
//
// Usage inside a component:
//   const { add } = useToast()
//   add({ title: "Track uploaded!", type: "success" })
// ─────────────────────────────────────────────────────────────────────────────

type ToastType = "default" | "success" | "error" | "warning" | "info" | "loading"

// Single shared chrome — every toast uses `border-border` regardless of
// type. The icon carries the semantic meaning; the surface stays neutral
// so toasts don't visually duplicate alert styling. Exported so static
// previews can render the same shell without forking the styles.
export const toastShellClass = cn(
  "relative flex w-full items-center gap-2.5 md:items-start",
  // A phone toast is ONE LINE, at the CONTROL step: `h-12` and a pill radius,
  // the same box as an `lg` field or button. It lands on top of the control
  // it is answering — the search field at the foot of a sheet, say — and
  // covers it outright instead of hanging over half of it. The description is
  // desktop-only for the same reason the box is one line: the title already
  // says it, and a two-line card with 18px of padding was a fifth of a 375px
  // screen for the word "added". Desktop keeps the roomier card.
  "h-12 rounded-full px-4 shadow-2xl md:h-auto md:rounded-xl md:px-4 md:pt-4 md:pb-[18px] md:shadow-lg",
  "border border-border bg-popover",
  // A PILL, like the field it lands on — same height, same gutter, same
  // radius — so it reads as that control rather than as a card parked over
  // it. 18px was tried on the theory that the rounder shape is the smaller
  // one and would therefore cover the field's corners: true, and it still
  // looked like a different object. `overflow-hidden` keeps the drain inside
  // the curve.
  "overflow-hidden",
  "text-popover-foreground transition-[transform,opacity] duration-200",
  // The swipe belongs to the toast, not to the page scrolling behind it.
  "touch-none",
)
const toastShell = toastShellClass

// Action-button + close-button class strings — extracted so ToastPreview
// stays visually identical to the real Viewport-rendered toast.
/* Undo and friends. It is the SECONDARY button from the catalogue rather than
   a button-shaped div: the toast is the one place an action appears without a
   surface around it, so it has to be recognisably the same control as
   everywhere else. Centred on the row, not pinned to the top of it — on a
   phone the toast is one 48px line, and a top-pinned action in it reads as
   crooked (the same fault the status icon had). On desktop the card can have
   two lines, and the action still centres against them. */
export const toastActionButtonClass = "relative shrink-0 self-center"
export const toastCloseButtonClass = cn(
  // Hidden on phones: the toast auto-dismisses and can be swiped away, and a
  // dismiss target competes for width with the message itself. Platform
  // snackbars don't carry one either.
  "hidden md:flex",
  "shrink-0 self-start mt-[3px] rounded-lg p-0.5 text-muted-foreground",
  "hover:bg-accent hover:text-accent-foreground transition-colors",
  "focus-visible:outline-none focus-ring",
)

// Icons take the same optical-centre nudge as the Alert component so the icon
// sits on the title's x-height centre, not floating between title and
// description when the description wraps. (The comment said `mt-[5px]` for a
// long time while the class was `mt-[3px]` — the class is the truth.)
// Centred on a phone, where the toast is ONE 48px line and the icon has a
// single line of text to sit against; the top-pinned nudge is a desktop rule,
// for a card whose description wraps under the title.
const ICON_CLS = "relative size-4 shrink-0 self-center mt-0 md:self-start md:mt-[3px]"
const ToastIcon: Record<string, React.ReactNode> = {
  default: <InfoIcon        className={cn(ICON_CLS, "text-muted-foreground")} />,
  success: <CheckCircleIcon className={cn(ICON_CLS, "text-green-600 dark:text-green-400")} />,
  error:   <AlertCircleIcon className={cn(ICON_CLS, "text-destructive")} />,
  warning: <AlertCircleIcon className={cn(ICON_CLS, "text-yellow-600 dark:text-yellow-400")} />,
  info:    <InfoIcon        className={cn(ICON_CLS, "text-blue-600 dark:text-blue-400")} />,
  loading: (
    <svg className={cn(ICON_CLS, "animate-spin text-muted-foreground")} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
}

// ── Provider + Viewport (place in root layout) ─────────────────────────────────

/** Default life of a toast carrying something worth reading — a consequence,
 *  or an action like Undo. Plain confirmations use `TOAST_CONFIRM_MS`. */
export const TOAST_DEFAULT_MS = 5000

function ToastProvider({ children, timeout = TOAST_DEFAULT_MS }: { children: React.ReactNode; timeout?: number }) {
  return (
    <ToastPrimitive.Provider timeout={timeout}>
      {children}
    </ToastPrimitive.Provider>
  )
}

function ToastViewport({ className }: { className?: string }) {
  const { toasts } = ToastPrimitive.useToastManager()

  return (
    <ToastPrimitive.Viewport
      className={cn(
        "group/toasts fixed z-[100] flex flex-col gap-2 outline-none",
        /* Below `md` → the TOP of the screen, under the browser chrome and
           over everything the app draws.
           
           It lived at the bottom, thumb-side, which is where platform
           snackbars sit — and on a phone the bottom is also where every
           control the toast is answering sits: a sheet's search field, its
           confirming action, the tab bar, the mini player. Whatever the toast
           cleared, it covered something else, and the arithmetic for "just
           above the control" changed with the keyboard, the screen and the
           sheet. The top of a phone holds a title and nothing you press.
           
           The keyboard never reaches it either, which is the other half of
           what this cost: no `--kb` term, no anchor published by a sheet, no
           measurement at all. */
        "inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] bottom-auto w-auto",
        // Desktop → the familiar top-right card.
        "md:inset-x-auto md:right-4 md:top-4 md:bottom-auto md:w-[380px] md:max-w-[calc(100vw-2rem)]",
        className
      )}
    >
      {toasts.map((t) => {
        const type    = (t.type as ToastType) ?? "default"
        const icon    = ToastIcon[type]
        // Action button is passed via toast.data: { actionLabel, onAction }.
        // Used for undo affordances on irreversible-feeling actions.
        const data    = (t.data ?? {}) as { actionLabel?: string; onAction?: () => void }

        return (
          <ToastPrimitive.Root
            key={t.id}
            toast={t}
            /* The gesture points at the nearest edge, and both placements
               are now top-anchored: UP on a phone (full width, under the
               browser chrome), RIGHT on desktop (a card in the top-right
               corner). It was `down` while the phone toast lived at the
               bottom — the pair has to move with the placement. */
            swipeDirection={["up", "right"]}
            className={toastShell}
          >
            {/* How long it has left. A toast that leaves on its own has to
                say so — otherwise every one of them is a surprise, and the
                user waits for something that was never going to stay. Paused
                while a pointer is over the viewport, matching Base UI, which
                stops the timer itself on hover. */}
            <span
              aria-hidden="true"
              /* The clock is the toast's own BACKGROUND running out: a
                 full-bleed `--muted` fill that recedes left to right under the
                 text, clipped by the pill. Not a rule and not a tint — a rule
                 is a 3px detail on a 48px control, and a translucent wash over
                 the whole surface reads as a disabled toast. This reads as the
                 surface itself being spent, which is what it measures.

                 `--muted` because it is the recessive surface in the palette:
                 it says "time" without competing with the icon, which is the
                 only colour a toast is allowed. */
              className="absolute inset-0 origin-left bg-muted animate-[toastTimer_linear_forwards] group-hover/toasts:[animation-play-state:paused]"
              style={{ animationDuration: `${t.timeout ?? TOAST_DEFAULT_MS}ms` }}
            />
            {icon}

            {/* `relative`: the timer is an absolutely positioned sibling, and
                a positioned box paints over static ones — the text has to be
                positioned too, or the fill runs across the words. */}
            <div className="relative flex flex-1 flex-col gap-1 min-w-0">
              {t.title && (
                <ToastPrimitive.Title className="truncate md:whitespace-normal text-small font-medium leading-5">
                  {t.title}
                </ToastPrimitive.Title>
              )}
              {t.description && (
                <ToastPrimitive.Description className="hidden md:block text-small leading-5 text-muted-foreground">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>

            {data.actionLabel && data.onAction && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { data.onAction!() }}
                className={toastActionButtonClass}
              >
                {data.actionLabel}
              </Button>
            )}

            <ToastPrimitive.Close
              aria-label="Dismiss"
              className={toastCloseButtonClass}
            >
              <XIcon className="size-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )
      })}
    </ToastPrimitive.Viewport>
  )
}

// ── Hook — use in components ───────────────────────────────────────────────────

function useToast() {
  return ToastPrimitive.useToastManager()
}

/** Timeout for a plain confirmation ("added", "created", "saved") — the user
 *  already saw the result, so the toast only has to register. Platform
 *  snackbars sit around 2–3s; our 5s default is for messages carrying an
 *  action or a consequence worth reading. Pass as `timeout` to `add()`. */
export const TOAST_CONFIRM_MS = 3000

// ── Static preview (kitchen-sink + design docs) ────────────────────────────────
//
// Renders the same visual chrome as a live toast, but as a plain inline div.
// Used to show every variant at a glance without firing real toasts. Shares
// `toastShellClass` + `ToastIcon` + button class constants with the live
// version, so any chrome change updates both — no drift.

interface ToastPreviewProps {
  type?:        ToastType
  title:        string
  description?: string
  /** Optional inline action button (e.g. "Undo"). */
  actionLabel?: string
  className?:   string
}

function ToastPreview({
  type = "default",
  title,
  description,
  actionLabel,
  className,
}: ToastPreviewProps) {
  return (
    <div className={cn(toastShellClass, "w-[380px] max-w-full", className)}>
      {ToastIcon[type]}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="text-small font-medium leading-5">{title}</p>
        {description && (
          <p className="text-small leading-5 text-muted-foreground">{description}</p>
        )}
      </div>
      {actionLabel && (
        <Button variant="secondary" size="sm" className={toastActionButtonClass}>
          {actionLabel}
        </Button>
      )}
      <button type="button" aria-label="Dismiss" className={toastCloseButtonClass}>
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}

export { ToastProvider, ToastViewport, useToast, ToastPreview }
export type { ToastType, ToastPreviewProps }
