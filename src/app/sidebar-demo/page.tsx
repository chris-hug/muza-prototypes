"use client"

import { Sidebar } from "@/components/app/sidebar"
import { Topbar, TopbarDefaultActions } from "@/components/app/topbar"
import { useState } from "react"
import { Music2 } from "lucide-react"

export default function SidebarDemo() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-background">

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        activeNav="Home"
      />

      {/* Main content area */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Topbar — always bg-background */}
        <Topbar actions={<TopbarDefaultActions />} />

        {/* Page body */}
        <div className="flex-1 p-10 overflow-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Good evening</h1>
          <p className="text-muted-foreground text-lg mb-10">Here's what's new on Muza today.</p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl">
            {[
              { emoji: "🎵", title: "Blue Afternoon",   sub: "River Lotus" },
              { emoji: "🎸", title: "Midnight Circuit",  sub: "Axon Fade" },
              { emoji: "🎤", title: "Haunt the Waves",   sub: "Dusk Ensemble" },
              { emoji: "🎹", title: "Static Memory",     sub: "Nora Voss" },
              { emoji: "🥁", title: "Low Tide Prayer",   sub: "Coastal Rites" },
              { emoji: "🎺", title: "Signal Lost",       sub: "Axon Fade" },
            ].map((card) => (
              <div
                key={card.title}
                className="flex items-center gap-3 bg-background rounded-xl p-3 border border-border hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="size-12 rounded-lg bg-neutral-300 flex items-center justify-center text-xl shrink-0">
                  {card.emoji}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{card.title}</p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-3 text-sm text-muted-foreground">
            <Music2 className="size-4" />
            <span>Sidebar component — <code className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">src/components/app/sidebar.tsx</code></span>
          </div>
        </div>

      </main>
    </div>
  )
}
