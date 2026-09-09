"use client"

/*
 * PlayingWave — the now-playing animation the Cover Play Button shows at
 * rest, on its own, at its canonical 28px and two larger sizes. For a
 * "now playing" mark outside a cover: a player bar, a sidebar row.
 *
 * A call site, not a copy: the real `PlayingWave`, in `text-foreground` so
 * the dots take the page's ink. Every internal length scales off `size`
 * and is rounded to an integer pixel, so the depth and parallax stay the
 * same at 40 and 56 as at 28. Only mount it inside a host that does not
 * animate its own opacity or transform — see the doc.
 */

import { PlayingWave } from "@/components/ui/playing-wave"

export default function CoverPlayButtonWaveExample() {
  return (
    <div className="flex items-center gap-6">
      <PlayingWave size={28} className="text-foreground" />
      <PlayingWave size={40} className="text-foreground" />
      <PlayingWave size={56} className="text-foreground" />
    </div>
  )
}
