"use client"

/*
 * ImageCropDialog — the seller frames one product image: drag to move it,
 * the slider to zoom. What it stores is a focal point and a zoom
 * (`ImageCrop`), not a cut-out, so the same image can be shown at the tile's
 * 4:3 and the gallery's wider frame without being re-cropped for each: both
 * crop around the same point.
 *
 * The frame here is the tile's 4:3, the tightest place the image appears,
 * so what fits here fits everywhere.
 *
 * Built from Dialog, Slider and Button. The drag is pointer events, so a
 * finger moves the image as well as a mouse; `touch-none` on the frame stops
 * the sheet from scrolling under it.
 */

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { cropStyle, DEFAULT_CROP, type ImageCrop } from "@/lib/shop-product"

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function ImageCropDialog({
  image, onOpenChange, onSave,
}: {
  /** The image being framed; `null` closes the dialog. */
  image: { src: string; name: string; crop?: ImageCrop } | null
  onOpenChange: (open: boolean) => void
  onSave: (crop: ImageCrop) => void
}) {
  return (
    <Dialog open={!!image} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-lg">
        {image && (
          <CropBody
            key={image.src}
            image={image}
            onCancel={() => onOpenChange(false)}
            onSave={crop => { onSave(crop); onOpenChange(false) }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CropBody({
  image, onCancel, onSave,
}: {
  image: { src: string; name: string; crop?: ImageCrop }
  onCancel: () => void
  onSave: (crop: ImageCrop) => void
}) {
  const [crop, setCrop] = useState<ImageCrop>(image.crop ?? DEFAULT_CROP)
  const frameRef = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number; crop: ImageCrop; pointerId: number } | null>(null)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Adjust image</DialogTitle>
        <DialogDescription>Drag to move it, zoom to fill more. Shown like this on the product tile and in the gallery.</DialogDescription>
      </DialogHeader>

      <div
        ref={frameRef}
        onPointerDown={e => {
          if (e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          start.current = { x: e.clientX, y: e.clientY, crop, pointerId: e.pointerId }
        }}
        onPointerMove={e => {
          const s = start.current
          const frame = frameRef.current
          if (!s || !frame || e.pointerId !== s.pointerId) return
          // Dragging right shows more of the left of the image, so the
          // focal point moves the other way. Divided by the zoom so a
          // zoomed-in image follows the finger instead of racing it.
          const dx = (e.clientX - s.x) / frame.clientWidth * 100 / s.crop.zoom
          const dy = (e.clientY - s.y) / frame.clientHeight * 100 / s.crop.zoom
          setCrop({ ...s.crop, x: clamp(s.crop.x - dx, 0, 100), y: clamp(s.crop.y - dy, 0, 100) })
        }}
        onPointerUp={() => { start.current = null }}
        onPointerCancel={() => { start.current = null }}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted touch-none select-none cursor-grab active:cursor-grabbing"
      >
        <img
          src={image.src}
          alt={image.name}
          draggable={false}
          style={cropStyle(crop)}
          className="pointer-events-none size-full object-cover"
        />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-small text-foreground shrink-0">Zoom</span>
        <Slider
          aria-label="Zoom"
          min={1}
          max={3}
          step={0.05}
          value={[crop.zoom]}
          onValueChange={v => setCrop(c => ({ ...c, zoom: Array.isArray(v) ? v[0] : v }))}
        />
      </div>

      <DialogFooter>
        <Button size="lg" variant="ghost" onClick={() => setCrop(DEFAULT_CROP)}>Reset</Button>
        <Button size="lg" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button size="lg" onClick={() => onSave(crop)}>Save</Button>
      </DialogFooter>
    </>
  )
}
