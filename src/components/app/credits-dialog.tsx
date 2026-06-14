"use client"

/*
 * CreditsDialog — release metadata surfaced by every "Show credits"
 * action (and the MediaHeader "i" button). A 3:2 image header (the
 * square cover floated over a blurred, stretched copy of itself to fill
 * the wider frame) sits above the release metadata: main artist, album,
 * label, recording date, and the per-instrument performer list. Artist
 * and album are navigable.
 *
 * Mounted once via `CreditsProvider`; any descendant opens it with
 * `useCredits().open(albumKey)`. Outside a provider (e.g. DS showcase)
 * `open` is a no-op, so the menus that bake it in never crash.
 *
 * Data is hand-curated in `album-catalog` for the prototype; in
 * production this lookup would hit MusicBrainz / Discogs.
 */

import { useCallback, useState } from "react"

import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getCredits, hasAlbumDetail, type Credits } from "@/lib/album-catalog"
import { CreditsContext } from "@/lib/credits-context"
import { useMediaNav, slugify } from "@/lib/media-nav"

export { useCredits } from "@/lib/credits-context"

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<string | null>(null)
  const open = useCallback((albumKey: string) => setKey(albumKey), [])
  const credits = key ? getCredits(key) : null

  return (
    <CreditsContext.Provider value={{ open }}>
      {children}
      <Dialog open={!!credits} onOpenChange={o => { if (!o) setKey(null) }}>
        {credits && <CreditsDialogContent credits={credits} onClose={() => setKey(null)} />}
      </Dialog>
    </CreditsContext.Provider>
  )
}

// A value that may be a navigable link. `onClick` makes it a button with
// hover-underline; without it, plain text.
function Value({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  if (!onClick) return <p className="text-small text-foreground leading-[20px]">{children}</p>
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-small text-foreground leading-[20px] text-left w-fit hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] outline-none cursor-pointer"
    >
      {children}
    </button>
  )
}

function Field({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-2xsmall text-muted-foreground leading-[16px]">{label}</p>
      <Value onClick={onClick}>{value}</Value>
    </div>
  )
}

/*
 * CreditsContent — the visual body (3:2 cover header + metadata), reused
 * by the live dialog AND the static DS preview. `heading` is slotted so
 * the live dialog can pass a real `DialogTitle` (a11y) while the preview
 * passes a plain heading. `onArtist`/`onAlbum` make the artist / album /
 * performers navigable; omit them for a static render.
 */
export function CreditsContent({
  credits, heading, onArtist, onAlbum, bodyClassName = "max-h-[50vh]",
}: {
  credits:   Credits
  heading:   React.ReactNode
  onArtist?: (name: string) => void
  onAlbum?:  () => void
  /** Sizing for the scrollable metadata region. Defaults to a fixed
   *  `max-h-[50vh]` (static preview / desktop). The live sheet passes
   *  `min-h-0` so it grows with the parent's height cap instead. */
  bodyClassName?: string
}) {
  return (
    <>
      {/* 3:2 header — blurred, stretched cover fills the gaps; the real
           square cover floats centred on top. */}
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-muted">
        <img
          src={credits.cover}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 size-full object-cover scale-125 blur-2xl opacity-80"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <img
          src={credits.cover}
          alt={credits.album}
          draggable={false}
          className="relative mx-auto h-full aspect-square object-cover rounded-xs shadow-lg"
        />
      </div>

      {/* Metadata — scrolls if the performer list is long. */}
      <div className={cn("flex flex-col gap-5 p-6 overflow-y-auto", bodyClassName)}>
        {heading}

        <div className="flex flex-col gap-4">
          <Field label="Main artist" value={credits.mainArtist} onClick={onArtist && (() => onArtist(credits.mainArtist))} />
          <Field label="Album" value={credits.album} onClick={onAlbum} />
          {credits.label && <Field label="Label" value={credits.label} />}
          {credits.recordingDate && <Field label="Recording Date" value={credits.recordingDate} />}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-small font-medium text-foreground leading-none">Performers</p>
          <div className="flex flex-col gap-3">
            {credits.performers.map((p, i) => (
              <div key={`${p.role}-${i}`} className="flex flex-col gap-0.5">
                <p className="text-2xsmall text-muted-foreground leading-[16px]">{p.role}</p>
                <div className="text-small text-foreground leading-[20px]">
                  {p.names.map((name, j) => (
                    <span key={name}>
                      {j > 0 && ", "}
                      {onArtist ? (
                        <button
                          type="button"
                          onClick={() => onArtist(name)}
                          className="hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] outline-none cursor-pointer"
                        >
                          {name}
                        </button>
                      ) : name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function CreditsDialogContent({ credits, onClose }: { credits: Credits; onClose: () => void }) {
  const { openArtist, openAlbum } = useMediaNav()
  // Navigate, then dismiss the dialog so the destination is visible.
  const go = (fn: () => void) => { fn(); onClose() }
  const albumLinkable = hasAlbumDetail(slugify(credits.album))
  return (
    // p-0 so the image header bleeds to the edges; the metadata below
    // gets its own padding. Mobile → bottom sheet (full-width, bottom-
    // anchored, top-rounded, slides up); desktop (sm+) → the centered
    // md dialog with its normal zoom-in.
    <DialogContent
      className={cn(
        "left-0 right-0 top-auto bottom-0 translate-x-0 translate-y-0 max-w-full rounded-b-none rounded-t-2xl",
        "data-open:zoom-in-100 data-open:slide-in-from-bottom-4",
        "sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl",
        "sm:data-open:zoom-in-95 sm:data-open:slide-in-from-bottom-0",
        // flex column so the metadata body fills the gap up to the height
        // cap, and the sheet grows with its content (less scrolling) but
        // never past ~92vh of the viewport.
        "p-0 gap-0 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]",
      )}
    >
      <CreditsContent
        credits={credits}
        heading={<DialogTitle className="text-large font-medium leading-none">Album credits</DialogTitle>}
        onArtist={name => go(() => openArtist(slugify(name)))}
        onAlbum={albumLinkable ? () => go(() => openAlbum(slugify(credits.album))) : undefined}
        bodyClassName="min-h-0"
      />
    </DialogContent>
  )
}

/*
 * CreditsDialogPreview — static, non-modal render for the design system
 * (no portal / backdrop / links). Shows the dialog body inside a card.
 */
export function CreditsDialogPreview({ albumKey = "a07" }: { albumKey?: string }) {
  return (
    <div className="w-full max-w-md rounded-xl sm:rounded-2xl border border-border bg-popover overflow-hidden">
      <CreditsContent
        credits={getCredits(albumKey)}
        heading={<p className="text-large font-medium leading-none text-foreground">Album credits</p>}
      />
    </div>
  )
}
