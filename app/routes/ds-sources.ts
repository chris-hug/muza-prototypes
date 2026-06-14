/*
 * Design-system section → source file map.
 *
 * Purely STRUCTURAL: maps each DS section id to the file that backs
 * it, so `vite.config.ts` can run `git log -1 -- <file>` at build and
 * derive a real "last changed" date per component (injected as
 * `__SECTION_LAST_CHANGED__`). This is set-once-per-component wiring —
 * NOT date maintenance. Dates auto-update forever from git history.
 *
 * Keys are Section ids (the `idFor`/`titleToId` dasherised form).
 * Paths are repo-relative. Sections without an entry simply show no
 * "changed" date (graceful) — add a path here to light one up.
 *
 * Token sections (Colors, Typography) point at the stylesheet that
 * defines them. Composite sections (List Table) can share a file with
 * their parent (Table).
 */
export const SECTION_SOURCE: Record<string, string> = {
  // Foundations
  colors:        "app/app.css",
  typography:    "app/app.css",

  // Controls
  button:        "src/components/ui/button.tsx",
  toggle:        "src/components/ui/toggle.tsx",
  togglegroup:   "src/components/ui/toggle-group.tsx",
  toolbar:       "src/components/ui/toolbar.tsx",
  badge:               "src/components/ui/badge.tsx",
  "status-badge":      "src/components/ui/status-badge.tsx",
  "order-status-badge":"src/components/ui/order-status-badge.tsx",
  chips:         "src/components/ui/chip.tsx",
  "chip-input":  "src/components/ui/chip-input.tsx",
  input:         "src/components/ui/input.tsx",
  select:        "src/components/ui/select.tsx",
  "filter-menu": "src/components/ui/filter-button.tsx",
  combobox:      "src/components/ui/combobox.tsx",
  menu:          "src/components/ui/dropdown-menu.tsx",
  "detail-more-button": "src/components/ui/detail-more-button.tsx",
  navigationmenu:"src/components/ui/navigation-menu.tsx",
  datepicker:    "src/components/ui/date-picker.tsx",
  checkbox:      "src/components/ui/checkbox.tsx",
  "radio-card":  "src/components/ui/radio-card.tsx",
  switch:        "src/components/ui/switch.tsx",
  slider:        "src/components/ui/slider.tsx",

  // Indicators
  meter:           "src/components/ui/meter.tsx",
  progress:        "src/components/ui/progress.tsx",
  spinner:         "src/components/ui/spinner.tsx",
  "top-progress-bar": "src/components/ui/top-progress-bar.tsx",
  separator:       "src/components/ui/separator.tsx",
  avatar:          "src/components/ui/avatar.tsx",
  "user-avatar":     "src/components/ui/user-avatar.tsx",
  "purchased-badge": "src/components/ui/purchased-badge.tsx",

  // Containers
  tabs:          "src/components/ui/tabs.tsx",
  tooltip:       "src/components/ui/tooltip.tsx",
  scrollarea:    "src/components/ui/scroll-area.tsx",
  collapsible:   "src/components/ui/collapsible.tsx",
  accordion:     "src/components/ui/accordion.tsx",

  // Cards & lists
  "album-card":       "src/components/ui/album-card.tsx",
  "artist-card":      "src/components/ui/artist-card.tsx",
  "playlist-card":    "src/components/ui/playlist-card.tsx",
  "cover-play-button":"src/components/ui/cover-play-button.tsx",
  "song-list-item":   "src/components/ui/song-list-item.tsx",
  "card-rail":        "src/components/app/card-rail.tsx",
  "product-card":     "src/components/ui/product-card.tsx",

  // Page composition
  "media-header": "src/components/ui/media-header.tsx",
  "media-list-item": "src/components/ui/media-list-item.tsx",
  search:            "src/components/app/search-results-view.tsx",
  "mobile-header": "src/components/ui/mobile-header.tsx",
  "footer-nav":   "src/components/app/footer-nav.tsx",
  items:          "src/components/app/items-section.tsx",

  // Overlays
  alerts:                 "src/components/ui/alert.tsx",
  alertdialog:            "src/components/ui/alert-dialog.tsx",
  dialog:                 "src/components/ui/dialog.tsx",
  "purchase-album-dialog":"src/components/app/purchase-album-dialog.tsx",
  paywall:                "src/components/app/subscription-dialogs.tsx",
  "credits-dialog":       "src/components/app/credits-dialog.tsx",
  drawer:                 "src/components/ui/sheet.tsx",
  toast:                  "src/components/ui/toast.tsx",

  // Utility
  skeleton:    "src/components/ui/skeleton.tsx",
  popover:     "src/components/ui/popover.tsx",
  table:       "src/components/ui/table.tsx",
  "list-table":"src/components/ui/table.tsx",
  "bulk-action-bar":"src/components/ui/bulk-action-bar.tsx",
  pagination:  "src/components/ui/pagination.tsx",
  command:     "src/components/ui/command.tsx",
  "otp-input": "src/components/ui/input-otp.tsx",
  form:        "src/components/ui/form.tsx",

  // Player — the live bar is player-bar-b.tsx.
  "player-bar":     "src/components/ui/player-bar-b.tsx",
  "player-overlay": "src/components/ui/player-overlay.tsx",
}
