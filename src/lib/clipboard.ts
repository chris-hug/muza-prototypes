/*
 * copyToClipboard — robust copy that falls back to a hidden textarea +
 * execCommand when the async Clipboard API is unavailable (insecure
 * context, iframe preview, or a Permissions-Policy block). Always
 * resolves to a boolean so callers can drive UI feedback without ever
 * surfacing a browser error.
 */
export type ShareResult = "shared" | "copied" | "failed" | "cancelled"

/*
 * shareUrl — open the OS share sheet via the Web Share API when it's
 * available (phones / tablets), otherwise fall back to copying the URL
 * to the clipboard. Returns what happened so the caller can decide
 * whether to toast:
 *   · "shared"    — native sheet handled it (no toast needed)
 *   · "cancelled" — user dismissed the native sheet (no toast)
 *   · "copied"    — desktop fallback succeeded (toast "Link copied")
 *   · "failed"    — couldn't copy either (toast error)
 * Must be called from a user gesture (the share button click).
 */
export async function shareUrl(data: { title?: string; text?: string; url: string }): Promise<ShareResult> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined
  if (nav && typeof nav.share === "function") {
    try {
      await nav.share(data)
      return "shared"
    } catch (e) {
      // User dismissed the sheet — treat as a no-op, don't fall back.
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled"
      // Any other failure (permission, etc.) → fall through to copy.
    }
  }
  const ok = await copyToClipboard(data.url)
  return ok ? "copied" : "failed"
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // fall through to the textarea fallback
  }
  try {
    const ta = document.createElement("textarea")
    ta.value = value
    ta.setAttribute("readonly", "")
    ta.style.position = "fixed"
    ta.style.top = "-1000px"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
