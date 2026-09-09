"use client"

/*
 * Toast, LIVE — buttons that fire the real portal toast through `useToast()`
 * (the `ToastProvider` is mounted once in the app shell). A phone window puts
 * it in the bottom bar, desktop in the top-right card; the confirmation uses
 * `TOAST_CONFIRM_MS`, the Undo toast the 5s default.
 */

import { useToast, TOAST_CONFIRM_MS } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"

export default function ToastLiveExample() {
  const { add } = useToast()
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => add({ title: "Blue Afternoon added to playlist", timeout: TOAST_CONFIRM_MS })}>Default</Button>
      <Button onClick={() => add({ type: "success", title: "Saved to Library", description: "Blue Afternoon · Song", data: { actionLabel: "Undo", onAction: () => {} } })}>Success + Undo</Button>
      <Button variant="destructive" onClick={() => add({ type: "error", title: "Upload failed", description: "File format not supported. Please upload an MP3 or WAV file." })}>Error</Button>
      <Button variant="outline" onClick={() => add({ type: "warning", title: "Heads up", description: "Your storage is almost full. Upgrade your plan to continue uploading." })}>Warning</Button>
      <Button variant="outline" onClick={() => add({ type: "info", title: "New release alert", description: "River Lotus just dropped a new album." })}>Info</Button>
      <Button variant="outline" onClick={() => add({ type: "loading", title: "Processing track…", description: "Blue Afternoon is being transcoded. This may take a minute." })}>Loading</Button>
    </div>
  )
}
