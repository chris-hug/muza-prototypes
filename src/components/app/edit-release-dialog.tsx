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
          Height is capped at `min(90vh, 900px)` so the dialog never
          grows past the viewport. */}
      <DialogContent
        className={cn(
          "sm:max-w-[600px] p-0 gap-0 shadow-none",
          "max-h-[min(90vh,900px)] flex flex-col",
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
        <DialogHeader className="shrink-0 px-8 pt-8 pb-6 border-b border-border flex flex-row items-start gap-4 space-y-0">
          <div className="relative shrink-0">
            <img
              src={cover}
              alt=""
              className="rounded-xs object-cover shadow-sm size-24"
            />
            <button
              type="button"
              aria-label="Change cover"
              className={cn(
                "absolute bottom-1.5 right-1.5 size-7 rounded-full",
                "bg-background/90 backdrop-blur-sm text-foreground",
                "border border-border shadow-sm",
                "flex items-center justify-center",
                "transition-colors hover:bg-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              )}
            >
              <Pencil className="size-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <DialogTitle className="text-large font-semibold leading-none truncate">
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
        </DialogHeader>

        {/* ── Scrollable middle ──────────────────────────────────────────
             Order: Monetisation → General info. */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 pt-6 pb-6 flex flex-col gap-8">

          {/* ── Monetisation ─────────────────────────────────────────────
               Two radio cards — both cards are fully expanded so the user
               can see both options' details at a glance. The "For purchase"
               card always shows its price inputs; the selected radio is
               the only thing that changes when the user picks. */}
          <div className="flex flex-col gap-3">
            <Label>Monetisation</Label>
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
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label>Price for listening</Label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <span className="text-xsmall text-muted-foreground font-normal">Let fans pay more if they want</span>
                      <Switch
                        size="sm"
                        checked={nameYourPriceListen}
                        onCheckedChange={setNameYourPriceListen}
                      />
                    </label>
                  </div>
                  <InputSelect
                    value={listenPrice}
                    onChange={e => setListenPrice((e.target as HTMLInputElement).value)}
                    placeholder={nameYourPriceListen ? "0.00 (leave blank for free)" : "1.00"}
                    className="text-small font-normal"
                    selectValue={currency}
                    onSelectChange={setCurrency}
                    options={CURRENCY_OPTIONS}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label>
                      Price for download <span className="opacity-60">(optional)</span>
                    </Label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <span className="text-xsmall text-muted-foreground font-normal">Let fans pay more if they want</span>
                      <Switch
                        size="sm"
                        checked={nameYourPriceDownload}
                        onCheckedChange={setNameYourPriceDownload}
                      />
                    </label>
                  </div>
                  <InputSelect
                    value={downloadPrice}
                    onChange={e => setDownloadPrice((e.target as HTMLInputElement).value)}
                    placeholder="Leave blank to skip"
                    className="text-small font-normal"
                    selectValue={currency}
                    onSelectChange={setCurrency}
                    options={CURRENCY_OPTIONS}
                  />
                </div>
              </RadioCard>
            </RadioCardGroup>
          </div>

          {/* ── General info ────────────────────────────────────────────
               Read-only for MusicBrainz-matched releases; editable inputs
               for original uploads (`isNew`). */}
          <div className="flex flex-col gap-3">
            <Label>General info</Label>
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
            padding. DialogContent here uses p-0 so no negative-margin
            bleed is needed. */}
        <DialogFooter className="shrink-0 mx-0 mb-0 p-8">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
