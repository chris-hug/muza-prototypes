"use client"

/*
 * AlertDialog — two live triggers: a destructive confirm (the default
 * `AlertDialogAction` is red) and a non-destructive one ("Unpublish", which
 * is reversible, so the action is rendered as a primary `Button` via `render`). The real
 * component: below a 768 window chip it opens as a bottom sheet, from 768 as
 * a centred modal. There is no static preview export, so the frame shows the
 * triggers.
 */

import { Trash2 } from "lucide-react"

import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export default function AlertDialogBasicExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          <Trash2 /> Delete track
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “Blue Afternoon”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the track from your profile and all playlists it appears in. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete track</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline" />}>
          Unpublish release
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish this release?</AlertDialogTitle>
            <AlertDialogDescription>
              Your fans will no longer be able to stream this release. You can republish it at any time from your Studio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep published</AlertDialogCancel>
            <AlertDialogAction render={<Button />}>Unpublish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
