"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from "lucide-react"
import { cva } from "class-variance-authority"

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

const toastVariants = cva(
  [
    "relative flex w-full items-start gap-3",
    "rounded-xl border border-border bg-popover p-4 shadow-lg",
    "text-popover-foreground",
    "transition-all duration-200",
  ],
  {
    variants: {
      type: {
        default: "",
        success: "border-green-200 dark:border-green-800",
        error:   "border-destructive/40",
        warning: "border-yellow-200 dark:border-yellow-800",
        info:    "border-blue-200 dark:border-blue-800",
        loading: "",
      },
    },
    defaultVariants: {
      type: "default",
    },
  }
)

const ToastIcon: Record<string, React.ReactNode> = {
  success: <CheckCircleIcon className="size-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />,
  error:   <AlertCircleIcon className="size-4 text-destructive shrink-0 mt-0.5" />,
  warning: <AlertCircleIcon className="size-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />,
  info:    <InfoIcon className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
  loading: (
    <svg className="size-4 animate-spin text-muted-foreground shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
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
        "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)] outline-none",
        className
      )}
    >
      {toasts.map((t) => {
        const type = (t.type as ToastType) ?? "default"
        const icon = ToastIcon[type]

        return (
          <ToastPrimitive.Root
            key={t.id}
            toast={t}
            className={toastVariants({ type })}
          >
            {icon}

            <div className="flex flex-1 flex-col gap-1 min-w-0">
              {t.title && (
                <ToastPrimitive.Title className="text-sm font-medium leading-snug">
                  {t.title}
                </ToastPrimitive.Title>
              )}
              {t.description && (
                <ToastPrimitive.Description className="text-xs text-muted-foreground leading-relaxed">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>

            <ToastPrimitive.Close
              aria-label="Dismiss"
              className={cn(
                "ml-auto shrink-0 rounded-lg p-0.5 text-muted-foreground",
                "hover:bg-accent hover:text-accent-foreground transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              )}
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

export { ToastProvider, ToastViewport, useToast }
export type { ToastType }
