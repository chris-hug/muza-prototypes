"use client"

/*
 * useKeyboardInset — publishes the on-screen keyboard's height as `--kb` on
 * the document root, so fixed bottom UI (bottom sheets, toasts) can sit above
 * it instead of underneath.
 *
 * Why this is needed at all: iOS Safari does NOT shrink the layout viewport
 * when the keyboard opens — it shrinks the VISUAL viewport and leaves layout
 * untouched. A `position: fixed; bottom: 0` sheet therefore stays pinned to
 * the bottom of a viewport that is now partly behind the keyboard. In the
 * Create-playlist sheet the name field is autofocused, so the keyboard opens
 * immediately and swallows the footer — the "Create playlist" button the user
 * was reaching for.
 *
 * Chrome/Android is handled declaratively by `interactive-widget=resizes-content`
 * in the viewport meta (it resizes the layout viewport, so `--kb` stays 0
 * there). This hook is the iOS half.
 *
 * Mount ONCE, high in the tree.
 */

import { useEffect } from "react"

export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const root = document.documentElement
    const apply = () => {
      // How much of the layout viewport is hidden below the visual one. The
      // offsetTop term matters while the page is scrolled under the keyboard.
      const hidden = window.innerHeight - vv.height - vv.offsetTop
      // Small values are address-bar chrome, not a keyboard — ignore them so
      // sheets don't drift on every scroll.
      root.style.setProperty("--kb", `${hidden > 80 ? Math.round(hidden) : 0}px`)
    }

    apply()
    vv.addEventListener("resize", apply)
    vv.addEventListener("scroll", apply)
    return () => {
      vv.removeEventListener("resize", apply)
      vv.removeEventListener("scroll", apply)
      root.style.removeProperty("--kb")
    }
  }, [])
}
