import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router"
import { cn } from "@/lib/utils"
import { AnimatedLogo } from "@/components/app/animated-logo"
import { Sidebar } from "@/components/app/sidebar"
import { StudioMusicView } from "@/components/app/studio-music"
import { WalletView } from "@/components/app/wallet-view"
import { TransferView } from "@/components/app/transfer-view"
import { ManageView } from "@/components/app/manage-view"
import { ManageV2 } from "@/components/app/manage-v2"
import { ReportView } from "@/components/app/report-view"
import { Topbar, TopbarDefaultActions } from "@/components/app/topbar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge, ContentTypeBadge, StatusBadge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputSelect } from "@/components/ui/input-select"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox, CheckboxField } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card"
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
  Radio as RadioIcon, ShoppingBag, Disc3, Disc, CassetteTape, Shirt, Ghost,
  ChevronLeft, ChevronRight, Globe,
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
import { ShopMyProductsView } from "@/components/app/shop-my-products"
import { OrdersView } from "@/components/app/orders-view"
import { FilterMenu } from "@/components/ui/filter-menu"
import { PlayerBar }     from "@/components/ui/player-bar"
import { PlayerBarB }    from "@/components/ui/player-bar-b"
import { PlayerOverlay } from "@/components/ui/player-overlay"
import { MobilePlayerShell } from "@/components/ui/mobile-player-shell"
import { Wordmark }      from "@/components/ui/logo"

// ─── Section heading component ────────────────────────────────────────────────
// `scroll-mt-6` gives the section 24px of breathing room from the top of the
// scroll container when the quick-nav scrolls to it.
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-6">
      <p className="text-small font-normal text-foreground mb-5 pb-3 border-b border-border">
        {title}
      </p>
      {children}
    </section>
  )
}

// ─── Quick-nav helper ─────────────────────────────────────────────────────────
// Finds the nearest scrollable ancestor and scrolls *it* directly to the target
// element's offset. More deterministic than `scrollIntoView`, which can pick
// the wrong ancestor when document height shifts (e.g. lazy-mounted overlays
// further down the page).
function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  let scroller: HTMLElement | null = target.parentElement
  while (scroller) {
    const cs = getComputedStyle(scroller)
    if (/(auto|scroll)/.test(cs.overflowY) && scroller.scrollHeight > scroller.clientHeight) {
      break
    }
    scroller = scroller.parentElement
  }
  if (!scroller) {
    target.scrollIntoView({ block: "start" })
    return
  }
  const SCROLL_MARGIN = 24   // matches `scroll-mt-6` on the Section element
  const top =
    target.getBoundingClientRect().top
    - scroller.getBoundingClientRect().top
    + scroller.scrollTop
    - SCROLL_MARGIN
  scroller.scrollTo({ top, behavior: "auto" })
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xsmall font-normal text-muted-foreground mb-3">{children}</p>
  )
}

// ─── Dialogs kitchen sink ─────────────────────────────────────────────────────
// Side-by-side static previews of every modal used in the product so the
// design of titles, descriptions, bodies and footers can be compared at a
// glance. Each preview uses the same classes as <DialogContent> but skips
// the portal/overlay so they sit inline and comparable.

function DialogFrame({
  width = "sm:max-w-sm",
  className,
  children,
}: { width?: string; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        // Shared DialogContent visual chrome (overlay/portal omitted).
        "relative w-full rounded-xl sm:rounded-2xl bg-popover text-small text-popover-foreground",
        "border border-border",
        width,
        className,
      )}
    >
      {children}
    </div>
  )
}

function DialogsKitchenSink() {
  return (
    <div className="flex flex-wrap gap-8 items-start">

      {/* ── 1. Confirm-destructive (manage-v2.tsx DeleteCard) ──────────── */}
      <div className="flex flex-col gap-3">
        <SubLabel>Confirm destructive</SubLabel>
        <DialogFrame className="p-4 grid gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-base font-medium text-foreground">Delete Chase Visa?</p>
            <p className="text-small text-muted-foreground">
              This will permanently remove this card from your account. This action cannot be undone.
            </p>
          </div>
          <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl sm:rounded-b-2xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete card</Button>
          </div>
        </DialogFrame>
      </div>

      {/* ── 2. Create Listing (shop-my-products AddProductDialog) ─────── */}
      <div className="flex flex-col gap-3">
        <SubLabel>Create Listing (Shop)</SubLabel>
        <DialogFrame width="w-[600px] max-w-none" className="p-8 gap-0 shadow-none">
          <div className="flex flex-col mb-8 gap-0.5">
            <p className="text-large font-medium leading-none">Create Listing</p>
            <p className="text-small text-muted-foreground">Choose what you want to sell.</p>
          </div>
          <RadioCardGroup value="vinyl" onValueChange={() => {}}>
            {[
              { v: "vinyl",    title: "Vinyl",        desc: "LPs, EPs, singles and limited pressings.",  icon: <Disc3 /> },
              { v: "cd",       title: "Compact Disc", desc: "Albums, EPs and special editions on CD.",   icon: <Disc /> },
              { v: "cassette", title: "Cassette",     desc: "Full releases and limited runs on tape.",   icon: <CassetteTape /> },
            ].map(o => (
              <RadioCard
                key={o.v}
                value={o.v}
                selected={o.v === "vinyl"}
                onSelect={() => {}}
                icon={o.icon}
                title={o.title}
                description={o.desc}
              />
            ))}
          </RadioCardGroup>
          {/* Footer — shared DialogFooter visual, p-8 to match bigger
              dialog's p-8 content padding. */}
          <div className="-mx-8 -mb-8 mt-8 flex flex-col-reverse gap-2 rounded-b-xl sm:rounded-b-2xl border-t bg-muted/50 p-8 sm:flex-row sm:justify-end">
            <Button variant="outline">Cancel</Button>
            <Button>Create Listing</Button>
          </div>
        </DialogFrame>
      </div>
    </div>
  )
}

