"use client"

import { useState, useRef } from "react"
import { Search, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/app/theme-provider"

// ─── Figma source: L9yw4Yaec9YtAXGxP8q4fu node 20458:305 ─────────────────────
// States: default | focus | filled
// Background: always --background (#FEFFFB)
// Search area: on focus/filled → bg-muted + dark underline
// Placeholder: muted-foreground (rgba(84,84,69,0.75) in light)

interface TopbarProps {
  placeholder?: string
  /** Right-side slot — pass avatar, studio button, etc. */
  actions?: React.ReactNode
  className?: string
}

export function Topbar({
  placeholder = "Search for Artists, Albums or Songs",
  actions,
  className,
}: TopbarProps) {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const isFocusOrFilled = focused || value.length > 0

  return (
    <header
      className={cn(
        // Always bg-background — never white, never muted
        "h-[54px] w-full bg-background border-b border-border flex items-center gap-6 pr-6 shrink-0",
        className
      )}
    >
      {/* ── Search area ─────────────────────────────────────────────── */}
      {/* Only adds its own border-b on focus/filled — default state uses header's border-b */}
      <div
        className={cn(
          "flex flex-1 h-full items-center gap-2 pl-8 pr-4 transition-colors cursor-text",
          isFocusOrFilled
            ? "bg-muted border-b border-foreground"
            : "bg-background"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Search icon — muted-foreground so it carries the 75% opacity */}
        <Search className="size-5 shrink-0 text-muted-foreground" />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            // bg-transparent so the parent bg shows through
            "flex-1 bg-transparent border-none outline-none text-base font-normal",
            "text-foreground placeholder:text-muted-foreground",
          )}
        />
      </div>

      {/* ── Right actions slot ──────────────────────────────────────── */}
      {actions && (
        <div className="flex items-center gap-4 shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}

// ─── Mode toggle ──────────────────────────────────────────────────────────────

function ModeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle light/dark mode"
      className="flex items-center h-9 px-1 rounded-full bg-muted gap-0.5"
    >
      <span className={cn(
        "size-7 flex items-center justify-center rounded-full transition-colors",
        theme === "light"
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}>
        <Sun className="size-[14px]" />
      </span>
      <span className={cn(
        "size-7 flex items-center justify-center rounded-full transition-colors",
        theme === "dark"
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}>
        <Moon className="size-[14px]" />
      </span>
    </button>
  )
}

// ─── Default actions used in demo ─────────────────────────────────────────────

export function TopbarDefaultActions() {
  return (
    <div className="flex items-center gap-4">
      <ModeToggle />
      {/* Avatar */}
      <div className="size-10 rounded-full bg-secondary flex items-center justify-center font-medium text-sm text-secondary-foreground shrink-0 overflow-hidden">
        <span>N</span>
      </div>
    </div>
  )
}
