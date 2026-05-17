"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Toast ────────────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 301:4623
//
// Built on @base-ui/react/toast.
//
// Setup: Wrap your app (or layout.tsx) with <ToastProvider>.
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
  "relative flex w-full items-start gap-2.5",
  "rounded-xl border border-border bg-popover px-4 pt-4 pb-[18px] shadow-lg",
  "text-popover-foreground transition-[transform,opacity] duration-200",
)
const toastShell = toastShellClass

// Action-button + close-button class strings — extracted so ToastPreview
// stays visually identical to the real Viewport-rendered toast.
export const toastActionButtonClass = cn(
  "shrink-0 self-start mt-[3px]",
  "rounded-md px-2 py-1 text-xsmall font-medium text-foreground",
  "border border-border hover:bg-accent transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
)
export const toastCloseButtonClass = cn(
  "shrink-0 self-start mt-[3px] rounded-lg p-0.5 text-muted-foreground",
  "hover:bg-accent hover:text-accent-foreground transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
)

// Icons use the same `self-start mt-[5px]` optical-center nudge as the Alert
// component so the icon sits on the title's x-height center, not floating
// between title and description when the description wraps.
const ICON_CLS = "size-4 shrink-0 self-start mt-[3px]"
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

function ToastProvider({ children, timeout = 5000 }: { children: React.ReactNode; timeout?: number }) {
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
        "fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)] outline-none",
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
            className={toastShell}
          >
            {icon}

            <div className="flex flex-1 flex-col gap-1 min-w-0">
              {t.title && (
                <ToastPrimitive.Title className="text-small font-medium leading-5">
                  {t.title}
                </ToastPrimitive.Title>
              )}
              {t.description && (
                <ToastPrimitive.Description className="text-small leading-5 text-muted-foreground">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>

            {data.actionLabel && data.onAction && (
              <button
                type="button"
                onClick={() => { data.onAction!(); }}
                className={toastActionButtonClass}
              >
                {data.actionLabel}
              </button>
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
        <button type="button" className={toastActionButtonClass}>
          {actionLabel}
        </button>
      )}
      <button type="button" aria-label="Dismiss" className={toastCloseButtonClass}>
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}

export { ToastProvider, ToastViewport, useToast, ToastPreview }
export type { ToastType, ToastPreviewProps }
