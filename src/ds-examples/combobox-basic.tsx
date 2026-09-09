"use client"

/*
 * Combobox filtering for real: Country over the full ISO list with a glyph
 * per row (the Shop › Settings shape), and Artist over the catalog. Both
 * pass `items` on the root and a function child to `ComboboxContent` — that
 * pair is what turns typing into filtering; static children would list every
 * row whatever you type.
 *
 * This file is a CALL SITE, not a copy: the real `Combobox` parts with the
 * props `cart-drawer.tsx` and `shop-settings-view.tsx` pass. The fields are
 * uncontrolled; the long list caps its popup with `max-h-[280px]` at the
 * call site, as every country field in the app does.
 */

import { MapPin } from "lucide-react"

import { Combobox, ComboboxContent, ComboboxItem, ComboboxTrigger } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { getRichAlbums } from "@/lib/album-catalog"
import { COUNTRY_CODES, countryName } from "@/lib/countries"

const ARTISTS = Array.from(new Set(getRichAlbums().map(a => a.artist)))

export default function ComboboxBasicExample() {
  return (
    <div className="flex flex-wrap gap-6 items-start">
      <div className="flex flex-col gap-1.5 w-[280px]">
        <Label>Country</Label>
        <Combobox items={COUNTRY_CODES} itemToStringLabel={c => countryName(String(c))}>
          <ComboboxTrigger placeholder="Search countries…" />
          <ComboboxContent className="max-h-[280px] overflow-y-auto">
            {(code: string) => (
              <ComboboxItem key={code} value={code}>
                <MapPin className="text-muted-foreground" />
                {countryName(code)}
              </ComboboxItem>
            )}
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="flex flex-col gap-1.5 w-[280px]">
        <Label>Artist</Label>
        <Combobox items={ARTISTS}>
          <ComboboxTrigger placeholder="Search artists…" />
          <ComboboxContent>
            {(name: string) => (
              <ComboboxItem key={name} value={name}>{name}</ComboboxItem>
            )}
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  )
}
