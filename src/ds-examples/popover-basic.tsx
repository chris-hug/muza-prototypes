"use client"

/*
 * Popover in its two everyday shapes: an info card under a text trigger
 * (the first track of the real catalog's default album) and a small
 * control panel to the RIGHT of an icon trigger (`side="right"`). Both are
 * the real `Popover` parts. The popup is a fixed 288px (`w-72`) and
 * positions itself against the trigger, so step the window chips down and
 * watch it flip sides rather than shrink.
 */

import { SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM = getAlbumDetail()
const TRACK = ALBUM.tracks[0]

export default function PopoverBasicExample() {
  return (
    <div className="flex flex-wrap gap-4">
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Track info</PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col gap-3">
            <p className="text-small font-medium leading-none">{TRACK.title}</p>
            <p className="text-xsmall text-muted-foreground">
              {ALBUM.artist} · {ALBUM.title} · {ALBUM.year}
            </p>
            <Separator />
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xsmall">
                <span className="text-muted-foreground">Duration</span>
                <span className="tabular-nums">{TRACK.duration}</span>
              </div>
              <div className="flex justify-between text-xsmall">
                <span className="text-muted-foreground">Format</span>
                <span>{ALBUM.format}</span>
              </div>
              {ALBUM.label && (
                <div className="flex justify-between text-xsmall">
                  <span className="text-muted-foreground">Label</span>
                  <span>{ALBUM.label}</span>
                </div>
              )}
            </div>
            <Button size="sm" className="w-full mt-1">Go to album</Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="icon" aria-label="Equalizer" />}>
          <SlidersHorizontal className="size-4" />
        </PopoverTrigger>
        <PopoverContent side="right">
          <p className="text-small font-medium mb-3">Equalizer</p>
          <div className="flex flex-col gap-3">
            {["Bass", "Mid", "Treble"].map(band => (
              <div key={band} className="flex items-center gap-3">
                <span className="text-xsmall text-muted-foreground w-12">{band}</span>
                <Slider defaultValue={[50]} max={100} step={1} className="flex-1" />
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
