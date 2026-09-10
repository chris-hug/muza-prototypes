"use client"

/*
 * EditReleaseDialog — opens from the Edit button on each release row in
 * StudioMusicView. Lets the user change:
 *
 *   · Cover           (always)
 *   · Title / Artist / Band / Year  (only when release.isNew — i.e. no
 *                                     MusicBrainz match exists; catalog
 *                                     metadata is managed centrally and
 *                                     locked for consistency)
 *   · Privacy         (always — public / private)
 *   · Pricing         (always — listen + download, each with a
 *                      "name your price" switch)
 *
 * Save is mocked: the dialog just calls onSave(updated) and closes. The
 * parent decides what to do with the patch.
 */

import { useEffect, useState } from "react"
import { Pencil, Radio as RadioIcon, ShoppingBag, Globe, Lock } from "lucide-react"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  DialogDescription, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { InputSelect } from "@/components/ui/input-select"
import { ContentTypeBadge } from "@/components/ui/badge"
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditableRelease {
  id:      string
  cover:   string
  title:   string
  artist:  string
  band?:   string
  year:    number
  type:    "album" | "single" | "ep"
  tracks?: number
  label?:  string
  catalog?: string
  status:  "public" | "private"
  isNew?:  boolean
}

export type MonetizationType = "streaming" | "purchase"

export interface EditReleasePatch {
  cover:         string
  title:         string
  artist:        string
  band:          string
  year:          number
  status:        "public" | "private"
  monetization:  MonetizationType
  listenPrice:   string
  nameYourPriceListen:   boolean
  downloadPrice: string
  nameYourPriceDownload: boolean
  currency:      string
}

interface EditReleaseDialogProps {
  release:      EditableRelease | null
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSave:       (patch: EditReleasePatch) => void
  /** Optional defaults for the monetisation section (e.g. current prices
   *  resolved from the demo `mockMonetisation`). */
  initialMonetization?:  MonetizationType
  initialListenPrice?:   string
  initialDownloadPrice?: string
}

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
]

// ─── InfoField — single read-only labelled value (used in the
//   MusicBrainz-matched metadata card).
// ─────────────────────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xsmall text-muted-foreground">{label}</span>
      <span className="text-small font-normal text-foreground">{value}</span>
    </div>
  )
}

const TYPE_LABELS: Record<"album" | "single" | "ep", string> = {
  album:  "Album",
  single: "Single",
  ep:     "EP",
}

// ─── EditReleaseDialog ────────────────────────────────────────────────────────

