"use client"

/*
 * Alert — the two variants, with and without an inline action. Renders the
 * real `Alert`; the destructive one with `AlertAction` is the "Shop not live
 * yet" pattern from Shop › My products.
 */

import { Info, AlertCircle } from "lucide-react"

import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function AlertsBasicExample() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Alert>
        <Info />
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Your track is processing. It may take up to 10 minutes to appear publicly.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Upload failed</AlertTitle>
        <AlertDescription>File format not supported. Please upload an MP3 or WAV file.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Shop not live yet</AlertTitle>
        <AlertDescription>You can draft listings, but publishing requires finishing setup.</AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm">Open settings</Button>
        </AlertAction>
      </Alert>
    </div>
  )
}
