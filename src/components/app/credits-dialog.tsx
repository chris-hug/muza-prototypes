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
import { X as XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/use-media-query"
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
      className="text-small text-foreground leading-[20px] text-left w-fit link-underline outline-none cursor-pointer"
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
  scrollRef, onScroll,
}: {
  credits:   Credits
  heading:   React.ReactNode
  onArtist?: (name: string) => void
  onAlbum?:  () => void
  /** The scroll box, for a host that reacts to its scrolling (the live sheet
   *  grows to full height on the first one — see `CreditsDialogContent`). */
  scrollRef?: React.Ref<HTMLDivElement>
  onScroll?:  React.UIEventHandler<HTMLDivElement>
  /** Sizing for the scroll region — which is now the WHOLE sheet body, cover
   *  included. Defaults to a fixed `max-h-[50vh]` (static preview / desktop);
   *  the live sheet passes `min-h-0` so it grows with the parent's height cap
   *  instead. */
  bodyClassName?: string
}) {
  return (
    /* ONE scroll box, cover included. The cover used to be a fixed header
       above a scrolling body, which on a phone spent 40% of the sheet on a
       picture the reader had already seen — and the performers, which is what
       anyone opens credits for, read through a 200px slot. Scrolling the
       cover away hands that space to the list; scrolling back brings it
       returns. The sheet still cannot scroll ITSELF (`DialogContent` pins
       that), so this box is the only thing that moves. */
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className={cn("flex flex-col flex-1 min-h-0 overflow-y-auto", bodyClassName)}
    >
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
          className="relative mx-auto h-full aspect-square object-cover rounded-xs shadow-lg art-edge"
        />
      </div>

      {/* Metadata — no scroller of its own any more; it scrolls with the
          cover in the box above. */}
      <div className="flex flex-col gap-5 p-6">
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
                          className="link-underline outline-none cursor-pointer"
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
    </div>
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
    // anchored, top-rounded, slides up); desktop (md+, 768) → the centered
    // md dialog with its normal zoom-in.
    <DialogContent
      className={cn(
        // Mobile bottom sheet / desktop centered modal now come from the base
        // DialogContent. Here we only set the desktop width + grow-with-content
        // sizing: a flex column so the metadata body fills up to the height cap
        // and the sheet grows with its content, never past ~92vh.
        "md:max-w-md",
        // `md:p-0` / `md:gap-0` are NOT redundant beside `p-0 gap-0`. The base
        // chrome sets `md:p-6 md:gap-5`, and tailwind-merge keeps a variant
        // and its unprefixed twin side by side — so from 768 up the base won
        // and put 24px of padding around the full-bleed cover hero, which is
        // meant to touch three edges. Cancel the variant with a variant.
        "p-0 gap-0 md:p-0 md:gap-0",
        "overflow-hidden flex flex-col max-h-[92vh] md:max-h-[85vh]",
      )}
    >
      <CreditsContent
        credits={credits}
        heading={<DialogTitle className="md:text-large font-medium leading-none">Album credits</DialogTitle>}
        onArtist={name => go(() => openArtist(slugify(name)))}
        onAlbum={albumLinkable ? () => go(() => openAlbum(slugify(credits.album))) : undefined}
        bodyClassName="min-h-0"
      />
    </DialogContent>
  )
}

/*
 * CreditsDialogPreview — static, non-modal render for the design system
 * (no portal / backdrop). Shows the dialog body inside a card.
 *
 * Reads `useIsMobile()` the way `DialogPreview` does: inside the design
 * system's frame that is the window CHIP, so a "375" frame shows the sheet
 * shape — full width, top corners only — instead of the desktop card.
 */
export function CreditsDialogPreview({ albumKey = "a07" }: { albumKey?: string }) {
  const phone = useIsMobile()
  return (
    <div
      data-mobile={phone ? "sheet" : undefined}
      className={cn(
        "relative w-full border border-border bg-popover overflow-hidden",
        phone ? "max-w-full rounded-t-[28px] rounded-b-none" : "max-w-md rounded-xl md:rounded-2xl",
      )}
    >
      {/* The navigation handlers are passed even though this preview goes
          nowhere. `Field` renders plain text without them and a link with
          them, so leaving them off documented the wrong component: in the
          product the artist, the album and every credited name ARE links, and
          the frame has to show the underline that says so. The handlers are
          no-ops here — a DS frame must not navigate the page out from under
          the person reading it. */}
      <CreditsContent
        credits={getCredits(albumKey)}
        heading={<p className="text-large font-medium leading-none text-foreground">Album credits</p>}
        onArtist={() => {}}
        onAlbum={() => {}}
      />
      {/* The real dialog gets its ✕ from `DialogContent`; this preview builds
          its own card, so it has to carry one or the frame documents a dialog
          you cannot close. Same position and size as `DialogPreview`'s, inert
          on purpose — there is nothing to dismiss. */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2"
        aria-label="Close (preview)"
      >
        <XIcon />
      </Button>
    </div>
  )
}
