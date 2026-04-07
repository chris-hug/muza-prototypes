"use client"

import { useState } from "react"
import { AnimatedLogo } from "@/components/app/animated-logo"
import { Sidebar } from "@/components/app/sidebar"
import { StudioMusicView } from "@/components/app/studio-music"
import { Topbar, TopbarDefaultActions } from "@/components/app/topbar"
import { Button } from "@/components/ui/button"
import { Badge, ContentTypeBadge, StatusBadge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox, CheckboxField } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Combobox, ComboboxTrigger, ComboboxContent, ComboboxItem } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Chip, ChipDismiss, ChipGroup } from "@/components/ui/chip"
import { useToast } from "@/components/ui/toast"
import {
  AlertCircle, CheckCircle2, Info, Music2, Heart, Share2,
  SkipBack, SkipForward, Play, Pause, Shuffle, Repeat,
  Settings, User, LogOut, Upload, MoreHorizontal,
  Plus, Search, ChevronDown, Trash2,
} from "lucide-react"

// ─── Section heading component ────────────────────────────────────────────────
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16">
      <p className="text-sm font-normal text-foreground mb-5 pb-3 border-b border-border">
        {title}
      </p>
      {children}
    </section>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-normal text-muted-foreground mb-3">{children}</p>
  )
}

