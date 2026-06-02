"use client"

/*
 * MobileHeader — the frosted top bar for phone layouts. Shares the exact
 * glass surface as the bottom FooterNav (`.frosted-glass`), just bordered
 * on the bottom instead of the top, so the two bookend the screen with
 * the same material.
 *
 * It's composed from small primitives so each context (Home / Library /
 * Explore + their search states) is just a different arrangement:
 *   · MobileTitleRow   — big title + trailing (avatar or icon pills)
 *   · MobileSearchBar  — pill search input (+ optional Cancel / clear)
 *   · MobilePillTabs   — horizontal-scroll filter pills
 *   · MobileScopeToggle— 2-segment scope switch (Catalog / Library)
 *   · MobileIconButton — round secondary icon button (+ / search)
 *
 * Figma: file dbSHgvquI2o4TFie2iAJxv › 4973:204176 (+ siblings).
 */

import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Chip } from "@/components/ui/chip"

// ── Surface ──────────────────────────────────────────────────────────
export function MobileHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <header
      className={cn(
        // Same glass as FooterNav; bottom hairline since it's a top bar.
        "frosted-glass border-b border-border/50 sticky top-0 z-30 select-none",
        // 12px horizontal = the phone page gutter; safe-area top inset.
        "px-3 pt-[max(12px,env(safe-area-inset-top))] pb-3 flex flex-col gap-3",
        className,
      )}
    >
      {children}
    </header>
  )
}

// ── Title row ────────────────────────────────────────────────────────
export function MobileTitleRow({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-9">
      <h1 className="text-2xlarge font-medium tracking-tight text-foreground truncate">{title}</h1>
      {trailing && <div className="flex items-center gap-2 shrink-0">{trailing}</div>}
    </div>
  )
}

// Round secondary icon button (the + / search pills next to a title).
export function MobileIconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-[background,transform] hover:bg-secondary-hover active:scale-[0.96] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-[18px]"
    >
      {children}
    </button>
  )
}

// Trailing avatar.
export function MobileAvatar({ src }: { src: string }) {
  return <img src={src} alt="" draggable={false} className="size-9 rounded-full object-cover bg-secondary shrink-0" />
}

// ── Search bar ───────────────────────────────────────────────────────
export function MobileSearchBar({
  value, onChange, placeholder = "Search", autoFocus,
  onCancel, onClear, onFocus, onSubmit,
}: {
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  /** Show a "Cancel" link to the right (focused / search mode). */
  onCancel?: () => void
  /** Show a clear (✕) inside the field when there's a value. */
  onClear?: () => void
  /** Fired when the input gains focus (drives the idle→focused state). */
  onFocus?: () => void
  /** Fired on Enter (drives focused→submitted, reveals result filters). */
  onSubmit?: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex flex-1 min-w-0 items-center gap-2 h-10 rounded-full bg-secondary pl-4 pr-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onFocus={onFocus}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSubmit?.() } }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 min-w-0 bg-transparent outline-none text-base font-normal text-foreground placeholder:text-muted-foreground"
        />
        {onClear && value
          ? <button type="button" onClick={onClear} aria-label="Clear" className="shrink-0 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          : null}
      </div>
      {onCancel && (
        <button type="button" onClick={onCancel} className="shrink-0 px-2 text-base font-normal text-primary-text">
          Cancel
        </button>
      )}
    </div>
  )
}

// ── Pill tabs / filters ──────────────────────────────────────────────
export interface PillTab { value: string; label: string }

export function MobilePillTabs({ tabs, value, onChange }: {
  tabs: PillTab[]
  value: string
  onChange?: (v: string) => void
}) {
  return (
    // Bleed to the edges so pills scroll under the header gutter.
    <div className="-mx-3 px-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map(t => (
        <Chip
          key={t.value}
          size="md"
          selected={t.value === value}
          onClick={() => onChange?.(t.value)}
          className="shrink-0"
        >
          {t.label}
        </Chip>
      ))}
    </div>
  )
}

// ── Scope toggle (segmented) ─────────────────────────────────────────
export function MobileScopeToggle({ options, value, onChange }: {
  options: PillTab[]
  value: string
  onChange?: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-muted/70 p-1">
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange?.(o.value)}
            aria-pressed={active}
            className={cn(
              "flex-1 h-8 rounded-full text-small font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active ? "bg-background text-foreground shadow-[0_1px_2px_rgba(13,13,4,0.10)]" : "text-muted-foreground",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
