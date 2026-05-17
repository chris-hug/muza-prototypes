/*
 * Platform-level constants — anything that identifies "Muza" as the
 * legal entity operating the marketplace. Used in buyer receipts, the
 * compose-email preview, and any other surface where Muza speaks in
 * its own legal voice (e.g. terms, footer, contact).
 *
 * Centralised here so a relocation, name change, or VAT-ID update is
 * a one-line edit, not a grep-and-pray across the codebase.
 */

export const MUZA_LEGAL = {
  legalName:   "Muza Arts and Music INC.",
  /** Short / display name used inline ("Muza"). */
  displayName: "Muza",
  /** Form of organisation — printed in the receipt footer. */
  entityType:  "New York State 501(c)(3) non-profit corporation",
  /** Postal / registered address. Mock until incorporation paperwork
   *  hands us the real one — drop into platform.ts when known. */
  address: {
    line1:   "228 Park Avenue South",
    line2:   "PMB 84319",
    city:    "New York",
    region:  "NY",
    postal:  "10003-1502",
    country: "United States",
  },
  /** US EIN. Filled in once Muza completes IRS-501(c)(3) determination. */
  ein:     "—",
  /** Single contact for buyer support, shown in every receipt footer. */
  supportEmail: "support@muza.example",
  website:      "muza.example",
} as const

/**
 * Format MUZA_LEGAL.address as a flat single-line string for inline use
 * inside email body text. Keeps every consumer free from re-deriving
 * the same join logic.
 */
export function formatMuzaAddress(): string {
  const a = MUZA_LEGAL.address
  return [a.line1, a.line2, `${a.city}, ${a.region} ${a.postal}`, a.country]
    .filter(Boolean)
    .join(", ")
}

// ─── Receipt numbering ───────────────────────────────────────────────────────
//
// Marketplace-facilitator receipts are issued by Muza, not by individual
// sellers — so the sequential number is OURS. Separate counter from the
// per-shop order numbers (`#M-1042`) the artist sees in their Studio.
//
// Format: M-RCT-YYYY-NNNNN (e.g. M-RCT-2026-01042). Real backend keeps
// a single monotonic counter scoped per fiscal year; the prototype
// derives a deterministic stable number from the per-shop order number
// so the same order always renders the same receipt number.

/**
 * Derive a stable Muza receipt number from a per-shop order number and
 * the order date. Same input → same output, so the seller and buyer
 * see consistent numbers across re-renders.
 *
 * Real implementation: a backend table with an auto-increment scoped
 * per year, with the actual issue timestamp recorded for audit.
 */
export function muzaReceiptNumber(orderNumber: string, orderDateISO: string): string {
  const year = new Date(orderDateISO).getFullYear()
  // Pull the digit run from the order number ("#M-1042" → "1042").
  // Fall back to a hash so non-numeric refs still get a deterministic
  // sequence — should never trip in production data.
  const digits = orderNumber.match(/\d+/)?.[0]
    ?? Math.abs(hashString(orderNumber) % 99999).toString()
  const padded = digits.padStart(5, "0")
  return `M-RCT-${year}-${padded}`
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return h
}