// ─── Home view ────────────────────────────────────────────────────────────────
function HomeView() {
  return (
    <div className="p-10 max-w-3xl">
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Good evening</h1>
      <p className="text-muted-foreground text-lg mb-10">Here's what's new on Muza today.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
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
              <p className="font-normal text-sm truncate">{card.title}</p>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-medium mb-4">Recently played</h2>
      <div className="flex flex-col max-w-md">
        {[
          { n: 1, emoji: "🎵", title: "Blue Afternoon",  artist: "River Lotus",   dur: "3:42", active: false },
          { n: 2, emoji: "🎸", title: "Midnight Circuit", artist: "Axon Fade",     dur: "4:15", active: false },
          { n: 3, emoji: "🎤", title: "Haunt the Waves",  artist: "Dusk Ensemble", dur: "5:01", active: true },
          { n: 4, emoji: "🎹", title: "Static Memory",    artist: "Nora Voss",     dur: "2:58", active: false },
        ].map(({ n, emoji, title, artist, dur, active }) => (
          <div key={n} className={`flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-colors ${active ? "bg-muted" : "hover:bg-muted"}`}>
            <div className="w-5 text-center text-sm text-muted-foreground shrink-0">
              {active ? <Play className="size-3.5 fill-primary text-primary mx-auto" /> : n}
            </div>
            <div className="size-9 rounded-md bg-neutral-300 shrink-0 flex items-center justify-center">{emoji}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-normal truncate ${active ? "text-primary" : ""}`}>{title}</p>
              <p className="text-xs text-muted-foreground">{artist}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{dur}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Studio pages ─────────────────────────────────────────────────────────────

const STUDIO_TABS: Record<string, string[]> = {
  Pages:  ["Artists", "Label"],
  Music:  ["My Music", "Upload Music"],
  Shop:   ["My Products", "Orders", "Add Product"],
  Wallet: ["Dashboard", "Transfer", "Report", "Manage"],
}

function toTabValue(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-")
}

function StudioView({ page }: { page: string }) {
  if (page === "Music") return <StudioMusicView />

  const tabs = STUDIO_TABS[page] ?? []

  return (
    <Tabs defaultValue={toTabValue(tabs[0])} className="flex flex-col h-full">

      {/* ── Header + tab list ──────────────────────────────────────────── */}
      <div className="shrink-0 px-10 pt-6 border-b border-border">
        <TabsList variant="line" className="w-auto justify-start gap-0 h-auto pb-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={toTabValue(tab)}
              className="flex-none px-4 pb-3 text-sm"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {tabs.map((tab) => (
          <TabsContent
            key={tab}
            value={toTabValue(tab)}
            className="p-10 h-full"
          >
            <p className="text-sm text-muted-foreground">{tab}</p>
          </TabsContent>
        ))}
      </div>

    </Tabs>
  )
}

// ─── Kitchen sink helpers ──────────────────────────────────────────────────────

function StatusBadgeDemo() {
  const [status, setStatus] = useState<"public" | "private">("public")
  return (
    <StatusBadge
      status={status}
      onClick={() => setStatus(s => s === "public" ? "private" : "public")}
    />
  )
}

function ChipFilterDemo() {
  const [selected, setSelected] = useState<string[]>(["electronic"])
  const genres = ["All", "Hip-Hop", "Electronic", "Jazz", "R&B", "Indie", "Afrobeats", "Pop"]

  function toggle(g: string) {
    if (g === "all") {
      setSelected([])
      return
    }
    setSelected((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  return (
    <ChipGroup>
      {genres.map((g) => (
        <Chip
          key={g}
          selected={g === "All" ? selected.length === 0 : selected.includes(g.toLowerCase())}
          onClick={() => toggle(g.toLowerCase())}
        >
          {g}
        </Chip>
      ))}
    </ChipGroup>
  )
}

function ChipDismissDemo() {
  const [tags, setTags] = useState(["Hip-Hop", "Electronic", "Jazz", "Indie"])

  return (
    <ChipGroup>
      {tags.map((tag) => (
        <ChipDismiss
          key={tag}
          onDismiss={() => setTags((prev) => prev.filter((t) => t !== tag))}
        >
          {tag}
        </ChipDismiss>
      ))}
      {tags.length === 0 && (
        <button
          type="button"
          onClick={() => setTags(["Hip-Hop", "Electronic", "Jazz", "Indie"])}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset
        </button>
      )}
    </ChipGroup>
  )
}

function ToastDemo() {
  const { add } = useToast()
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() => add({ title: "Blue Afternoon added to playlist" })}
      >
        Default
      </Button>
      <Button
        onClick={() => add({ title: "Track saved!", description: "Your changes have been saved successfully.", type: "success" })}
      >
        Success
      </Button>
      <Button
        variant="destructive"
        onClick={() => add({ title: "Upload failed", description: "File format not supported. Please upload an MP3 or WAV file.", type: "error" })}
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => add({ title: "Heads up", description: "Your storage is almost full. Upgrade your plan to continue uploading.", type: "warning" })}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => add({ title: "New release alert", description: "River Lotus just dropped a new album.", type: "info" })}
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() => add({ title: "Processing track…", description: "Blue Afternoon is being transcoded. This may take a minute.", type: "loading" })}
      >
        Loading
      </Button>
    </div>
  )
}

function DatePickerDemo() {
  const [date, setDate] = useState<Date | undefined>()
  const [releaseDate, setReleaseDate] = useState<Date | undefined>()

  return (
    <div className="flex flex-wrap gap-6 items-start">
      <div className="flex flex-col gap-1.5 w-[240px]">
        <Label>Release date</Label>
        <DatePicker
          value={releaseDate}
          onChange={setReleaseDate}
          placeholder="Pick a release date"
        />
      </div>
      <div className="flex flex-col gap-1.5 w-[240px]">
        <Label>Start date</Label>
        <DatePicker
          value={date}
          onChange={setDate}
          placeholder="Pick a date"
        />
      </div>
    </div>
  )
}

// ─── Kitchen sink (Explore view) ──────────────────────────────────────────────
function ExploreView() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState([62])
  const [progress, setProgress] = useState([38])

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center gap-6 py-16 border-b border-border bg-muted">
        <AnimatedLogo size={220} />
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-1">Design System</h1>
          <p className="text-sm text-muted-foreground">Founders Grotesk · shadcn/ui · Tailwind v4</p>
        </div>
      </div>

    <div className="max-w-[960px] px-10 py-10 pb-32">

      {/* Quick nav */}
      <nav className="flex flex-wrap gap-1.5 mb-12">
        {[
          "Colors","Typography","Buttons","Badges","Chips","Inputs","Combobox","Date Picker",
          "Checkbox","Switch & Slider","Avatar","Tabs","Cards","Alerts","Alert Dialog",
          "Dropdown","Toast","Player","Song List","Skeleton",
        ].map((s) => {
          const id = s.toLowerCase().replace(/\s+&\s+/g,"-").replace(/\s+/g,"-")
          return (
            <button
              key={s}
              type="button"
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="text-xs font-normal text-foreground px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors"
            >
              {s}
            </button>
          )
        })}
      </nav>

      {/* ══ COLORS ══ */}
      <Section id="colors" title="Colors">
        <p className="text-xs font-normal text-muted-foreground mb-3">Muza neutrals — warm olive-tinted</p>
        <div className="flex gap-1 mb-8">
          {[
            { name: "50",  bg: "#f9faf0" },
            { name: "100", bg: "#f1f3e6" },
            { name: "200", bg: "#eceedf" },
            { name: "300", bg: "#daddcd" },
            { name: "400", bg: "#b5b7a7" },
            { name: "500", bg: "#86887c" },
            { name: "600", bg: "#69695d" },
            { name: "700", bg: "#3c3d33" },
            { name: "800", bg: "#2e2c24" },
            { name: "900", bg: "#1d1c18" },
            { name: "950", bg: "#0d0d04" },
          ].map((c) => (
            <div key={c.name} className="flex-1 min-w-0">
              <div className="h-14 rounded-md border border-border" style={{ background: c.bg }} />
              <div className="mt-1.5 text-xs text-muted-foreground leading-tight">
                <span className="block text-foreground">{c.name}</span>
                {c.bg}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs font-normal text-muted-foreground mb-3">Semantic tokens</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: "--background",    cls: "bg-background border border-border", label: "#fefffb" },
            { name: "--foreground",    cls: "bg-foreground",                       label: "#0d0d04" },
            { name: "--primary",       cls: "bg-primary",                          label: "#001183" },
            { name: "--secondary",     cls: "bg-secondary border border-border",   label: "#eceedf" },
            { name: "--accent",        cls: "bg-accent border border-border",      label: "#f1f3e6" },
            { name: "--muted",         cls: "bg-muted border border-border",       label: "#f9faf0" },
            { name: "--border",        cls: "bg-border",                           label: "#daddcd" },
            { name: "--destructive",   cls: "bg-destructive",                      label: "#dc2626" },
            { name: "--muted-fg",      cls: "bg-[rgba(105,105,93,0.75)]",          label: "neutral-600 @ 75%" },
            { name: "--primary-fg",    cls: "bg-primary-foreground border border-border", label: "#f9faf0" },
            { name: "--sidebar",       cls: "bg-sidebar border border-border",     label: "#fefffb" },
            { name: "--sidebar-accent",cls: "bg-sidebar-accent border border-border", label: "#f1f3e6" },
            { name: "--input",         cls: "bg-input",                            label: "#eceedf" },
          ].map((t) => (
            <div key={t.name} className="flex flex-col gap-1.5">
              <div className={`h-10 rounded-md ${t.cls}`} />
              <div className="text-xs text-muted-foreground leading-tight">
                <span className="block text-foreground">{t.name}</span>
                {t.label}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ TYPOGRAPHY ══ */}
      <Section id="typography" title="Typography — Founders Grotesk">
        <div className="flex flex-col divide-y divide-border">
          {[
            { label: "H1",        sub: "Semibold · 72px · text-5xl",
              el: <p className="text-5xl font-semibold leading-none tracking-[-0.025em]">Discover Music</p> },
            { label: "H2",        sub: "Semibold · 48px · text-3xl",
              el: <p className="text-3xl font-semibold leading-none tracking-[-0.02em]">New Releases</p> },
            { label: "H3",        sub: "Medium · 36px · text-2xl",
              el: <p className="text-2xl font-medium leading-tight tracking-[-0.015em]">Featured Artists</p> },
            { label: "H4",        sub: "Medium · 30px · text-xl",
              el: <p className="text-xl font-medium leading-tight">Top Playlists</p> },
            { label: "Large",     sub: "Regular · 24px · text-lg",
              el: <p className="text-lg leading-normal">Stream independent artists directly.</p> },
            { label: "Lead",      sub: "Regular · 20px · text-base",
              el: <p className="text-base leading-normal">A platform built for artists who want to own their sound.</p> },
            { label: "Body",      sub: "Regular · 18px · text-sm",
              el: <p className="text-sm leading-normal">Upload your tracks, build your fanbase, and get paid fairly.</p> },
            { label: "Small",     sub: "Regular · 16px · text-xs",
              el: <p className="text-xs leading-snug text-muted-foreground">Last played 3 hours ago · 124 streams</p> },
            { label: "Caption",   sub: "Regular · 14px · text-xxs",
              el: <p className="text-xxs leading-snug text-muted-foreground">Chips · badges · button-sm · minimum size</p> },
            { label: "Blockquote",sub: "Italic · 20px · text-base",
              el: <blockquote className="text-base italic leading-normal text-muted-foreground border-l-[3px] border-border pl-4">Music is the shorthand of emotion.</blockquote> },
          ].map(({ label, sub, el }) => (
            <div key={label} className="flex items-baseline gap-6 py-4">
              <div className="w-40 shrink-0">
                <span className="text-sm font-normal">{label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{sub}</span>
              </div>
              <div className="flex-1">{el}</div>
            </div>
          ))}
        </div>

        {/* Font weights */}
        <p className="text-xs font-normal text-muted-foreground mt-8 mb-4">Font weights — Founders Grotesk at text-base (20px)</p>
        <div className="flex flex-col divide-y divide-border">
          {[
            { label: "Regular",  cls: "font-normal",   val: "400", note: "default",             noteCls: "text-green-700 dark:text-green-400" },
            { label: "Medium",   cls: "font-medium",   val: "500", note: "emphasis & headlines", noteCls: "text-green-700 dark:text-green-400" },
            { label: "Semibold", cls: "font-semibold", val: "600", note: "hardly ever",          noteCls: "text-yellow-700 dark:text-yellow-400" },
          ].map(({ label, cls, val, note, noteCls }) => (
            <div key={label} className="flex items-center gap-6 py-3.5">
              <div className="w-40 shrink-0">
                <span className="text-sm font-normal">{label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">font-weight: {val}</span>
                <span className={`block text-xs mt-0.5 ${noteCls}`}>{note}</span>
              </div>
              <p className={`text-base ${cls}`}>Upload your tracks and get paid fairly.</p>
            </div>
          ))}
        </div>

      </Section>

      {/* ══ BUTTONS ══ */}
      <Section id="buttons" title="Buttons">
        <div className="flex flex-col gap-6">
          <div>
            <SubLabel>Variants</SubLabel>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="outline-primary">Primary outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
          <div>
            <SubLabel>Sizes</SubLabel>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">Large</Button>
              <Button>Default</Button>
              <Button size="sm">Small</Button>
              <Button size="icon"><Plus /></Button>
              <Button size="icon-sm"><Plus /></Button>
              <Button size="icon-lg"><Plus /></Button>
            </div>
          </div>
          <div>
            <SubLabel>States</SubLabel>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button disabled className="opacity-75 pointer-events-none">
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Loading
              </Button>
            </div>
          </div>
          <div>
            <SubLabel>With icons</SubLabel>
            <div className="flex flex-wrap items-center gap-3">
              <Button><Plus className="size-4" />Add to playlist</Button>
              <Button variant="secondary"><Heart className="size-4" />Follow</Button>
              <Button variant="outline"><Upload className="size-4" />Upload</Button>
              <Button variant="outline" size="icon"><Share2 /></Button>
              <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ BADGES ══ */}
      <Section id="badges" title="Badges">
        <div className="flex flex-col gap-5">
          <div>
            <SubLabel>Content type — always secondary fill + icon</SubLabel>
            <div className="flex flex-wrap gap-2 items-center">
              <ContentTypeBadge type="song" />
              <ContentTypeBadge type="album" />
              <ContentTypeBadge type="single" />
              <ContentTypeBadge type="ep" />
              <ContentTypeBadge type="artist" />
              <ContentTypeBadge type="playlist" />
            </div>
          </div>
          <div>
            <SubLabel>Status — click to toggle public / private</SubLabel>
            <div className="flex flex-wrap gap-2 items-center">
              <StatusBadgeDemo />
            </div>
          </div>
          <div>
            <SubLabel>Base variants — design system primitives</SubLabel>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ CHIPS ══ */}
      <Section id="chips" title="Chips">
        <div className="flex flex-col gap-5">
          <div>
            <SubLabel>Filter chips — toggle</SubLabel>
            <ChipFilterDemo />
          </div>
          <div>
            <SubLabel>States</SubLabel>
            <ChipGroup>
              <Chip>Unselected</Chip>
              <Chip selected>Selected</Chip>
            </ChipGroup>
          </div>
          <div>
            <SubLabel>Dismissible chips</SubLabel>
            <ChipDismissDemo />
          </div>
        </div>
      </Section>

      {/* ══ INPUTS ══ */}
      <Section id="inputs" title="Inputs">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="flex flex-col gap-1.5 min-w-[260px]">
            <Label htmlFor="artist">Artist name</Label>
            <Input id="artist" placeholder="e.g. Kendrick Lamar" />
            <p className="text-xs text-muted-foreground">Your public display name on Muza.</p>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[260px]">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@muza.com" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[260px]">
            <Label htmlFor="search-input">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="search-input" className="pl-9" placeholder="Search artists, albums…" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <Label>Genre</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="rb">R&amp;B</SelectItem>
                <SelectItem value="indie">Indie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[320px]">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell listeners about yourself…" rows={3} />
            <p className="text-xs text-muted-foreground">Max 280 characters.</p>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <Label>With action</Label>
            <div className="flex gap-2">
              <Input placeholder="Invite by email" />
              <Button>Invite</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ COMBOBOX ══ */}
      <Section id="combobox" title="Combobox">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="flex flex-col gap-1.5 w-[280px]">
            <Label>Genre</Label>
            <Combobox>
              <ComboboxTrigger placeholder="Search genres…" />
              <ComboboxContent>
                <ComboboxItem value="hip-hop">Hip-Hop</ComboboxItem>
                <ComboboxItem value="electronic">Electronic</ComboboxItem>
                <ComboboxItem value="jazz">Jazz</ComboboxItem>
                <ComboboxItem value="rb">R&amp;B</ComboboxItem>
                <ComboboxItem value="indie">Indie</ComboboxItem>
                <ComboboxItem value="pop">Pop</ComboboxItem>
                <ComboboxItem value="afrobeats">Afrobeats</ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="flex flex-col gap-1.5 w-[280px]">
            <Label>Artist</Label>
            <Combobox>
              <ComboboxTrigger placeholder="Search artists…" />
              <ComboboxContent>
                <ComboboxItem value="river-lotus">River Lotus</ComboboxItem>
                <ComboboxItem value="axon-fade">Axon Fade</ComboboxItem>
                <ComboboxItem value="dusk-ensemble">Dusk Ensemble</ComboboxItem>
                <ComboboxItem value="nora-voss">Nora Voss</ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </Section>

      {/* ══ DATE PICKER ══ */}
      <Section id="date-picker" title="Date Picker">
        <DatePickerDemo />
      </Section>

      {/* ══ CHECKBOX & RADIO ══ */}
      <Section id="checkbox" title="Checkbox & Radio">
        <div className="flex flex-wrap gap-12 items-start">
          <div className="flex flex-col gap-3">
            <SubLabel>Checkbox — basic</SubLabel>
            {[
              { id: "c1", label: "Accept terms & conditions", checked: true },
              { id: "c2", label: "Save to favorites" },
              { id: "c3", label: "Explicit content" },
              { id: "c4", label: "Unavailable option", disabled: true },
            ].map(({ id, label, checked, disabled }) => (
              <div key={id} className="flex items-center gap-2.5">
                <Checkbox id={id} defaultChecked={checked} disabled={disabled} />
                <Label htmlFor={id} className={disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}>{label}</Label>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <SubLabel>Checkbox with description</SubLabel>
            <CheckboxField
              id="notify"
              label="Artist notifications"
              description="Get notified when artists you follow release new music."
              defaultChecked
            />
            <CheckboxField
              id="marketing"
              label="Marketing emails"
              description="Receive tips, promotions and product updates from Muza."
            />
            <CheckboxField
              id="analytics"
              label="Share analytics"
              description="Help us improve by sharing anonymous usage data."
              defaultChecked
            />
          </div>
          <div className="flex flex-col gap-3">
            <SubLabel>Radio group</SubLabel>
            <RadioGroup defaultValue="free">
              {[
                { value: "free",   id: "r1", label: "Free listener" },
                { value: "pro",    id: "r2", label: "Muza Pro — $9/mo" },
                { value: "artist", id: "r3", label: "Artist plan — $19/mo" },
              ].map(({ value, id, label }) => (
                <div key={id} className="flex items-center gap-2.5">
                  <RadioGroupItem value={value} id={id} />
                  <Label htmlFor={id} className="cursor-pointer">{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </Section>

      {/* ══ SWITCH & SLIDER ══ */}
      <Section id="switch-&-slider" title="Switch & Slider & Progress">
        <div className="flex flex-wrap gap-12 items-start">
          <div className="flex flex-col gap-4">
            <SubLabel>Switch</SubLabel>
            {[
              { id: "s1", label: "High quality audio", on: true },
              { id: "s2", label: "Offline mode" },
              { id: "s3", label: "Artist notifications", on: true },
            ].map(({ id, label, on }) => (
              <div key={id} className="flex items-center gap-3">
                <Switch id={id} defaultChecked={on} />
                <Label htmlFor={id} className="cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 min-w-[280px]">
            <SubLabel>Slider</SubLabel>
            <Slider value={volume} onValueChange={(v) => setVolume(Array.isArray(v) ? [...(v as number[])] : [v as number])} max={100} step={1} />
            <Slider defaultValue={[30]} max={100} step={1} />
            <SubLabel>Progress</SubLabel>
            <div className="flex flex-col gap-2 max-w-sm">
              {[100, 75, 50, 25, 0].map((v) => (
                <Progress key={v} value={v} className="h-2" />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ══ AVATAR ══ */}
      <Section id="avatar" title="Avatar">
        <div className="flex items-center gap-4 flex-wrap">
          <Avatar className="size-7"><AvatarFallback className="text-xs">JD</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>MK</AvatarFallback></Avatar>
          <Avatar className="size-12"><AvatarFallback className="text-lg">AL</AvatarFallback></Avatar>
          <Avatar className="size-16"><AvatarFallback className="text-2xl">RS</AvatarFallback></Avatar>
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">M</AvatarFallback>
          </Avatar>
          <div className="flex -space-x-2">
            {["JD","AL","RS"].map((i) => (
              <Avatar key={i} className="ring-2 ring-background">
                <AvatarFallback className="text-xs">{i}</AvatarFallback>
              </Avatar>
            ))}
            <Avatar className="ring-2 ring-background">
              <AvatarFallback className="text-xs bg-neutral-800 text-neutral-100">+4</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </Section>

      {/* ══ TABS ══ */}
      <Section id="tabs" title="Tabs">
        <div className="flex flex-col gap-8 max-w-xl">
          <div>
            <SubLabel>Segment (default)</SubLabel>
            <Tabs defaultValue="music">
              <TabsList>
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
              </TabsList>
              <TabsContent value="music" className="pt-3 text-sm text-muted-foreground">
                Music tab content.
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <SubLabel>Underline (line)</SubLabel>
            <Tabs defaultValue="overview">
              <TabsList variant="line" className="w-full justify-start border-b border-border">
                {["Overview","Discography","About","Events"].map((t) => (
                  <TabsTrigger key={t} value={t.toLowerCase()}>{t}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="overview" className="pt-4 text-sm text-muted-foreground">
                Artist overview content here.
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <SubLabel>Pill</SubLabel>
            <Tabs defaultValue="all">
              <TabsList variant="pill">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="tracks">Tracks</TabsTrigger>
                <TabsTrigger value="albums">Albums</TabsTrigger>
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Section>

      {/* ══ CARDS ══ */}
      <Section id="cards" title="Cards">
        <div className="flex flex-wrap gap-4 items-start">
          <Card className="w-72">
            <CardHeader>
              <CardTitle>Upload Track</CardTitle>
              <CardDescription>Add a new song to your Muza artist profile.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Track title</Label>
                <Input placeholder="e.g. Blue Afternoon" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Genre</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select genre" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="gap-2 justify-end">
              <Button variant="outline" size="sm">Cancel</Button>
              <Button size="sm">Upload</Button>
            </CardFooter>
          </Card>

          <Card className="w-64">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Weekly Streams</CardTitle>
                <Badge>+14%</Badge>
              </div>
              <CardDescription>Your stats for the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-medium tracking-tight">12,430</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">streams across all tracks</p>
              <Progress value={72} className="h-1.5" />
            </CardContent>
          </Card>

          <Card className="w-64">
            <CardContent className="pt-6 flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback className="bg-primary text-primary-foreground font-medium text-lg">RL</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium leading-tight">River Lotus</p>
                <p className="text-sm text-muted-foreground">Electronic · Berlin</p>
                <div className="flex gap-1.5 mt-2.5">
                  <Button size="sm">Follow</Button>
                  <Button variant="outline" size="icon-sm"><Share2 className="size-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ══ ALERTS ══ */}
      <Section id="alerts" title="Alerts">
        <div className="flex flex-col gap-3 max-w-lg">
          <Alert>
            <Info className="size-4" />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>Your track is processing. It may take up to 10 minutes to appear publicly.</AlertDescription>
          </Alert>
          <Alert className="border-primary/25 bg-primary/5">
            <CheckCircle2 className="size-4 text-primary" />
            <AlertTitle className="text-primary">Track uploaded successfully</AlertTitle>
            <AlertDescription>Blue Afternoon is live and available to stream on your profile.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>File format not supported. Please upload an MP3 or WAV file.</AlertDescription>
          </Alert>
        </div>
      </Section>

      {/* ══ ALERT DIALOG ══ */}
      <Section id="alert-dialog" title="Alert Dialog">
        <div className="flex flex-wrap gap-3">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              <Trash2 className="size-4" />Delete track
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &quot;Blue Afternoon&quot;?</AlertDialogTitle>
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
                <AlertDialogAction>Unpublish</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Section>

      {/* ══ DIALOGS ══ */}
      <Section id="dialogs" title="Dialogs — static preview">
        <div className="flex flex-wrap gap-5 items-start">
          <div className="border border-border rounded-2xl bg-card p-6 max-w-sm">
            <p className="text-lg font-medium tracking-tight mb-2">Delete track</p>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Are you sure you want to delete "Blue Afternoon"? This action cannot be undone.
            </p>
            <Separator className="mb-4" />
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">Delete track</Button>
            </div>
          </div>
          <div className="border border-border rounded-2xl bg-card p-6 max-w-sm">
            <p className="text-lg font-medium tracking-tight mb-2">Publish release</p>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Ready to go public? Your fans will be notified once it&apos;s live.
            </p>
            <div className="flex flex-col gap-1.5 mb-4">
              <Label>Release date</Label>
              <Input type="date" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Save draft</Button>
              <Button>Publish</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ DROPDOWN ══ */}
      <Section id="dropdown" title="Dropdown menu">
        <div className="flex flex-wrap gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              My Account <ChevronDown className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="size-4" />Profile</DropdownMenuItem>
              <DropdownMenuItem><Settings className="size-4" />Settings</DropdownMenuItem>
              <DropdownMenuItem><Music2 className="size-4" />My uploads</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Heart className="size-4" />Liked songs</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <LogOut className="size-4" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="icon" variant="ghost" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44">
              <DropdownMenuItem><Upload className="size-4" />Upload track</DropdownMenuItem>
              <DropdownMenuItem><Share2 className="size-4" />Share profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 className="size-4" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Section>

      {/* ══ TOAST ══ */}
      <Section id="toast" title="Toast">
        <ToastDemo />
      </Section>

      {/* ══ SKELETON ══ */}
      <Section id="skeleton" title="Skeleton">
        <div className="flex flex-wrap gap-8 items-start">
          <div className="flex flex-col gap-2.5 w-64">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-9 w-28 rounded-full mt-1" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <Skeleton className="size-44 rounded-xl" />
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </Section>

    </div>
    </div>
  )
}

// ─── Root page — unified app shell ────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState("Home")
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />
      <main className="flex-1 min-w-0 flex flex-col">
        <Topbar actions={<TopbarDefaultActions />} />
        <div className="flex-1 overflow-auto">
          {activeNav === "Home"      && <HomeView />}
          {activeNav === "Explore"   && <ExploreView />}
          {Object.keys(STUDIO_TABS).includes(activeNav) && <StudioView page={activeNav} />}
          {["Playlists","Albums","Artists","Songs"].includes(activeNav) && (
            <div className="p-10"><h1 className="text-2xl font-medium">{activeNav}</h1></div>
          )}
        </div>
      </main>
    </div>
  )
}
