"use client"

/*
 * PlayingWave — miniature 3D carousel that echoes the home page's
 * `AnimatedLogo`: four dots arranged around a Y-axis (90° apart) on
 * a `transform-style: preserve-3d` stage. The outer wrapper sets the
 * perspective and a subtle Y-float; the inner stage rotates Y on a
 * linear loop, so from the camera's POV each dot orbits front → side
 * → back → side. Reads as motion-through-depth rather than a flat
 * spinner.
 *
 * Every length inside is expressed in `em`s so the entire shape
 * scales uniformly off a single `size` knob: the wrapper's
 * `font-size` is pinned to `size`, and every internal value
 * (perspective, dot size, orbit translateZ) is a fraction of that.
 * Change `size` and the proportions stay locked.
 *
 * NOTE — `transform-style: preserve-3d` + `perspective` promote
 * this to its own compositing layer. Chromium resamples that layer
 * whenever any ancestor transitions opacity / transform — inside a
 * static wrapper (CoverPlayButton) it works great; inside a host
 * that animates its own opacity (e.g. Button's `disabled:opacity-45`)
 * it smears. Only use inside static hosts.
 *
 * NOTE — Tailwind v4 tree-shakes `@keyframes` it doesn't see
 * referenced from CSS. The `muzaCarousel` / `muzaCarouselFloat`
 * keyframes here are referenced only via arbitrary-value classes
 * (which Tailwind's analyzer can't parse), so app.css ships dummy
 * `.muza-anchor-*` rules to keep them in the build. If the names
 * change, update the anchors too.
 */

import { cn } from "@/lib/utils"

export interface PlayingWaveProps {
  /** Outer box edge in px. All internal dimensions scale off this
   *  one value — pass any number and the proportions are preserved.
   *  Default 28 (the canonical Song-List-Item / Cover-Play-Button
   *  size). */
  size?: number
  className?: string
}

// Canonical proportions, derived from the size=28 design tuning:
//   perspective  = 25/28 ≈ 0.89em
//   orbit  (translateZ) = 8/28 ≈ 0.29em
//   dot diameter = 42% of the wrapper
// `em` works because we pin `font-size: <size>px` on the wrapper —
// children inherit it, so `em` resolves to "fraction of `size`".
const PERSPECTIVE_EM = "0.89em"
const TRANSLATE_Z_EM = "0.29em"

export function PlayingWave({ size = 28, className }: PlayingWaveProps) {
  const dot = "absolute top-1/2 left-1/2 size-[42%] -mt-[21%] -ml-[21%] rounded-full bg-current"
  return (
    <span
      aria-hidden="true"
      style={{
        width:      size,
        height:     size,
        fontSize:   size, // anchors `em` for every descendant
        perspective: PERSPECTIVE_EM,
      }}
      className={cn(
        "relative inline-block [transform-style:preserve-3d]",
        "[animation:muzaCarouselFloat_3.5s_ease-in-out_infinite]",
        className,
      )}
    >
      <span className="absolute inset-0 [transform-style:preserve-3d] [animation:muzaCarousel_8s_linear_infinite]">
        <span className={dot} style={{ transform: `rotateY(0deg)   translateZ(${TRANSLATE_Z_EM})` }} />
        <span className={dot} style={{ transform: `rotateY(90deg)  translateZ(${TRANSLATE_Z_EM})` }} />
        <span className={dot} style={{ transform: `rotateY(180deg) translateZ(${TRANSLATE_Z_EM})` }} />
        <span className={dot} style={{ transform: `rotateY(270deg) translateZ(${TRANSLATE_Z_EM})` }} />
      </span>
    </span>
  )
}

