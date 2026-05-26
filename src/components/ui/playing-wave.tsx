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
 * Canonical size 28px (matches the list-item leading slot). All
 * internal lengths are fixed pixel values tuned at this size:
 *   · perspective 25px
 *   · orbit radius (translateZ) 8px
 *   · dot diameter 42% of the wrapper
 *
 * Earlier this file used em-based perspective + translateZ so the
 * shape would scale with `font-size: size`. That produced
 * fractional pixels (0.89em × 28 = 24.92, 0.29em × 28 = 8.12) which
 * the browser anti-aliased differently each frame — the dots read
 * as blurry / smeared in motion. Fixed pixels render crisp.
 * If you need a non-canonical size, just pass `size`: the outer
 * box scales but the perspective + orbit stay at their tuned
 * values, which still reads acceptably down to ~20 and up to ~56.
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
  /** Outer box edge in px. Default 28 (the canonical Song-List-Item /
   *  Cover-Play-Button size). Internal perspective + orbit stay
   *  fixed at the tuned 25 / 8 — the wrapper just scales. */
  size?: number
  className?: string
}

export function PlayingWave({ size = 28, className }: PlayingWaveProps) {
  const dot = "absolute top-1/2 left-1/2 size-[42%] -mt-[21%] -ml-[21%] rounded-full bg-current"
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-block [perspective:25px] [transform-style:preserve-3d]",
        "[animation:muzaCarouselFloat_3.5s_ease-in-out_infinite]",
        className,
      )}
    >
      <span className="absolute inset-0 [transform-style:preserve-3d] [animation:muzaCarousel_8s_linear_infinite]">
        <span className={`${dot} [transform:rotateY(0deg)_translateZ(8px)]`} />
        <span className={`${dot} [transform:rotateY(90deg)_translateZ(8px)]`} />
        <span className={`${dot} [transform:rotateY(180deg)_translateZ(8px)]`} />
        <span className={`${dot} [transform:rotateY(270deg)_translateZ(8px)]`} />
      </span>
    </span>
  )
}
