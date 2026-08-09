"use client"

/*
 * ShareButton — the app's standard share affordance. ONE adaptive action,
 * no menu: where the Web Share API exists (mostly mobile) the button opens
 * the OS share sheet; everywhere else it copies the link (with a toast).
 * The native sheet already offers "copy" alongside AirDrop / messaging, so
 * a separate Copy-link row would be redundant. Defaults to the current page
 * URL; pass `url` to override.
 *
 * Trigger styling is configurable so it can be the round glassy icon in
 * the MediaHeader cluster or a plain ghost button anywhere else.
 */

import type { ComponentProps } from "react"
import { Share, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
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
  const { canNativeShare, copyLink, nativeShare } = useShare({ title, text, url })
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      className={className}
      onClick={canNativeShare ? nativeShare : copyLink}
    >
      {icon ?? <Share />}
    </Button>
  )
}

/*
 * ShareMenuItems — the single share entry for use INSIDE an existing
 * dropdown menu (a card / song / detail "…"). ONE adaptive row: "Share…"
 * (opens the native sheet) where the Web Share API exists, otherwise "Copy
 * link". Label + icon reflect what the row actually does, so every menu's
 * share affordance is identical. Must be rendered within a
 * DropdownMenuContent.
 */
export function ShareMenuItems({ url, title, text }: { url?: string; title?: string; text?: string }) {
  const { canNativeShare, copyLink, nativeShare } = useShare({ title, text, url })
  return (
    <DropdownMenuItem onClick={canNativeShare ? nativeShare : copyLink}>
      {canNativeShare ? <Share /> : <Link2 />}
      {canNativeShare ? "Share…" : "Copy link"}
    </DropdownMenuItem>
  )
}
