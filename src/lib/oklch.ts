/*
 * oklch — hex ⇄ OKLCH, with the maths written out rather than measured.
 *
 * The design system's primitives are declared in two forms: some as
 * `oklch(…)`, some as a hex (`#3E79FF`). Anything that wants to reason about
 * the ramp — fit a curve to it, compare a generated step against the real one
 * — has to see both in the same space.
 *
 * A canvas probe would also convert, and is what `TokenEditor` uses to read a
 * PAINTED colour off the page. This module exists because fitting happens
 * before paint: it runs on the parsed stylesheet text, where there is no
 * element to measure. Same reason the numbers are exact here and rounded
 * there.
 *
 * The transform is the standard one: sRGB → linear → LMS → OKLab (Björn
 * Ottosson), then Lab → LCh by polar coordinates.
 */

export interface Oklch { l: number; c: number; h: number }

const srgbToLinear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)

export function hexToOklch(hex: string): Oklch | null {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim())
  if (!m) return null
  const raw = m[1].length === 3 ? m[1].split("").map(c => c + c).join("") : m[1]
  const [r, g, b] = [0, 2, 4].map(i => srgbToLinear(parseInt(raw.slice(i, i + 2), 16) / 255))

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  const L = 0.2104542553 * l + 0.7936177850 * m_ - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.4285922050 * m_ + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m_ - 0.8086757660 * s

  const C = Math.hypot(a, bb)
  let H = (Math.atan2(bb, a) * 180) / Math.PI
  if (H < 0) H += 360
  return { l: L, c: C, h: H }
}

/** `oklch(22.61% 0.0077 95.4)` → numbers. Percent or 0–1 both read. */
export function parseOklch(value: string): Oklch | null {
  const m = /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/i.exec(value)
  if (!m) return null
  const l = m[2] === "%" ? Number(m[1]) / 100 : Number(m[1])
  return { l, c: Number(m[3]), h: Number(m[4]) }
}

/** Either form, whichever a token happens to be written in. */
export function readColour(value: string): Oklch | null {
  return value.includes("oklch") ? parseOklch(value) : hexToOklch(value)
}

export function formatOklch({ l, c, h }: Oklch): string {
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(1)})`
}