// ─── Filter Menu kitchen sink ─────────────────────────────────────────────────
// Live multi-select filters backed by <FilterMenu> so the buttons actually
// open, toggle options, show a count badge, and expose a clear-all row.
function FilterMenuKitchenSink() {
  const [status,       setStatus]       = useState<Set<string>>(new Set())
  const [type,         setType]         = useState<Set<string>>(new Set(["album", "single"]))
  const [artist,       setArtist]       = useState<Set<string>>(new Set(["miles"]))
  const [monetisation, setMonetisation] = useState<Set<string>>(new Set())

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <FilterMenu
        label="Status"
        selected={status}
        onChange={setStatus}
        options={[
          { value: "public",  label: "Public" },
          { value: "private", label: "Private" },
        ]}
      />
      <FilterMenu
        label="Type"
        selected={type}
        onChange={setType}
        options={[
          { value: "album",  label: "Album" },
          { value: "single", label: "Single" },
          { value: "ep",     label: "EP" },
        ]}
      />
      <FilterMenu
        label="Artist"
        selected={artist}
        onChange={setArtist}
        options={[
          { value: "miles",    label: "Miles Davis" },
          { value: "coltrane", label: "John Coltrane" },
          { value: "monk",     label: "Thelonious Monk" },
          { value: "mingus",   label: "Charles Mingus" },
        ]}
      />
      <FilterMenu
        label="Monetisation"
        selected={monetisation}
        onChange={setMonetisation}
        options={[
          { value: "streaming", label: "Streaming" },
          { value: "purchase",  label: "Purchase" },
        ]}
      />
    </div>
  )
}

// ─── Radio Card kitchen sink ──────────────────────────────────────────────────
// Two demos:
//   · Simple — icon + title + description only (product-type picker flavour)
//   · With expanded content — a second card has children rendered below a
//     divider so you can see the "Purchase card with price inputs" pattern.
function RadioCardKitchenSink() {
  const [productType, setProductType]   = useState("vinyl")
  const [monetization, setMonetization] = useState("streaming")

  const products: { value: string; icon: React.ReactNode; title: string; description: string }[] = [
    { value: "vinyl",    icon: <Disc3 />,        title: "Vinyl",        description: "LPs, EPs, singles and limited pressings." },
    { value: "cd",       icon: <Disc />,         title: "Compact Disc", description: "Albums, EPs and special editions on CD." },
    { value: "cassette", icon: <CassetteTape />, title: "Cassette",     description: "Full releases and limited runs on tape." },
    { value: "apparel",  icon: <Shirt />,        title: "Apparel",      description: "T-shirts, hoodies, longsleeves and more." },
    { value: "other",    icon: <Ghost />,        title: "Other",        description: "Posters, zines, accessories or anything else." },
  ]

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex flex-col gap-3">
        <SubLabel>Simple — icon · title · description</SubLabel>
        <RadioCardGroup value={productType} onValueChange={setProductType}>
          {products.map(p => (
            <RadioCard
              key={p.value}
              value={p.value}
              selected={productType === p.value}
              onSelect={() => setProductType(p.value)}
              icon={p.icon}
              title={p.title}
              description={p.description}
            />
          ))}
        </RadioCardGroup>
      </div>

      <div className="flex flex-col gap-3">
        <SubLabel>With expanded content — the "For purchase" card shows inputs below a divider</SubLabel>
        <RadioCardGroup value={monetization} onValueChange={setMonetization}>
          <RadioCard
            value="streaming"
            selected={monetization === "streaming"}
            onSelect={() => setMonetization("streaming")}
            icon={<RadioIcon />}
            title="For streaming"
            description="Anyone on Muza can listen · per-stream royalties distributed monthly"
          />
          <RadioCard
            value="purchase"
            selected={monetization === "purchase"}
            onSelect={() => setMonetization("purchase")}
            icon={<ShoppingBag />}
            title="For purchase"
            description="Fans pay to unlock · you set your price"
          >
            <p className="text-xsmall text-muted-foreground">
              Children render below a full-width separator with generous padding.
              Clicks inside are swallowed so they don't re-select the card.
            </p>
            <Input placeholder="e.g. pricing inputs, options, notes…" />
          </RadioCard>
        </RadioCardGroup>
      </div>
    </div>
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
    <div className="pt-30 pb-64 max-w-[100rem] mx-auto w-full px-[clamp(1.5rem,5vw,5rem)] flex flex-col gap-6">
      <div className="flex flex-col items-center gap-28 min-h-[65vh] justify-center">
        <div className="flex flex-col items-center gap-6">
          <Wordmark className="h-4 w-auto" />
          <h1 className="text-[clamp(3.6rem,_5.4vw,_7.2rem)] leading-[1] font-medium text-foreground text-center">The Platform for<br />Independent Music.</h1>
        </div>
        <AnimatedLogo size={logoSize} />
      </div>
      <p className="text-[clamp(2rem,_3vw,_4rem)] leading-[1.1] font-normal text-foreground mt-16">Built as a non-profit, muza exists to fix streaming's broken economics. Instead of paying artists per click, muza rewards attention — distributing revenue based on actual listening time and direct listener support. Your subscription goes only to the artists you play.</p>
      <p className="text-[clamp(2rem,_3vw,_4rem)] leading-[1.1] font-normal text-foreground mt-10">We combine subscription streaming with direct artist uploads, giving musicians full control over how their music is shared and monetised. Artists retain ownership, receive up to 90–95% of revenue, and are paid directly — no hidden intermediaries.</p>
      <div className="flex justify-center mt-24">
        <Button size="lg" className="text-[2rem] px-[5.5rem] h-[5.5rem] rounded-full transition-transform duration-300 ease-out hover:transition-transform hover:duration-250 hover:ease-[cubic-bezier(0.22,1.8,0.36,1)] hover:scale-[1.07]" onClick={() => onNavigate("Music")}>Join muza now</Button>
      </div>
    </div>
  )
}

