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
      /* The keyboard's height: how much of the layout viewport the visual one
         no longer covers.

         NO `offsetTop` term. It was in here — the reasoning being that the
         page may be scrolled under the keyboard — and it is what left a
         REOPENED keyboard with `--kb: 0`: focusing a field near the bottom
         makes iOS scroll the window first, so at the moment the resize fires
         `offsetTop` is large, `hidden` lands under the threshold, and the
         sheet never shrinks. The offset moves what you SEE; it does not
         change how tall the keyboard is, and the keyboard's height is all
         this publishes.

         `window.innerHeight`, deliberately: `documentElement.clientHeight` was
         tried here to explain a sheet whose bottom edge floated clear of the
         keyboard's accessory bar, and it made the sheet COLLAPSE instead — on
         iOS with `interactive-widget=resizes-content` in the meta, the two do
         not differ the way the theory needed. Read the live numbers with
         `?kbdebug` (`KeyboardProbe`) before touching this again. */
      const hidden = window.innerHeight - vv.height
      /* Small values are address-bar chrome, not a keyboard — ignore them so
         sheets don't drift on every scroll. And a keyboard only exists while
         something is being TYPED INTO: without that check any browser UI that
         eats a chunk of the visual viewport (a collapsing toolbar, a find bar,
         a translate prompt) reads as a keyboard, and every sheet in the app
         reshapes itself around one that is not there. */
      const el = document.activeElement as HTMLElement | null
      const typing = !!el && (
        el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
      )
      const open = hidden > 80 && typing
      root.style.setProperty("--kb", `${open ? Math.round(hidden) : 0}px`)
      /* A flag as well as a number, because some of what has to give when the
         keyboard is up is not expressible as a length. A media query can't see
         this: the LAYOUT viewport doesn't shrink on iOS, which is the whole
         reason this hook exists. Measured on an iPhone in Brave: 495px of
         layout, 169px of it still visible. See `app.css` for what tightens. */
      if (open) root.dataset.kb = "open"
      else delete root.dataset.kb

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

    /* iOS settles the viewport in stages — the resize can land before the
       keyboard has finished arriving, and focusing a field scrolls the window
       in between. So a focus is also a reason to measure again, twice, once
       the animation has had time to end. */
    const settle = () => {
      apply()
      window.setTimeout(apply, 150)
      window.setTimeout(apply, 450)
    }

    apply()
    vv.addEventListener("resize", apply)
    vv.addEventListener("scroll", apply)
    window.addEventListener("focusin", settle)
    window.addEventListener("focusout", settle)
    window.addEventListener("orientationchange", settle)
    return () => {
      vv.removeEventListener("resize", apply)
      vv.removeEventListener("scroll", apply)
      window.removeEventListener("focusin", settle)
      window.removeEventListener("focusout", settle)
      window.removeEventListener("orientationchange", settle)
      root.style.removeProperty("--kb")
      delete root.dataset.kb
    }
  }, [])
}
