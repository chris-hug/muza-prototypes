"use client"

/*
 * useShare — the app's share behaviour in one place. Returns:
 *   · canNativeShare — whether the Web Share API exists (mobile/tablet)
 *   · nativeShare()  — open the OS share sheet (falls back to copy)
 *   · copyLink()     — copy the URL to the clipboard
 * Both actions toast appropriately. `url` defaults to the current page.
 *
 * Consumed by ShareButton (dropdown) and DetailMoreButton (overflow
 * menu) so every share affordance behaves identically.
 */

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/toast"
import { copyToClipboard, shareUrl } from "@/lib/clipboard"

export function useShare(data: { title?: string; text?: string; url?: string }) {
  const { add } = useToast()
  const [canNativeShare, setCanNativeShare] = useState(false)
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function")
  }, [])

  // Resolve to an absolute URL — `data.url` may be a relative path
  // (e.g. a card passing `/?page=Album&album=…`); copying/sharing wants
  // the full link.
  const target = () => {
    if (typeof window === "undefined") return data.url ?? ""
    if (!data.url) return window.location.href
    try { return new URL(data.url, window.location.origin).href } catch { return data.url }
  }

  const copyLink = () => {
    void copyToClipboard(target()).then(ok =>
      add(ok
        ? { title: "Link copied", type: "success" }
        : { title: "Couldn't copy link", type: "error" }),
    )
  }

  const nativeShare = () => {
    void shareUrl({ title: data.title, text: data.text, url: target() }).then(r => {
      if (r === "copied") add({ title: "Link copied", type: "success" })
      else if (r === "failed") add({ title: "Couldn't copy link", type: "error" })
    })
  }

  return { canNativeShare, copyLink, nativeShare }
}