// ─── Studio pages ─────────────────────────────────────────────────────────────

const STUDIO_TABS: Record<string, string[]> = {
  Pages:     ["Artists", "Label"],
  Music:     ["My Music", "Upload Music"],
  Analytics: [],
  Products:  [],
  Orders:    [],
  Wallet:    ["Dashboard", "Transfer", "Manage"],
}

function toTabValue(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-")
}

function StudioView({ page, onOpenUpload }: { page: string; onOpenUpload?: () => void }) {
  if (page === "Music")    return <StudioMusicView onOpenUpload={onOpenUpload} />
  if (page === "Analytics") return <ReportView />
  if (page === "Products")  return <ShopMyProductsView />
  if (page === "Orders")    return <OrdersView />

  const tabs = STUDIO_TABS[page] ?? []

  return (
    <Tabs defaultValue={toTabValue(tabs[0])} className="flex flex-col h-full gap-0">

      {/* ── Header + tabs ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-16 pt-8 border-b border-border">
        <div className="flex items-start justify-between gap-6 mb-5">
          <h1 className="text-2xlarge font-medium tracking-tight">{page}</h1>
        </div>
        <TabsList variant="line" className="w-auto justify-start gap-0 h-auto pb-0">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={toTabValue(tab)} className="flex-none px-4 pb-3 text-small">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {tabs.map((tab) => (
          <TabsContent key={tab} value={toTabValue(tab)} className="h-full">
            {page === "Wallet" && tab === "Dashboard" ? <WalletView />   :
             page === "Wallet" && tab === "Transfer"  ? <TransferView /> :
             page === "Wallet" && tab === "Manage"    ? <ManageV2 />     :
             <div className="p-10"><p className="text-small text-muted-foreground">{tab}</p></div>
            }
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
          className="text-xsmall text-muted-foreground hover:text-foreground transition-colors"
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
    <div className="flex flex-wrap gap-10 items-start">
      <div className="flex flex-col gap-4">
        <SubLabel>Triggers (click to open)</SubLabel>
        <div className="flex flex-col gap-4">
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
      </div>

      <div className="flex flex-col gap-4">
        <SubLabel>Calendar popup (static preview)</SubLabel>
        <DatePickerStaticPreview />
      </div>
    </div>
  )
}

// Static snapshot of the DatePicker's popup face — uses the same tokens
// and markup as the real calendar inside `DatePicker`, but skips the
// PopoverPrimitive so it renders inline (no portal, no auto-positioning)
// and is suitable as a visual preview in the kitchen sink.
function DatePickerStaticPreview() {
  // Fixed sample month — Apr 2026, with the 20th highlighted as "today"
  // (matches the project's demo date) and the 14th marked as selected.
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  const firstDayOffset = 3    // Apr 2026 starts on Wednesday
  const daysInMonth    = 30
  const todayDay       = 20
  const selectedDay    = 14

  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="w-72 rounded-xl bg-popover border border-border p-4 shadow-md ring-1 ring-foreground/10">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" aria-label="Previous month" className="p-1 rounded-lg hover:bg-accent text-foreground transition-colors">
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-small font-medium text-foreground">April 2026</span>
        <button type="button" aria-label="Next month" className="p-1 rounded-lg hover:bg-accent text-foreground transition-colors">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {days.map(d => (
          <div key={d} className="flex items-center justify-center h-8 text-xsmall font-medium text-muted-foreground">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) =>
          day === null ? (
            <div key={`blank-${i}`} />
          ) : (
            <button
              key={day}
              type="button"
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-lg text-small transition-colors",
                day === selectedDay
                  ? "bg-primary text-primary-foreground font-medium"
                  : day === todayDay
                    ? "border border-border text-foreground hover:bg-accent"
                    : "text-foreground hover:bg-accent",
              )}
            >
              {day}
            </button>
          ),
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <Button variant="ghost" size="sm" className="text-xsmall">Today</Button>
        <Button variant="ghost" size="sm" className="text-xsmall text-muted-foreground">Clear</Button>
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

// ─── Hex → OKLch converter ────────────────────────────────────────────────────
function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  const lr = lin(r), lg = lin(g), lb = lin(b)
  const lms  = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const mms  = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const sms  = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(lms), m_ = Math.cbrt(mms), s_ = Math.cbrt(sms)
  const L  =  0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a  =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const bb =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  const C  = Math.sqrt(a * a + bb * bb)
  let   H  = Math.atan2(bb, a) * 180 / Math.PI
  if (H < 0) H += 360
  return `${(L * 100).toFixed(2)}% ${C.toFixed(4)} ${H.toFixed(1)}`
}

// ─── LazyOnView — renders children only once the wrapper enters the viewport.
//   Useful for keeping heavy previews (blurred backdrops, WaveSurfer canvases,
//   etc.) out of the paint/layout tree while they're scrolled off-screen —
//   without the scroll-anchoring quirks of `content-visibility: auto`.
function LazyOnView({
  children,
  fallbackClassName,
  rootMargin = "200px",
}: {
  children:           React.ReactNode
  fallbackClassName?: string
  rootMargin?:        string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || mounted) return
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setMounted(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mounted, rootMargin])

  return (
    <div ref={ref} className="absolute inset-0">
      {mounted ? children : fallbackClassName && <div className={fallbackClassName} />}
    </div>
  )
}

// ─── ResizableBox — drag the right edge to test responsive components.
//    The box never grows wider than its own parent container (measured with
//    a ResizeObserver), regardless of the `maxWidth` prop. ─────────────────
function ResizableBox({
  initialWidth = 800,
  minWidth     = 280,
  maxWidth     = 1400,
  children,
}: {
  initialWidth?: number
  minWidth?:     number
  maxWidth?:     number
  children:      React.ReactNode
}) {
  const outerRef   = useRef<HTMLDivElement>(null)
  const [width,       setWidth]       = useState(initialWidth)
  const [parentWidth, setParentWidth] = useState(Infinity)
  const [dragging,    setDragging]    = useState(false)
  const startX     = useRef(0)
  const startWidth = useRef(initialWidth)

  // Track the parent container's width so we can cap the box to it.
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const update = () => setParentWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const effectiveMax = Math.min(maxWidth, parentWidth)

  // Clamp state if the parent shrinks below the current width.
  useEffect(() => {
    setWidth(w => Math.min(w, effectiveMax))
  }, [effectiveMax])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startX.current     = e.clientX
    startWidth.current = width
    setDragging(true)
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX.current
      // Right handle adds delta; 2× because the box is centred (mx-auto), so
      // dragging right adds delta to both sides symmetrically.
      setWidth(Math.min(effectiveMax, Math.max(minWidth, startWidth.current + delta * 2)))
    }
    const onUp = () => setDragging(false)
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup",   onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup",   onUp)
    }
  }, [dragging, effectiveMax, minWidth])

  return (
    <div ref={outerRef} className="flex flex-col items-center gap-2 w-full">
      <div className="text-xsmall text-muted-foreground tabular-nums">{Math.round(width)}px</div>
      <div className="relative mx-auto max-w-full" style={{ width }}>
        {children}
        {/* Right resize handle */}
        <div
          onMouseDown={onMouseDown}
          className={cn(
            "absolute top-1/2 -right-2 -translate-y-1/2 z-30",
            "flex items-center justify-center w-4 h-12 cursor-ew-resize select-none",
            "rounded-full bg-foreground/80 hover:bg-foreground transition-colors shadow-md",
            dragging && "bg-foreground",
          )}
          title="Drag to resize"
        >
          <div className="w-0.5 h-4 bg-background rounded-full" />
        </div>
      </div>
    </div>
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
      <div className="bg-muted border-b border-border pt-24 pb-[3.75rem]">
        <div className="max-w-[100rem] mx-auto px-[clamp(1.5rem,5vw,5rem)]">
          <h1 className="text-5xl font-medium leading-none tracking-[-0.025em]">The muza design system</h1>
        </div>
      </div>

    <div className="max-w-[100rem] mx-auto w-full px-[clamp(1.5rem,5vw,5rem)] py-10 pb-32">

      {/* Quick nav */}
      <nav className="flex flex-wrap gap-1.5 mb-12">
        {[
          "Colors","Typography","Buttons","Badges","Chips","Input","Select","Filter Menu","Combobox","Menu",
          "Date Picker","Checkbox","Radio Card","Switch & Slider","Avatar","Tabs","Cards","Alerts","Alert Dialog",
          "Dialogs","Toast","Skeleton",
          "Popover","Table","Pagination","Command","OTP Input","Form",
          "Player Bar","Player Overlay",
        ].map((s) => {
          // Preserve `&` so "Switch & Slider" matches the section id
          // "switch-&-slider". Just lowercase and turn whitespace into dashes.
          const id = s.toLowerCase().replace(/\s+/g,"-")
          return (
            <button
              key={s}
              type="button"
              onClick={() => scrollToSection(id)}
              className="text-xsmall font-normal text-foreground px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors"
            >
              {s}
            </button>
          )
        })}
      </nav>

      {/* ══ COLORS ══ */}
      <Section id="colors" title="Colors">
        {/* oklch legend */}
        <p className="text-xsmall text-muted-foreground mb-6 leading-relaxed">
          Colors are defined in <span className="text-foreground">oklch</span> — a perceptually uniform space where equal numeric steps look equal to the human eye.
          Each swatch shows three values: <span className="text-foreground">L</span> lightness (0–100%),{" "}
          <span className="text-foreground">C</span> chroma/saturation (0 = grey, ~0.37 = max), and{" "}
          <span className="text-foreground">H</span> hue angle (0–360°).
        </p>
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
              <p className="text-xsmall font-normal text-muted-foreground mb-2">{scale.label}</p>
              <div className="flex gap-2">
                {scale.stops.map((s) => (
                  <div key={s.name} className="flex-1 flex flex-col items-start gap-1">
                    <div className="w-full h-14 rounded-xl border border-border" style={{ background: s.hex }} />
                    <span className="text-2xsmall text-foreground leading-tight">{s.name}</span>
                    {hexToOklch(s.hex).split(" ").map((v, i) => (
                      <span key={i} className="text-2xsmall text-muted-foreground leading-tight">
                        <span className="text-muted-foreground/40">{["L","C","H"][i]} </span>{v}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <table className="w-full text-xsmall border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-8 font-normal text-foreground">Token</th>
              <th className="pb-2 pr-8 font-normal text-foreground">Light</th>
              <th className="pb-2 font-normal text-foreground">Dark</th>
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
                lHex: "#1E34D8", lPrim: "--muza-blue-200",         lOklch: "44.70% 0.2440 267.0",
                dHex: "#1E34D8", dPrim: "--muza-blue-200",         dOklch: "44.70% 0.2440 267.0",
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
                <td className="py-2 pr-8 text-foreground whitespace-nowrap">{r.token}</td>
                <td className="py-2 pr-8">
                  <div className="flex gap-2">
                    <div className="size-10 rounded-xl border border-border shrink-0 self-center" style={{ background: r.lHex }} />
                    <div>
                      <span className="block text-foreground">{r.lPrim}</span>
                      <span className="text-muted-foreground">oklch({r.lOklch})</span>
                    </div>
                  </div>
                </td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <div className="size-10 rounded-xl border border-border shrink-0 self-center" style={{ background: r.dHex }} />
                    <div>
                      <span className="block text-foreground">{r.dPrim}</span>
                      <span className="text-muted-foreground">oklch({r.dOklch})</span>
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
        {/* ── PRIMITIVES ─────────────────────────────────────────────────
             Raw pixel values from Figma. Components should NOT reference
             these directly — use the semantic alias table below when one
             exists for the size you need. */}
        <p className="text-small font-medium text-foreground mb-1">Primitives</p>
        <p className="text-xsmall font-normal text-muted-foreground mb-5">
          Raw font-size values. Used directly only when no semantic alias fits (large display headings).
        </p>
        <div className="flex gap-6 pb-2 border-b border-border">
          <span className="w-32 shrink-0 text-xsmall text-muted-foreground">Primitive</span>
          <span className="w-20 shrink-0 text-xsmall text-muted-foreground">Value</span>
          <span className="flex-1 text-xsmall text-muted-foreground">Example</span>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {[
            { token: "text-9xl",  px: 200 },
            { token: "text-8xl",  px: 160 },
            { token: "text-7xl",  px: 128 },
            { token: "text-6xl",  px: 96 },
            { token: "text-5xl",  px: 72 },
            { token: "text-4xl",  px: 60 },
            { token: "text-3xl",  px: 48 },
            { token: "text-2xl",  px: 36 },
            { token: "text-xl",   px: 30 },
            { token: "text-lg",   px: 24 },
            { token: "text-base", px: 20 },
            { token: "text-sm",   px: 18 },
            { token: "text-xs",   px: 16 },
            { token: "text-xxs",  px: 14 },
          ].map(({ token, px }) => (
            <div key={token} className="flex items-baseline gap-6 py-4">
              <span className="w-32 shrink-0 text-small font-normal">{token}</span>
              <span className="w-20 shrink-0 text-xsmall text-muted-foreground tabular-nums">{px}px</span>
              <div className="flex-1 min-w-0">
                <p className={`${token} font-normal leading-none truncate`}>Discover Music</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEMANTIC ALIASES ───────────────────────────────────────────
             These are what product code should use by default. Each alias
             is a `var(--text-*)` reference in app.css — never a raw px. */}
        <p className="text-small font-medium text-foreground mt-10 mb-1">Semantic aliases</p>
        <p className="text-xsmall font-normal text-muted-foreground mb-5">
          Default choice in product code. Each alias resolves to a primitive via <code className="text-xsmall">var()</code> — never a hardcoded px.
        </p>
        <div className="flex gap-6 pb-2 border-b border-border">
          <span className="w-32 shrink-0 text-xsmall text-muted-foreground">Alias</span>
          <span className="w-32 shrink-0 text-xsmall text-muted-foreground">→ Primitive</span>
          <span className="w-20 shrink-0 text-xsmall text-muted-foreground">Resolved</span>
          <span className="flex-1 text-xsmall text-muted-foreground">Example</span>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {[
            { alias: "text-4xlarge", primitive: "text-4xl",  px: 60, weight: "font-medium",   sample: "Discover Music" },
            { alias: "text-3xlarge", primitive: "text-3xl",  px: 48, weight: "font-medium",   sample: "Featured Releases" },
            { alias: "text-2xlarge", primitive: "text-2xl",  px: 36, weight: "font-medium",   sample: "Top Playlists" },
            { alias: "text-xlarge",  primitive: "text-xl",   px: 30, weight: "font-medium",   sample: "Album of the Week" },
            { alias: "text-large",   primitive: "text-lg",   px: 24, weight: "font-medium",   sample: "Dialog titles, lead paragraphs." },
            { alias: "text-base",    primitive: "text-base", px: 20, weight: "font-normal",   sample: "Body copy, card content, default paragraphs.", note: "alias name = primitive name; use the primitive directly (no separate CSS variable)." },
            { alias: "text-small",   primitive: "text-sm",   px: 18, weight: "font-normal",   sample: "Descriptions, table cells, body text." },
            { alias: "text-xsmall",  primitive: "text-xs",   px: 16, weight: "font-normal",   sample: "Helper text, placeholder copy." },
            { alias: "text-2xsmall", primitive: "text-xxs",  px: 14, weight: "font-normal",   sample: "Badges, chips, captions, meta." },
          ].map(({ alias, primitive, px, weight, sample, note }) => (
            <div key={alias} className="flex items-baseline gap-6 py-4">
              <span className="w-32 shrink-0 text-small font-normal">{alias}</span>
              <span className="w-32 shrink-0 text-xsmall text-muted-foreground">{primitive}</span>
              <span className="w-20 shrink-0 text-xsmall text-muted-foreground tabular-nums">{px}px</span>
              <div className="flex-1 min-w-0">
                <p className={`${alias} ${weight} leading-normal text-foreground truncate`}>{sample}</p>
                {note && (
                  <p className="text-2xsmall text-muted-foreground/70 mt-1 italic truncate">{note}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Font weights */}
        <p className="text-xsmall font-normal text-muted-foreground mt-10 mb-4">Font weights — Founders Grotesk at text-large (24px)</p>
        <div className="flex flex-col divide-y divide-border">
          {[
            { label: "Regular",  cls: "font-normal",               val: "400", note: "default",             noteCls: "text-green-700 dark:text-green-400" },
            { label: "Medium",   cls: "font-medium",               val: "500", note: "emphasis & headlines", noteCls: "text-green-700 dark:text-green-400" },
            { label: "Semibold", cls: "font-semibold line-through", val: "600", note: "hardly ever",         noteCls: "text-yellow-700 dark:text-yellow-400" },
            { label: "Bold",     cls: "font-bold line-through",     val: "700", note: "never",               noteCls: "text-red-600 dark:text-red-400" },
          ].map(({ label, cls, val, note, noteCls }) => (
            <div key={label} className="flex items-center gap-6 py-3.5">
              <div className="w-40 shrink-0">
                <span className="text-small font-normal">{label}</span>
                <span className="block text-xsmall text-muted-foreground mt-0.5">font-weight: {val}</span>
                <span className={`block text-xsmall mt-0.5 ${noteCls}`}>{note}</span>
              </div>
              <p className={`text-large ${cls}`}>Upload your tracks and get paid fairly.</p>
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

          const GRID_TEXT = "grid grid-cols-[120px_auto_auto_auto] gap-x-8 items-center py-3"
          const GRID_ICON = "grid grid-cols-[120px_auto_auto_auto] gap-x-6 items-center py-3"
          const D = "border-b border-border/50"

          return (
            <div className="flex flex-col gap-10">
              {/* ── Text buttons ── */}
              <div className="flex flex-col">
                <div className={GRID_TEXT + " pb-2"}>
                  <div />
                  <p className="text-2xsmall text-muted-foreground pl-10">Large</p>
                  <p className="text-2xsmall text-muted-foreground pl-[18px]">Default</p>
                  <p className="text-2xsmall text-muted-foreground pl-3">Small</p>
                </div>
                {VARIANTS.map((v) => (
                  <div key={v.key} className={GRID_TEXT + " " + D}>
                    <p className="text-2xsmall text-muted-foreground">{v.label}</p>
                    <div className="flex"><Button variant={v.key as any} size="lg">{v.label}</Button></div>
                    <div className="flex"><Button variant={v.key as any}>{v.label}</Button></div>
                    <div className="flex"><Button variant={v.key as any} size="sm">{v.label}</Button></div>
                  </div>
                ))}
                <div className={GRID_TEXT + " " + D}>
                  <p className="text-2xsmall text-muted-foreground">Disabled</p>
                  <div className="flex"><Button size="lg" disabled>Primary</Button></div>
                  <div className="flex"><Button disabled>Primary</Button></div>
                  <div className="flex"><Button size="sm" disabled>Primary</Button></div>
                </div>
                <div className={GRID_TEXT}>
                  <p className="text-2xsmall text-muted-foreground">Loading</p>
                  <div className="flex"><Button size="lg" disabled><Spin />Primary</Button></div>
                  <div className="flex"><Button disabled><Spin />Primary</Button></div>
                  <div className="flex"><Button size="sm" disabled><Spin />Primary</Button></div>
                </div>
              </div>

              {/* ── Icon-only buttons ── */}
              <div className="flex flex-col">
                <div className={GRID_ICON + " pb-2"}>
                  <div />
                  <p className="text-2xsmall text-muted-foreground">Large</p>
                  <p className="text-2xsmall text-muted-foreground">Default</p>
                  <p className="text-2xsmall text-muted-foreground">Small</p>
                </div>
                {VARIANTS.map((v) => (
                  <div key={v.key} className={GRID_ICON + " " + D}>
                    <p className="text-2xsmall text-muted-foreground">{v.label}</p>
                    <div className="flex"><Button variant={v.key as any} size="icon-lg"><Plus /></Button></div>
                    <div className="flex"><Button variant={v.key as any} size="icon"><Plus /></Button></div>
                    <div className="flex"><Button variant={v.key as any} size="icon-sm"><Plus /></Button></div>
                  </div>
                ))}
                <div className={GRID_ICON + " " + D}>
                  <p className="text-2xsmall text-muted-foreground">Disabled</p>
                  <div className="flex"><Button size="icon-lg" disabled><Plus /></Button></div>
                  <div className="flex"><Button size="icon" disabled><Plus /></Button></div>
                  <div className="flex"><Button size="icon-sm" disabled><Plus /></Button></div>
                </div>
                <div className={GRID_ICON}>
                  <p className="text-2xsmall text-muted-foreground">Loading</p>
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

      {/* ══ INPUT ══ */}
      <Section id="input" title="Input">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="flex flex-col gap-1.5 min-w-[260px]">
            <Label htmlFor="artist">Default</Label>
            <Input id="artist" placeholder="e.g. Kendrick Lamar" />
            <p className="text-xsmall text-muted-foreground">Your public display name on Muza.</p>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[260px]">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@muza.com" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[260px]">
            <Label htmlFor="search-input">With icon</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="search-input" className="pl-9" placeholder="Search artists, albums…" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[320px]">
            <Label htmlFor="bio">Textarea</Label>
            <Textarea id="bio" placeholder="Tell listeners about yourself…" rows={3} />
            <p className="text-xsmall text-muted-foreground">Max 280 characters.</p>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <Label>With action</Label>
            <div className="flex gap-2">
              <Input placeholder="Invite by email" />
              <Button>Invite</Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <Label>With inline select</Label>
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
            <Label>With inline select (suffix)</Label>
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

      {/* ══ SELECT ══ */}
      <Section id="select" title="Select">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="flex flex-col gap-1.5">
            <Label>Genre</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="rb">R&amp;B</SelectItem>
                <SelectItem value="indie">Indie</SelectItem>
                <SelectItem value="pop">Pop</SelectItem>
                <SelectItem value="afrobeats">Afrobeats</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Sort by</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Most recent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="popular">Most popular</SelectItem>
                <SelectItem value="az">A → Z</SelectItem>
                <SelectItem value="za">Z → A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Disabled</Label>
            <Select disabled>
              <SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hip-hop">Hip-Hop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* ══ FILTER MENU ══
           base-ui `Menu` with `CheckboxItem`s + pill trigger, count badge,
           and a clear-all row. Single app-level API: <FilterMenu>. */}
      <Section id="filter-menu" title="Filter Menu">
        <FilterMenuKitchenSink />
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

      {/* ══ MENU ══ */}
      <Section id="menu" title="Menu">
        <div className="flex flex-wrap gap-4">
          {(["default", "secondary", "outline", "ghost"] as const).map((variant) => (
            <DropdownMenu key={variant}>
              <DropdownMenuTrigger className={buttonVariants({ variant })}>
                My Account <ChevronDown className="size-4 transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" />
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
          ))}

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

      {/* ══ RADIO CARD ══ */}
      <Section id="radio-card" title="Radio Card">
        <RadioCardKitchenSink />
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
          <Avatar className="size-7"><AvatarFallback className="text-xsmall">JD</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>MK</AvatarFallback></Avatar>
          <Avatar className="size-12"><AvatarFallback className="text-large">AL</AvatarFallback></Avatar>
          <Avatar className="size-16"><AvatarFallback className="text-2xlarge">RS</AvatarFallback></Avatar>
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">M</AvatarFallback>
          </Avatar>
          <div className="flex -space-x-2">
            {["JD","AL","RS"].map((i) => (
              <Avatar key={i} className="ring-2 ring-background">
                <AvatarFallback className="text-xsmall">{i}</AvatarFallback>
              </Avatar>
            ))}
            <Avatar className="ring-2 ring-background">
              <AvatarFallback className="text-xsmall bg-neutral-800 text-neutral-100">+4</AvatarFallback>
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
              <TabsContent value="overview" className="pt-4 text-small text-muted-foreground">
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
              <p className="text-4xlarge font-medium tracking-tight">12,430</p>
              <p className="text-xsmall text-muted-foreground mt-1 mb-4">streams across all tracks</p>
              <Progress value={72} className="h-1.5" />
            </CardContent>
          </Card>

          <Card className="w-64">
            <CardContent className="pt-6 flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback className="bg-primary text-primary-foreground font-medium text-large">RL</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium leading-tight">River Lotus</p>
                <p className="text-small text-muted-foreground">Electronic · Berlin</p>
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
        <DialogsKitchenSink />
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
                <p className="text-small font-medium leading-none">Blue Afternoon</p>
                <p className="text-xsmall text-muted-foreground">River Lotus · Electronic · 2024</p>
                <Separator />
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xsmall">
                    <span className="text-muted-foreground">Streams</span>
                    <span>12,430</span>
                  </div>
                  <div className="flex justify-between text-xsmall">
                    <span className="text-muted-foreground">Duration</span>
                    <span>3:42</span>
                  </div>
                  <div className="flex justify-between text-xsmall">
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
              <p className="text-small font-medium mb-3">Equalizer</p>
              <div className="flex flex-col gap-3">
                {["Bass","Mid","Treble"].map((band) => (
                  <div key={band} className="flex items-center gap-3">
                    <span className="text-xsmall text-muted-foreground w-12">{band}</span>
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
              { n: 1, seed: "sonny",     title: "Blue Afternoon",    artist: "River Lotus",   genre: "Jazz",       streams: "12,430", dur: "3:42" },
              { n: 2, seed: "miles",     title: "Midnight Circuit",  artist: "Axon Fade",     genre: "Jazz",       streams: "9,814",  dur: "4:15" },
              { n: 3, seed: "coltrane",  title: "Haunt the Waves",   artist: "Dusk Ensemble", genre: "Jazz",       streams: "7,201",  dur: "5:01" },
              { n: 4, seed: "monk",      title: "Static Memory",     artist: "Nora Voss",     genre: "Jazz",       streams: "5,588",  dur: "2:58" },
              { n: 5, seed: "mingus",    title: "Low Tide Prayer",   artist: "Coastal Rites", genre: "Jazz",       streams: "3,112",  dur: "4:33" },
            ].map(({ n, seed, title, artist, genre, streams, dur }) => (
              <TableRow key={n}>
                <TableCell className="text-muted-foreground">{n}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    {/* `rounded-xs` (2px) — design-system spec for image-containers. */}
                    <img
                      src={`https://picsum.photos/seed/${seed}/64/64`}
                      alt=""
                      className="size-8 rounded-xs object-cover shrink-0"
                    />
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

      {/* ══ PLAYER BAR ══ */}
      <Section id="player-bar" title="Player Bar">
        <div className="flex flex-col gap-8">
          {/* Player A */}
          <ResizableBox initialWidth={1000} minWidth={368} maxWidth={1500}>
            <div
              className="relative flex flex-col justify-center gap-4 rounded-xl overflow-hidden p-10"
              style={{
                backgroundImage: "url(https://www.figma.com/api/mcp/asset/146ffdca-77f3-4008-8ff4-904d2b06ca52)",
                backgroundSize: "cover",
                backgroundPosition: "center top",
                minHeight: 360,
              }}
            >
              <div className="relative z-10 flex flex-col gap-4">
                <span className="self-start text-2xsmall font-medium text-foreground bg-background/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  Player Bar A
                </span>
                <PlayerBar className="w-full" />
              </div>
            </div>
          </ResizableBox>

          {/* Player B */}
          <ResizableBox initialWidth={1000} minWidth={368} maxWidth={1500}>
            <div
              className="relative flex flex-col justify-center gap-4 rounded-xl overflow-hidden p-10"
              style={{
                backgroundImage: "url(https://www.figma.com/api/mcp/asset/146ffdca-77f3-4008-8ff4-904d2b06ca52)",
                backgroundSize: "cover",
                backgroundPosition: "center top",
                minHeight: 360,
              }}
            >
              <div className="relative z-10 flex flex-col gap-4">
                <span className="self-start text-2xsmall font-medium text-foreground bg-background/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  Player Bar B
                </span>
                <PlayerBarB className="w-full" />
              </div>
            </div>
          </ResizableBox>
        </div>
      </Section>

      {/* ══ PLAYER OVERLAY (mobile full-screen "Now listening") ══ */}
      <Section id="player-overlay" title="Player Overlay">
        {/*
          Reference frames covering the full spread of iPhones still in
          common daily use — from the oldest 4" device up to the newest
          6.9" Pro Max.
        */}
        <div className="flex flex-wrap items-start justify-center gap-10">
          {[
            { label: "iPhone SE (1st gen) · 4\"",        width: 320, height: 568 },
            { label: "iPhone SE (2nd/3rd gen) · 4.7\"",  width: 375, height: 667 },
            { label: "iPhone 13–16e · 6.1\"",            width: 390, height: 844 },
            { label: "iPhone 17 Pro Max · 6.9\"",        width: 440, height: 956 },
          ].map(({ label, width, height }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <span className="text-2xsmall text-muted-foreground tabular-nums">
                {label} · {width}×{height}
              </span>
              <div
                className="relative rounded-[48px] overflow-hidden ring-1 ring-border shadow-xl bg-background"
                style={{ width, height }}
              >
                <LazyOnView fallbackClassName="absolute inset-0 bg-muted animate-pulse">
                  <MobilePlayerShell />
                </LazyOnView>
              </div>
            </div>
          ))}
        </div>
      </Section>

    </div>
    </div>
  )
}

// ─── Root page — unified app shell ────────────────────────────────────────────
export default function Home() {
  // ── URL-backed navigation ──────────────────────────────────────────────
  // Top-level page lives in the `?page=<View>` query param so links are
  // shareable and survive reload. Anchor `#<section-id>` on the Explore
  // page still works as expected (e.g. `?page=Explore#player-bar`).
  const [params, setParams] = useSearchParams()
  const activeNav = params.get("page") ?? "Home"

  function navigate(view: string) {
    // `replace: true` keeps the back button feeling like an app-shell nav
    // rather than stacking a history entry for every sidebar click.
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (view === "Home") next.delete("page")
      else next.set("page", view)
      return next
    }, { replace: true })
  }

  const [collapsed, setCollapsed] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadMinimized, setUploadMinimized] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll-to-top on page change, but only when there's no hash — a hash
    // means the user explicitly requested a section anchor, and the browser
    // will handle that scroll itself.
    if (window.location.hash) return
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
    }, 0)
    return () => clearTimeout(id)
  }, [activeNav])

  // Scroll anchors inside a scrollable container (scrollRef) don't fire
  // browser auto-scroll on load. Re-run the anchor scroll whenever the
  // page changes and a hash is present.
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) {
      // rAF ensures the target section is in the layout tree already.
      requestAnimationFrame(() => el.scrollIntoView({ block: "start" }))
    }
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
            <div className="p-10"><h1 className="text-2xlarge font-medium">{activeNav}</h1></div>
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
              <span className="text-small font-medium text-foreground leading-tight">Uploading music</span>
              <span className="text-xsmall text-muted-foreground font-normal leading-tight">{uploadProgress}%</span>
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
