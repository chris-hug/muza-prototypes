"use client"

/*
 * useKeyboardInset — publishes the on-screen keyboard's height as `--kb` on
 * the document root, so fixed bottom UI (bottom sheets, toasts) can sit above
 * it instead of underneath.
 *
 * Why this is needed at all: iOS Safari does NOT shrink the layout viewport
 * when the keyboard opens — it shrinks the VISUAL viewport and leaves layout
 * untouched. A `position: fixed; bottom: 0` sheet therefore stays pinned to
 * the bottom of a viewport that is now partly behind the keyboard — and so
 * would the sheet's footer, with the "Create playlist" button the user was
 * reaching for. (That form is now a full-screen `mobile="form"` sheet with
 * its actions in the top bar; `--kb` still bounds its scroll box.)
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
    let wasOpen = false
    const apply = () => {
      // How much of the layout viewport is hidden below the visual one. The
      // offsetTop term matters while the page is scrolled under the keyboard.
      const hidden = window.innerHeight - vv.height - vv.offsetTop
      // Small values are address-bar chrome, not a keyboard — ignore them so
      // sheets don't drift on every scroll.
      const open = hidden > 80
      root.style.setProperty("--kb", `${open ? Math.round(hidden) : 0}px`)

      /* The keyboard leaves the WINDOW scrolled, and the app cannot scroll it
         back on its own.
         
         Focusing a field inside a sheet makes iOS scroll the window itself to
         bring the caret into view — not the sheet's scroll box, the window,
         which the app otherwise never scrolls because its shell is exactly one
         viewport tall. When the keyboard closes, the layout viewport is whole
         again but that scroll offset stays: the shell ends partway up the
         screen and the rest is blank page below it. Reported from the "add to
         playlist" flow, where the search field is the first thing you touch.
         
         So: when the keyboard has just closed, put the window back. Guarded on
         the transition rather than run on every event, because scrolling the
         window during a normal scroll would fight the user. */
      if (wasOpen && !open && window.scrollY !== 0) window.scrollTo(0, 0)
      wasOpen = open
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
