"use client"

/*
 * Menu — a labelled account menu on an `outline` Button, and the "…" a card
 * or row carries. Real `DropdownMenu` parts, real `Button` triggers via
 * `render`: from 768 up the anchored popup, below it the bottom sheet —
 * `useIsMobile()` picks, and inside the frame it reads the window chip.
 *
 * This file is a CALL SITE, not a copy. The items are inline here because
 * this menu belongs to no media object; a card or row passes
 * `<AlbumCardMenuItems … />` / `<SongMenuItems … />` in the same slot.
 */

import {
  ChevronDown, Heart, LogOut, MoreHorizontal, Music2, Settings, Share, Trash2, Upload, User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function MenuBasicExample() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          My account
          <ChevronDown className="transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem><User />Profile</DropdownMenuItem>
          <DropdownMenuItem><Settings />Settings</DropdownMenuItem>
          <DropdownMenuItem><Music2 />My uploads</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem><Heart />Liked songs</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive"><LogOut />Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6}>
          <DropdownMenuItem><Upload />Upload track</DropdownMenuItem>
          <DropdownMenuItem><Share />Share profile</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive"><Trash2 />Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
