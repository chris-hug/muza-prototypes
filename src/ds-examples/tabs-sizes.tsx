"use client"

/*
 * Tabs — the segmented control at its three sizes: `sm` (40px), the default
 * (48px) and `lg` (52px, the Wallet's Withdraw / Transfer switch, with its
 * icons). `size` only exists on the default variant; `line` and `pill` have
 * one height each.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Tabs` parts.
 */

import { ArrowDownToLine, Send } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TabsSizesExample() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-8">
      <Tabs defaultValue="music">
        <TabsList size="sm">
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs defaultValue="music">
        <TabsList>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs defaultValue="withdraw" className="w-full">
        <TabsList size="lg" className="w-full">
          <TabsTrigger value="withdraw"><ArrowDownToLine />Withdraw</TabsTrigger>
          <TabsTrigger value="transfer"><Send />Transfer</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
