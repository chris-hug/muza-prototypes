"use client"

/*
 * Tabs in its three variants, each with the labels a real screen gives it:
 * the segmented control (the Report page's metric switch), the underline
 * strip (the Library's status filter, `autoCenter={false}` as there), and
 * the pills (the player overlay's Lyrics / Now listening / Up next).
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Tabs` parts. Every one is uncontrolled (`defaultValue`), so what you copy
 * out compiles on its own; the app's call sites pass `value` +
 * `onValueChange` because the tab is state they own (a URL param, a store).
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TabsBasicExample() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-12">
      <Tabs defaultValue="listeners">
        <TabsList>
          <TabsTrigger value="listeners">Listeners</TabsTrigger>
          <TabsTrigger value="streams">Streams</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs defaultValue="all">
        <TabsList variant="line" autoCenter={false} className="w-full justify-start border-b border-border">
          <TabsTrigger value="all">All albums</TabsTrigger>
          <TabsTrigger value="owned">Owned</TabsTrigger>
          <TabsTrigger value="downloaded">Downloaded</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4 text-muted-foreground">Every album in your library.</TabsContent>
        <TabsContent value="owned" className="pt-4 text-muted-foreground">Albums you have bought.</TabsContent>
        <TabsContent value="downloaded" className="pt-4 text-muted-foreground">Albums saved to this device.</TabsContent>
      </Tabs>

      <Tabs defaultValue="lyrics">
        <TabsList variant="pill">
          <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
          <TabsTrigger value="now-listening">Now listening</TabsTrigger>
          <TabsTrigger value="up-next">Up next</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
