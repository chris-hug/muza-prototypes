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
         sheets don't drift on every scroll. Two thresholds, not one: opening
         needs 80px, staying open only 40. Without the gap a keyboard that
         reports its height in stages (iOS animates it in, and the accessory
         bar arrives on its own beat) can cross back under a single threshold
         mid-animation and drop `--kb` to 0, which is a sheet snapping to full
         height and then back.

         It does NOT ask whether a field is focused. That was tried, to keep
         browser chrome from being mistaken for a keyboard, and it broke the
         SECOND opening: `activeElement` is not reliably the field yet when
         the viewport resize lands, so the measurement said "no keyboard",
         `--kb` stayed 0, and the sheet left its search field behind the
         keyboard. A height this large is a keyboard; nothing else on a phone
         takes 300px of viewport. */
      const open = hidden > (wasOpen ? 40 : 80)
      root.style.setProperty("--kb", `${open ? Math.round(hidden) : 0}px`)
      /* A flag as well as a number, because some of what has to give when the
         keyboard is up is not expressible as a length. A media query can't see
         this: the LAYOUT viewport doesn't shrink on iOS, which is the whole
         reason this hook exists. Measured on an iPhone in Brave: 495px of
         layout, 169px of it still visible. See `app.css` for what tightens. */
      if (open) root.dataset.kb = "open"
      else delete root.dataset.kb

      /* The window must never be scrolled, and iOS scrolls it anyway.
         
         Focusing a field inside a sheet makes iOS scroll the WINDOW to bring
         the caret into view — not the sheet's own scroll box, the window,
         which this app otherwise never scrolls: the shell is exactly one
         viewport tall and the body is `overflow: hidden`. Nothing good comes
         of that offset. `position: fixed` is anchored to the LAYOUT viewport,
         so a scrolled window carries every fixed thing off the top of the
         screen — the app header, and the top of the sheet itself, which is
         why a sheet could answer a tap with blank space and a field at the
         bottom. And when the keyboard closes the offset stays, leaving the
         shell parked partway up the screen.
         
         So it is pinned, on every measurement rather than only on the
         keyboard's closing edge: there is no legitimate window scroll in this
         app to fight with, and the caret is already in view because the sheet
         resized around `--kb`. */
      if (window.scrollY !== 0) window.scrollTo(0, 0)
      wasOpen = open
    }

    /* iOS settles the viewport in stages — the resize can land before the
       keyboard has finished arriving, and focusing a field scrolls the window
       in between. So a focus is also a reason to measure again, twice, once
       the animation has had time to end. */
    const settle = () => {
      // iOS brings the keyboard in over ~300ms and the accessory bar can land
      // after it, so one measurement at focus time is worth little. Sample
      // across the whole animation instead.
      for (const t of [0, 100, 250, 450, 700]) window.setTimeout(apply, t)
    }

    apply()
    vv.addEventListener("resize", apply)
    vv.addEventListener("scroll", apply)
    // The window's own scroll is the event that matters for the pin above:
    // iOS fires it as it drags the caret into view, and the sooner it is put
    // back the less of the jump is visible.
    window.addEventListener("scroll", apply, { passive: true })
    window.addEventListener("focusin", settle)
    window.addEventListener("focusout", settle)
    window.addEventListener("orientationchange", settle)
    return () => {
      vv.removeEventListener("resize", apply)
      vv.removeEventListener("scroll", apply)
      window.removeEventListener("scroll", apply)
      window.removeEventListener("focusin", settle)
      window.removeEventListener("focusout", settle)
      window.removeEventListener("orientationchange", settle)
      root.style.removeProperty("--kb")
      delete root.dataset.kb
    }
  }, [])
}
