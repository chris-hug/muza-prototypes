"use client"

/*
 * useImageLuminance — samples an image's TOP strip (where floating
 * detail-page chrome sits) and reports whether it reads "light" or
 * "dark", so the back / "…" buttons can flip to the legible mode
 * (dark icons on a light cover, light icons on a dark cover).
 *
 * Defensive by design: remote covers may be CORS-tainted (canvas
 * `getImageData` throws) or fail to load — in either case we return
 * `null` and the caller falls back to its default treatment.
 */

import { useEffect, useState } from "react"

export type Luminance = "light" | "dark"

export function useImageLuminance(src?: string): Luminance | null {
  const [lum, setLum] = useState<Luminance | null>(null)

  useEffect(() => {
    if (!src) { setLum(null); return }
    let cancelled = false

    const img = new Image()
    // Needed to read pixels; servers without CORS headers taint the
    // canvas → caught below → null fallback.
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const W = 24, H = 24
        const canvas = document.createElement("canvas")
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return
        // Draw only the top ~28% of the source (the button band) scaled
        // into the tiny sampling canvas.
        const srcH = Math.max(1, Math.floor(img.naturalHeight * 0.28))
        ctx.drawImage(img, 0, 0, img.naturalWidth, srcH, 0, 0, W, H)
        const { data } = ctx.getImageData(0, 0, W, H)
        let total = 0
        for (let i = 0; i < data.length; i += 4) {
          // Rec. 709 perceived luminance.
          total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
        }
        const avg = total / (data.length / 4)
        if (!cancelled) setLum(avg > 140 ? "light" : "dark")
      } catch {
        if (!cancelled) setLum(null)
      }
    }
    img.onerror = () => { if (!cancelled) setLum(null) }
    img.src = src

    return () => { cancelled = true }
  }, [src])

  return lum
}
