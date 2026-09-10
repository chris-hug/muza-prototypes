"use client"

/*
 * KeyboardProbe — a live readout of the numbers `useKeyboardInset` works
 * from. Renders NOTHING unless the URL carries `?kbdebug`, so it can ship and
 * be opened on the actual phone, which is the only place these numbers are
 * interesting: iOS reports three different viewport heights and every browser
 * draws its own chrome around them.
 *
 * What to read:
 *  · `client` — the LAYOUT viewport, what a `position: fixed` bottom is
 *    measured from, and what `--kb` is subtracted from.
 *  · `inner`  — iOS's LARGE viewport (bottom toolbar collapsed away). Bigger
 *    than `client` on a browser that keeps a bottom toolbar.
 *  · `vv`/`top` — the visual viewport: its bottom edge is the top of the
 *    keyboard.
 *  · `--kb` — what the sheets are actually using.
 *
 * `client − vv − top` should equal `--kb`, and `--kb` should equal the height
 * of the keyboard PLUS its accessory bar. If the sheet floats above the
 * accessory bar, `--kb` is too big — compare it against `inner − vv − top` to
 * see whether the difference is the browser's bottom toolbar.
 */

import { useEffect, useState } from "react"

export function KeyboardProbe() {
  const [on, setOn] = useState(false)
  const [n, setN] = useState({ inner: 0, client: 0, vv: 0, top: 0, kb: "0px", scroll: 0 })

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("kbdebug")) return
    setOn(true)
    const vv = window.visualViewport
    const read = () => setN({
      inner:  Math.round(window.innerHeight),
      client: document.documentElement.clientHeight,
      vv:     Math.round(vv?.height ?? 0),
      top:    Math.round(vv?.offsetTop ?? 0),
      kb:     getComputedStyle(document.documentElement).getPropertyValue("--kb").trim() || "0px",
      scroll: Math.round(window.scrollY),
    })
    read()
    const id = setInterval(read, 250)
    vv?.addEventListener("resize", read)
    vv?.addEventListener("scroll", read)
    return () => {
      clearInterval(id)
      vv?.removeEventListener("resize", read)
      vv?.removeEventListener("scroll", read)
    }
  }, [])

  if (!on) return null

  const derived = n.client - n.vv - n.top
  const viaInner = n.inner - n.vv - n.top

  return (
    <div
      // Top-left and translucent: the keyboard, the sheet and the sheet's
      // bottom edge are all at the BOTTOM, which is the thing being measured.
      className="fixed left-2 top-2 z-[999] rounded-md bg-black/80 px-2 py-1.5 font-mono text-[11px] leading-tight text-white"
    >
      <div>client {n.client} · inner {n.inner}</div>
      <div>vv {n.vv} · top {n.top} · scrollY {n.scroll}</div>
      <div>--kb {n.kb}</div>
      <div>client−vv−top {derived} · inner−vv−top {viaInner}</div>
    </div>
  )
}
