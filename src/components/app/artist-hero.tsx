"use client"

/*
 * ArtistHero — the full-bleed hero at the top of the artist profile.
 * Cover photo under a theme-agnostic dark gradient, with the name, bio
 * (3-line clamp + read-more), and the action row pinned bottom-left.
 *
 * Height is locked to the same growth ceilings as the page's content
 * wrappers (`max-w-[1480px] min-[1920px]:max-w-[1716px]`). At each ceiling
 * the natural `aspect-[1072/400]` gives:
 *   · tier 1: 1480 × 400/1072 ≈ 552px
 *   · tier 2: 1716 × 400/1072 ≈ 640px
 * so the hero stops growing taller at exactly the viewport widths where the
 * rails stop growing wider. Past each ceiling the photo crops via
 * `object-cover`. See DESIGN_SYSTEM.md › "Layout — page max-width tiers".
 *
 * Playback is owned by the host (it knows the artist's tracks) and passed in
 * as `isPlaying` + `onPlayToggle`; Share / Save are wired here via the shared
 * store-bound components. Below the footer-nav breakpoint Share + Save move
 * into the floating header's "…", so they're hidden here.
 */

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Radio } from "lucide-react"
import { PlayFilledAlt, PauseFilledAlt } from "@/components/ui/transport-icons"
import { ShareButton } from "@/components/ui/share-button"
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
import { useFooterNav } from "@/lib/use-media-query"

export interface ArtistHeroProps {
  name: string
  /** Wide hero backdrop photo. */
  cover: string
  /** Square artist profile image (set up separately from the cover) — used
   *  for the bio dialog's avatar. Falls back to `cover` if omitted. */
  avatar?: string
  bio: string
  /** Library id (slug) for the Save button. */
  artistId: string
  /** Whether this artist is the current player source. */
  isPlaying: boolean
  /** Toggle playback for this artist (host owns the track list). */
  onPlayToggle: () => void
}

export function ArtistHero({ name, cover, avatar, bio, artistId, isPlaying, onPlayToggle }: ArtistHeroProps) {
  const [bioOpen, setBioOpen] = useState(false)
  const footerNav = useFooterNav()

  // Collapsed bio = just the opening clause + inline "read more" (matching
  // how the big streaming apps tease an artist bio). Trim at a word boundary
  // near ~100 chars and drop any trailing punctuation before the ellipsis.
  // The full text opens in a dialog (→ bottom sheet on mobile) so the
  // fixed-height hero never has to grow to fit it.
  const COLLAPSED_LEN = 100
  const isLong = bio.length > COLLAPSED_LEN
  const teaser = isLong
    ? bio.slice(0, COLLAPSED_LEN).replace(/\s+\S*$/, "").replace(/[.,;:–-]+$/, "") + "… "
    : bio

  return (
    <>
    <section className="dark relative w-full aspect-[1072/400] min-h-[320px] max-h-[552px] min-[1920px]:max-h-[640px] overflow-hidden text-foreground">
      <img
        src={cover}
        alt={name}
        draggable={false}
        className="absolute inset-0 size-full object-cover"
      />
      {/* Theme-agnostic dark gradient over the photo so the foreground
           content stays readable regardless of cover. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/40 to-black/80"
      />

      {/* Name + bio — pinned to bottom-left of the hero. */}
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] w-full px-page pb-8 flex flex-col gap-4">
        <div className="max-w-3xl flex flex-col gap-3">
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-medium leading-[1.05] tracking-tight">
            {name}
          </h1>
          <p className="text-small leading-6 text-foreground/90">
            {teaser}
            {isLong && (
              <button
                type="button"
                onClick={() => setBioOpen(true)}
                className="underline underline-offset-[3px] [text-decoration-thickness:1px] cursor-pointer"
              >
                read more
              </button>
            )}
          </p>
        </div>

        {/* Action row — Play (primary), Artist radio (outline), then
             circular Share + Add-to-library on the right. On mobile
             (the footer-nav breakpoint) the Share + library buttons
             collapse into the floating header's "…" instead. */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              className="h-12 px-6 rounded-full"
              aria-pressed={isPlaying}
              onClick={onPlayToggle}
            >
              {isPlaying ? <PauseFilledAlt className="size-4" /> : <PlayFilledAlt className="size-4" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-6 rounded-full">
              <Radio />
              Artist radio
            </Button>
          </div>
          {!footerNav && (
            <div className="flex items-center gap-2">
              <ShareButton variant="outline" size="icon" title={name} text={name} />
              <LibraryHeartButton
                type="artist"
                id={artistId}
                name={name}
                variant="outline"
                size="icon"
              />
            </div>
          )}
        </div>
      </div>
    </section>

    {/* Full bio — base DialogContent (→ bottom sheet on mobile), built like
        the other content dialogs: a header row (artist avatar + name) above
        a divider, then the bio in a roomy, easy-to-read body. Wider than the
        default modal so long copy isn't cramped. */}
    <Dialog open={bioOpen} onOpenChange={setBioOpen}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Header — avatar + name / type, mirroring the search Top-result row. */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-5 sm:px-8 sm:pt-8">
          <img
            src={avatar ?? cover}
            alt={name}
            draggable={false}
            className="size-20 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex flex-col gap-1">
            <DialogTitle className="truncate text-large font-medium leading-tight">{name}</DialogTitle>
            <p className="text-small text-muted-foreground leading-none">Artist</p>
          </div>
        </div>

        <Separator />

        {/* Bio — generous line-height + spacing so it's comfortable to read. */}
        <div className="px-6 py-6 sm:px-8 sm:py-7 overflow-y-auto min-h-0">
          <p className="text-base leading-8 text-foreground/80 whitespace-pre-line">
            {bio}
          </p>
          {/* Attribution — bio + portrait come from Wikipedia / Wikimedia. */}
          <p className="mt-6 text-2xsmall text-muted-foreground">
            Source:{" "}
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Wikipedia
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
