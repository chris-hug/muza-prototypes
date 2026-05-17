"use client"

/*
 * ShippingZoneEditor — reusable zone table for both shop-wide defaults
 * (Shop settings sheet) and per-listing overrides (vinyl-create-listing).
 *
 * Each row is a Region + rate (InputSelect with currency) + Free toggle +
 * Remove. Add a new row with the "Add shipping zone" button.
 *
 * Region is a Combobox bound to a predefined list (no free text) so the
 * runtime can map a buyer's destination country to a zone deterministically.
 * The system implicitly treats "Worldwide" as the lowest-priority match.
 */

import { useMemo, useState } from "react"
import { Plus, Trash2, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { InputSelect } from "@/components/ui/input-select"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ─── Region taxonomy ─────────────────────────────────────────────────────────
//
// Predefined regions cover ~95% of indie shop needs without overwhelming
// the picker. The system maps a buyer's country to the first zone that
// contains it (top-down through the artist's configured list), falling
// back to "Worldwide".

export interface ShippingRegion {
  /** Stable identifier — used as the value in zone.region. */
  id:    string
  /** Human-readable name shown in the picker + the input chip. */
  name:  string
  /** Used to group entries in the Combobox dropdown. */
  group: "Catch-all" | "Continent / bloc" | "Country"
}

export const SHIPPING_REGIONS: ShippingRegion[] = [
  { id: "worldwide",     name: "Worldwide",        group: "Catch-all"        },
  { id: "north-america", name: "North America",    group: "Continent / bloc" },
  { id: "europe",        name: "Europe (EU + UK + EFTA)", group: "Continent / bloc" },
  { id: "asia-pacific",  name: "Asia-Pacific",     group: "Continent / bloc" },
  { id: "latin-america", name: "Latin America",    group: "Continent / bloc" },
  { id: "africa",        name: "Africa",           group: "Continent / bloc" },
  { id: "middle-east",   name: "Middle East",      group: "Continent / bloc" },
  { id: "oceania",       name: "Oceania",          group: "Continent / bloc" },
  { id: "us", name: "United States", group: "Country" },
  { id: "ca", name: "Canada",        group: "Country" },
  { id: "uk", name: "United Kingdom",group: "Country" },
  { id: "de", name: "Germany",       group: "Country" },
  { id: "fr", name: "France",        group: "Country" },
  { id: "jp", name: "Japan",         group: "Country" },
  { id: "au", name: "Australia",     group: "Country" },
]

export const CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
]

export interface ShippingZone {
  id:       string
  /** Region id — references SHIPPING_REGIONS, or "" while picking. */
  region:   string
  price:    string
  currency: string
  free:     boolean
}

export const DEFAULT_ZONES: ShippingZone[] = [
  { id: "ww", region: "worldwide", price: "8.00", currency: "USD", free: false },
]

// ─── Editor ──────────────────────────────────────────────────────────────────

interface ShippingZoneEditorProps {
  zones:    ShippingZone[]
  onChange: (next: ShippingZone[]) => void
  /** Optional caption above the table — defaults to "Shipping zones". */
  label?: string
}

export function ShippingZoneEditor({
  zones, onChange, label = "Shipping zones",
}: ShippingZoneEditorProps) {
  function update(id: string, patch: Partial<ShippingZone>) {
    onChange(zones.map(z => (z.id === id ? { ...z, ...patch } : z)))
  }
  function remove(id: string) {
    onChange(zones.filter(z => z.id !== id))
  }
  function add() {
    onChange([
      ...zones,
      { id: crypto.randomUUID(), region: "", price: "1.00", currency: "USD", free: false },
    ])
  }

  // Disallow picking a region already used by another row.
  const takenIds = useMemo(
    () => new Set(zones.map(z => z.region).filter(Boolean)),
    [zones],
  )

  return (
    <div className="flex flex-col gap-3">
      {label && <Label>{label}</Label>}

      {/* Column header row — only shown once we have ≥ 1 zone. Gives each
           field its own identity so the empty Region pill's chevron
           doesn't read as if it belongs to the Rate input next to it. */}
      {zones.length > 0 && (
        <div className="flex items-center gap-4 pr-1 pl-0">
          <span className="w-48 shrink-0 text-2xsmall text-muted-foreground">Region</span>
          <span className="flex-1 text-2xsmall text-muted-foreground">Rate</span>
          {/* Trailing spacer matches the Free toggle + delete column width */}
          <span className="w-[120px] shrink-0" aria-hidden="true" />
        </div>
      )}

      {zones.map(z => (
        <ShippingZoneRow
          key={z.id}
          zone={z}
          taken={takenIds}
          onChange={(patch) => update(z.id, patch)}
          onRemove={() => remove(z.id)}
        />
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-3"
        onClick={add}
      >
        <Plus className="size-4" />
        Add shipping zone
      </Button>
    </div>
  )
}

// ─── Single row ──────────────────────────────────────────────────────────────

function ShippingZoneRow({
  zone, taken, onChange, onRemove,
}: {
  zone: ShippingZone
  taken: Set<string>
  onChange: (patch: Partial<ShippingZone>) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-48 shrink-0">
        <Select
          value={zone.region}
          onValueChange={(v) => v && onChange({ region: String(v) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pick region" />
          </SelectTrigger>
          {/* Popup defaults to the trigger's width (192px), which clips
               longer region names like "United Kingdom" against the
               checkmark indicator. `w-auto` lets it size to content;
               `min-w-(--anchor-width)` keeps it at least as wide as the
               trigger so it doesn't shrink for short labels. */}
          <SelectContent className="w-auto min-w-(--anchor-width)">
            {(["Catch-all", "Continent / bloc", "Country"] as const).map(group => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {SHIPPING_REGIONS.filter(r => r.group === group).map(r => {
                  const isTakenElsewhere = taken.has(r.id) && r.id !== zone.region
                  return (
                    <SelectItem
                      key={r.id}
                      value={r.id}
                      disabled={isTakenElsewhere}
                    >
                      <MapPin className="text-muted-foreground" />
                      {r.name}
                      {isTakenElsewhere && (
                        <span className="ml-auto text-2xsmall text-muted-foreground">In use</span>
                      )}
                    </SelectItem>
                  )
                })}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <InputSelect
        value={zone.free ? "" : zone.price}
        onChange={(e) => onChange({ price: e.target.value })}
        selectValue={zone.currency}
        onSelectChange={(v) => onChange({ currency: v })}
        options={CURRENCIES}
        disabled={zone.free}
        placeholder={zone.free ? "Free" : "1.00"}
        className="flex-1"
      />

      <div className="flex items-center gap-2 shrink-0">
        <Label htmlFor={`free-${zone.id}`} className="cursor-pointer text-xsmall text-muted-foreground">
          Free
        </Label>
        <Switch
          id={`free-${zone.id}`}
          checked={zone.free}
          onCheckedChange={(v) => onChange({ free: v })}
        />
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label="Remove shipping zone"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
