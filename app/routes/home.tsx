import { useState, useEffect, useRef } from "react"
import { AnimatedLogo } from "@/components/app/animated-logo"
import { Sidebar } from "@/components/app/sidebar"
import { StudioMusicView } from "@/components/app/studio-music"
import { Topbar, TopbarDefaultActions } from "@/components/app/topbar"
import { Button } from "@/components/ui/button"
import { Badge, ContentTypeBadge, StatusBadge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputSelect } from "@/components/ui/input-select"
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
  Plus, Search, ChevronDown, Trash2, SlidersHorizontal, Maximize2,
} from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Command, CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandShortcut, CommandSeparator,
} from "@/components/ui/command"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UploadMusicDialog } from "@/components/app/upload-music-dialog"

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
function useViewportLogoSize() {
  const [size, setSize] = useState(288)
  useEffect(() => {
    const update = () => setSize(Math.round(Math.max(160, Math.min(304, window.innerWidth * 0.20))))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return size
}

function HomeView({ onNavigate }: { onNavigate: (view: string) => void }) {
  const logoSize = useViewportLogoSize()
  return (
    <div className="px-10 pt-10 pb-64 max-w-6xl 3xl:max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col items-center gap-28 min-h-[65vh] justify-center">
        <div className="flex flex-col items-center gap-6">
          <img src="/wordmark.svg" alt="muza" className="h-4" />
          <h1 className="text-[clamp(3.6rem,_5.4vw,_7.2rem)] leading-[1] font-medium text-foreground text-center">The Platform for<br />Independent Music.</h1>
        </div>
        <AnimatedLogo size={logoSize} />
      </div>
      <p className="text-[clamp(2rem,_3vw,_4rem)] leading-snug font-normal text-foreground mt-16">Built as a non-profit, muza exists to fix streaming's broken economics. Instead of paying artists per click, muza rewards attention — distributing revenue based on actual listening time and direct listener support. Your subscription goes only to the artists you play.</p>
      <p className="text-[clamp(2rem,_3vw,_4rem)] leading-snug font-normal text-foreground">We combine subscription streaming with direct artist uploads, giving musicians full control over how their music is shared and monetised. Artists retain ownership, receive up to 90–95% of revenue, and are paid directly — no hidden intermediaries.</p>
      <div className="flex justify-center mt-24">
        <Button size="xl" className="text-[2rem] px-[5.5rem] h-[5.5rem] rounded-full transition-transform duration-300 ease-out hover:transition-transform hover:duration-250 hover:ease-[cubic-bezier(0.22,1.8,0.36,1)] hover:scale-[1.07]" onClick={() => onNavigate("Music")}>Join muza now</Button>
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

function StudioView({ page, onOpenUpload }: { page: string; onOpenUpload?: () => void }) {
  if (page === "Music") return <StudioMusicView onOpenUpload={onOpenUpload} />

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
  return <StatusBadge status={status} onStatusChange={setStatus} />
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

function ChipFilterOutlineDemo() {
  const [selected, setSelected] = useState<string[]>(["electronic"])
  const genres = ["All", "Hip-Hop", "Electronic", "Jazz", "R&B", "Indie", "Afrobeats", "Pop"]

  function toggle(g: string) {
    if (g === "all") { setSelected([]); return }
    setSelected((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])
  }

  return (
    <ChipGroup>
      {genres.map((g) => (
        <Chip
          key={g}
          activeStyle="outline"
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

// ─── Command demo ────────────────────────────────────────────────────────────
function CommandDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Search className="size-4" />Open Command Palette
          <CommandShortcut>⌘K</CommandShortcut>
        </Button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search tracks, artists, playlists…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Tracks">
            <CommandItem><Music2 className="size-4" />Blue Afternoon<CommandShortcut>↵</CommandShortcut></CommandItem>
            <CommandItem><Music2 className="size-4" />Midnight Circuit</CommandItem>
            <CommandItem><Music2 className="size-4" />Static Memory</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Artists">
            <CommandItem><User className="size-4" />River Lotus</CommandItem>
            <CommandItem><User className="size-4" />Axon Fade</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem><Upload className="size-4" />Upload a track<CommandShortcut>⌘U</CommandShortcut></CommandItem>
            <CommandItem><Settings className="size-4" />Settings<CommandShortcut>⌘,</CommandShortcut></CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

// ─── Form demo ────────────────────────────────────────────────────────────────
const trackSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  genre: z.string().min(1, "Please select a genre"),
  bio: z.string().max(280, "Max 280 characters").optional(),
})

function FormDemo() {
  const form = useForm<z.infer<typeof trackSchema>>({
    resolver: zodResolver(trackSchema),
    defaultValues: { title: "", genre: "", bio: "" },
  })

  function onSubmit(values: z.infer<typeof trackSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 max-w-sm">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Track title</FormLabel>
              <FormControl><Input placeholder="e.g. Blue Afternoon" {...field} /></FormControl>
              <FormDescription>Your track's public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="genre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Genre</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="indie">Indie</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Tell listeners about this track…" rows={3} {...field} /></FormControl>
              <FormDescription>Max 280 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit">Submit</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>Reset</Button>
        </div>
      </form>
    </Form>
  )
}

// ─── Kitchen sink (Explore view) ──────────────────────────────────────────────
function ExploreView() {
  const [inputSelectCurrency, setInputSelectCurrency] = useState("USD")
  const [inputSelectTld, setInputSelectTld] = useState(".com")
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState([62])
  const [progress, setProgress] = useState([38])

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-muted border-b border-border pt-24 pb-[3.75rem] px-10">
        <div className="max-w-6xl 3xl:max-w-[1600px] mx-auto">
          <h1 className="text-5xl font-medium tracking-tight">muza design system</h1>
        </div>
      </div>

    <div className="max-w-6xl 3xl:max-w-[1600px] mx-auto w-full px-10 py-10 pb-32">

      {/* Quick nav */}
      <nav className="flex flex-wrap gap-1.5 mb-12">
        {[
          "Colors","Typography","Buttons","Badges","Chips","Inputs","Combobox","Date Picker",
          "Checkbox","Switch & Slider","Avatar","Tabs","Cards","Alerts","Alert Dialog",
          "Dropdown","Toast","Player","Song List","Skeleton",
          "Popover","Table","Pagination","Command","OTP Input","Form",
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
        {/* Primitive scales */}
        <div className="flex flex-col gap-6 mb-10">
          {[
            {
              label: "muza-white / muza-black",
              stops: [
                { name: "white", hex: "#FEFFFB" },
                { name: "black", hex: "#0D0D04" },
              ],
            },
            {
              label: "muza-neutrals",
              stops: [
                { name: "50",  hex: "#F9FAF0" },
                { name: "100", hex: "#F1F3E6" },
                { name: "200", hex: "#ECEEDF" },
                { name: "300", hex: "#DADDCD" },
                { name: "400", hex: "#B5B7A7" },
                { name: "500", hex: "#86887C" },
                { name: "600", hex: "#69695D" },
                { name: "700", hex: "#3C3D33" },
                { name: "800", hex: "#2E2C24" },
                { name: "900", hex: "#1D1C18" },
                { name: "950", hex: "#0D0D04" },
              ],
            },
            {
              label: "muza-blue",
              stops: [
                { name: "50",  hex: "#3E79FF" },
                { name: "100", hex: "#3F66FF" },
                { name: "200", hex: "#1E34D8" },
                { name: "300", hex: "#1121C2" },
                { name: "400", hex: "#030AB1" },
                { name: "500", hex: "#000DA2" },
                { name: "600", hex: "#001183" },
                { name: "700", hex: "#000E69" },
                { name: "800", hex: "#000A4E" },
                { name: "900", hex: "#000734" },
                { name: "950", hex: "#000318" },
              ],
            },
          ].map((scale) => (
            <div key={scale.label}>
              <p className="text-xs font-normal text-muted-foreground mb-2">{scale.label}</p>
              <div className="flex gap-2">
                {scale.stops.map((s) => (
                  <div key={s.name} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full h-14 rounded-xl border border-border" style={{ background: s.hex }} />
                    <span className="text-xs font-mono text-muted-foreground">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-8 font-medium text-foreground">Token</th>
              <th className="pb-2 pr-8 font-medium text-foreground">Light</th>
              <th className="pb-2 font-medium text-foreground">Dark</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                token: "--background",
                lHex: "#FEFFFB", lPrim: "--muza-white",            lOklch: "99.81% 0.0053 118.5",
                dHex: "#0D0D04", dPrim: "--muza-black",            dOklch: "15.55% 0.0204 108.6",
              },
              {
                token: "--foreground",
                lHex: "#0D0D04", lPrim: "--muza-neutrals-950",     lOklch: "15.55% 0.0204 108.6",
                dHex: "#F9FAF0", dPrim: "--muza-neutrals-50",      dOklch: "98.16% 0.0131 111.4",
              },
              {
                token: "--card / --popover",
                lHex: "#FEFFFB", lPrim: "--muza-white",            lOklch: "99.81% 0.0053 118.5",
                dHex: "#0D0D04", dPrim: "--muza-neutrals-950",     dOklch: "15.55% 0.0204 108.6",
              },
              {
                token: "--primary",
                lHex: "#000DA2", lPrim: "--muza-blue-500",         lOklch: "33.02% 0.2175 264.2",
                dHex: "#1121C2", dPrim: "--muza-blue-300",         dOklch: "39.43% 0.2371 266.1",
              },
              {
                token: "--primary-foreground",
                lHex: "#F9FAF0", lPrim: "--muza-neutrals-50",      lOklch: "98.16% 0.0131 111.4",
                dHex: "#F9FAF0", dPrim: "--muza-neutrals-50",      dOklch: "98.16% 0.0131 111.4",
              },
              {
                token: "--secondary",
                lHex: "#ECEEDF", lPrim: "--muza-neutrals-200",     lOklch: "94.35% 0.0199 113.1",
                dHex: "#2E2C24", dPrim: "--muza-neutrals-800",     dOklch: "29.25% 0.0143 95.6",
              },
              {
                token: "--secondary-hover",
                lHex: "#DADDCD", lPrim: "--muza-neutrals-300",     lOklch: "89.08% 0.0217 115.6",
                dHex: "#3C3D33", dPrim: "--muza-neutrals-700",     dOklch: "35.57% 0.0168 111.9",
              },
              {
                token: "--muted",
                lHex: "#F9FAF0", lPrim: "--muza-neutrals-50",      lOklch: "98.16% 0.0131 111.4",
                dHex: "#1D1C18", dPrim: "--muza-neutrals-900",     dOklch: "22.61% 0.0077 95.4",
              },
              {
                token: "--muted-foreground",
                lHex: "rgba(84,84,69,.75)", lPrim: "--muza-neutrals-a75-700", lOklch: "44.13% 0.0237 107.4 / 0.75",
                dHex: "rgba(249,250,240,.5)", dPrim: "--muza-neutrals-a50-50", dOklch: "98.16% 0.0131 111.4 / 0.5",
              },
              {
                token: "--accent",
                lHex: "#F1F3E6", lPrim: "--muza-neutrals-100",     lOklch: "95.91% 0.0172 114",
                dHex: "#2E2C24", dPrim: "--muza-neutrals-800",     dOklch: "29.25% 0.0143 95.6",
              },
              {
                token: "--accent-foreground",
                lHex: "#1D1C18", lPrim: "--muza-neutrals-900",     lOklch: "22.61% 0.0077 95.4",
                dHex: "#F9FAF0", dPrim: "--muza-neutrals-50",      dOklch: "98.16% 0.0131 111.4",
              },
              {
                token: "--destructive",
                lHex: "#DC2626", lPrim: "--tw-red-600",            lOklch: "57.71% 0.2151 27.3",
                dHex: "#7F1D1D", dPrim: "--tw-red-900",            dOklch: "39.59% 0.1331 25.7",
              },
              {
                token: "--border",
                lHex: "#DADDCD", lPrim: "--muza-neutrals-300",     lOklch: "89.08% 0.0217 115.6",
                dHex: "#3C3D33", dPrim: "--muza-neutrals-700",     dOklch: "35.57% 0.0168 111.9",
              },
              {
                token: "--input",
                lHex: "#ECEEDF", lPrim: "--muza-neutrals-200",     lOklch: "94.35% 0.0199 113.1",
                dHex: "#DADDCD", dPrim: "--muza-neutrals-300",     dOklch: "89.08% 0.0217 115.6",
              },
              {
                token: "--ring",
                lHex: "#1D1C18", lPrim: "--muza-neutrals-900",     lOklch: "22.61% 0.0077 95.4",
                dHex: "#DADDCD", dPrim: "--muza-neutrals-300",     dOklch: "89.08% 0.0217 115.6",
              },
            ].map((r) => (
              <tr key={r.token} className="border-b border-border">
                <td className="py-2 pr-8 font-mono text-foreground whitespace-nowrap">{r.token}</td>
                <td className="py-2 pr-8">
                  <div className="flex gap-2">
                    <div className="size-10 rounded-xl border border-border shrink-0 self-center" style={{ background: r.lHex }} />
                    <div>
                      <span className="block font-mono text-foreground">{r.lPrim}</span>
                      <span className="font-mono text-muted-foreground">oklch({r.lOklch})</span>
                    </div>
                  </div>
                </td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <div className="size-10 rounded-xl border border-border shrink-0 self-center" style={{ background: r.dHex }} />
                    <div>
                      <span className="block font-mono text-foreground">{r.dPrim}</span>
                      <span className="font-mono text-muted-foreground">oklch({r.dOklch})</span>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        {(() => {
          const VARIANTS = [
            { key: "default",         label: "Primary" },
            { key: "secondary",       label: "Secondary" },
            { key: "outline",         label: "Outline" },
            { key: "outline-primary", label: "Primary outline" },
            { key: "ghost",           label: "Ghost" },
            { key: "link",            label: "Link" },
            { key: "destructive",     label: "Destructive" },
          ] as const

          const Spin = () => (
            <svg className="animate-spin size-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          )

          const GRID_TEXT = "grid grid-cols-[120px_auto_auto_auto_auto] gap-x-8 items-center py-3"
          const GRID_ICON = "grid grid-cols-[120px_auto_auto_auto_auto] gap-x-6 items-center py-3"
          const D = "border-b border-border/50"

          return (
            <div className="flex flex-col gap-10">
              {/* ── Text buttons ── */}
              <div className="flex flex-col">
                <div className={GRID_TEXT + " pb-2"}>
                  <div />
                  <p className="text-xxs text-muted-foreground pl-10">XLarge</p>
                  <p className="text-xxs text-muted-foreground pl-[34px]">Large</p>
                  <p className="text-xxs text-muted-foreground pl-[18px]">Default</p>
                  <p className="text-xxs text-muted-foreground pl-3">Small</p>
                </div>
                {VARIANTS.map((v) => (
                  <div key={v.key} className={GRID_TEXT + " " + D}>
                    <p className="text-xxs text-muted-foreground">{v.label}</p>
                    <div className="flex"><Button variant={v.key as any} size="xl">{v.label}</Button></div>
                    <div className="flex"><Button variant={v.key as any} size="lg">{v.label}</Button></div>
                    <div className="flex"><Button variant={v.key as any}>{v.label}</Button></div>
                    <div className="flex"><Button variant={v.key as any} size="sm">{v.label}</Button></div>
                  </div>
                ))}
                <div className={GRID_TEXT + " " + D}>
                  <p className="text-xxs text-muted-foreground">Disabled</p>
                  <div className="flex"><Button size="xl" disabled>Primary</Button></div>
                  <div className="flex"><Button size="lg" disabled>Primary</Button></div>
                  <div className="flex"><Button disabled>Primary</Button></div>
                  <div className="flex"><Button size="sm" disabled>Primary</Button></div>
                </div>
                <div className={GRID_TEXT}>
                  <p className="text-xxs text-muted-foreground">Loading</p>
                  <div className="flex"><Button size="xl" disabled><Spin />Primary</Button></div>
                  <div className="flex"><Button size="lg" disabled><Spin />Primary</Button></div>
                  <div className="flex"><Button disabled><Spin />Primary</Button></div>
                  <div className="flex"><Button size="sm" disabled><Spin />Primary</Button></div>
                </div>
              </div>

              {/* ── Icon-only buttons ── */}
              <div className="flex flex-col">
                <div className={GRID_ICON + " pb-2"}>
                  <div />
                  <p className="text-xxs text-muted-foreground">XLarge</p>
                  <p className="text-xxs text-muted-foreground">Large</p>
                  <p className="text-xxs text-muted-foreground">Default</p>
                  <p className="text-xxs text-muted-foreground">Small</p>
                </div>
                {VARIANTS.map((v) => (
                  <div key={v.key} className={GRID_ICON + " " + D}>
                    <p className="text-xxs text-muted-foreground">{v.label}</p>
                    <div className="flex"><Button variant={v.key as any} size="icon-xl"><Plus /></Button></div>
                    <div className="flex"><Button variant={v.key as any} size="icon-lg"><Plus /></Button></div>
                    <div className="flex"><Button variant={v.key as any} size="icon"><Plus /></Button></div>
                    <div className="flex"><Button variant={v.key as any} size="icon-sm"><Plus /></Button></div>
                  </div>
                ))}
                <div className={GRID_ICON + " " + D}>
                  <p className="text-xxs text-muted-foreground">Disabled</p>
                  <div className="flex"><Button size="icon-xl" disabled><Plus /></Button></div>
                  <div className="flex"><Button size="icon-lg" disabled><Plus /></Button></div>
                  <div className="flex"><Button size="icon" disabled><Plus /></Button></div>
                  <div className="flex"><Button size="icon-sm" disabled><Plus /></Button></div>
                </div>
                <div className={GRID_ICON}>
                  <p className="text-xxs text-muted-foreground">Loading</p>
                  <div className="flex"><Button size="icon-xl" disabled><Spin /></Button></div>
                  <div className="flex"><Button size="icon-lg" disabled><Spin /></Button></div>
                  <div className="flex"><Button size="icon" disabled><Spin /></Button></div>
                  <div className="flex"><Button size="icon-sm" disabled><Spin /></Button></div>
                </div>
              </div>
            </div>
          )
        })()}
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
            <SubLabel>Filter chips — toggle (outline active)</SubLabel>
            <ChipFilterOutlineDemo />
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
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <Label>Price (with currency select)</Label>
            <InputSelect
              placeholder="1.00"
              selectValue={inputSelectCurrency}
              onSelectChange={setInputSelectCurrency}
              options={[
                { value: "USD", label: "USD" },
                { value: "EUR", label: "EUR" },
                { value: "GBP", label: "GBP" },
                { value: "JPY", label: "JPY" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <Label>Domain</Label>
            <InputSelect
              placeholder="yourdomain"
              selectValue={inputSelectTld}
              onSelectChange={setInputSelectTld}
              options={[
                { value: ".com", label: ".com" },
                { value: ".io",  label: ".io"  },
                { value: ".co",  label: ".co"  },
                { value: ".org", label: ".org" },
              ]}
            />
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
        <div className="flex flex-col gap-20 max-w-xl">
          <div>
            <SubLabel>Segment — small</SubLabel>
            <Tabs defaultValue="music">
              <TabsList size="sm">
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div>
            <SubLabel>Segment — default</SubLabel>
            <Tabs defaultValue="music">
              <TabsList>
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div>
            <SubLabel>Segment — large</SubLabel>
            <Tabs defaultValue="music">
              <TabsList size="lg">
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
              </TabsList>
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
            <Skeleton className="size-44 rounded-xs" />
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </Section>

      {/* ══ POPOVER ══ */}
      <Section id="popover" title="Popover">
        <div className="flex flex-wrap gap-4">
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>
              Track info
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium leading-none">Blue Afternoon</p>
                <p className="text-xs text-muted-foreground">River Lotus · Electronic · 2024</p>
                <Separator />
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Streams</span>
                    <span>12,430</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Duration</span>
                    <span>3:42</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Release</span>
                    <span>Mar 2024</span>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-1">View track</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="icon" />}>
              <SlidersHorizontal className="size-4" />
            </PopoverTrigger>
            <PopoverContent side="right">
              <p className="text-sm font-medium mb-3">Equalizer</p>
              <div className="flex flex-col gap-3">
                {["Bass","Mid","Treble"].map((band) => (
                  <div key={band} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12">{band}</span>
                    <Slider defaultValue={[50]} max={100} step={1} className="flex-1" />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </Section>

      {/* ══ TABLE ══ */}
      <Section id="table" title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead className="text-right">Streams</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { n: 1,  emoji: "🎵", title: "Blue Afternoon",   artist: "River Lotus",   genre: "Electronic", streams: "12,430", dur: "3:42" },
              { n: 2,  emoji: "🎸", title: "Midnight Circuit",  artist: "Axon Fade",     genre: "Indie",       streams: "9,814",  dur: "4:15" },
              { n: 3,  emoji: "🎤", title: "Haunt the Waves",   artist: "Dusk Ensemble", genre: "Jazz",        streams: "7,201",  dur: "5:01" },
              { n: 4,  emoji: "🎹", title: "Static Memory",     artist: "Nora Voss",     genre: "Electronic",  streams: "5,588",  dur: "2:58" },
              { n: 5,  emoji: "🥁", title: "Low Tide Prayer",   artist: "Coastal Rites", genre: "Indie",       streams: "3,112",  dur: "4:33" },
            ].map(({ n, emoji, title, artist, genre, streams, dur }) => (
              <TableRow key={n}>
                <TableCell className="text-muted-foreground">{n}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-md bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-base">{emoji}</div>
                    <span className="font-normal">{title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{artist}</TableCell>
                <TableCell><Badge variant="secondary">{genre}</Badge></TableCell>
                <TableCell className="text-right text-muted-foreground">{streams}</TableCell>
                <TableCell className="text-right text-muted-foreground">{dur}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Total</TableCell>
              <TableCell className="text-right">38,145</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </Section>

      {/* ══ PAGINATION ══ */}
      <Section id="pagination" title="Pagination">
        <div className="flex flex-col gap-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
              <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
              <PaginationItem><PaginationEllipsis /></PaginationItem>
              <PaginationItem><PaginationLink href="#">8</PaginationLink></PaginationItem>
              <PaginationItem><PaginationNext href="#" /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Section>

      {/* ══ COMMAND ══ */}
      <Section id="command" title="Command">
        <div className="flex flex-col gap-5">
          <div>
            <SubLabel>Dialog — press ⌘K or click</SubLabel>
            <CommandDemo />
          </div>
          <div>
            <SubLabel>Inline — always visible</SubLabel>
            <Command className="border border-border rounded-xl max-w-sm">
              <CommandInput placeholder="Search…" />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup heading="Recent">
                  <CommandItem><Music2 className="size-4" />Blue Afternoon</CommandItem>
                  <CommandItem><Music2 className="size-4" />Midnight Circuit</CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  <CommandItem><Upload className="size-4" />Upload track</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>
      </Section>

      {/* ══ OTP INPUT ══ */}
      <Section id="otp-input" title="OTP Input">
        <div className="flex flex-col gap-6">
          <div>
            <SubLabel>6-digit verification code</SubLabel>
            <InputOTP maxLength={6} autoFocus={false}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div>
            <SubLabel>4-digit PIN</SubLabel>
            <InputOTP maxLength={4} autoFocus={false}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
      </Section>

      {/* ══ FORM ══ */}
      <Section id="form" title="Form">
        <div className="flex flex-col gap-2">
          <SubLabel>Controlled form with Zod validation — try submitting empty</SubLabel>
          <FormDemo />
        </div>
      </Section>

    </div>
    </div>
  )
}

// ─── Root page — unified app shell ────────────────────────────────────────────
export default function Home() {
  const [activeNav, setActiveNav] = useState("Home")
  const [collapsed, setCollapsed] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadMinimized, setUploadMinimized] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  function navigate(view: string) {
    setActiveNav(view)
  }

  useEffect(() => {
    // Run after all child mount effects (including Command's scrollIntoView) have fired
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
    }, 0)
    return () => clearTimeout(id)
  }, [activeNav])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        activeNav={activeNav}
        onNavChange={navigate}
      />
      <main className="flex-1 min-w-0 flex flex-col relative">
        <Topbar actions={<TopbarDefaultActions />} />
        <div ref={scrollRef} className="flex-1 overflow-auto">
          {activeNav === "Home"      && <HomeView onNavigate={navigate} />}
          {activeNav === "Explore"   && <ExploreView />}
          {Object.keys(STUDIO_TABS).includes(activeNav) && (
            <StudioView
              page={activeNav}
              onOpenUpload={() => { setUploadOpen(true); setUploadMinimized(false) }}
            />
          )}
          {["Playlists","Albums","Artists","Songs"].includes(activeNav) && (
            <div className="p-10"><h1 className="text-2xl font-medium">{activeNav}</h1></div>
          )}
        </div>

        {/* Global upload dialog — absolute within main, sidebar stays visible */}
        {uploadOpen && (
          <div className="absolute inset-0 z-50">
            <UploadMusicDialog
              onClose={() => { setUploadOpen(false); setUploadMinimized(false) }}
              onMinimize={() => { setUploadOpen(false); setUploadMinimized(true) }}
              onProgressChange={setUploadProgress}
            />
          </div>
        )}
      </main>

      {/* Global upload toast — always visible when minimized */}
      {uploadMinimized && (
        <div className="fixed top-[86px] right-10 z-50 flex items-center gap-3 pl-3 pr-2 py-2 rounded-xl bg-background border border-border shadow-lg">
          <div className="flex flex-col gap-1 min-w-[160px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-foreground leading-tight">Uploading music</span>
              <span className="text-xs text-muted-foreground font-normal leading-tight">{uploadProgress}%</span>
            </div>
            <div className="h-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
          <button
            onClick={() => { setUploadMinimized(false); setUploadOpen(true) }}
            className="size-7 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
