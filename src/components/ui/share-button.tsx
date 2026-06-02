"use client"

/*
 * ShareButton — the app's standard share affordance. A button that
 * opens a small dropdown menu: "Share…" (native OS sheet, only where the
 * Web Share API exists) + "Copy link" (always). Users actively pick the
 * option rather than the button guessing. Defaults to sharing the
 * current page URL; pass `url` to override.
 *
 * Trigger styling is configurable so it can be the round glassy icon in
 * the MediaHeader cluster or a plain ghost button anywhere else.
 */

import type { ComponentProps } from "react"
import { Share, Link2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useShare } from "@/lib/use-share"

interface ShareButtonProps {
  /** Defaults to the current page URL. */
  url?:    string
  title?:  string
  text?:   string
  variant?: ComponentProps<typeof Button>["variant"]
  size?:    ComponentProps<typeof Button>["size"]
  className?: string
  /** Trigger glyph — defaults to the Share icon. */
  icon?:   React.ReactNode
  ariaLabel?: string
}

export function ShareButton({
  url, title, text,
  variant = "outline", size = "icon-lg", className,
  icon, ariaLabel = "Share",
}: ShareButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant={variant} size={size} aria-label={ariaLabel} />}
        className={className}
      >
        {icon ?? <Share />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-48">
        <ShareMenuItems url={url} title={title} text={text} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/*
 * ShareMenuItems — the share entries for use INSIDE an existing dropdown
 * menu (e.g. a card's "…" context menu): "Share…" (native, where the Web
 * Share API exists) + "Copy link". Same behaviour as ShareButton's
 * dropdown, so every share surface is identical. Must be rendered within
 * a DropdownMenuContent.
 */
export function ShareMenuItems({ url, title, text }: { url?: string; title?: string; text?: string }) {
  const { canNativeShare, copyLink, nativeShare } = useShare({ title, text, url })
  return (
    <>
      {canNativeShare && (
        <DropdownMenuItem onClick={nativeShare}>
          <Share />
          Share…
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={copyLink}>
        <Link2 />
        Copy link
      </DropdownMenuItem>
    </>
  )
}
