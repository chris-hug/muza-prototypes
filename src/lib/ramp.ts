/*
 * ramp — a colour ladder from five numbers.
 *
 * A ramp is not a list of colours somebody picked. It is a curve: one hue, one
 * tint, and a lightness that walks from a top to a bottom in a shape. Written
 * that way, a step is derivable rather than remembered, and the question
 * "should 300 be a hair darker" stops being an argument about a hex.
 *
 * The five numbers, and what each one actually does:
 *
 *   hue        the OKLCH angle every step shares. A neutral is not grey — it
 *              is a hue at a low tint, which is why muza's neutrals read warm
 *              and olive rather than as camera-grey.
 *   chroma     the OKLCH chroma at the ramp's most colourful step. Absolute,
 *              not a percentage of some maximum: a neutral peaks around 0.022
 *              and the brand around 0.24, and one scale that covers both makes
 *              the neutral end of the slider unusable. 0 gives true grey.
 *   top        lightness of the FIRST step (50).
 *   bottom     lightness of the LAST step (950).
 *   contrast   the shape of the walk between them. 1 is a straight line;
 *              below 1 the ramp holds its light end and falls away late,
 *              above 1 it drops immediately and crawls at the dark end.
 *
 * Chroma is not constant down the ladder, and cannot be: at L→1 and L→0 there
 * is no room for colour — a chroma that survives the ends turns the lightest
 * step into a tinted wash and the darkest into a muddy one. So the tint is
 * shaped by a half-sine that peaks in the middle and vanishes at both ends,
 * which is also where a palette wants its colour.
 */

export interface RampShape {
  hue:      number   // degrees
  chroma:   number   // peak chroma, absolute
  top:      number   // L of the first step
  bottom:   number   // L of the last step
  contrast: number   // exponent on the walk; 1 = linear
}

/** Slider ceiling. Comfortably past muza's brand ramp, whose most colourful
 *  step measures 0.2371. */
export const CHROMA_CEILING = 0.35

/** Step numbers in the order a ramp is written. Not every project uses all of
 *  them — muza's neutrals skip 500 and 600 — so the shape is computed from a
 *  step's POSITION on this canonical ladder, not from its index in whatever
 *  subset a file happens to declare. Otherwise dropping a step would silently
 *  re-space every step after it. */
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

/** Where a step sits on the ladder, 0 (lightest) → 1 (darkest). */
export function positionOf(step: number): number {
  const i = STEPS.indexOf(step as typeof STEPS[number])
  return i === -1 ? 0 : i / (STEPS.length - 1)
}

/** The OKLCH values for one step of a ramp. */
export function stepColour(step: number, shape: RampShape): { l: number; c: number; h: number } {
  const t = positionOf(step)
  // `contrast` is an exponent, so 1 is linear and the two directions are
  // symmetric around it rather than one being a special case.
  const walk = Math.pow(t, 1 / Math.max(shape.contrast, 0.05))
  const l = shape.top + (shape.bottom - shape.top) * walk
  const c = shape.chroma * Math.sin(Math.PI * t)
  return { l, c, h: shape.hue }
}

/** `oklch(…)` as it would be written in the stylesheet. */
export function stepCss(step: number, shape: RampShape): string {
  const { l, c, h } = stepColour(step, shape)
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(1)})`
}


/* ── Reading a ramp that already exists ──────────────────────────────────
 *
 * A controller whose sliders start on invented numbers is a toy: you are
 * shaping some other project's ladder and comparing it to nothing. So the
 * starting shape is FITTED to what `app.css` declares, and the fit reports
 * how far it missed — because a hand-picked ramp is not obliged to be a
 * curve, and pretending otherwise would be the same lie in a different place.
 *
 * The fit is direct rather than iterative:
 *
 *   top / bottom   the L of the first and last declared step. Not fitted:
 *                  those two ARE the ends of the ladder.
 *   hue            the chroma-weighted mean. A near-grey step's hue is noise
 *                  — at C = 0.002 the angle is whatever rounding left behind
 *                  — so weighting by chroma lets the colourful steps decide.
 *   contrast       least squares on the exponent, over the steps between the
 *                  ends, in log space: `walk = t^(1/contrast)`.
 *   tint           the scale that best matches the declared chromas against
 *                  the half-sine the generator uses.
 */

export interface RampFit {
  shape: RampShape
  /** Largest miss across the declared steps, in L and in C. */
  worst: { step: number; dL: number; dC: number }
  /** Per-step comparison, for showing the real value beside the generated. */
  steps: Array<{ step: number; real: { l: number; c: number; h: number }; dL: number; dC: number }>
}

export function fitRamp(
  declared: Array<{ step: number; colour: { l: number; c: number; h: number } }>,
): RampFit | null {
  if (declared.length < 3) return null
  const sorted = [...declared].sort((a, b) => a.step - b.step)
  const top = sorted[0].colour.l
  const bottom = sorted[sorted.length - 1].colour.l

  // hue — weighted by chroma, on the circle, so 359° and 1° average to 0°.
  let x = 0, y = 0
  for (const d of sorted) {
    const w = d.colour.c
    x += w * Math.cos((d.colour.h * Math.PI) / 180)
    y += w * Math.sin((d.colour.h * Math.PI) / 180)
  }
  let hue = (Math.atan2(y, x) * 180) / Math.PI
  if (hue < 0) hue += 360

  // contrast — the exponent k in walk = t^k, then contrast = 1/k.
  let num = 0, den = 0
  for (const d of sorted) {
    const t = positionOf(d.step)
    if (t <= 0 || t >= 1) continue
    const walk = (d.colour.l - top) / (bottom - top)
    if (walk <= 0 || walk >= 1) continue
    num += Math.log(walk) * Math.log(t)
    den += Math.log(t) * Math.log(t)
  }
  const k = den === 0 ? 1 : num / den
  const contrast = Math.min(2.4, Math.max(0.2, 1 / k))

  // chroma — least-squares peak against the generator's half-sine.
  let sn = 0, sd = 0
  for (const d of sorted) {
    const shapeC = Math.sin(Math.PI * positionOf(d.step))
    sn += shapeC * d.colour.c
    sd += shapeC * shapeC
  }
  const chroma = sd === 0 ? 0 : Math.min(CHROMA_CEILING, Math.max(0, sn / sd))

  const shape: RampShape = { hue, chroma, top, bottom, contrast }

  const steps = sorted.map(d => {
    const gen = stepColour(d.step, shape)
    return {
      step: d.step,
      real: d.colour,
      dL: Math.abs(gen.l - d.colour.l),
      dC: Math.abs(gen.c - d.colour.c),
    }
  })
  const worst = steps.reduce((a, b) => (b.dL > a.dL ? b : a), steps[0])
  return { shape, steps, worst: { step: worst.step, dL: worst.dL, dC: worst.dC } }
}