export function EditReleaseDialog({
  release, open, onOpenChange, onSave,
  initialMonetization  = "purchase",
  initialListenPrice   = "8.50",
  initialDownloadPrice = "",
}: EditReleaseDialogProps) {
  const [cover,   setCover]   = useState("")
  const [title,   setTitle]   = useState("")
  const [artist,  setArtist]  = useState("")
  const [band,    setBand]    = useState("")
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [status,  setStatus]  = useState<"public" | "private">("public")
  const [monetization,          setMonetization]          = useState<MonetizationType>(initialMonetization)
  const [listenPrice,           setListenPrice]           = useState(initialListenPrice)
  const [nameYourPriceListen,   setNameYourPriceListen]   = useState(false)
  const [downloadPrice,         setDownloadPrice]         = useState(initialDownloadPrice)
  const [nameYourPriceDownload, setNameYourPriceDownload] = useState(false)
  const [currency,              setCurrency]              = useState("USD")

  // Seed form state whenever a release is opened.
  useEffect(() => {
    if (!release) return
    setCover(release.cover)
    setTitle(release.title)
    setArtist(release.artist)
    setBand(release.band ?? "")
    setYear(release.year)
    setStatus(release.status)
    setMonetization(initialMonetization)
    setListenPrice(initialListenPrice)
    setDownloadPrice(initialDownloadPrice)
    setNameYourPriceListen(false)
    setNameYourPriceDownload(false)
  }, [release, initialMonetization, initialListenPrice, initialDownloadPrice])

  if (!release) return null
  const canEditMetadata = release.isNew === true

  const save = () => {
    onSave({
      cover, title, artist, band, year, status, monetization,
      listenPrice, nameYourPriceListen,
      downloadPrice, nameYourPriceDownload,
      currency,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Dialog layout:
            · Header slot     — fixed (shrink-0); holds title, description,
                                and the release-info card. Never scrolls so
                                the user always sees which release they're
                                editing.
            · Middle slot     — `flex-1 overflow-y-auto min-h-0`. Contains
                                Visibility + Monetisation. Scrolls when the
                                content exceeds the viewport budget.
            · Footer slot     — fixed (shrink-0); Cancel + Save stay reachable
                                without scrolling to the bottom.
          Height is capped at `min(90vh, 900px)` on DESKTOP; on a phone the
          sheet keeps DialogContent's own keyboard-aware cap. */}
      <DialogContent
        className={cn(
          // Mobile bottom sheet / desktop centered modal come from the base
          // DialogContent. Here: desktop width (600px) + grow-to-cap sizing.
          "md:max-w-[600px]",
          // No mobile `max-h`: the bottom sheet's own cap is
          // `100svh - var(--kb) - 8px`, and a `max-h-[90vh]` here would win
          // (twMerge, last class) — 90% of the LAYOUT viewport, which iOS does
          // not shrink for the keyboard, so an open keyboard would push the
          // header off the top of the screen. Desktop still caps.
          "p-0 gap-0 shadow-none md:max-h-[min(90vh,900px)] flex flex-col",
        )}
      >
        {/* ── Fixed header ─────────────────────────────────────────────
             The release identity IS the dialog title — no redundant
             "Edit release" heading. Cover thumb on the left, release
             title + badge/artist/year subline in the middle, "Change
             cover" action on the right. Stays locked to the top while
             the rest of the form scrolls. */}
        {/* Cover thumb (96px) on the left, with a small pencil button
            overlaid on its bottom-right corner for "change cover". Right
            column: title + visibility switch on one line, badge + artist
            · year on the second line. Top-aligned. */}
        {/* Phone paddings are the page's gutter, not the desktop dialog's
            32px: at 375 this header was 251px — a third of the sheet — before
            a single field. Measured after: 150. */}
        <DialogHeader className="shrink-0 px-3 pt-3 pb-4 md:px-8 md:pt-8 md:pb-6 border-b border-border">
          {/* DialogHeader STACKS its children (`dialogHeaderStackClass` is a
              column) — a cover passed as a sibling of the title lands under it.
              The identity is one row, so it is one child. */}
          <div className="flex flex-row items-start gap-3 md:gap-4 min-w-0">
          <div className="relative shrink-0">
            <img
              src={cover}
              alt=""
              // 64px on a phone, 96 from `md`: the cover is here to say WHICH
              // release is being edited, and at 96 it was taking a quarter of
              // the header to say it.
              className="rounded-xs object-cover shadow-sm size-16 md:size-24 art-edge"
            />
            <button
              type="button"
              aria-label="Change cover"
              className={cn(
                // Sized to the cover it sits on: 24 on the phone's 64px thumb,
                // 28 on the 96px one — a 28px badge on a 64px cover reads as a
                // button with a picture behind it.
                "absolute bottom-1 right-1 size-6 md:bottom-1.5 md:right-1.5 md:size-7 rounded-full",
                "bg-background/90 backdrop-blur-sm text-foreground",
                "border border-border shadow-sm",
                "flex items-center justify-center",
                "transition-colors hover:bg-background",
                "focus-visible:outline-none focus-ring",
              )}
            >
              <Pencil className="size-3 md:size-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <DialogTitle className="md:text-large font-semibold leading-none truncate">
              {title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 text-small text-muted-foreground font-normal min-w-0">
              <ContentTypeBadge type={release.type} />
              <span className="truncate">{artist}{year ? ` · ${year}` : ""}</span>
            </DialogDescription>
            <label className="flex items-center gap-2 cursor-pointer mt-1 self-start">
              {status === "public"
                ? <Globe className="size-4 text-muted-foreground" />
                : <Lock  className="size-4 text-muted-foreground" />}
              <span className="text-small font-normal text-foreground w-[52px]">
                {status === "public" ? "Public" : "Private"}
              </span>
              <Switch
                size="sm"
                checked={status === "public"}
                onCheckedChange={v => setStatus(v ? "public" : "private")}
              />
            </label>
          </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable middle ──────────────────────────────────────────
             Order: Monetisation → General info. */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 pb-4 md:px-8 md:pt-6 md:pb-6 flex flex-col gap-6 md:gap-8">

          {/* ── Monetisation ─────────────────────────────────────────────
               Two radio cards — both cards are fully expanded so the user
               can see both options' details at a glance. The "For purchase"
               card always shows its price inputs; the selected radio is
               the only thing that changes when the user picks. */}
          <div className="flex flex-col gap-3">
            {/* Captions a RadioCardGroup — a group of controls, not one, so
                there is nothing for `htmlFor` to point at. */}
            <p className="text-small leading-none font-normal text-foreground">Monetisation</p>
            <RadioCardGroup
              value={monetization}
              onValueChange={v => setMonetization(v as MonetizationType)}
            >
              <RadioCard
                value="streaming"
                selected={monetization === "streaming"}
                onSelect={() => setMonetization("streaming")}
                icon={<RadioIcon />}
                title="For streaming"
                description="Anyone on Muza can listen · per-stream royalties distributed monthly"
              />
              <RadioCard
                value="purchase"
                selected={monetization === "purchase"}
                onSelect={() => setMonetization("purchase")}
                icon={<ShoppingBag />}
                title="For purchase"
                description="Fans pay to unlock · you set your price"
              >
                <FormItem className="gap-3">
                  {/* Wraps rather than squeezes: at 375 the price label and the
                      "name your price" caption both broke into two ragged lines
                      trying to share one. Given the chance to wrap, the caption
                      takes the second line whole and stays on the right. */}
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <FormLabel className="shrink-0">Price for listening</FormLabel>
                    <label className="flex shrink-0 items-center gap-1.5 ml-auto cursor-pointer">
                      <span className="text-xsmall text-muted-foreground font-normal">Let fans pay more if they want</span>
                      <Switch
                        size="sm"
                        checked={nameYourPriceListen}
                        onCheckedChange={setNameYourPriceListen}
                      />
                    </label>
                  </div>
                  <FormControl><InputSelect
                    value={listenPrice}
                    onChange={e => setListenPrice((e.target as HTMLInputElement).value)}
                    placeholder={nameYourPriceListen ? "0.00 (leave blank for free)" : "1.00"}
                    selectValue={currency}
                    onSelectChange={setCurrency}
                    options={CURRENCY_OPTIONS}
                  /></FormControl>
                </FormItem>

                <FormItem className="gap-3">
                  {/* Wraps rather than squeezes: at 375 the price label and the
                      "name your price" caption both broke into two ragged lines
                      trying to share one. Given the chance to wrap, the caption
                      takes the second line whole and stays on the right. */}
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <FormLabel className="shrink-0">
                      Price for download <span className="opacity-60">(optional)</span>
                    </FormLabel>
                    <label className="flex shrink-0 items-center gap-1.5 ml-auto cursor-pointer">
                      <span className="text-xsmall text-muted-foreground font-normal">Let fans pay more if they want</span>
                      <Switch
                        size="sm"
                        checked={nameYourPriceDownload}
                        onCheckedChange={setNameYourPriceDownload}
                      />
                    </label>
                  </div>
                  <FormControl><InputSelect
                    value={downloadPrice}
                    onChange={e => setDownloadPrice((e.target as HTMLInputElement).value)}
                    placeholder="Leave blank to skip"
                    selectValue={currency}
                    onSelectChange={setCurrency}
                    options={CURRENCY_OPTIONS}
                  /></FormControl>
                </FormItem>
              </RadioCard>
            </RadioCardGroup>
          </div>

          {/* ── General info ────────────────────────────────────────────
               Read-only for MusicBrainz-matched releases; editable inputs
               for original uploads (`isNew`). */}
          <div className="flex flex-col gap-3">
            <p className="text-small leading-none font-normal text-foreground">General info</p>
            {canEditMetadata ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <Label htmlFor="edit-title">Release title</Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-artist">Main Artist</Label>
                  <Input
                    id="edit-artist"
                    value={artist}
                    onChange={e => setArtist(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-band">Band Name</Label>
                  <Input
                    id="edit-band"
                    value={band}
                    onChange={e => setBand(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-year">Year</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={year}
                    onChange={e => setYear(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Main Artist"    value={release.artist} />
                <InfoField label="Band Name"      value={release.band ?? "—"} />
                <InfoField label="Release title"  value={release.title} />
                <InfoField label="Label"          value={release.label ?? "—"} />
                <InfoField label="Catalog Number" value={release.catalog ?? "—"} />
                <InfoField label="Release Type"   value={TYPE_LABELS[release.type]} />
                <InfoField label="Year"           value={String(release.year)} />
                <InfoField label="Tracks"         value={release.tracks != null ? String(release.tracks) : "—"} />
              </div>
            )}
          </div>
        </div>

        {/* Bigger dialog → footer padding scales up to match the section
            padding. DialogContent here uses p-0 so no negative-margin bleed is
            needed. On a phone: the sheet's own gutter, and NO Cancel — the ✕
            in the corner is how every other sheet in the app is dismissed, and
            two stacked full-width buttons were 153px of the 731 the sheet
            had. Measured after: 72. */}
        <DialogFooter className="shrink-0 mx-0 mb-0 p-3 md:p-8">
          {/* `lg` (48px) is the house default for a form's own actions — the
              same rung `Input` and `InputSelect` already default to, so the
              button that submits a stack of 48px fields is not 40. */}
          <DialogClose className="hidden md:inline-flex" render={<Button variant="outline" size="lg" />}>Cancel</DialogClose>
          <Button size="lg" onClick={save} className="w-full md:w-auto">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
