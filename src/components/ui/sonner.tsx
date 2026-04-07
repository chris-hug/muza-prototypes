"use client"

import { ToastProvider, ToastViewport, useToast } from "@/components/ui/toast"

// ─── Sonner ───────────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 193:1386
//
// Muza uses @base-ui/react/toast for toast notifications.
// This file provides <Toaster /> — a drop-in component for layout.tsx
// that wraps ToastProvider + ToastViewport.
//
// Setup in layout.tsx:
//   import { Toaster } from "@/components/ui/sonner"
//   // Place inside body: <Toaster />
//
// Usage in components:
//   import { useToast } from "@/components/ui/sonner"
//   const { add } = useToast()
//   add({ title: "Saved!", type: "success" })
//   add({ title: "Error", description: "Something went wrong.", type: "error" })
//   add({ title: "Track uploading…", type: "loading" })
// ─────────────────────────────────────────────────────────────────────────────

export { ToastProvider, ToastViewport, useToast }

/**
 * Drop-in <Toaster /> for app layouts.
 * Place once in layout.tsx inside <body>.
 */
function Toaster({ timeout = 5000 }: { timeout?: number }) {
  return (
    <ToastProvider timeout={timeout}>
      <ToastViewport />
    </ToastProvider>
  )
}

export { Toaster }
