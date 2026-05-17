"use client"

/*
 * PlaylistCreateCard — the "Create New Playlist" tile.
 *
 * Figma source: file L9yw4Yaec9YtAXGxP8q4fu › Component "Record Cover"
 *   · 19272:1625 — Type=Add, State=Default
 *   · 19272:1629 — Type=Add, State=Hover
 *
 * Distinctive shape — a square tinted background with a centered dark
 * round button hosting a "+" icon, then "Create New Playlist" label
 * below. Sits as the first tile in any "Your playlists" grid so
 * adding a new playlist is a peer to opening an existing one.
 */

import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

export interface PlaylistCreateCardProps {
  onClick?: () => void
  /** Override the default label — defaults to "Create New Playlist". */
  label?:   string
  className?: string
}

export function PlaylistCreateCard({
  onClick, label = "Create New Playlist", className,
}: PlaylistCreateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Card stretches to its container — consumers control width
        // via grid cell / parent sizing. Figma natural size 192px.
        "group/create flex flex-col gap-1 text-center outline-none w-full min-w-0",
        "rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {/* Square tinted tile with centered dark round button. Hover
           subtly tightens the background tint — matches the Figma
           hover state which is otherwise visually identical. */}
      <div
        className={cn(
          "relative aspect-square w-full rounded-xs",
          "bg-muted/60 transition-colors group-hover/create:bg-muted",
          "flex items-center justify-center",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center size-12 rounded-full",
            "bg-foreground text-background",
            "transition-transform group-hover/create:scale-[1.04]",
          )}
        >
          <Plus className="size-5" />
        </span>
      </div>

      <p className="text-small font-normal leading-5 text-foreground truncate">{label}</p>
    </button>
  )
}
