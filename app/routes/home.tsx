import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "react-router"
import { cn } from "@/lib/utils"
import { useSidebarAutoCollapsed, useFooterNav } from "@/lib/use-media-query"
import { FooterNav } from "@/components/app/footer-nav"
import { MobileAppHeader } from "@/components/app/mobile-app-header"
import { MediaListItem } from "@/components/ui/media-list-item"
import { SearchResultsView } from "@/components/app/search-results-view"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { registerAlbums } from "@/lib/album-catalog"
import { CreditsProvider, CreditsDialogPreview, useCredits } from "@/components/app/credits-dialog"
import { BulkActionBarContent, BulkActionButton } from "@/components/ui/bulk-action-bar"
import { ResponsiveDiagram } from "@/components/app/responsive-diagram"
import { registerPlaylists } from "@/lib/playlist-catalog"
import { AnimatedLogo } from "@/components/app/animated-logo"
import { Sidebar } from "@/components/app/sidebar"
import { StudioMusicView } from "@/components/app/studio-music"
import { WalletView } from "@/components/app/wallet-view"
import { TransferView } from "@/components/app/transfer-view"
import { ManageView } from "@/components/app/manage-view"
import { ManageV2 } from "@/components/app/manage-v2"
import { ReportView } from "@/components/app/report-view"
import { Topbar, TopbarDefaultActions } from "@/components/app/topbar"
import { PurchasesView } from "@/components/app/purchases-view"
import { SettingsView } from "@/components/app/settings-view"
import { UserAvatar } from "@/components/ui/user-avatar"
import { PurchasedBadge } from "@/components/ui/purchased-badge"
import { ChipInput } from "@/components/ui/chip-input"
import { ChipDismiss, ChipGroup } from "@/components/ui/chip"
import { AVATAR_PALETTE } from "@/lib/avatar"
import { CartProvider } from "@/lib/cart"
import { UserLibraryProvider, useUserLibrary } from "@/lib/user-library"
import { UserAccountProvider } from "@/lib/user-account"
import { albumMetaFor, libraryIdForTitle } from "@/lib/album-meta"
import { SECTION_STATUS_BY_ID, LAST_GIT_PUSH, sectionLastChanged, sectionSourceUrl, formatStatusDate, type SectionStatus } from "./ds-status"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge, ContentTypeBadge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { InputSelect } from "@/components/ui/input-select"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox, CheckboxField } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { QtyStepper } from "@/components/ui/qty-stepper"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  SheetFooter, SheetTrigger, SheetClose,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"
import {
  Collapsible, CollapsibleTrigger, CollapsiblePanel,
} from "@/components/ui/collapsible"
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionPanel,
} from "@/components/ui/accordion"
import {
  Meter, MeterLabel, MeterValue, MeterTrack, MeterIndicator,
} from "@/components/ui/meter"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator,
} from "@/components/ui/toolbar"
import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
  NavigationMenuPopup, NavigationMenuViewport, NavigationMenuPortal,
  NavigationMenuPositioner,
} from "@/components/ui/navigation-menu"
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
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
  DialogPreview, DialogPreviewHeader, DialogPreviewTitle,
  DialogPreviewDescription, DialogPreviewFooter,
} from "@/components/ui/dialog"
import { Combobox, ComboboxTrigger, ComboboxContent, ComboboxItem } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Chip, ChipDismiss, ChipGroup } from "@/components/ui/chip"
import { SingleSelect } from "@/components/ui/single-select"
import { useToast, ToastPreview } from "@/components/ui/toast"
import {
  AlertCircle, CheckCircle2, Info, Music2, Heart, Share,
  SkipBack, SkipForward, Play, Pause, Shuffle, Repeat,
  Settings, User, LogOut, Upload, MoreHorizontal,
  Plus, Search, ChevronDown, Trash2, SlidersHorizontal, Maximize2,
  Radio as RadioIcon, ShoppingBag, Disc3, Disc, CassetteTape, Shirt, Ghost,
  ChevronLeft, ChevronRight, Globe, X, Sun, Moon, MapPin, CircleCheckBig,
  ArrowUpRight, Truck, Mail,
  ListPlus, ListStart, ListEnd, Mic, Flag, Clock,
} from "lucide-react"
import { DetailMoreButton } from "@/components/ui/detail-more-button"
import { SearchPanel } from "@/components/ui/search-panel"
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
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { CheckoutCard, CHECKOUTS } from "@/components/app/purchases-view"
import { ShopView } from "@/components/app/shop-view"
import { LibraryAlbumsView } from "@/components/app/library-albums-view"
import { ArtistProfileView } from "@/components/app/artist-profile-view"
import { AlbumDetailView } from "@/components/app/album-detail-view"
import { PlaylistDetailView } from "@/components/app/playlist-detail-view"
import { PurchaseAlbumDialog, PurchaseAlbumDialogPreview } from "@/components/app/purchase-album-dialog"
import { SubscriptionPromptDialog, SubscriptionPromptDialogPreview, SubscriptionCheckoutDialog, SubscriptionCheckoutDialogPreview } from "@/components/app/subscription-dialogs"
import { LoginDialog, LoginDialogPreview } from "@/components/app/login-dialog"
import { LibraryArtistsView, SAVED_ARTISTS } from "@/components/app/library-artists-view"
import { LibraryPlaylistsView, SAVED_PLAYLISTS } from "@/components/app/library-playlists-view"
import { LibrarySongsView, SAVED_SONGS_SEED } from "@/components/app/library-songs-view"
// Imported after the per-type views so the SAVED_* data modules they
// own are initialised before this combined view (which reads them)
// enters the playlist-catalog import cycle.
import { LibraryAllView } from "@/components/app/library-all-view"
import { DetailActionsProvider } from "@/lib/detail-actions"
import { AlbumCard } from "@/components/ui/album-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { PlaylistCard } from "@/components/ui/playlist-card"
import { ProductCard } from "@/components/ui/product-card"
import { SongListItem } from "@/components/ui/song-list-item"
import { CoverPlayButton } from "@/components/ui/cover-play-button"
import { PlayingWave } from "@/components/ui/playing-wave"
import { Spinner } from "@/components/ui/spinner"
import { TopProgressBar } from "@/components/ui/top-progress-bar"
import { AlbumCardMenuItems, PlaylistCardMenuItems } from "@/components/ui/cover-card-menu"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { CardRail } from "@/components/app/card-rail"
import { SongRail } from "@/components/app/song-rail"
import { PlaylistCreateCard } from "@/components/ui/playlist-create-card"
import { MediaHeader } from "@/components/ui/media-header"
import { ArtistHero } from "@/components/app/artist-hero"
import {
  MobileHeader, MobileTitleRow, MobileIconButton, MobileAvatar,
  MobileSearchBar, MobilePillTabs, MobileScopeToggle,
} from "@/components/ui/mobile-header"
import { Section as PageSection } from "@/components/app/section"
import { ItemsSection as DetailItemsSection } from "@/components/app/items-section"
import { COUNTRY_CODES, countryName } from "@/lib/countries"
import { MultiSelect } from "@/components/ui/multi-select"
import { PlayerBarB }    from "@/components/ui/player-bar-b"
import { PlayerOverlay } from "@/components/ui/player-overlay"
import { PlayerProvider } from "@/lib/player"
import { AppPlayer }     from "@/components/app/app-player"
import { MobilePlayerShell } from "@/components/ui/mobile-player-shell"
import { Wordmark }      from "@/components/ui/logo"
import DesignSystem      from "./design-system"

// ─── Section heading component ────────────────────────────────────────────────
// `scroll-mt-6` gives the section 24px of breathing room from the top of the
// scroll container when the quick-nav scrolls to it.
type SectionUsage  = ReadonlyArray<{ label: string; href: string }>

function Section({
  id, title, status, phase, usage, children,
}: {
  id:       string
  title:    string
  /** Optional override. When omitted, falls back to the central
   *  `SECTION_STATUS_BY_ID` map so adding/removing badges is a
   *  one-place edit. Pass an explicit value only when a specific
   *  showcase wants to deviate from the cycle-wide flag. */
  status?:  SectionStatus
  /** `2` marks a component tied to the Shop / Products experience —
   *  scheduled for Phase 2 and not in the day-one build. Lets devs
   *  triage what's actively in scope vs deferred. */
  phase?:   2
  /** Where this component / pattern is used in the actual prototype.
   *  Rendered as a small muted "Used in: a · b · c" line under the
   *  title so a reader can jump straight from the docs into the
   *  living context. */
  usage?:   SectionUsage
  children: React.ReactNode
}) {
  // Fall back to the cycle's central status map when no explicit
  // prop is passed. Lets the prop API stay flexible while keeping
  // 99% of usages driven by the single source of truth.
  const entry           = SECTION_STATUS_BY_ID[id]
  const resolvedStatus  = status ?? entry?.status
  // "Changed …" date — auto-derived from git (last commit that
  // touched this section's backing file, per `ds-sources.ts`). null
  // when the section has no mapped file / git was missing at build.
  const changedDate     = sectionLastChanged(id)
  // Deep link to this component's source on GitHub (auto-derived).
  const sourceUrl       = sectionSourceUrl(id)
  return (
    <section
      id={id}
      data-phase={phase}
      className="mb-36 scroll-mt-6"
    >
      <div className="mb-5">
        {/* One line — name, status labels (New / Updated / Not used
             yet / Phase 2), then the auto "Changed …" date + GitHub
             source button pushed to the right. The border sits under
             this row; the "Used in" annotation drops below the line. */}
        <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-border">
          <p className="text-base font-medium text-foreground">{title}</p>
          {resolvedStatus === "new"     && <Badge variant="new">New</Badge>}
          {resolvedStatus === "updated" && <Badge variant="updated">Updated</Badge>}
          {/* `concept` = built but not yet wired into the prototype.
               Keep visible so we can iterate, but make it clear it's
               not actually in use. */}
          {resolvedStatus === "concept" && <Badge variant="outline">Not used yet</Badge>}
          {phase === 2                  && <Badge variant="secondary">Phase 2 · Shop</Badge>}

          {(changedDate || sourceUrl) && (
            <div className="ml-auto flex items-center gap-2">
              {changedDate && (
                <span className="text-small text-muted-foreground tabular-nums">
                  Changed{" "}<span className="text-foreground">{formatStatusDate(changedDate)}</span>
                </span>
              )}
              {sourceUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  render={<a href={sourceUrl} target="_blank" rel="noreferrer" />}
                >
                  GitHub
                  <ArrowUpRight className="size-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        {usage && usage.length > 0 && (
          <p className="text-xsmall font-normal text-muted-foreground mt-3">
            <span className="opacity-70">Used in: </span>
            {usage.map((u, i) => (
              <span key={u.label + u.href}>
                {i > 0 && <span className="opacity-50"> · </span>}
                <a href={u.href} className="hover:text-foreground hover:underline underline-offset-[3px] [text-decoration-thickness:1px] transition-colors">
                  {u.label}
                </a>
              </span>
            ))}
          </p>
        )}
      </div>
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
    target.scrollIntoView({ block: "start", behavior: "smooth" })
    return
  }
  const SCROLL_MARGIN = 24   // matches `scroll-mt-6` on the Section element
  const top =
    target.getBoundingClientRect().top
    - scroller.getBoundingClientRect().top
    + scroller.scrollTop
    - SCROLL_MARGIN
  smoothScrollTo(scroller, top)
}

// ─── Snappy custom tween ──────────────────────────────────────────────────────
// Native `scrollTo({ behavior: "smooth" })` is a bit sluggish (~500ms, slow
// ease). This runs a short rAF-driven animation with an ease-out curve so the
// jump feels responsive without teleporting.
const SCROLL_DURATION_MS = 280
function smoothScrollTo(scroller: Element, targetTop: number) {
  const startTop = scroller.scrollTop
  const delta    = targetTop - startTop
  if (Math.abs(delta) < 1) return
  const startAt  = performance.now()
  // cubic ease-out: fast start, soft landing
  const ease = (t: number) => 1 - Math.pow(1 - t, 3)
  function step(now: number) {
    const t = Math.min(1, (now - startAt) / SCROLL_DURATION_MS)
    scroller.scrollTop = startTop + delta * ease(t)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// Sample rows for the DS Song Rail showcase (enough to overflow → arrows + Show all).
const SONG_RAIL_DEMO = [
  { id: "sr1", title: "Blue Train",        album: "Blue Train",        duration: "10:43", cover: "https://picsum.photos/seed/songrail1/80" },
  { id: "sr2", title: "Moment's Notice",   album: "Blue Train",        duration: "9:10",  cover: "https://picsum.photos/seed/songrail2/80" },
  { id: "sr3", title: "Locomotion",        album: "Blue Train",        duration: "7:14",  cover: "https://picsum.photos/seed/songrail3/80" },
  { id: "sr4", title: "Lazy Bird",         album: "Blue Train",        duration: "7:05",  cover: "https://picsum.photos/seed/songrail4/80" },
  { id: "sr5", title: "I'm Old Fashioned", album: "Blue Train",        duration: "7:58",  cover: "https://picsum.photos/seed/songrail5/80" },
  { id: "sr6", title: "Naima",             album: "Giant Steps",       duration: "4:21",  cover: "https://picsum.photos/seed/songrail6/80" },
  { id: "sr7", title: "Cousin Mary",       album: "Giant Steps",       duration: "5:45",  cover: "https://picsum.photos/seed/songrail7/80" },
  { id: "sr8", title: "Mr. P.C.",          album: "Giant Steps",       duration: "6:57",  cover: "https://picsum.photos/seed/songrail8/80" },
]

function SubLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-xsmall font-normal text-muted-foreground mb-3", className)}>{children}</p>
  )
}

// Phone-shaped frame for the MobileHeader showcase. The header sticks
// to the top while faux content scrolls under it, so the frosted-glass
// tint + blur actually reads (a flat backdrop would show nothing). The
// frame is a fixed 320px so the 12px gutter + pill proportions match a
// real phone regardless of the DS page's own viewport.
function PhoneHeaderFrame({ header }: { header: React.ReactNode }) {
  return (
    <div className="w-[320px] shrink-0 rounded-[28px] border border-border overflow-hidden bg-background shadow-[0_1px_2px_rgba(13,13,4,0.06)]">
      <div className="relative h-[300px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="sticky top-0 z-10">{header}</div>
        {/* Faux content so the glass has something to blur over. */}
        <ul className="px-3 py-3 flex flex-col gap-3">
          {[
            { c: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/120x120bb.jpg", t: "Kind of Blue", s: "Miles Davis" },
            { c: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/120x120bb.jpg", t: "A Love Supreme", s: "John Coltrane" },
            { c: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/120x120bb.jpg", t: "Mingus Ah Um", s: "Charles Mingus" },
            { c: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/120x120bb.jpg", t: "Time Out", s: "The Dave Brubeck Quartet" },
            { c: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/120x120bb.jpg", t: "Blue Train", s: "John Coltrane" },
          ].map((r, i) => (
            <li key={i} className="flex items-center gap-3">
              <img src={r.c} alt="" className="size-11 rounded-xs object-cover bg-secondary" />
              <div className="min-w-0">
                <p className="text-small font-medium text-foreground truncate">{r.t}</p>
                <p className="text-xsmall text-muted-foreground truncate">{r.s}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Tiny stateful wrapper so each kitchen-sink stepper has its own value
// without the page having to track 5+ pieces of state.
function QtyStepperDemo({
  initial = 2, min, max, size,
}: {
  initial?: number
  min?:     number
  max?:     number
  size?:    "sm" | "default"
}) {
  const [n, setN] = useState(initial)
  return <QtyStepper value={n} onChange={setN} min={min} max={max} size={size} />
}

// ─── Semantic token table ─────────────────────────────────────────────────────
//
// Renders every semantic CSS variable with its LIVE light + dark swatches.
// Swatches use `var(--TOKEN)` inside scoped `<div class="light">` and
// `<div class="dark">` wrappers, so they always reflect what app.css
// currently defines. Hex values are derived from `getComputedStyle()` after
// mount, so changes to the underlying tokens automatically flow through.
//
// The only thing kept hardcoded is the primitive-name label per row
// (--muza-neutrals-X etc.) — that's documentation of which primitive each
// semantic token currently maps to. Keep in sync with the var(...)
// assignments in app.css's :root / .dark blocks.

interface SemanticToken {
  token:  string  // CSS variable name, e.g. "--background"
  /** Display alias when the token is rendered (used when the token covers
   *  multiple aliases like `--card / --popover`). Falls back to `token`. */
  alias?: string
  lPrim:  string  // light-mode primitive label
  dPrim:  string  // dark-mode primitive label
}

const SEMANTIC_TOKENS: SemanticToken[] = [
  { token: "--background",         lPrim: "--muza-white",            dPrim: "--muza-black"            },
  { token: "--foreground",         lPrim: "--muza-neutrals-950",     dPrim: "--muza-neutrals-50"      },
  { token: "--card",   alias: "--card / --popover",
                                   lPrim: "--muza-white",            dPrim: "--muza-neutrals-950"     },
  { token: "--primary",            lPrim: "--muza-blue-200",         dPrim: "--muza-blue-200"         },
  { token: "--primary-foreground", lPrim: "--muza-neutrals-50",      dPrim: "--muza-neutrals-50"      },
  { token: "--primary-text",       lPrim: "--muza-blue-200",         dPrim: "--muza-blue-100"         },
  { token: "--secondary",          lPrim: "--muza-neutrals-200",     dPrim: "--muza-neutrals-800"     },
  { token: "--secondary-hover",    lPrim: "--muza-neutrals-300",     dPrim: "--muza-neutrals-700"     },
  { token: "--muted",              lPrim: "--muza-neutrals-50",      dPrim: "--muza-neutrals-900"     },
  { token: "--muted-foreground",   lPrim: "--muza-neutrals-a75-700", dPrim: "--muza-neutrals-a50-50"  },
  { token: "--accent",             lPrim: "--muza-neutrals-100",     dPrim: "--muza-neutrals-800"     },
  { token: "--accent-foreground",  lPrim: "--muza-neutrals-900",     dPrim: "--muza-neutrals-50"      },
  { token: "--destructive",        lPrim: "--tw-red-600",            dPrim: "--tw-red-900"            },
  { token: "--border",             lPrim: "--muza-neutrals-300",     dPrim: "--muza-neutrals-700"     },
  { token: "--input",              lPrim: "--muza-neutrals-200",     dPrim: "--muza-neutrals-800"     },
  { token: "--ring",               lPrim: "--muza-neutrals-900",     dPrim: "--muza-neutrals-300"     },
]

/** rgb(R, G, B[, A]) → "#RRGGBB" (alpha dropped) or pass-through for
 *  values the browser doesn't normalise (e.g. "transparent"). */
function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/)
  if (!m) return rgb
  const [, r, g, b, a] = m
  const hex = "#" + [r, g, b].map(n => Number(n).toString(16).padStart(2, "0").toUpperCase()).join("")
  return a && Number(a) < 1
    ? `${hex} · ${Math.round(Number(a) * 100)}%`
    : hex
}

function TokenSwatch({ token, mode, primLabel }: {
  token:     string
  mode:      "light" | "dark"
  primLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hex, setHex] = useState("")

  useEffect(() => {
    if (!ref.current) return
    const compute = () => {
      const bg = getComputedStyle(ref.current!).backgroundColor
      setHex(rgbToHex(bg))
    }
    compute()
    // Re-read on theme toggle (so any computed values that depend on the
    // page mode update — though our .light/.dark scopes pin them).
    const observer = new MutationObserver(compute)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [token])

  // Only the SWATCH lives in the scoped .light / .dark wrapper — the
  // text labels stay in the page's natural theme scope so they remain
  // readable when the user's currently in the opposite mode.
  return (
    <div className="flex gap-2">
      <div className={cn(mode, "shrink-0 self-center")}>
        <div
          ref={ref}
          className="size-10 rounded-xl border border-border"
          style={{ background: `var(${token})` }}
        />
      </div>
      <div>
        <span className="block text-foreground">{primLabel}</span>
        <span className="text-muted-foreground tabular-nums">{hex || "…"}</span>
      </div>
    </div>
  )
}

function SemanticTokenTable() {
  return (
    <table className="w-full text-xsmall border-collapse">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="pb-2 pr-8 font-normal text-foreground">Token</th>
          <th className="pb-2 pr-8 font-normal text-foreground">Light</th>
          <th className="pb-2 font-normal text-foreground">Dark</th>
        </tr>
      </thead>
      <tbody>
        {SEMANTIC_TOKENS.map(r => (
          <tr key={r.token} className="border-b border-border">
            <td className="py-2 pr-8 text-foreground whitespace-nowrap">{r.alias ?? r.token}</td>
            <td className="py-2 pr-8">
              <TokenSwatch token={r.token} mode="light" primLabel={r.lPrim} />
            </td>
            <td className="py-2">
              <TokenSwatch token={r.token} mode="dark" primLabel={r.dPrim} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Dialogs kitchen sink ─────────────────────────────────────────────────────

// Kitchen sink shows BOTH a static visual preview (every variant at a
// glance) AND a live trigger (real component, real behavior). Both share
// the chrome class constants from `src/components/ui/dialog.tsx` —
// chrome changes flow to both automatically.
function DialogsKitchenSink() {
  return (
    <div className="flex flex-col gap-8">
      {/* ── Static previews — all variants visible without clicking ───── */}
      <div className="flex flex-col gap-3">
        <SubLabel>All variants (static preview — same chrome as the live Dialog)</SubLabel>
        <div className="flex flex-wrap gap-6 items-start">

          {/* 1. Confirm-destructive (manage-v2.tsx DeleteCard pattern) */}
          <DialogPreview>
            <DialogPreviewHeader>
              <DialogPreviewTitle>Delete Chase Visa?</DialogPreviewTitle>
              <DialogPreviewDescription>
                This will permanently remove this card from your account. This action cannot be undone.
              </DialogPreviewDescription>
            </DialogPreviewHeader>
            <DialogPreviewFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">Delete card</Button>
            </DialogPreviewFooter>
          </DialogPreview>

          {/* 2. Create Listing (shop-my-products AddProductDialog pattern) */}
          <DialogPreview className="sm:max-w-[600px]">
            <DialogPreviewHeader>
              <DialogPreviewTitle>Create Listing</DialogPreviewTitle>
              <DialogPreviewDescription>Choose what you want to sell.</DialogPreviewDescription>
            </DialogPreviewHeader>
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
            <DialogPreviewFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Create Listing</Button>
            </DialogPreviewFooter>
          </DialogPreview>
        </div>
      </div>

      {/* ── Live triggers — real Dialog with portal, focus trap, etc. ─── */}
      <div className="flex flex-col gap-3">
        <SubLabel>Trigger — open the real Dialog (portal, backdrop, focus trap)</SubLabel>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Open: Delete card
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Chase Visa?</DialogTitle>
                <DialogDescription>
                  This will permanently remove this card from your account. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button variant="destructive">Delete card</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Open: Create Listing
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Listing</DialogTitle>
                <DialogDescription>Choose what you want to sell.</DialogDescription>
              </DialogHeader>
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
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button>Create Listing</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Menu kitchen sink ─────────────────────────────────────────────────
// Live multi-select filters backed by <MultiSelect> so the buttons actually
// open, toggle options, show a count badge, and expose a clear-all row.
function MultiSelectKitchenSink() {
  const [status,       setStatus]       = useState<Set<string>>(new Set())
  const [type,         setType]         = useState<Set<string>>(new Set(["album", "single"]))
  const [artist,       setArtist]       = useState<Set<string>>(new Set(["miles"]))
  const [monetisation, setMonetisation] = useState<Set<string>>(new Set())

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <MultiSelect
        label="Status"
        selected={status}
        onChange={setStatus}
        options={[
          { value: "public",  label: "Public" },
          { value: "private", label: "Private" },
        ]}
      />
      <MultiSelect
        label="Type"
        selected={type}
        onChange={setType}
        options={[
          { value: "album",  label: "Album" },
          { value: "single", label: "Single" },
          { value: "ep",     label: "EP" },
        ]}
      />
      <MultiSelect
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
      <MultiSelect
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

// Curated picks for the Home content rows. Real wiring would pull
// these from "new releases", "editorial picks", and "trending artist"
// feeds — for now we hard-code six per row spanning the same label
// universe as the Library views (Blue Note / Impulse! / Strata-East
// / Justin Time / Evidence / contemporary jazz).
const HOME_NEW_ALBUMS = [
  { id: "h-na-1",  title: "Endlessness",                       artist: "Nala Sinephro",                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/b8/46/98b84638-476a-ea68-151f-e844017594de/5056614798067.png/600x600bb.jpg" },
  { id: "h-na-2",  title: "Promises",                          artist: "Floating Points",                cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/af/dc/6b/afdc6b88-b275-de4e-3098-63dff171dffb/680899009720.jpg/600x600bb.jpg" },
  { id: "h-na-3",  title: "Source",                            artist: "Nubya Garcia",                   cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/01/0b/96/010b9654-4059-150f-8650-38f94faa62cf/20CRGIM21278.rgb.jpg/600x600bb.jpg" },
  { id: "h-na-4",  title: "In These Times",                    artist: "Makaya McCraven",                cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e8/e0/90/e8e090fb-10ba-a0f8-c719-ce347b658bbc/075597908541.jpg/600x600bb.jpg" },
  { id: "h-na-5",  title: "Black Acid Soul",                   artist: "Lady Blackbird",                 cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d9/8f/37/d98f3727-0c84-108d-a74e-0bcbf43928c3/4050538709391.jpg/600x600bb.jpg" },
  { id: "h-na-6",  title: "Wisdom of Elders",                  artist: "Shabaka and the Ancestors",      cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/34/9c/a3/349ca34c-87b6-a0a3-874d-a9cb7209dbc3/5060180322892.jpg/600x600bb.jpg" },
  { id: "h-na-7",  title: "Space 1.8",                         artist: "Nala Sinephro",                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/e4/57/42/e45742d5-0ac5-a3a5-9840-a54b8648d182/0801061032432.png/600x600bb.jpg" },
  { id: "h-na-8",  title: "Black Focus",                       artist: "Yussef Kamaal",                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7a/65/c2/7a65c212-d5b8-2e3c-4d08-77bc4e4a65ac/3614970930488.jpg/600x600bb.jpg" },
  { id: "h-na-9",  title: "We Are Sent Here by History",       artist: "Shabaka and the Ancestors",      cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b0/90/1d/b0901d41-49bf-22b9-f7a2-a9e1c15e244b/20UMGIM01600.rgb.jpg/600x600bb.jpg" },
  { id: "h-na-10", title: "Trust in the Lifeforce of the Deep Mystery", artist: "The Comet Is Coming",   cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/3d/9d/36/3d9d36ec-d86c-98ee-e0ea-601fc6e32504/00602577388385.rgb.jpg/600x600bb.jpg" },
  { id: "h-na-11", title: "Black Radio",                       artist: "Robert Glasper",                 cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/cb/c7/1d/cbc71df4-e2b7-4ea4-7edb-563a9aaf7b31/00602537433919.rgb.jpg/600x600bb.jpg" },
  { id: "h-na-12", title: "Under Tangled Silence",             artist: "Djrum",                          cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4a/2d/6f/4a2d6f89-f204-8f91-9812-f9bd203e33b0/cover.jpg/600x600bb.jpg" },
]

// A few releases marked as already-purchased on the live home rails, so the
// "Owned" label shows up without buying first. Spread across both album
// rails — two priced-looking titles per rail.
const HOME_OWNED = new Set<string>([
  "Promises",          // New Albums
  "Black Acid Soul",   // New Albums
  "Maiden Voyage",     // Albums of the week
  "Glass Bead Game",   // Albums of the week
])

const HOME_WEEKLY_ALBUMS = [
  { id: "h-wa-1",  title: "Maiden Voyage",                     artist: "Herbie Hancock",                 cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg" },
  { id: "h-wa-2",  title: "A Love Supreme",                    artist: "John Coltrane",                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg" },
  { id: "h-wa-3",  title: "Speak No Evil",                     artist: "Wayne Shorter",                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg" },
  { id: "h-wa-4",  title: "Karma",                             artist: "Pharoah Sanders",                cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg" },
  { id: "h-wa-5",  title: "Journey in Satchidananda",          artist: "Alice Coltrane",                 cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/af/5c/40/af5c40a1-54b1-855d-3da2-f875efbd8372/06UMGIM04169.rgb.jpg/600x600bb.jpg" },
  { id: "h-wa-6",  title: "Winter in America",                 artist: "Gil Scott-Heron & Brian Jackson", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/83/48/94/mzi.olnzcoeq.jpg/600x600bb.jpg" },
  { id: "h-wa-7",  title: "Blue Train",                        artist: "John Coltrane",                  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg" },
  { id: "h-wa-8",  title: "Cool Struttin'",                    artist: "Sonny Clark",                    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg" },
  { id: "h-wa-9",  title: "Out to Lunch",                      artist: "Eric Dolphy",                    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg" },
  { id: "h-wa-10", title: "Empyrean Isles",                    artist: "Herbie Hancock",                 cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3b/30/51/3b305111-c28a-80ad-1f1d-6e89fb4fa2af/13ULAIM49306.rgb.jpg/600x600bb.jpg" },
  { id: "h-wa-11", title: "Glass Bead Game",                   artist: "Clifford Jordan",                cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/19/b3/86/19b386e1-550c-0ec4-868b-542cd02bc382/118212.jpg/600x600bb.jpg" },
  { id: "h-wa-12", title: "Musa: Ancestral Streams",           artist: "Stanley Cowell",                 cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d5/21/70/d5217051-3c92-7ec6-790b-770833a01727/118206.jpg/600x600bb.jpg" },
]

// 2×2 composite covers — reuse a small pool of real album art so
// playlists feel populated. Same labels as the album rows above.
const COMPOSITE_POOL = [
  "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/af/5c/40/af5c40a1-54b1-855d-3da2-f875efbd8372/06UMGIM04169.rgb.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/b8/46/98b84638-476a-ea68-151f-e844017594de/5056614798067.png/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e8/e0/90/e8e090fb-10ba-a0f8-c719-ce347b658bbc/075597908541.jpg/200x200bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d5/21/70/d5217051-3c92-7ec6-790b-770833a01727/118206.jpg/200x200bb.jpg",
]
const composite = (offset: number) => [0, 3, 5, 7].map(i => COMPOSITE_POOL[(offset + i) % COMPOSITE_POOL.length])

const HOME_WEEKLY_PLAYLISTS = [
  { id: "h-wp-1",  title: "Spiritual Jazz Mornings",       songCount: 42, owned: true,        covers: composite(0) },
  { id: "h-wp-2",  title: "Blue Note Essentials",          songCount: 64, owner: "Sarah K",   covers: composite(1) },
  { id: "h-wp-3",  title: "Late Night Subway",             songCount: 31, owner: "Otto K",    covers: composite(2) },
  { id: "h-wp-4",  title: "London Jazz Renaissance",       songCount: 48, owner: "Ari S",     covers: composite(3) },
  { id: "h-wp-5",  title: "Boogaloo Boulevard",            songCount: 45, owner: "Dante M",   covers: composite(4) },
  { id: "h-wp-6",  title: "Modal Jazz Meditations",        songCount: 51, owner: "Elena P",   covers: composite(5) },
  { id: "h-wp-7",  title: "Impulse! Spiritual Jazz",       songCount: 47, owned: true,        covers: composite(6) },
  { id: "h-wp-8",  title: "Coltrane Years on Impulse",     songCount: 52, owner: "Léa M",     covers: composite(7) },
  { id: "h-wp-9",  title: "Strata-East Deep Cuts",         songCount: 31, owner: "Ingrid H",  covers: composite(8) },
  { id: "h-wp-10", title: "Hard Bop Hustle",               songCount: 67, owner: "Niamh O",   covers: composite(9) },
  { id: "h-wp-11", title: "Smoky Ballads",                 songCount: 34, owned: true,        covers: composite(2) },
  { id: "h-wp-12", title: "Nubya & Friends",               songCount: 19, owner: "Caleb W",   covers: composite(4) },
]

// Artist portraits resolved from Wikipedia (REST page-summary API) by
// `scripts/fetch-wikipedia-artist-images.mjs`. Cases without a
// Wikipedia thumbnail (Nala Sinephro, Yussef Dayes) fall back to a
// deterministic pravatar placeholder so the rail still renders.
const HOME_WEEKLY_ARTISTS = [
  { id: "h-ar-1",  name: "John Coltrane",       image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/John_Coltrane_1963_cropped_ver2.jpg/500px-John_Coltrane_1963_cropped_ver2.jpg" },
  { id: "h-ar-2",  name: "Alice Coltrane",      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Alice_Coltrane_1972.jpg/500px-Alice_Coltrane_1972.jpg" },
  { id: "h-ar-3",  name: "Pharoah Sanders",     image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Pharoah_Sanders_photo.jpg/500px-Pharoah_Sanders_photo.jpg" },
  { id: "h-ar-4",  name: "Nubya Garcia",        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Nubya_Garcia_INNt%C3%B6ne_01.jpg/500px-Nubya_Garcia_INNt%C3%B6ne_01.jpg" },
  { id: "h-ar-5",  name: "Makaya McCraven",     image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Bobby_Broom_Trio_-_INNt%C3%B6ne_Jazzfestival_2013_Makaye_McCraven.jpg/500px-Bobby_Broom_Trio_-_INNt%C3%B6ne_Jazzfestival_2013_Makaye_McCraven.jpg" },
  { id: "h-ar-6",  name: "Nala Sinephro",       image: "https://i.pravatar.cc/400?u=nala" },
  { id: "h-ar-7",  name: "Floating Points",     image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Floating_Points_at_Coachella_2017_%28cropped%29.jpg/500px-Floating_Points_at_Coachella_2017_%28cropped%29.jpg" },
  { id: "h-ar-8",  name: "Shabaka Hutchings",   image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shabaka_Hutchings_Sons_of_Kemet_Oslo_Jazzfestival_2018_%28223102%29.jpg/500px-Shabaka_Hutchings_Sons_of_Kemet_Oslo_Jazzfestival_2018_%28223102%29.jpg" },
  { id: "h-ar-9",  name: "Yussef Dayes",        image: "https://i.pravatar.cc/400?u=yussef" },
  { id: "h-ar-10", name: "Robert Glasper",      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/RG_Trio_3.jpg/500px-RG_Trio_3.jpg" },
  { id: "h-ar-11", name: "Lady Blackbird",      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Lady_Blackbird_Paradiso_Amsterdam_26_maart_2022.jpg/500px-Lady_Blackbird_Paradiso_Amsterdam_26_maart_2022.jpg" },
  { id: "h-ar-12", name: "Theon Cross",         image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Theon_Cross_at_Ljubljana%2C_May_2015.jpg/500px-Theon_Cross_at_Ljubljana%2C_May_2015.jpg" },
]

// Register home-rail albums + playlists so their cards resolve to real
// synthesized detail pages. Runs once at module load.
registerAlbums(
  [...HOME_NEW_ALBUMS, ...HOME_WEEKLY_ALBUMS].map(a => ({
    id: a.id, title: a.title, cover: a.cover, artist: a.artist,
    year: albumMetaFor(a.title).year,
    streamPrice: albumMetaFor(a.title).streamPrice,
    downloadPrice: albumMetaFor(a.title).downloadPrice,
  })),
)
registerPlaylists(
  HOME_WEEKLY_PLAYLISTS.map(p => ({
    id: p.id, title: p.title, covers: p.covers,
    songCount: p.songCount, owner: p.owner, owned: p.owned,
  })),
)

function HomeView({ onNavigate }: { onNavigate: (view: string) => void }) {
  const logoSize = useViewportLogoSize()
  const library  = useUserLibrary()
  const { openAlbum, openPlaylist, openArtist } = useMediaNav()
  // Wrap an album catalog entry into a fully-propped AlbumCard via
  // the shared album-meta lookup. Same helper is reused in album /
  // playlist / artist detail rails so cards render consistently.
  const renderAlbum = (a: { id: string; title: string; artist: string; cover: string }) => {
    const meta  = albumMetaFor(a.title)
    const libId = libraryIdForTitle(a.title)
    const key   = slugify(a.title)
    // Seed a handful of "Owned" releases across the rails so the purchased
    // state is visible on the live home page even before the user buys.
    const owned = (libId ? library.isPurchased(libId) : false) || HOME_OWNED.has(a.title)
    return (
      <AlbumCard
        cover={a.cover}
        title={a.title}
        artist={a.artist}
        year={meta.year}
        streamPrice={meta.streamPrice}
        downloadPrice={meta.downloadPrice}
        purchased={owned}
        onTitleClick={() => openAlbum(key)}
        onPlay={() => openAlbum(key)}
      />
    )
  }
  return (
    <div className="pt-30 pb-64 max-w-[1480px] min-[1920px]:max-w-[1716px] mx-auto w-full px-page flex flex-col gap-6">
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

      {/* Discovery rails — four content rows below the call-to-action.
           The outer `@container` lets CardRail's grid step its column
           count off the row's own width, independent of viewport. */}
      <div className="@container mt-24 flex flex-col gap-8">
        <CardRail title="New Albums">
          {HOME_NEW_ALBUMS.map(a => (
            <li key={a.id}>{renderAlbum(a)}</li>
          ))}
        </CardRail>

        <CardRail title="Playlists of the week">
          {HOME_WEEKLY_PLAYLISTS.map(p => (
            <li key={p.id}>
              <PlaylistCard
                title={p.title}
                covers={p.covers}
                songCount={p.songCount}
                owner={p.owner}
                owned={p.owned}
                onTitleClick={() => openPlaylist(slugify(p.title))}
                onPlay={() => openPlaylist(slugify(p.title))}
              />
            </li>
          ))}
        </CardRail>

        <CardRail title="Artists of the week">
          {HOME_WEEKLY_ARTISTS.map(a => (
            <li key={a.id}><ArtistCard name={a.name} image={a.image} onClick={() => openArtist(slugify(a.name))} /></li>
          ))}
        </CardRail>

        <CardRail title="Albums of the week">
          {HOME_WEEKLY_ALBUMS.map(a => (
            <li key={a.id}>{renderAlbum(a)}</li>
          ))}
        </CardRail>
      </div>
    </div>
  )
}

// ─── Studio pages ─────────────────────────────────────────────────────────────

// Demo seed for the UserLibraryProvider — first 12 SAVED_ALBUMS ids
// are in the library; a04 + a14 + a18 are flagged as purchased so the
// "Purchased" badge has a few examples to ride on out of the box.
// a07 (A Love Supreme) is intentionally absent so the buy → purchase
// flow on the album detail page demonstrates the auto-add behavior.
const LIBRARY_SEED = {
  a01: { added: true, purchased: false },
  a02: { added: true, purchased: false },
  a03: { added: true, purchased: false },
  a04: { added: true, purchased: false },
  a05: { added: true, purchased: false },
  a06: { added: true, purchased: false },
  a08: { added: true, purchased: false },
  a09: { added: true, purchased: false },
  a10: { added: true, purchased: false },
  a11: { added: true, purchased: false },
  a12: { added: true, purchased: false },
  a14: { added: true, purchased: true, tier: "stream" as const },
  a18: { added: true, purchased: true, tier: "stream" as const },
}

// Seed for the non-album saved sets so the Artists / Playlists library
// grids open populated. Keyed by slug (same key the detail-page hearts
// use) so toggling a heart off on a detail page removes it from the grid.
const LIBRARY_SAVED_SEED = {
  artist:   Object.fromEntries(SAVED_ARTISTS.map(a => [slugify(a.name), true as const])),
  playlist: Object.fromEntries(SAVED_PLAYLISTS.map(p => [slugify(p.title), true as const])),
  song:     Object.fromEntries(SAVED_SONGS_SEED.map(s => [s.id, s])),
}

// Demo seed for the UserAccountProvider — pre-fills two of the
// A Love Supreme tracks so the "X plays left" affordance has
// something to show. Real wiring would persist these per-account.
const DEMO_PLAY_COUNTS = {
  // Track ids in album-detail-view's ALBUM constant.
  "1": 2,  // Acknowledgement — 2/3 used → "1 play left"
  "2": 3,  // Resolution — already capped → next press paywall
}

const STUDIO_TABS: Record<string, string[]> = {
  Pages:     ["Artists", "Label"],
  Music:     ["My Music", "Upload Music"],
  Analytics: [],
  Shop:      [],
  // Wallet is reachable from the avatar dropdown — kept in the routing
  // table so the `?page=Wallet` URL still works.
  Wallet:    ["Dashboard", "Transfer", "Manage"],
}

function toTabValue(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-")
}

function StudioView({ page, onOpenUpload }: { page: string; onOpenUpload?: () => void }) {
  if (page === "Music")    return <StudioMusicView onOpenUpload={onOpenUpload} />
  if (page === "Analytics") return <ReportView />
  if (page === "Shop")     return <ShopView />

  const tabs = STUDIO_TABS[page] ?? []

  return (
    <Tabs defaultValue={toTabValue(tabs[0])} className="flex flex-col h-full gap-0">

      {/* ── Header + tabs ──────────────────────────────────────────────── */}
      {/* On mobile the frosted MobileAppHeader already shows the page name,
           so the in-page <h1> is hidden to avoid a redundant double title;
           the tab strip stays. */}
      <div className="shrink-0 px-page pt-4 sm:pt-8 border-b border-border">
        <div className="hidden sm:flex items-start justify-between gap-6 mb-5">
          <h1 className="text-2xlarge font-medium tracking-tight text-balance">{page}</h1>
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

// Standalone ChipInput — pure showcase, prints committed values below.
function ChipInputDemo() {
  const [log, setLog] = useState<string[][]>([])
  return (
    <div className="flex flex-col gap-3">
      <ChipInput
        placeholder="Type names, comma to chip, Enter to commit…"
        onCommit={(values) => setLog((prev) => [values, ...prev].slice(0, 4))}
      />
      {log.length > 0 ? (
        <div className="flex flex-col gap-2">
          {log.map((batch, i) => (
            <div key={i} className="text-xsmall text-muted-foreground">
              Commit #{log.length - i}: <span className="text-foreground">{batch.join(", ")}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xsmall text-muted-foreground">Commits will print here.</p>
      )}
    </div>
  )
}

// Full pattern — committed chips above, ChipInput below. Mirrors how
// the upload flow's Main Artists & Additional Credits use it.
function ChipInputPatternDemo() {
  const [committed, setCommitted] = useState<string[]>(["Sun Ra"])
  return (
    <div className="flex flex-col gap-2">
      {committed.length > 0 && (
        <ChipGroup className="mb-1">
          {committed.map((name, i) => (
            <ChipDismiss
              key={`${name}-${i}`}
              onDismiss={() => setCommitted((prev) => prev.filter((_, j) => j !== i))}
            >
              {name}
            </ChipDismiss>
          ))}
        </ChipGroup>
      )}
      <ChipInput
        placeholder="Add a collaborator…"
        onCommit={(values) => setCommitted((prev) => [...prev, ...values])}
      />
      <p className="text-2xsmall text-muted-foreground">
        Separate names with a comma, then press <span className="font-medium text-muted-foreground">Enter</span> to add them.
      </p>
    </div>
  )
}


// TopProgressBar — interactive demo. Click to flip loading=true for
// 1.4s. The bar renders to the top edge of the viewport (not this
// section), so the user should look up.
function TopProgressBarDemo() {
  const [loading, setLoading] = useState(false)
  const trigger = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1400)
  }
  return (
    <div className="flex items-center gap-4">
      <TopProgressBar loading={loading} />
      <Button onClick={trigger} disabled={loading} variant="outline">
        {loading ? "Loading…" : "Trigger 1.4s load"}
      </Button>
      <span className="text-2xsmall text-muted-foreground">
        Watch the top edge of the window. Loads under 200ms stay invisible.
      </span>
    </div>
  )
}

function CoverPlayButtonDemo() {
  const [playing, setPlaying] = useState(false)
  const cover = "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/200x200bb.jpg"
  return (
    <CoverPlayButton
      src={cover}
      title="Space Is the Place"
      playing={playing}
      onToggle={() => setPlaying(p => !p)}
    />
  )
}

// Borderless list table — pattern used by Artist › Discography list
// view. Demo wires a small set of releases with hover + active-row
// states + sortable headers + kebab menu.
// Static `<PurchaseAlbumDialogPreview>` so the dialog body is
// always visible on the DS page (no click required). A trigger
// button below opens the real `<PurchaseAlbumDialog>` modal for
// live interaction. New-vs-existing-customer distinction sits
// INSIDE Square's universal form (saved-card detection +
// brand-detection on new cards + Apple Pay / Google Pay / PayPal
// express buttons all in one iframe) — the dialog only owns the
// shell.
function PurchaseDialogDemo() {
  const [open, setOpen] = useState(false)
  const album = {
    cover:  "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg",
    title:  "A Love Supreme",
    artist: "John Coltrane",
    year:   1965,
    format: "Album",
  }
  return (
    <div className="flex flex-col gap-4">
      <PurchaseAlbumDialogPreview
        album={album}
        streamPrice="$2.99"
        downloadPrice="$4.99"
      />
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open as modal
        </Button>
        <span className="text-xsmall text-muted-foreground">
          Real dialog (with portal + focus trap + processing / success steps).
        </span>
      </div>
      <PurchaseAlbumDialog
        open={open}
        onOpenChange={setOpen}
        album={album}
        streamPrice="$2.99"
        downloadPrice="$4.99"
      />
    </div>
  )
}

// Credits dialog demo — static preview of the body inline, plus
// triggers that open the real modal (via useCredits) for two different
// releases so the data variety is visible.
function CreditsDialogDemo() {
  const credits = useCredits()
  return (
    <div className="flex flex-col gap-4">
      <CreditsDialogPreview albumKey="a07" />
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" onClick={() => credits.open("a07")}>Open as modal</Button>
        <Button variant="outline" onClick={() => credits.open("out-to-lunch")}>Another release</Button>
        <span className="text-xsmall text-muted-foreground">
          Real dialog (portal + focus trap). Artist / album / performers navigate and dismiss it.
        </span>
      </div>
    </div>
  )
}

// Paywall demo — non-profit subscription prompt that fires when an
// anonymous user trips the 3-play cap. The static
// `SubscriptionPromptDialogPreview` renders inline so devs see the
// full dialog body without clicking. Buttons below open the real
// modal + a direct checkout hand-off.
function SubscriptionPromptDemo() {
  const [promptOpen, setPromptOpen]       = useState(false)
  const [checkoutOpen, setCheckoutOpen]   = useState(false)
  const [amount, setAmount]               = useState<string>("10")
  return (
    <div className="flex flex-col gap-4">
      <SubscriptionPromptDialogPreview />
      {/* Step 2 — the checkout, shown static below the paywall. Two
          variants side by side: the paid summary and the free-month
          variant (no amount / no payment, $0 today). */}
      <div className="flex flex-wrap items-start gap-4">
        <SubscriptionCheckoutDialogPreview className="flex-1 min-w-[320px]" />
        <SubscriptionCheckoutDialogPreview freeTrial className="flex-1 min-w-[320px]" />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" onClick={() => setPromptOpen(true)}>
          Open as modal
        </Button>
        <Button variant="outline" onClick={() => setCheckoutOpen(true)}>
          Open checkout directly
        </Button>
        <span className="text-xsmall text-muted-foreground">
          Real dialog (with portal + focus trap). Paywall hands its picked amount through to the checkout.
        </span>
      </div>
      <SubscriptionPromptDialog
        open={promptOpen}
        onOpenChange={setPromptOpen}
        onSubscribe={(a) => { setAmount(a); setCheckoutOpen(true) }}
      />
      <SubscriptionCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        initialAmount={amount}
      />
    </div>
  )
}

// Login demo — static preview + a button that opens the real modal.
function LoginDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col gap-4">
      <LoginDialogPreview />
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" onClick={() => setOpen(true)}>Open as modal</Button>
        <span className="text-xsmall text-muted-foreground">
          Real dialog (portal + focus trap). Bottom sheet on mobile, centered modal on desktop — straight from the base.
        </span>
      </div>
      <LoginDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

function ListTableDemo() {
  type R = { id: string; title: string; band: string; year: number; tracks: number; type: "album" | "single" | "ep"; cover: string }
  const rows: R[] = [
    { id: "lt1", title: "Space Is the Place",  band: "Sun Ra and his Arkestra",        year: 1973, tracks: 4, type: "album",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/200x200bb.jpg" },
    { id: "lt2", title: "Lanquidity",          band: "Sun Ra and his Arkestra",        year: 1978, tracks: 4, type: "album",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b3/2a/5f/b32a5f91-5551-1ac0-17c6-e6dd4dcc0292/4062548021820_3000.jpg/200x200bb.jpg" },
    { id: "lt3", title: "Door of the Cosmos",  band: "Sun Ra and his Arkestra",        year: 1979, tracks: 1, type: "single", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a7/f2/b9/a7f2b9d7-3cd0-c092-d667-59dd10e11b6c/4062548112283.png/200x200bb.jpg" },
    { id: "lt4", title: "Big John's Special",  band: "Sun Ra Arkestra",                year: 2024, tracks: 3, type: "ep",     cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/02/8e/1f/028e1fa4-9637-6097-2d74-e901087946ba/cover.jpg/200x200bb.jpg" },
  ]
  type SK = "year-desc" | "year-asc" | "title-az" | "title-za" | "tracks-desc" | "tracks-asc"
  const [sort, setSort] = useState<SK>("year-desc")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    if (sort === "year-desc")   return b.year - a.year
    if (sort === "year-asc")    return a.year - b.year
    if (sort === "tracks-desc") return b.tracks - a.tracks
    if (sort === "tracks-asc")  return a.tracks - b.tracks
    if (sort === "title-za")    return b.title.localeCompare(a.title)
    return a.title.localeCompare(b.title)
  }), [sort])

  const SortHeader = ({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc" | null; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="flex items-center gap-0.5 min-w-0 overflow-hidden cursor-pointer group/sort select-none">
      <span className={cn("text-xsmall font-normal truncate", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      {active
        ? (dir === "asc"
            ? <ArrowUp   className="size-3 shrink-0 text-foreground" />
            : <ArrowDown className="size-3 shrink-0 text-foreground" />)
        : <ArrowUpDown className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover/sort:opacity-50 transition-opacity" />}
    </button>
  )

  return (
    <table className="w-full table-fixed">
      <colgroup>
        <col style={{ width: 64 }} />
        <col />
        <col />
        <col style={{ width: 112 }} />
        <col style={{ width: 80 }} />
        <col style={{ width: 128 }} />
        <col style={{ width: 56 }} />
      </colgroup>
      <thead className="[&_tr]:border-b [&_tr]:border-border [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background">
        <TableRow>
          <TableHead resizable={false} className="px-2" />
          <TableHead>
            <SortHeader
              label="Title"
              active={sort === "title-az" || sort === "title-za"}
              dir={sort === "title-az" ? "asc" : sort === "title-za" ? "desc" : null}
              onClick={() => setSort(sort === "title-az" ? "title-za" : "title-az")}
            />
          </TableHead>
          <TableHead>Band</TableHead>
          <TableHead resizable={false}>
            <SortHeader
              label="Recorded"
              active={sort === "year-desc" || sort === "year-asc"}
              dir={sort === "year-desc" ? "desc" : sort === "year-asc" ? "asc" : null}
              onClick={() => setSort(sort === "year-desc" ? "year-asc" : "year-desc")}
            />
          </TableHead>
          <TableHead resizable={false}>
            <SortHeader
              label="Tracks"
              active={sort === "tracks-desc" || sort === "tracks-asc"}
              dir={sort === "tracks-desc" ? "desc" : sort === "tracks-asc" ? "asc" : null}
              onClick={() => setSort(sort === "tracks-desc" ? "tracks-asc" : "tracks-desc")}
            />
          </TableHead>
          <TableHead resizable={false} className="text-right">Type</TableHead>
          <TableHead resizable={false} className="px-2" />
        </TableRow>
      </thead>
      <TableBody>
        {sorted.map(r => {
          const playing = playingId === r.id
          return (
            <TableRow
              key={r.id}
              className={cn(
                "group/row border-b-0 hover:bg-transparent",
                "[&>td]:group-hover/row:bg-muted [&>td:first-child]:group-hover/row:rounded-l-md [&>td:last-child]:group-hover/row:rounded-r-md",
                "[&_td]:py-1.5",
                playing && "[&>td]:bg-muted [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md",
              )}
            >
              <TableCell className="px-2">
                <CoverPlayButton
                  src={r.cover}
                  title={r.title}
                  playing={playing}
                  onToggle={() => setPlayingId(prev => prev === r.id ? null : r.id)}
                  hoverGroup="row"
                />
              </TableCell>
              <TableCell className="text-foreground whitespace-nowrap truncate">
                <button type="button" className="text-left hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] outline-none cursor-pointer">{r.title}</button>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                <button type="button" className="text-left hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] outline-none cursor-pointer">{r.band}</button>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">{r.year}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">{r.tracks}</TableCell>
              <TableCell className="text-right">
                <ContentTypeBadge type={r.type} />
              </TableCell>
              <TableCell className="px-2">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6}>
                    <AlbumCardMenuItems />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </table>
  )
}

function SingleSelectDemo() {
  const [v, setV] = useState<"recent" | "popular" | "az" | "za">("recent")
  const options = [
    { value: "recent",  label: "Most recent" },
    { value: "popular", label: "Most popular" },
    { value: "az",      label: "A → Z" },
    { value: "za",      label: "Z → A" },
  ] as const
  return (
    <div className="flex flex-wrap gap-6 items-center">
      {/* Default — current-option label, ArrowUpDown icon (sort use). */}
      <SingleSelect value={v} onChange={setV} options={[...options]} />
      {/* Fixed label — useful when the trigger doubles as a category
          ("Sort", "Density") and the menu carries the qualifier. */}
      <SingleSelect value={v} onChange={setV} options={[...options]} label="Sort" />
      {/* No icon — generic single-select trigger. */}
      <SingleSelect value={v} onChange={setV} options={[...options]} icon={null} />
    </div>
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

function ChipCountDemo() {
  // size="md" + count={n} renders the bigger header-style filter chip
  // (Discography, library filter bars) with a pill count badge.
  // Single-select example: clicking another chip swaps the selection.
  const kinds = [
    { id: "all",       label: "All Releases",   count: 32 },
    { id: "album",     label: "Albums",         count: 10 },
    { id: "single-ep", label: "Singles & EPs",  count: 8 },
    { id: "ep",        label: "EPs",            count: 10 },
    { id: "remix",     label: "Remixes",        count: 2 },
    { id: "secondary", label: "Secondary Role", count: 2 },
  ] as const
  const [active, setActive] = useState<typeof kinds[number]["id"]>("all")
  return (
    <ChipGroup>
      {kinds.map(k => (
        <Chip
          key={k.id}
          size="md"
          variant="ghost"
          count={k.count}
          selected={active === k.id}
          onClick={() => setActive(k.id)}
        >
          {k.label}
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
    <div className="flex flex-col gap-8">
      {/* Static gallery — every variant at a glance */}
      <div className="flex flex-col gap-3">
        <SubLabel>All variants (real ToastPreview — shares chrome with the live toast)</SubLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ToastPreview
            title="Blue Afternoon added to playlist"
          />
          <ToastPreview
            type="success"
            title="Track saved!"
            description="Your changes have been saved successfully."
          />
          <ToastPreview
            type="error"
            title="Upload failed"
            description="File format not supported. Please upload an MP3 or WAV file."
          />
          <ToastPreview
            type="warning"
            title="Heads up"
            description="Your storage is almost full. Upgrade your plan to continue uploading."
          />
          <ToastPreview
            type="info"
            title="New release alert"
            description="River Lotus just dropped a new album."
          />
          <ToastPreview
            type="loading"
            title="Processing track…"
            description="Blue Afternoon is being transcoded. This may take a minute."
          />
        </div>
      </div>

      {/* Live triggers — fire the real portal toast */}
      <div className="flex flex-col gap-3">
        <SubLabel>Trigger — live portal toast</SubLabel>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary"   onClick={() => add({ title: "Blue Afternoon added to playlist" })}>Default</Button>
          <Button                       onClick={() => add({ title: "Track saved!", description: "Your changes have been saved successfully.", type: "success" })}>Success</Button>
          <Button variant="destructive" onClick={() => add({ title: "Upload failed", description: "File format not supported. Please upload an MP3 or WAV file.", type: "error" })}>Error</Button>
          <Button variant="outline"     onClick={() => add({ title: "Heads up", description: "Your storage is almost full. Upgrade your plan to continue uploading.", type: "warning" })}>Warning</Button>
          <Button variant="outline"     onClick={() => add({ title: "New release alert", description: "River Lotus just dropped a new album.", type: "info" })}>Info</Button>
          <Button variant="outline"     onClick={() => add({ title: "Processing track…", description: "Blue Afternoon is being transcoded. This may take a minute.", type: "loading" })}>Loading</Button>
        </div>
      </div>
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
export function ExploreView({ showHero = true, showQuickNav = true }: { showHero?: boolean; showQuickNav?: boolean } = {}) {
  const [inputSelectCurrency, setInputSelectCurrency] = useState("USD")
  const [inputSelectTld, setInputSelectTld] = useState(".com")
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState([62])
  const [progress, setProgress] = useState([38])

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {showHero && (
      <div className="bg-muted border-b border-border pt-24 pb-[3.75rem]">
        <div className="max-w-[1480px] min-[1920px]:max-w-[1716px] mx-auto px-page flex flex-col gap-3">
          <h1 className="text-5xl font-medium leading-none tracking-[-0.025em]">The muza design system</h1>
          <p className="text-small text-muted-foreground">
            {LAST_GIT_PUSH && (
              <>
                Last pushed to git:{" "}
                <span className="text-foreground tabular-nums">{formatStatusDate(LAST_GIT_PUSH)}</span>.{" "}
              </>
            )}
            Sections with a <span className="text-foreground">New</span> or <span className="text-foreground">Updated</span> badge landed in this release.
          </p>
        </div>
      </div>
      )}

    {/* `@container` is on the inner content wrapper (after the
         page's max-width + padding) so it matches the @container
         scope used by the Library views — same rules, same query
         container width, identical card sizing at any viewport. */}
    <div className="@container max-w-[1480px] min-[1920px]:max-w-[1716px] mx-auto w-full px-page py-10 pb-32">

      {/* Naming convention explainer — visible to readers (not a code comment) */}
      <p className="text-base text-muted-foreground max-w-2xl mb-4 text-pretty">
        Section labels mirror the underlying base-ui primitive name where one exists
        (Button, Dialog, NumberField, …). Pure visual patterns that have no base-ui
        primitive (Badges, Chips, Alerts, Skeleton, Table, Pagination) and
        third-party ones (Command, OTP Input) keep their descriptive name.
      </p>

      {/* Quick nav — hidden when a parent shell (e.g. the dedicated
           `/design-system` route) already supplies its own sidebar
           navigation. */}
      {showQuickNav && (
      <nav className="flex flex-wrap gap-1.5 mb-12">
        {[
          // Section labels mirror the underlying base-ui primitive name where
          // applicable (Button, Dialog, NumberField, AlertDialog, …) so the
          // showcase doubles as a quick lookup of which base-ui component
          // backs each pattern. Custom (non-base-ui) patterns keep their
          // descriptive name (Badges, Chips, etc.).
          "Colors","Typography","Responsive","Button","Toggle","ToggleGroup","Toolbar","Badge","Status Badge","Order Status Badge","Chips",
          "Input","NumberField","Select","Filter Menu","Combobox","Menu","Sort Button","NavigationMenu",
          "DatePicker","Checkbox","Radio Card","Switch","Slider","Meter","Progress","Separator",
          "Avatar","Tabs","Tooltip","ScrollArea","Collapsible","Accordion",
          "Album Card","Artist Card","Playlist Card","Song List Item","Product Card","Page Section","Items","Alerts","AlertDialog","Dialog","Paywall","Drawer","Toast","Skeleton",
          "Popover","Table","List Table","Pagination","Command","OTP Input","Form",
          "Player Bar","Player Overlay",
        ].map((s) => {
          // Lowercase + whitespace-to-dashes → matches each Section id.
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
      )}

      {/* ══ RESPONSIVE & POINTER ══ */}
      <Section id="responsive" title="Responsive & Pointer">
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          The shared foundations for how Muza components adapt to <span className="text-foreground">viewport / container width</span> and <span className="text-foreground">pointer type</span> (mouse vs touch). Each component documents its own specific behaviour in its own section — this is just the common ground they all build on.
        </p>

        {/* The responsive ladder, visualised — three layout tiers + the
             container column steps. Source of truth: app.css. */}
        <p className="text-base text-muted-foreground mb-3 max-w-2xl">
          <span className="text-foreground font-medium">The responsive ladder</span> — the page steps through three layouts as it narrows; the nav chrome, page gutter and card columns all change together:
        </p>
        <div className="mb-6">
          <ResponsiveDiagram />
        </div>

        <ul className="text-base text-muted-foreground flex flex-col gap-2 mb-2 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Hover is pointer-only.</span> Every
            {" "}<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">hover:</code> /
            {" "}<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">group-hover:</code>
            {" "}utility is auto-wrapped in <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">@media (hover: hover)</code> (Tailwind v4 default), so hover states never fire on touch — and there's no sticky-hover after a tap.
          </li>
          <li>
            <span className="text-foreground">Cosmetic device gating.</span> To
            merely show/hide a control by pointer we use
            {" "}<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">[@media(hover:none)]:!hidden</code> (hide on touch) /
            {" "}<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">[@media(hover:hover)]:!hidden</code> (hide on pointer).
            The <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">!</code> is required — Tailwind v4 sorts the
            {" "}<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">pointer-*</code> / hover variant rules before base
            {" "}<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">flex</code>/<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">hidden</code>, so without it the base wins and the gate is a silent no-op.
          </li>
          <li>
            <span className="text-foreground">Swap components by viewport, not hover.</span>{" "}
            When a phone needs a <span className="text-foreground">different component</span> (dropdown ⇄ bottom sheet, inline toggle ⇄ full-width header toggle), gate on
            {" "}<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">useIsMobile()</code> (&lt; 768px) — e.g.{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">{`if (isMobile) return <Sheet>… ; return <DropdownMenu>…`}</code>.
            Don't use <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">hover:</code> for this: the headless preview reports{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">hover: hover</code> at phone width (a hover-gated sheet never shows there) and hybrid touch-laptops do too. Breakpoint hooks:{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">useFooterNav</code> (608 — sidebar⇄tab bar, Topbar⇄MobileAppHeader),{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">useIsMobile</code> (768).
          </li>
          <li>
            <span className="text-foreground">Mobile surfaces escalate to sheets.</span>{" "}
            <span className="text-foreground">Every</span> dialog (and alert dialog) becomes a bottom sheet — it's the <span className="text-foreground">base default</span> of <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">DialogContent</code>, not a per-dialog opt-in; tall ones grow to{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">max-h-[92vh]</code> with a <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">min-h-0</code> scroll body;
            simple "…" lists use the auto-sheet <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">DropdownMenu</code>; rich "…" actions use the advanced{" "}
            <a href="/?page=DesignSystem#detail-more-button" className="text-primary-text hover:underline underline-offset-2">bottom-sheet menu</a>.
            Panels that open under the sticky header (search suggestions) are <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">absolute</code> (out of flow) so they overlay rather than push content.
          </li>
          <li>
            <span className="text-foreground">Touch gestures.</span> Cards use
            {" "}<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">useLongPress</code> (tap = primary action, long-press = bottom sheet). Rails use <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">touch-pan-x</code> + <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">overscroll-x-contain</code> + scroll-snap.
          </li>
          <li>
            <span className="text-foreground">Shared column steps.</span> Library
            grids, Card Rail and Top Songs step columns at the same container widths —{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">304→2</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">464→3</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">692→4</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">928→5</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">1164→6</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">1500→7</code>.
            {" "}These are column-<span className="text-foreground">count</span> steps. The mobile↔desktop boundary for <span className="text-foreground">behaviours</span> (rail swipe-peek, MediaHeader stacking) is <span className="text-foreground">560px</span> container — and the sidebar auto-collapses below <span className="text-foreground">~1069px</span> viewport so that boundary lands at the same point across the app.
          </li>
        </ul>
        <p className="text-small text-muted-foreground max-w-2xl">
          Per-component specifics live in each component's section (e.g. <a href="/?page=DesignSystem#card-rail" className="text-primary-text hover:underline underline-offset-2">Card Rail</a>, <a href="/?page=DesignSystem#song-list-item" className="text-primary-text hover:underline underline-offset-2">Song List Item</a>).
        </p>
      </Section>

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

        {/* Semantic token table — swatches + hex values are read LIVE from
             the stylesheet (via .light / .dark scope wrappers + computed
             style), so changing a token in app.css automatically updates
             this table. Only the primitive-name labels are hand-mapped;
             keep them in sync with the var(...) assignments in app.css. */}
        <SemanticTokenTable />
      </Section>

      {/* ══ TYPOGRAPHY ══ */}
      <Section id="typography" title="Typography — Founders Grotesk">
        {/* ── PRIMITIVES ─────────────────────────────────────────────────
             Raw pixel values from Figma. Components should NOT reference
             these directly — use the semantic alias table below when one
             exists for the size you need. */}
        <p className="text-small font-medium text-muted-foreground mb-1">Primitives</p>
        <p className="text-xsmall font-normal text-muted-foreground mb-5">
          Raw font-size values. Used directly only when no semantic alias fits (large display headings).
          Display sizes <code className="text-xsmall">text-2xl</code>–<code className="text-xsmall">text-9xl</code> are <span className="text-foreground">fluid</span> — they clamp from a mobile floor up to the listed max across a 360→1280px viewport.
        </p>
        <div className="flex gap-6 pb-2 border-b border-border">
          <span className="w-32 shrink-0 text-xsmall text-muted-foreground">Primitive</span>
          <span className="w-28 shrink-0 text-xsmall text-muted-foreground">Value (px)</span>
          <span className="flex-1 text-xsmall text-muted-foreground">Example</span>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {[
            { token: "text-9xl",  px: "84–200" },
            { token: "text-8xl",  px: "72–160" },
            { token: "text-7xl",  px: "62–128" },
            { token: "text-6xl",  px: "52–96" },
            { token: "text-5xl",  px: "44–72" },
            { token: "text-4xl",  px: "38–60" },
            { token: "text-3xl",  px: "34–48" },
            { token: "text-2xl",  px: "32–36" },
            { token: "text-xl",   px: 30 },
            { token: "text-lg",   px: 24 },
            { token: "text-base", px: 21 },
            { token: "text-sm",   px: 19 },
            { token: "text-xs",   px: 17 },
            { token: "text-xxs",  px: 15 },
          ].map(({ token, px }) => (
            <div key={token} className="flex items-baseline gap-6 py-4">
              <span className="w-32 shrink-0 text-small font-normal">{token}</span>
              <span className="w-28 shrink-0 text-xsmall text-muted-foreground tabular-nums">{px}px</span>
              <div className="flex-1 min-w-0">
                <p className={`${token} font-normal leading-none truncate`}>Discover Music</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEMANTIC ALIASES ───────────────────────────────────────────
             These are what product code should use by default. Each alias
             is a `var(--text-*)` reference in app.css — never a raw px. */}
        <p className="text-small font-medium text-muted-foreground mt-10 mb-1">Semantic aliases</p>
        <p className="text-xsmall font-normal text-muted-foreground mb-5">
          Default choice in product code. Each alias resolves to a primitive via <code className="text-xsmall">var()</code> — never a hardcoded px.
        </p>
        <div className="flex gap-6 pb-2 border-b border-border">
          <span className="w-32 shrink-0 text-xsmall text-muted-foreground">Alias</span>
          <span className="w-32 shrink-0 text-xsmall text-muted-foreground">→ Primitive</span>
          <span className="w-28 shrink-0 text-xsmall text-muted-foreground">Resolved</span>
          <span className="flex-1 text-xsmall text-muted-foreground">Example</span>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {[
            { alias: "text-4xlarge", primitive: "text-4xl",  px: "38–60", weight: "font-medium",   sample: "Discover Music" },
            { alias: "text-3xlarge", primitive: "text-3xl",  px: "34–48", weight: "font-medium",   sample: "Featured Releases" },
            { alias: "text-2xlarge", primitive: "text-2xl",  px: "32–36", weight: "font-medium",   sample: "Top Playlists" },
            { alias: "text-xlarge",  primitive: "text-xl",   px: 30, weight: "font-medium",   sample: "Album of the Week" },
            { alias: "text-large",   primitive: "text-lg",   px: 24, weight: "font-medium",   sample: "Dialog titles, lead paragraphs." },
            { alias: "text-base",    primitive: "text-base", px: 21, weight: "font-normal",   sample: "Card-rail titles, lead paragraphs.", note: "this 21px step's semantic name equals its token name — use text-base (it's a sanctioned semantic token)." },
            { alias: "text-small",   primitive: "text-sm",   px: 19, weight: "font-normal",   sample: "Descriptions, body text, song-list rows." },
            { alias: "text-xsmall",  primitive: "text-xs",   px: 17, weight: "font-normal",   sample: "Media-card title + meta, table rows, helper text." },
            { alias: "text-2xsmall", primitive: "text-xxs",  px: 15, weight: "font-normal",   sample: "Badges, chips, captions, meta." },
          ].map(({ alias, primitive, px, weight, sample, note }) => (
            <div key={alias} className="flex items-baseline gap-6 py-4">
              <span className="w-32 shrink-0 text-small font-normal">{alias}</span>
              <span className="w-32 shrink-0 text-xsmall text-muted-foreground">{primitive}</span>
              <span className="w-28 shrink-0 text-xsmall text-muted-foreground tabular-nums">{px}px</span>
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
      <Section id="button" title="Button">
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

          // Local alias — the brand `Spinner` at sm size (16px),
          // inheriting text colour from its parent button so every
          // variant gets the right contrast automatically.
          const Spin = () => <Spinner size="sm" />


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
      {/* ══ TOGGLE ══ */}
      <Section id="toggle" title="Toggle">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Toggle defaultPressed>Pressed</Toggle>
            <Toggle>Unpressed</Toggle>
            <Toggle disabled>Disabled</Toggle>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Toggle size="sm">Small</Toggle>
            <Toggle size="default" defaultPressed>Default</Toggle>
            <Toggle size="lg" defaultPressed>Large</Toggle>
          </div>
          <p className="text-xsmall text-muted-foreground">
            Standalone Toggle metrics mirror Button (sm/default/lg).
            When nested in a ToggleGroup, sizing is inherited from the group.
          </p>
        </div>
      </Section>

      {/* ══ TOGGLE GROUP ══ */}
      <Section id="togglegroup" title="ToggleGroup"
        usage={[
          { label: "Topbar theme switcher",                href: "/" },
          { label: "Artist › Discography grid/list toggle", href: "/?page=Artist" },
        ]}>
        <div className="flex flex-col gap-6 max-w-md">
          <div>
            <SubLabel>Single-select — view modes</SubLabel>
            <ToggleGroup defaultValue={["grid"]}>
              <Toggle value="list">List</Toggle>
              <Toggle value="grid">Grid</Toggle>
              <Toggle value="compact">Compact</Toggle>
            </ToggleGroup>
          </div>
          <div>
            <SubLabel>Multi-select — formatting</SubLabel>
            <ToggleGroup multiple defaultValue={["bold"]}>
              <Toggle value="bold" className="aspect-square px-0 font-semibold">B</Toggle>
              <Toggle value="italic" className="aspect-square px-0 italic">I</Toggle>
              <Toggle value="underline" className="aspect-square px-0 underline">U</Toggle>
            </ToggleGroup>
          </div>
          <div>
            <SubLabel>Icon-only — same pattern as the topbar's theme picker</SubLabel>
            <ToggleGroup defaultValue={["light"]}>
              <Toggle value="light" className="aspect-square px-0" aria-label="Light"><Sun className="size-[14px]" /></Toggle>
              <Toggle value="dark"  className="aspect-square px-0" aria-label="Dark"><Moon className="size-[14px]" /></Toggle>
            </ToggleGroup>
          </div>
          <div>
            <SubLabel>Larger sizes</SubLabel>
            <div className="flex items-center gap-3">
              <ToggleGroup size="default" defaultValue={["grid"]}>
                <Toggle value="list">List</Toggle>
                <Toggle value="grid">Grid</Toggle>
                <Toggle value="compact">Compact</Toggle>
              </ToggleGroup>
              <ToggleGroup size="lg" defaultValue={["grid"]}>
                <Toggle value="list">List</Toggle>
                <Toggle value="grid">Grid</Toggle>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ TOOLBAR ══ */}
      <Section id="toolbar" title="Toolbar">
        <Toolbar>
          <ToolbarGroup>
            <ToolbarButton>Bold</ToolbarButton>
            <ToolbarButton>Italic</ToolbarButton>
            <ToolbarButton>Underline</ToolbarButton>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <ToolbarButton>Link</ToolbarButton>
            <ToolbarButton>Code</ToolbarButton>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarButton>Settings</ToolbarButton>
        </Toolbar>
        <p className="text-xsmall text-muted-foreground mt-3">
          Roving focus + arrow-key navigation between buttons.
        </p>
      </Section>

      {/* ══ BADGE (base + content type) ══ */}
      <Section id="badge" title="Badge"
        usage={[
          { label: "Studio › Music type column", href: "/?page=Music" },
          { label: "Artist › Discography type",  href: "/?page=Artist" },
        ]}>
        <div className="flex flex-col gap-5">
          <div>
            <SubLabel>Base variants — design system primitives</SubLabel>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>
          <div>
            <SubLabel>Content type — always secondary fill + icon</SubLabel>
            <div className="flex flex-wrap gap-2 items-center">
              <ContentTypeBadge type="song" />
              <ContentTypeBadge type="album" />
              <ContentTypeBadge type="single" />
              <ContentTypeBadge type="ep" />
              <ContentTypeBadge type="artist" />
              <ContentTypeBadge type="playlist" />
              <ContentTypeBadge type="label" />
            </div>
          </div>
        </div>
      </Section>

      {/* ══ STATUS BADGE (privacy) ══ */}
      <Section id="status-badge" title="Status Badge"
        usage={[
          { label: "Studio › Music visibility column", href: "/?page=Music" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Track / release visibility. Self-contained dropdown — click to toggle
          public / private in place. Pass <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">onStatusChange</code> to be notified.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <StatusBadgeDemo />
        </div>
      </Section>

      {/* ══ ORDER STATUS BADGE (shop) ══ */}
      <Section id="order-status-badge" title="Order Status Badge" phase={2}
        usage={[
          { label: "Shop › Orders → order detail status", href: "/?page=Shop&shop-tab=orders" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Shop order lifecycle. Colored per status; read-only by default, or pass
          an <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">onStatusChange</code> handler to make it a dropdown of allowed forward transitions.
        </p>
        <div className="flex flex-col gap-5">
          <div>
            <SubLabel>All statuses — read-only</SubLabel>
            <div className="flex flex-wrap gap-2 items-center">
              <OrderStatusBadge status="payment_failed" />
              <OrderStatusBadge status="new" />
              <OrderStatusBadge status="shipped" />
              <OrderStatusBadge status="delivered" />
              <OrderStatusBadge status="refunded" />
              <OrderStatusBadge status="cancelled" />
            </div>
          </div>
          <div>
            <SubLabel>Interactive — dropdown of allowed transitions</SubLabel>
            <div className="flex flex-wrap gap-2 items-center">
              <OrderStatusBadge status="new" onStatusChange={() => {}} />
              <OrderStatusBadge status="shipped" onStatusChange={() => {}} />
              <OrderStatusBadge status="delivered" onStatusChange={() => {}} />
            </div>
          </div>
        </div>
      </Section>

      {/* ══ PURCHASED BADGE ══ */}
      <Section id="purchased-badge" title="Purchased Badge"
        usage={[
          { label: "Album card pricing row", href: "/?page=Albums" },
          { label: "Media Header meta line", href: "/?page=Album" },
        ]}>
        <p className="text-base text-muted-foreground mb-6 max-w-2xl">
          Inline "Owned" marker — plain <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">CircleCheckBig</code> glyph + label, foreground color, no pill chrome. Sits alongside body text as quiet ownership info. Used everywhere an owned album appears.
        </p>

        <SubLabel>Default</SubLabel>
        <div className="flex items-center gap-4 mb-10">
          <PurchasedBadge />
          <span className="text-xsmall text-muted-foreground">As rendered in MediaHeader meta line.</span>
        </div>

        <SubLabel>Smaller — fits inside an Album Card row</SubLabel>
        <div className="flex items-center gap-4">
          <PurchasedBadge className="text-2xsmall [&_svg]:size-3" />
          <span className="text-xsmall text-muted-foreground">As rendered in AlbumCard's pricing row. Pass any text-size class to scale.</span>
        </div>
      </Section>

      {/* ══ CHIPS ══ */}
      <Section id="chips" title="Chips"
        usage={[{ label: "Shop › Products → Create listing (Release Type + artist chips)", href: "/?page=Shop&shop-tab=products" }]}>
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
          <div>
            <SubLabel>
              Filter chips — ghost + count badge
              <Badge variant="outline" className="ml-2">Not used yet</Badge>
            </SubLabel>
            <p className="text-xsmall text-muted-foreground mb-3 max-w-2xl">
              First built for the Discography toolbar; replaced with a
              MultiSelect dropdown when the kind list grew past five
              entries. Kept here for the next surface that needs an
              inline single-select pill bar.
            </p>
            <ChipCountDemo />
          </div>
        </div>
      </Section>

      {/* ══ INPUT ══ */}
      <Section id="input" title="Input">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="flex flex-col gap-1.5 min-w-[260px]">
            <Label htmlFor="artist">Default</Label>
            <Input
              id="artist"
              placeholder="e.g. Kendrick Lamar"
              hint="Your public display name on Muza."
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[260px]">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@muza.com"
              defaultValue="not-an-email"
              aria-invalid="true"
              hint="Enter a valid email address."
              hintTone="error"
            />
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
            <Textarea
              id="bio"
              placeholder="Tell listeners about yourself…"
              rows={3}
              hint="Max 280 characters."
            />
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

      {/* ══ CHIP INPUT ══ */}
      <Section id="chip-input" title="Chip Input"
        usage={[
          { label: "Upload music → Main Artist(s)",     href: "/?page=Music" },
          { label: "Upload music → Additional credits", href: "/?page=Music" },
        ]}>
        <p className="text-base text-muted-foreground mb-6 max-w-2xl">
          Chip-aware text input. Typing a comma turns the preceding text into a pending chip inside the input; pressing <span className="font-medium text-muted-foreground">Enter</span> promotes every pending chip (plus any trailing text) to the host's committed list. Backspace on an empty input pops the last chip; pasting comma-separated text creates multiple chips at once.
        </p>

        <SubLabel>Standalone</SubLabel>
        <div className="max-w-xl mb-10">
          <ChipInputDemo />
        </div>

        <SubLabel>Pattern — chips above, ChipInput below</SubLabel>
        <div className="max-w-xl">
          <ChipInputPatternDemo />
        </div>
      </Section>

      {/* ══ QTY STEPPER ══ */}
      <Section id="numberfield" title="NumberField">
        <div className="flex flex-col gap-6 max-w-md">
          <div className="flex flex-col gap-2">
            <SubLabel>Default (h-10) — pairs with Input / SelectTrigger</SubLabel>
            <div className="flex items-center gap-3">
              <QtyStepperDemo />
              <QtyStepperDemo initial={1} />
              <QtyStepperDemo initial={5} max={5} />
              <QtyStepper value={2} onChange={() => {}} disabled />
            </div>
            <p className="text-xsmall text-muted-foreground">
              Default size aligns with Input height. Auto-disables at min/max boundaries.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <SubLabel>Small (h-8) — for compact rows / sm SelectTrigger</SubLabel>
            <div className="flex items-center gap-3">
              <QtyStepperDemo size="sm" />
              <QtyStepperDemo size="sm" initial={1} />
              <QtyStepperDemo size="sm" initial={9} min={0} max={9} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SubLabel>In a row with Input + Button</SubLabel>
            <div className="flex items-center gap-2">
              <Input placeholder="Tracking number" className="flex-1" />
              <QtyStepperDemo initial={3} />
              <Button variant="outline">Apply</Button>
            </div>
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

      {/* ══ MULTI SELECT ══
           base-ui `Menu` with left-checkbox items + pill trigger,
           count badge, and a clear-all row. */}
      <Section id="multi-select" title="MultiSelect"
        usage={[
          { label: "Studio › Music filters",   href: "/?page=Music" },
          { label: "Artist › Discography",     href: "/?page=Artist" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Dropdown button with left-side checkboxes. Ticking an option
          adds it to the selection, the menu stays open while you
          toggle, and a count badge in the trigger reflects how many
          are currently active. Pairs with <code className="text-xsmall font-normal font-sans px-1 mx-0.5 rounded-sm bg-muted">SingleSelect</code> (right-side ✓).
          <br /><br />
          <strong className="font-medium text-muted-foreground">Mainly used for:</strong> filtering
          a list/grid down to a subset (Studio › Music's Status / Type
          / Artist / Label / Monetisation filters, Artist Discography's
          release-kind filter). Searchable when the option list is
          long; carries a "Clear all" row at the bottom.
        </p>
        <MultiSelectKitchenSink />
      </Section>

      {/* ══ PICKER ══ */}
      <Section id="single-select" title="SingleSelect"
        usage={[{ label: "Artist › Discography (sort)", href: "/?page=Artist" }]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Dropdown button that shows the current option with a
          right-side ✓ — picking another option replaces it (only one
          value at a time). Pairs with <code className="text-xsmall font-normal font-sans px-1 mx-0.5 rounded-sm bg-muted">MultiSelect</code> (left-side checkboxes).
          <br /><br />
          <strong className="font-medium text-muted-foreground">Mainly used for:</strong> sort
          (ArrowUpDown icon by default — Discography "Recording date /
          Title / Tracks"). Also fits any other "pick one of N"
          trigger sitting in a toolbar: view density, layout mode,
          card size, etc. Distinct from the form-field <code className="text-xsmall font-normal font-sans px-1 mx-0.5 rounded-sm bg-muted">Select</code> (which lives inside forms).
        </p>
        <SingleSelectDemo />
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

          {/* Filterable long-list configuration with a leading
               item icon — same pattern Shop › Settings › Shipping
               zones uses (each region prefixed with a MapPin). Pass
               `items` + a function-child renderer to enable real
               type-to-filter behaviour. */}
          <div className="flex flex-col gap-1.5 w-[280px]">
            <Label>Country</Label>
            <Combobox
              items={COUNTRY_CODES}
              itemToStringLabel={(c) => countryName(String(c))}
            >
              <ComboboxTrigger placeholder="Search countries…" />
              <ComboboxContent className="max-h-[280px] overflow-y-auto">
                {(code: string) => (
                  <ComboboxItem key={code} value={code}>
                    <MapPin className="size-4 text-muted-foreground shrink-0" />
                    {countryName(code)}
                  </ComboboxItem>
                )}
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
              <DropdownMenuItem><Share className="size-4" />Share profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 className="size-4" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Section>

      {/* ══ DETAIL "…" MENU — advanced bottom sheet ══ */}
      <Section id="detail-more-button" title="Detail Menu"
        usage={[
          { label: "Album / Playlist / Artist detail — header “…”", href: "/?page=Album" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">DetailMoreButton</code> — the
          overflow affordance on media detail pages. <span className="text-foreground">Viewport-aware</span>{" "}
          (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">useIsMobile</code>, &lt; 768):
          desktop opens an anchored <a href="/?page=DesignSystem#menu" className="text-primary-text hover:underline underline-offset-2">dropdown</a>;
          phones open an <span className="text-foreground">advanced bottom sheet</span> — one action model, two surfaces.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-6 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">Rich header</span> — <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">MenuCover</code> (square cover · 2×2 playlist collage · round artist avatar, 72px ≈ the three text lines) + title + <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">ContentTypeBadge</code> + meta.</li>
          <li><span className="text-foreground">Quick actions</span> — icon-over-label pills (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">flex-1 rounded-2xl bg-secondary</code>): Share · <span className="text-foreground">Save</span> · (Edit / Play radio …).</li>
          <li><span className="text-foreground">Grouped rows</span> — 44px tap targets split by <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">h-px bg-border</code> dividers; the destructive row (Delete) is last.</li>
          <li><span className="text-foreground">Store-bound Save.</span> The Save pill reads the live library and flips to <span className="text-foreground">Remove</span> (filled heart) — in sync with the header/card hearts. See <a href="/?page=DesignSystem#song-list-item" className="text-primary-text hover:underline underline-offset-2">Save to library</a>.</li>
        </ul>

        <div className="flex flex-wrap items-start gap-8">
          {/* Live trigger — desktop dropdown variant. */}
          <div className="flex flex-col gap-2">
            <SubLabel>Live · desktop dropdown</SubLabel>
            <div className="flex items-center gap-2 rounded-xl border border-border p-3">
              <DetailMoreButton kind="album" title="A Love Supreme" subtitle="John Coltrane" meta="1965"
                cover="https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/120x120bb.jpg"
                triggerVariant="outline" triggerSize="icon" />
              <span className="text-2xsmall text-muted-foreground">open me →</span>
            </div>
          </div>

          {/* Static preview — the phone sheet (the live one only renders < 768). */}
          <div className="flex flex-col gap-2">
            <SubLabel>Static preview · phone bottom sheet</SubLabel>
            <div className="w-[340px] rounded-t-2xl border border-border border-b-0 bg-popover overflow-hidden shadow-xl">
              {/* header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-6">
                <div className="size-[72px] shrink-0 grid grid-cols-2 grid-rows-2 overflow-hidden rounded-xs">
                  {[
                    "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/120x120bb.jpg",
                    "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/120x120bb.jpg",
                    "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/120x120bb.jpg",
                    "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/120x120bb.jpg",
                  ].map((src, i) => <img key={i} src={src} alt="" draggable={false} className="size-full object-cover" />)}
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="truncate text-base font-medium leading-tight text-foreground">Late Night Improvisations</p>
                  <p className="truncate text-small text-muted-foreground leading-none">by Jules</p>
                  <div className="flex items-center gap-2"><ContentTypeBadge type="playlist" /><span className="text-xsmall text-muted-foreground">8 tracks</span></div>
                </div>
              </div>
              {/* quick actions */}
              <div className="flex items-stretch gap-2 px-5 pb-2">
                {[{ icon: <Share />, label: "Share" }, { icon: <Heart />, label: "Save" }, { icon: <RadioIcon />, label: "Play radio" }].map(a => (
                  <div key={a.label} className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl bg-secondary px-2 py-3.5 text-foreground [&_svg]:size-5">
                    {a.icon}<span className="text-xsmall">{a.label}</span>
                  </div>
                ))}
              </div>
              {/* grouped rows */}
              <div className="flex flex-col px-4 pb-4">
                {[{ icon: <ListPlus />, label: "Add to a playlist" }, { icon: <ListStart />, label: "Play next" }, { icon: <ListEnd />, label: "Add to queue" }].map(a => (
                  <div key={a.label} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base text-foreground [&_svg]:size-5 [&_svg]:text-muted-foreground">{a.icon}{a.label}</div>
                ))}
                <div className="mx-2 my-1 h-px bg-border" />
                <div className="flex items-center gap-3 rounded-lg px-3 py-3 text-base text-foreground [&_svg]:size-5 [&_svg]:text-muted-foreground"><Info />Credits</div>
                <div className="flex items-center gap-3 rounded-lg px-3 py-3 text-base text-foreground [&_svg]:size-5 [&_svg]:text-muted-foreground"><Mic />Go to artist</div>
                <div className="mx-2 my-1 h-px bg-border" />
                <div className="flex items-center gap-3 rounded-lg px-3 py-3 text-base text-destructive [&_svg]:size-5"><Flag />Report</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ NAVIGATION MENU ══ */}
      <Section id="navigationmenu" title="NavigationMenu">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Discover</NavigationMenuTrigger>
              <NavigationMenuPortal>
                <NavigationMenuPositioner>
                  <NavigationMenuPopup>
                    <NavigationMenuViewport>
                      <NavigationMenuContent>
                        <div className="grid grid-cols-2 gap-1 min-w-[320px]">
                          <NavigationMenuLink href="#">New releases</NavigationMenuLink>
                          <NavigationMenuLink href="#">Charts</NavigationMenuLink>
                          <NavigationMenuLink href="#">Genres</NavigationMenuLink>
                          <NavigationMenuLink href="#">Editorial</NavigationMenuLink>
                          <NavigationMenuLink href="#">Live sessions</NavigationMenuLink>
                          <NavigationMenuLink href="#">Independent</NavigationMenuLink>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuViewport>
                  </NavigationMenuPopup>
                </NavigationMenuPositioner>
              </NavigationMenuPortal>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Studio</NavigationMenuTrigger>
              <NavigationMenuPortal>
                <NavigationMenuPositioner>
                  <NavigationMenuPopup>
                    <NavigationMenuViewport>
                      <NavigationMenuContent>
                        <div className="flex flex-col gap-1 min-w-[240px]">
                          <NavigationMenuLink href="#">Music</NavigationMenuLink>
                          <NavigationMenuLink href="#">Wallet</NavigationMenuLink>
                          <NavigationMenuLink href="#">Reports</NavigationMenuLink>
                          <NavigationMenuLink href="#">Manage</NavigationMenuLink>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuViewport>
                  </NavigationMenuPopup>
                </NavigationMenuPositioner>
              </NavigationMenuPortal>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <p className="text-xsmall text-muted-foreground mt-3">
          Hover or focus a trigger. Sliding between triggers keeps the popup open.
        </p>
      </Section>

      {/* ══ DATE PICKER ══ */}
      <Section id="datepicker" title="DatePicker">
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
      <Section id="radio-card" title="Radio Card"
        usage={[
          { label: "Vinyl listing — format selector (Vinyl / CD / Cassette)", href: "/?page=Shop&shop-tab=products" },
          { label: "Upload music — distribution choices",                    href: "/?page=Music" },
        ]}>
        <RadioCardKitchenSink />
      </Section>

      {/* ══ SWITCH ══ */}
      <Section id="switch" title="Switch">
        <div className="flex flex-col gap-4">
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
      </Section>

      {/* ══ SLIDER ══ */}
      <Section id="slider" title="Slider">
        <div className="flex flex-col gap-4 min-w-[280px] max-w-md">
          <Slider
            value={volume}
            onValueChange={(v) => setVolume(Array.isArray(v) ? [...(v as number[])] : [v as number])}
            max={100}
            step={1}
          />
          <Slider defaultValue={[30]} max={100} step={1} />
        </div>
      </Section>

      {/* ══ PROGRESS ══ */}
      <Section id="progress" title="Progress">
        <div className="flex flex-col gap-2 min-w-[280px] max-w-md">
          {[100, 75, 50, 25, 0].map((v) => (
            <Progress key={v} value={v} className="h-2" />
          ))}
        </div>
        <p className="text-xsmall text-muted-foreground mt-3">
          Indeterminate work in flight (uploads, syncs). Use Meter for static measurements.
        </p>
      </Section>

      {/* ══ METER ══ */}
      <Section id="meter" title="Meter">
        <div className="flex flex-col gap-5 max-w-md">
          {[
            { value: 12,  label: "Storage used", display: "12 GB / 100 GB" },
            { value: 78,  label: "Password strength", display: "Strong" },
            { value: 96,  label: "Capacity", display: "Almost full" },
          ].map((m) => (
            <Meter key={m.label} value={m.value}>
              <div className="flex items-baseline gap-3">
                <MeterLabel>{m.label}</MeterLabel>
                <MeterValue>{() => m.display}</MeterValue>
              </div>
              <MeterTrack>
                <MeterIndicator />
              </MeterTrack>
            </Meter>
          ))}
        </div>
        <p className="text-xsmall text-muted-foreground mt-3">
          Static measurement (vs. Progress, which is work in flight).
        </p>
      </Section>

      {/* ══ SPINNER ══ */}
      {/*
        The muza brand animation (`PlayingWave`) used as an "actively
        working" indicator. Same dot carousel as the now-playing
        indicator on purpose — the brand mark stays consistent;
        meaning comes from context (label + placement). Use inline
        beside a real wait (upload progress, payment processing,
        search loading). Do NOT use for page nav — the built-in
        page-crossfade already handles that.
      */}
      <Section id="spinner" title="Spinner">
        <div className="flex flex-col gap-6">
          <div className="flex items-end gap-10">
            <div className="flex flex-col items-start gap-2">
              <Spinner size="sm" />
              <span className="text-2xsmall text-muted-foreground">sm · 16px — inline beside text</span>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Spinner size="md" />
              <span className="text-2xsmall text-muted-foreground">md · 24px — content area</span>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Spinner size="lg" />
              <span className="text-2xsmall text-muted-foreground">lg · 40px — full-section loader</span>
            </div>
          </div>

          {/* Static composition examples — the Spinner is a
               primitive; this is how it gets used in real surfaces.
               No state toggling, no transitions — just shows the
               composition pattern. Compose it into real surfaces
               (upload progress, payment, search) with whatever
               loading state those surfaces own. */}
          <div className="flex flex-col gap-2 pt-2">
            <SubLabel>Composition</SubLabel>
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <Spinner size="sm" label="Saving" />
              <span>Saving changes…</span>
            </div>
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <Spinner size="sm" label="Uploading" />
              <span>Uploading music · 42%</span>
            </div>
          </div>

          <p className="text-xsmall text-muted-foreground max-w-prose">
            Use for genuinely slow surfaces (≥300ms). For page
            navigation, rely on the built-in page-crossfade.
          </p>
        </div>
      </Section>

      {/* ══ TOP PROGRESS BAR ══ */}
      {/*
        Thin 2px bar pinned to the very top edge — appears only when
        a load exceeds 200ms, climbs asymptotically to ~85%, snaps to
        100% on completion and fades. Quiet and non-blocking. Reserve
        for real fetches that fall into the awkward 200ms–3s window.
        Loads <200ms stay invisible; loads >3s should switch to a
        Spinner so the user gets a stronger signal.
      */}
      <Section id="top-progress-bar" title="Top Progress Bar">
        <TopProgressBarDemo />
        <p className="text-xsmall text-muted-foreground max-w-prose mt-4">
          The bar attaches to the viewport, not this section — look at
          the very top edge of the window when you trigger it.
        </p>
      </Section>

      {/* ══ SEPARATOR ══ */}
      <Section id="separator" title="Separator">
        <div className="flex flex-col gap-6 max-w-md">
          <div>
            <SubLabel>Horizontal — between stacked content</SubLabel>
            <div className="flex flex-col gap-3 text-small">
              <span>Recently played</span>
              <Separator />
              <span>Saved albums</span>
              <Separator />
              <span>Following</span>
            </div>
          </div>
          <div>
            <SubLabel>Vertical — inline divider in a row</SubLabel>
            <div className="flex items-center gap-3 text-small h-6">
              <span>Songs · 248</span>
              <Separator orientation="vertical" />
              <span>Albums · 32</span>
              <Separator orientation="vertical" />
              <span>Playlists · 14</span>
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

      {/* ══ USER AVATAR (placeholder palette) ══ */}
      <Section id="user-avatar" title="User Avatar"
        usage={[
          { label: "Topbar profile menu trigger", href: "/?page=Home" },
          { label: "Settings → Account hero",     href: "/?page=Settings" },
        ]}>
        <p className="text-base text-muted-foreground mb-6 max-w-2xl">
          Deterministic placeholder avatar — initials derived from the username, color hashed from the same string so the same user always lands on the same swatch across sessions. Falls back to a soft, earthy palette of {AVATAR_PALETTE.length} tints designed to share Muza's warm-olive character.
        </p>

        <SubLabel>Sizes</SubLabel>
        <div className="flex items-end gap-4 flex-wrap mb-10">
          <UserAvatar username="naomi-smith" className="size-7 text-2xsmall" />
          <UserAvatar username="naomi-smith" />
          <UserAvatar username="naomi-smith" className="size-12" />
          <UserAvatar username="naomi-smith" className="size-16 text-large" />
          <UserAvatar username="naomi-smith" className="size-20 text-xlarge" />
        </div>

        <SubLabel>Palette — {AVATAR_PALETTE.length} colors</SubLabel>
        <div className="grid grid-cols-5 gap-4 mb-10 max-w-2xl">
          {AVATAR_PALETTE.map((c) => (
            <div key={c.name} className="flex flex-col items-center gap-1.5">
              <div
                className="size-12 rounded-full flex items-center justify-center text-small font-medium leading-none"
                style={{ backgroundColor: c.bg, color: c.fg }}
              >
                Aa
              </div>
              <span className="text-xsmall text-foreground">{c.name}</span>
              <span className="text-2xsmall text-muted-foreground tabular-nums">{c.bg}</span>
            </div>
          ))}
        </div>

        <SubLabel>Username → initials + color</SubLabel>
        <div className="flex flex-wrap gap-2 max-w-3xl">
          {[
            "Chris-123", "alex_99", "naomi-smith", "kira-92", "zoe",
            "miles-d", "ellaR", "monk", "jordan", "kai",
            "sun-ra", "pharoah_77", "ines_n", "yusef", "ophelia_3",
            "hugo-2", "alice-c", "dee-dee", "cleo", "kofi",
          ].map((u) => (
            <div key={u} className="flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-3 py-1">
              <UserAvatar username={u} className="size-7 text-2xsmall" />
              <span className="text-2xsmall text-muted-foreground">{u}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ TABS ══ */}
      <Section id="tabs" title="Tabs"
        usage={[
          { label: "Artist profile (Overview / Discography / Shop)", href: "/?page=Artist" },
          { label: "Library (Albums / Artists / Songs / Playlists)", href: "/?page=Albums" },
          { label: "Studio sub-nav",                                 href: "/?page=Music" },
        ]}>
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
      {/* ══ TOOLTIP ══ */}
      <Section id="tooltip" title="Tooltip">
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="outline">Hover me</Button>}
              />
              <TooltipContent>Default tooltip</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="outline" size="icon"><Plus /></Button>}
              />
              <TooltipContent>Add a new track</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-sm"><Search /></Button>}
              />
              <TooltipContent side="bottom">Search · ⌘K</TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xsmall text-muted-foreground mt-3">
            Hover or focus the trigger. Sides: <code className="font-mono">top</code> (default), <code className="font-mono">bottom</code>, <code className="font-mono">left</code>, <code className="font-mono">right</code>.
          </p>
        </TooltipProvider>
      </Section>

      {/* ══ SCROLL AREA ══ */}
      <Section id="scrollarea" title="ScrollArea">
        <div className="flex flex-wrap gap-6">
          <div>
            <SubLabel>Vertical</SubLabel>
            <ScrollArea className="h-[180px] w-[280px] rounded-xl border border-border p-4">
              <div className="flex flex-col gap-2 text-small">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i}>Tag #{i + 1} — example item in a scrollable list</div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <SubLabel>Horizontal</SubLabel>
            <ScrollArea className="h-[100px] w-[320px] rounded-xl border border-border">
              <div className="flex gap-3 p-4">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="size-16 shrink-0 rounded-lg bg-muted flex items-center justify-center text-xsmall text-muted-foreground">
                    {i + 1}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <p className="text-xsmall text-muted-foreground mt-3">
          Scrollbars only show on hover/scroll. Hover the panel to reveal them.
        </p>
      </Section>

      {/* ══ COLLAPSIBLE ══ */}
      <Section id="collapsible" title="Collapsible">
        <div className="max-w-md">
          <Collapsible>
            <CollapsibleTrigger>
              <span>Show advanced options</span>
            </CollapsibleTrigger>
            <CollapsiblePanel>
              <div className="mt-3 flex flex-col gap-3 p-4 rounded-lg bg-muted text-small text-foreground">
                <p>Advanced settings go here.</p>
                <p className="text-muted-foreground">
                  Single-region expand/collapse — the building block of Accordion when you only need one section.
                </p>
              </div>
            </CollapsiblePanel>
          </Collapsible>
        </div>
      </Section>

      {/* ══ ACCORDION ══ */}
      <Section id="accordion" title="Accordion">
        <div className="max-w-md">
          <Accordion>
            <AccordionItem value="payments">
              <AccordionTrigger>How do I get paid?</AccordionTrigger>
              <AccordionPanel>
                Payouts arrive in your Muza wallet immediately on every sale. Withdraw to a connected bank account at any time.
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem value="rights">
              <AccordionTrigger>Do I keep my rights?</AccordionTrigger>
              <AccordionPanel>
                Yes — you retain full ownership of your masters and compositions. Muza only handles distribution and storefront.
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem value="exclusive">
              <AccordionTrigger>Is Muza exclusive?</AccordionTrigger>
              <AccordionPanel>
                No. You can release the same music on any other platform at any time.
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </div>
      </Section>

      {/* ══ ALBUM CARD ══ */}
      {/*
        Reusable album tile — square cover + title + artist subtitle.
        Hover reveals: Add (+) / More (⋯) bottom-left, Play (▶)
        bottom-right. `owned` swaps Add for Edit (✏️) so artist-owned
        listings get the right affordance. Figma:
          · Type=Album        (default + hover overlay)
          · Type=My Album     (owned variant — pencil instead of plus)
      */}
      <Section id="album-card" title="Album Card"
        usage={[
          { label: "Library › Albums",            href: "/?page=Albums" },
          { label: "Artist › Top Albums",         href: "/?page=Artist" },
          { label: "Artist › Discography (grid)", href: "/?page=Artist" },
          { label: "Home › New Albums rail",      href: "/" },
        ]}>
        <p className="text-base text-muted-foreground mb-8 max-w-2xl">
          The card is a <span className="text-foreground">nav surface</span>:
          tap the cover (or click the title) to <em>open the album</em>;
          long-press for the action menu (touch). The hover cluster carries
          the card's own actions — the <span className="text-foreground">Play</span> button
          plays the album (self-contained, never navigates) and the
          <span className="text-foreground"> Heart</span> saves it to the library
          (store-bound, flips to Remove). Click the artist to open the artist.
          The kebab opens the full context menu (Share / Save to library /
          Add to playlist / Go to artist / Go to album / Report / Show info). The
          <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">owned</code>
          prop swaps the menu (Add → Edit, Report → Remove from library).
        </p>
        <p className="text-base text-muted-foreground mb-8 max-w-2xl">
          <span className="text-foreground font-medium">Responsive &amp; pointer</span> — hover cluster is mouse-only (auto-gated); touch gets the same actions via long-press → bottom sheet. Inside dense rails (Card Rail's <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">mobileGrid</code>) the year is hidden via <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">data-card-year</code>. See <a href="/?page=DesignSystem#responsive" className="text-primary-text hover:underline underline-offset-2">Responsive &amp; Pointer</a>.
        </p>

        <SubLabel>Monetisation states — Free · Stream-only · Stream + Download · Owned</SubLabel>
        <p className="text-xsmall text-muted-foreground mb-5 max-w-2xl">
          The card's third row shows the album's monetisation state — and
          only when there's something to say. A free album (streams under the
          Muza subscription) shows <span className="text-foreground">nothing</span> —
          the absence of a price is the signal.
          <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">streamPrice</code>
          alone marks stream-only purchase albums; adding
          <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">downloadPrice</code>
          appends the download tier with a download icon glyph; the
          <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">purchased</code>
          prop wins over everything and renders the "Owned" label.
        </p>
        <div className="grid grid-cols-[repeat(1,minmax(143px,220px))] @min-[304px]:grid-cols-[repeat(2,minmax(143px,220px))] @min-[464px]:grid-cols-[repeat(3,minmax(143px,220px))] @min-[692px]:grid-cols-[repeat(4,minmax(143px,220px))] gap-x-4 gap-y-6 mb-10">
          <AlbumCard
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg"
            title="Maiden Voyage"
            artist="Herbie Hancock"
            year={1965}
          />
          <AlbumCard
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg"
            title="Karma"
            artist="Pharoah Sanders"
            year={1969}
            streamPrice="$1.99"
          />
          <AlbumCard
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg"
            title="A Love Supreme"
            artist="John Coltrane"
            year={1965}
            streamPrice="$2.99"
            downloadPrice="$4.99"
          />
          <AlbumCard
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/19/b3/86/19b386e1-550c-0ec4-868b-542cd02bc382/118212.jpg/600x600bb.jpg"
            title="Glass Bead Game"
            artist="Clifford Jordan"
            year={1973}
            purchased
          />
        </div>

        <SubLabel>Title clamp · owned-by-user variant</SubLabel>
        <p className="text-xsmall text-muted-foreground mb-5 max-w-2xl">
          Long titles wrap to a 2-line clamp (Spotify-style) so the
          card height stays predictable. The
          <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">owned</code>
          variant (separate concept from <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">purchased</code>)
          means the user uploaded this release as an artist; hover
          shows an Edit button instead of Add, and the menu adds
          Remove-from-library.
        </p>
        <div className="grid grid-cols-[repeat(1,minmax(143px,220px))] @min-[304px]:grid-cols-[repeat(2,minmax(143px,220px))] @min-[464px]:grid-cols-[repeat(3,minmax(143px,220px))] gap-x-4 gap-y-6">
          <AlbumCard
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg"
            title="The Black Saint and the Sinner Lady"
            artist="Charles Mingus"
            year={1963}
          />
          <AlbumCard
            owned
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e8/e0/90/e8e090fb-10ba-a0f8-c719-ce347b658bbc/075597908541.jpg/600x600bb.jpg"
            title="In These Times"
            artist="Makaya McCraven"
            year={2022}
          />
          <AlbumCard
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/01/0b/96/010b9654-4059-150f-8650-38f94faa62cf/20CRGIM21278.rgb.jpg/600x600bb.jpg"
            title="Source"
            artist="Nubya Garcia"
            year={2020}
          />
        </div>

        <SubLabel className="mt-12">Missing-artwork fallback</SubLabel>
        <p className="text-xsmall text-muted-foreground mb-5 max-w-2xl">
          When a cover is missing or fails to load, the artwork square shows
          the branded placeholder (muted square + soft solid-secondary muza
          mark) via the shared <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">CoverArt</code> —
          same language as the artist circle and song rows.
        </p>
        <div className="grid grid-cols-[repeat(1,minmax(143px,220px))] @min-[304px]:grid-cols-[repeat(2,minmax(143px,220px))] gap-x-4 gap-y-6">
          <AlbumCard cover="" title="Untitled Release" artist="Unknown Artist" year={2026} streamPrice="$1.99" />
          <AlbumCard cover="" title="Lost Tapes, Vol. 2" artist="Various Artists" purchased />
        </div>
      </Section>

      {/* ══ ARTIST CARD ══ */}
      {/*
        Reusable artist tile — circular avatar + name centered below.
        No hover overlay by design (per Figma Type=Artist) — clicking
        navigates to the artist profile.
      */}
      <Section id="artist-card" title="Artist Card"
        usage={[
          { label: "Library › Artists",          href: "/?page=Artists" },
          { label: "Artist › Similar Artists",   href: "/?page=Artist" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Circle is inset to ~80% of the track so the artist tile
          doesn't dominate when it shares a row with album/playlist
          cards (circles read visually heavier than squares at the
          same diameter). No hover overlay by design — clicking the
          card navigates to the artist profile.
        </p>
        <div className="grid-cards">
          <ArtistCard name="John Coltrane"   image="https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/John_Coltrane_1963_cropped_ver2.jpg/500px-John_Coltrane_1963_cropped_ver2.jpg" />
          <ArtistCard name="Alice Coltrane"  image="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Alice_Coltrane_1972.jpg/500px-Alice_Coltrane_1972.jpg" />
          <ArtistCard name="Sun Ra"          image="https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Sun_Ra_%281973_publicity_photo_-_Impulse_ABC_Dunhill%29.jpg/500px-Sun_Ra_%281973_publicity_photo_-_Impulse_ABC_Dunhill%29.jpg" />
          <ArtistCard name="Anthony Braxton" image="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Anthony_braxton_5268134w.jpg/500px-Anthony_braxton_5268134w.jpg" />
          <ArtistCard name="Nubya Garcia"    image="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Nubya_Garcia_INNt%C3%B6ne_01.jpg/500px-Nubya_Garcia_INNt%C3%B6ne_01.jpg" />
        </div>

        <SubLabel className="mt-12">No-photo fallback</SubLabel>
        <p className="text-xsmall text-muted-foreground mb-5 max-w-2xl">
          When there's no real portrait (or one fails to load), the circle
          shows a branded placeholder — a muted disc with a soft, solid
          secondary muza mark — instead of a random stock photo. Same
          treatment carries to album / song artwork (see those sections).
        </p>
        <div className="grid-cards">
          <ArtistCard name="Curtis Fuller" />
          <ArtistCard name="Unknown Artist" />
        </div>
      </Section>

      {/* ══ PLAYLIST CARD ══ */}
      {/*
        Reusable playlist tile — 2×2 composite cover + title + subtitle.
        Hover overlay matches AlbumCard (Add/Edit, More, Play). Owner
        line in subtitle hides when `owned` (the user's own playlists).
        First tile uses the special "Create New Playlist" variant.
        Figma:
          · Type=Playlist     (default — "1234 Songs • User Name")
          · Type=My Playlist  (owned — "1234 Songs", Edit instead of Add)
          · Type=Add          (PlaylistCreateCard — the "+" tile)
      */}
      <Section id="playlist-card" title="Playlist Card"
        usage={[
          { label: "Library › Playlists",         href: "/?page=Playlists" },
          { label: "Artist › Curated Playlists",  href: "/?page=Artist" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Same nav-surface model as <a href="/?page=DesignSystem#album-card" className="text-primary-text hover:underline underline-offset-2">Album Card</a>:
          tap cover (or title) to <em>open the playlist</em>, long-press for
          the menu; the hover Play button plays it and the Heart saves it —
          neither navigates. Owned playlists drop the owner name from the
          subtitle and swap Save → Edit, Report → Delete in the menu. First
          tile is the special <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">PlaylistCreateCard</code>
          variant.
        </p>
        <div className="grid-cards">
          <PlaylistCreateCard />
          <PlaylistCard
            title="Blue Train Late Night"
            covers={[
              "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/13/07/89/1307897d-b463-5a49-0af9-d8d895259c84/D000000002855.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/6e/0e/b4/6e0eb485-2cc8-f2d7-e123-eac40ec75f02/680899009027.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/54/ec/e9/54ece95f-de54-e6a7-0b1a-6a8eee947443/24UM1IM25320.rgb.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e8/e0/90/e8e090fb-10ba-a0f8-c719-ce347b658bbc/075597908541.jpg/200x200bb.jpg",
            ]}
            songCount={42}
            owned
          />
          <PlaylistCard
            title="Coltrane & Coffee"
            covers={[
              "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/49/39/f6/4939f68e-00a5-49f4-9642-57020b789e19/00602547491763.rgb.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/cb/c7/1d/cbc71df4-e2b7-4ea4-7edb-563a9aaf7b31/00602537433919.rgb.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/d2/c6/ef/d2c6efa8-08f8-9486-57e1-c460fa2964af/cover.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4a/2d/6f/4a2d6f89-f204-8f91-9812-f9bd203e33b0/cover.jpg/200x200bb.jpg",
            ]}
            songCount={28}
            owner="Sarah K"
          />
          <PlaylistCard
            title="Saturday Easygoing"
            covers={[
              "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/71/f2/e3/71f2e3e0-b799-3315-9f91-ea9bfebb58db/mzi.isjazqfb.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/01/0b/96/010b9654-4059-150f-8650-38f94faa62cf/20CRGIM21278.rgb.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/af/dc/6b/afdc6b88-b275-de4e-3098-63dff171dffb/680899009720.jpg/200x200bb.jpg",
            ]}
            songCount={67}
            owner="Marcus W"
          />
          <PlaylistCard
            title="Modal Jazz Meditations"
            covers={[
              "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/af/5c/40/af5c40a1-54b1-855d-3da2-f875efbd8372/06UMGIM04169.rgb.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d5/21/70/d5217051-3c92-7ec6-790b-770833a01727/118206.jpg/200x200bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/3d/9d/36/3d9d36ec-d86c-98ee-e0ea-601fc6e32504/00602577388385.rgb.jpg/200x200bb.jpg",
            ]}
            songCount={51}
            owner="Elena P"
          />
        </div>
      </Section>

      {/* ══ SONG LIST ITEM ══ */}
      {/*
        Single row in any song list (Top Songs on Artist, playlist
        detail, search results). Cover acts as the play button —
        idle hover shows ▶, playing state swaps to the spinning
        carousel wave + Pause-on-hover. Title / album / artist all
        independent hover-underline click targets; right cluster:
        [+] always + [info] [⋯] on hover, then duration. Pass a
        `menuItems` slot to turn the kebab into a real DropdownMenu.
      */}
      {/* ══ COVER PLAY BUTTON ══ */}
      {/*
        Cover-as-play button. Shared base behind every row that carries
        a track or release — SongListItem, the discography list table,
        and any future list/grid that wants the same affordance. Three
        overlay states: idle/hover → Play icon; playing/rest → animated
        muza wave; playing/hover → Pause icon. Pass `hoverGroup` to wire
        the overlay to a parent `group/row` or `group/song`, or leave
        as `self` for standalone use.
      */}
      <Section id="cover-play-button" title="Cover Play Button"
        usage={[
          { label: "Song List Item",                href: "/?page=DesignSystem#song-list-item" },
          { label: "Artist › Discography (list view)", href: "/?page=Artist" },
          { label: "Design system › List Table",   href: "/?page=DesignSystem#list-table" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          <span className="text-foreground font-medium">Responsive &amp; pointer</span> — the dark-wash overlay (Play / Pause / 3D wave) is hover-gated, so it only appears on mouse devices; a tap toggles playback everywhere. The wave layer renders outside the cover's clip and supersamples 2× so it stays crisp at any size. See <a href="/?page=DesignSystem#responsive" className="text-primary-text hover:underline underline-offset-2">Responsive &amp; Pointer</a>.
        </p>
        <div className="flex flex-col gap-8">
          {/* Live demo — click the cover to toggle playing state. */}
          <CoverPlayButtonDemo />

          {/* PlayingWave on its own — devs may want the wave outside
               the cover button (e.g. inline "now playing" indicator
               in a player bar or sidebar row). All internal lengths
               scale off the `size` prop, so the dot ratio + orbit
               stay locked across sizes. */}
          <div className="flex flex-col gap-3">
            <SubLabel>PlayingWave — the animation on its own</SubLabel>
            <div className="flex items-center gap-6">
              <PlayingWave size={28} className="text-foreground" />
              <PlayingWave size={40} className="text-foreground" />
              <PlayingWave size={56} className="text-foreground" />
            </div>
            <p className="text-xsmall text-muted-foreground max-w-prose">
              A 3D carousel of four dots rotating around a Y-axis,
              with a subtle Y-float on the outer wrapper. Scales to
              any wrapper (the dots are sized in %). Tuned slow (8s
              rotation, 3.5s float) so it reads as "alive" rather
              than "working" — don't reuse it as a loading spinner.
            </p>
          </div>

        </div>
      </Section>

      <Section id="song-list-item" title="Song List Item"
        usage={[
          { label: "Artist › Top Songs",        href: "/?page=Artist" },
          { label: "Album detail (track list)", href: "/?page=Album" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          One row in a song list — a single component with two leading-slot variants, driven by props (not separate components). Pass <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">cover</code> for album art (<span className="text-foreground">cover mode</span> — Top Songs, playlists, search) or <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">trackNumber</code> for a number (<span className="text-foreground">trackNumber mode</span> — album detail). Row tap toggles play; title / artist / album are independent links.
        </p>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          <span className="text-foreground font-medium">Meta line is optional.</span> When no artist / album / year / badge is passed, the meta row is omitted and the title sits as a single centred line. That's the album-detail case: every track shares the same artist / album / year (already in the header), so repeating it per row is noise — pass just <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">trackNumber</code> + <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">title</code> + <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">duration</code>. A meta line is only worth showing when a track differs (e.g. guest artists).
        </p>
        <p className="text-base text-muted-foreground mb-2 max-w-2xl">
          <span className="text-foreground font-medium">Priority disclosure</span> — the row is a <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">@container</code>, so meta fields shed by the row's <em>own</em> width (works in any context — full list, narrow rail, etc.), keeping the most important last:
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-3 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">≥ 380</span> — artist · album · year + duration</li>
          <li><span className="text-foreground">300–379</span> — year drops</li>
          <li><span className="text-foreground">260–299</span> — duration drops</li>
          <li><span className="text-foreground">&lt; 260</span> — album drops (artist always stays)</li>
        </ul>
        <p className="text-base text-muted-foreground mb-6 max-w-2xl">
          When both show, album shrinks 2× faster than artist (artist truncates last), and a left-fading veil dissolves the meta into the row bg before the action icons rather than hard-clipping.
        </p>
        <p className="text-base text-muted-foreground mb-2 max-w-2xl">
          <span className="text-foreground font-medium">Pointer</span> (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">compact</code> prop — used in swipeable rails like Top Songs):
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-6 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">Mouse / desktop</span> (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">hover: hover</code>): the <span className="text-foreground">♥ (Save to library)</span> is always visible, More + Info fade in on hover (3 icons).</li>
          <li><span className="text-foreground">Touch</span> (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">hover: none</code>): no hover, so a single <span className="text-foreground">“…”</span> button opens a <span className="text-foreground">bottom sheet</span> with the full action set.</li>
          <li>Compact also drops the duration unconditionally (swipe rails are tight). Default rows keep the in-flow heart + duration. See <a href="/?page=DesignSystem#responsive" className="text-primary-text hover:underline underline-offset-2">Responsive &amp; Pointer</a> for the shared conventions.</li>
        </ul>
        {/* Variant 1 — `cover` mode. Used wherever a row of songs
             pulls from different albums (Artist › Top Songs,
             playlists, search results). Each row shows its album
             art in the leading slot. */}
        <div className="flex flex-col gap-2">
          <SubLabel>cover mode — Artist › Top Songs, playlists, search</SubLabel>
          <ul className="flex flex-col gap-1 max-w-2xl">
            <li>
              <SongListItem
                cover="https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/200x200bb.jpg"
                title="Space Is the Place"
                album="Space Is the Place"
                year={1973}
                duration="21:14"
                badge="Demo"
                menuItems={<AlbumCardMenuItems />}
              />
            </li>
            <li>
              <SongListItem
                cover="https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b3/2a/5f/b32a5f91-5551-1ac0-17c6-e6dd4dcc0292/4062548021820_3000.jpg/200x200bb.jpg"
                title="Lanquidity"
                artist="Sun Ra"
                album="Lanquidity"
                year={1978}
                duration="9:11"
                menuItems={<AlbumCardMenuItems />}
              />
            </li>
            <li>
              <SongListItem
                cover="https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a7/f2/b9/a7f2b9d7-3cd0-c092-d667-59dd10e11b6c/4062548112283.png/200x200bb.jpg"
                title="Door of the Cosmos"
                album="Sleeping Beauty"
                year={1979}
                duration="9:03"
                menuItems={<AlbumCardMenuItems />}
              />
            </li>
            {/* Missing-artwork fallback — empty cover → branded CoverArt
                placeholder (muted square + soft solid-secondary muza mark). */}
            <li>
              <SongListItem
                cover=""
                title="Untitled (no artwork)"
                artist="Unknown Artist"
                album="Bootleg Series"
                year={1971}
                duration="6:02"
                menuItems={<AlbumCardMenuItems />}
              />
            </li>
          </ul>
        </div>

        {/* Variant 2 — `trackNumber` mode, album-detail usage. Every
             track sits on the same album, so the cover thumb AND the
             artist / album / year meta are redundant (all in the
             header). Pass only number + title + duration → a clean
             single-line row. Same play / pause / wave hover behaviour
             as `cover` mode. */}
        <div className="flex flex-col gap-2 mt-8">
          <SubLabel>trackNumber mode — Album detail (single line, no meta)</SubLabel>
          <ul className="flex flex-col gap-1 max-w-2xl">
            <li>
              <SongListItem trackNumber={1} title="Acknowledgement" duration="7:47" menuItems={<AlbumCardMenuItems />} />
            </li>
            <li>
              <SongListItem trackNumber={2} title="Resolution" duration="7:21" menuItems={<AlbumCardMenuItems />} />
            </li>
            <li>
              <SongListItem trackNumber={3} title="Pursuance" duration="10:46" menuItems={<AlbumCardMenuItems />} />
            </li>
          </ul>
        </div>

        {/* Variant 3 — `trackNumber` mode WITH a meta line, for the
             rarer case where a track differs from the album (a guest /
             featured artist). Shows the meta line is still available in
             trackNumber mode when it actually carries new info. */}
        <div className="flex flex-col gap-2 mt-8">
          <SubLabel>trackNumber mode — with guest-artist meta (when a track differs)</SubLabel>
          <ul className="flex flex-col gap-1 max-w-2xl">
            <li>
              <SongListItem
                trackNumber={4}
                title="Dancing in Your Head"
                artist="Sun Ra feat. Ornette Coleman"
                duration="8:24"
                onArtistClick={() => {}}
                menuItems={<AlbumCardMenuItems />}
              />
            </li>
          </ul>
        </div>
      </Section>

      {/* ══ MEDIA LIST ITEM ══ */}
      <Section id="media-list-item" title="Media List Item"
        usage={[
          { label: "Library / search — mixed result list (mobile)", href: "/?page=Albums" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          A row for <span className="text-foreground">mixed</span> lists — albums,
          playlists, tracks and artists together (library, search results).
          Same anatomy as <a href="/?page=DesignSystem#song-list-item" className="text-primary-text hover:underline underline-offset-2">Song List Item</a>,
          but a <span className="text-foreground">nav</span> row, not a player
          row.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-6 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Primary action per type.</span>{" "}
            Album / Playlist / Artist <span className="text-foreground">open</span> the
            detail page. A Song row also <span className="text-foreground">opens its
            release</span> (the album) when an <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">onOpen</code> is given —
            the <span className="text-foreground">cover button</span> is what plays
            (and shows the now-playing state). With no <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">onOpen</code>, the whole song row plays.
          </li>
          <li>
            <span className="text-foreground">Type badge + adaptive thumb.</span>{" "}
            A <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">ContentTypeBadge</code> labels
            each row; the leading slot is a square cover, a 2×2 collage
            (playlist) or a circle (artist / <span className="text-foreground">label</span>). No heart, no duration — just
            the <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">⋯</code> menu.
          </li>
        </ul>
        <div className="max-w-[420px] flex flex-col gap-1 rounded-xl border border-border p-2">
          <MediaListItem
            type="album"
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/120x120bb.jpg"
            title="Time Out"
            subtitle="The Dave Brubeck Quartet"
            meta="1959"
            menuItems={<AlbumCardMenuItems />}
          />
          <MediaListItem
            type="playlist"
            covers={[
              "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/120x120bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/120x120bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/120x120bb.jpg",
              "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/120x120bb.jpg",
            ]}
            title="Modal Jazz Meditations"
            subtitle="You"
            meta="123 Songs"
            menuItems={<PlaylistCardMenuItems />}
          />
          <MediaListItem
            type="song"
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/120x120bb.jpg"
            title="A Love Supreme, Pt. 1: Acknowledgement"
            subtitle="John Coltrane"
            meta="1965"
            menuItems={<AlbumCardMenuItems />}
          />
          <MediaListItem
            type="artist"
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/120x120bb.jpg"
            title="Charles Mingus"
            menuItems={<AlbumCardMenuItems />}
          />
          <MediaListItem
            type="label"
            cover="https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/120x120bb.jpg"
            title="Impulse!"
            subtitle="12 albums"
          />
        </div>
        <p className="text-small text-muted-foreground mt-5 max-w-2xl">
          (Song row opens its album; the rest navigate. Container clicks are
          inert here — wired to real routes in the app.)
        </p>
      </Section>

      {/* ══ SEARCH ══ */}
      <Section id="search" title="Search"
        usage={[
          { label: "Topbar / mobile header search → Explore results", href: "/?page=Explore&q=coltrane" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          The Explore page <span className="text-foreground">is</span> the search surface. Focusing the search field opens a{" "}
          <span className="text-foreground">panel</span> (recent searches → suggestions); Enter routes to URL-backed results
          (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">?page=Explore&amp;q=…&amp;scope=…</code>) that are identical on desktop and mobile.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-6 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">Panel</span> — empty query → “Your recent searches” (clock rows, removable); typing → plain-text suggestions.</li>
          <li><span className="text-foreground">Scope</span> — a <a href="/?page=DesignSystem#togglegroup" className="text-primary-text hover:underline underline-offset-2">ToggleGroup</a> (Muza Catalog / My Library); full-width in the mobile header, inline on desktop.</li>
          <li><span className="text-foreground">Category filter</span> — underlined <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">Tabs variant="line"</code> on desktop, <a href="/?page=DesignSystem#mobile-header" className="text-primary-text hover:underline underline-offset-2">MobilePillTabs</a> on mobile. <span className="text-foreground">Only types with results are shown</span> (All always); the active tab falls back to All if it empties as the query narrows. No counts (they churn per keystroke).</li>
          <li><span className="text-foreground">A specific tab</span> (Songs / Artists / …) — a flat vertical list of <a href="/?page=DesignSystem#media-list-item" className="text-primary-text hover:underline underline-offset-2">Media List Item</a> rows (songs play / open their album, containers navigate); <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">label</code> renders round with a “Label” badge + album count.</li>
        </ul>

        <p className="text-base font-medium text-foreground mb-2 max-w-2xl">The “All” tab — a composition of shelves, not a flat list</p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-6 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">Top result</span> — the single best-ranked match as an oversized hero card (cover, title, content-type badge, Play for playable kinds). It’s <span className="text-foreground">removed from its own type section</span>, so that section appears only when there are <span className="text-foreground">other</span> hits of that type (e.g. more artists with a similar name) — a lone match never gets a one-item rail repeating the hero.</li>
          <li><span className="text-foreground">Then one shelf per type</span>, ordered by relevance (the Top result’s type leads when it has siblings).</li>
          <li><span className="text-foreground">Songs</span> — a horizontally-paged <a href="/?page=DesignSystem#song-list-item" className="text-primary-text hover:underline underline-offset-2">Song List Item</a> column-rail (3 rows/column) when <span className="text-foreground">≥ 6</span>; a plain vertical list when <span className="text-foreground">≤ 5</span>.</li>
          <li><span className="text-foreground">Artists / Albums / Playlists</span> — a <a href="/?page=DesignSystem#card-rail" className="text-primary-text hover:underline underline-offset-2">Card Rail</a> when <span className="text-foreground">≥ 2</span>; a single inline card when exactly <span className="text-foreground">1</span>. <span className="text-foreground">Labels</span> — always a list.</li>
          <li><span className="text-foreground">“Show all”</span> shows <span className="text-foreground">only when the shelf overflows</span> (off-screen content to scroll to) → opens that type’s tab; shelves that already show everything get none.</li>
          <li><span className="text-foreground">Sparse query</span> (≤ 2 total results) → skip the shelves: Top result + a short list.</li>
        </ul>

        <SubLabel>Panel — recent searches / suggestions</SubLabel>
        <div className="flex flex-wrap gap-6 mb-8">
          <div className="w-[320px]"><SearchPanel query="" onPick={() => {}} /></div>
          <div className="w-[320px]"><SearchPanel query="col" onPick={() => {}} /></div>
        </div>

        <SubLabel>Results — live (interactive: rows navigate, scope/tabs filter)</SubLabel>
        <div className="rounded-xl border border-border overflow-hidden">
          <SearchResultsView query="coltrane" />
        </div>
      </Section>

      {/* ══ HOME ROW ══ */}
      {/*
        Horizontally-scrolling rail used on the Home page for "New
        Albums", "Playlists of the week", etc. Same column step map
        as the Library views (2/3/4/5/6 cards visible at container
        widths 304/464/692/928/1164) so the home density matches the
        rest of the app. Arrow buttons scroll by one full page so
        the row always lands on a clean N-card boundary; touch swipe
        is free-form for natural feel.
      */}
      <Section id="card-rail" title="Card Rail"
        usage={[
          { label: "Home › New Albums / Playlists / Artists rails", href: "/" },
          { label: "Artist profile rails (Top Albums, Products, Curated Playlists, Similar Artists)", href: "/?page=Artist" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Section divider with title + ◀ ▶ + ghost "Show all"
          button on top, scrollable card rail below. The row hides
          its scrollbar and uses
          <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">touch-action: pan-x</code>
          so vertical wheel/swipe passes straight through to the
          page. Try clicking the arrows or swiping horizontally.
        </p>
        <p className="text-base text-muted-foreground mb-2 max-w-2xl">
          <span className="text-foreground font-medium">Responsive behaviour</span> — the rail has two distinct modes, split at a <span className="text-foreground">560px</span> container width (synced to the <a href="/?page=DesignSystem#media-header" className="text-primary-text hover:underline underline-offset-2">MediaHeader</a>'s stacked breakpoint):
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-5 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Column steps</span> — visible
            cards step with container width on the same thresholds as
            the Library grids:{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">304→2</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">464→3</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">692→4</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">928→5</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">1164→6</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">1500→7</code>.
          </li>
          <li>
            <span className="text-foreground">Mobile (&lt; 560px) — swipe mode.</span>{" "}
            Cards are floored at the <span className="text-foreground">220px</span> max width
            (min = max), so they lock to one/two big cards with a <span className="text-foreground">~24px peek</span> of
            the next at the right edge — a clear "this row scrolls" cue
            on touch. This is the same point the MediaHeader stacks, so
            the whole page flips to its mobile read together. The ghost
            "Show all" also firms up into a <span className="text-foreground">secondary pill</span> here,
            since the chevrons are gone.
          </li>
          <li>
            <span className="text-foreground">Desktop (≥ 560px) — grid mode.</span>{" "}
            Cards fit exactly N-per-row (no peek), aligned to the Library
            grids; the ◀ ▶ arrows carry the scroll affordance.
          </li>
          <li>
            <span className="text-foreground">Arrows</span> — a pointer
            affordance for <span className="text-foreground">grid mode (≥ 560)</span> only.
            Below 560 the swipe peek is the scroll cue, so the arrows would
            be redundant and are hidden. On touch
            (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">hover: none</code>)
            they're always hidden — the peek / native swipe is the cue.
          </li>
          <li>
            <span className="text-foreground">Scroll</span> — scroll-snap
            re-aligns cards after a swipe; arrows page by one viewport +
            one gap. Native scrollbar hidden.
          </li>
        </ul>
        <CardRail title="New Albums">
          {HOME_NEW_ALBUMS.map(a => (
            <li key={a.id}><AlbumCard cover={a.cover} title={a.title} artist={a.artist} year={albumMetaFor(a.title).year} streamPrice={albumMetaFor(a.title).streamPrice} downloadPrice={albumMetaFor(a.title).downloadPrice} /></li>
          ))}
        </CardRail>

        <p className="text-base text-muted-foreground mt-8 mb-2 max-w-2xl">
          <span className="text-foreground font-medium">Swipeable grid variant</span> (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">mobileGrid</code>) — opt-in denser layout for shelves with <span className="text-foreground">12+ entries</span>. On mobile (&lt; 560px) cards lay out as a <span className="text-foreground">2-row, column-major</span> grid you swipe across columns (~2× the cards per screen); desktop is unchanged. Enabling it is the host/editor's call — pass the boolean only when the shelf is long enough and an editor opted in. <span className="text-foreground">Narrow your window below 560px</span> to see the two rows.
        </p>
        <CardRail title="Swipeable Grid Section" mobileGrid>
          {HOME_NEW_ALBUMS.map(a => (
            <li key={a.id}><AlbumCard cover={a.cover} title={a.title} artist={a.artist} year={albumMetaFor(a.title).year} streamPrice={albumMetaFor(a.title).streamPrice} downloadPrice={albumMetaFor(a.title).downloadPrice} /></li>
          ))}
        </CardRail>
      </Section>

      {/* ══ SONG RAIL ══ */}
      <Section id="song-rail" title="Song Rail"
        usage={[
          { label: "Artist › Top Songs",     href: "/?page=Artist&artist=sun-ra" },
          { label: "Search › Songs group",   href: "/?page=Explore&q=blue" },
        ]}>
        <p className="text-base text-muted-foreground mb-2 max-w-2xl">
          The row-shaped sibling of <a href="/?page=DesignSystem#card-rail" className="text-primary-text hover:underline underline-offset-2">Card Rail</a>: it stacks <a href="/?page=DesignSystem#song-list-item" className="text-primary-text hover:underline underline-offset-2">Song List Item</a> rows into columns of <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">3</code> and scrolls sideways. One shared shell (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">song-rail.tsx</code>) — Artist Top Songs and Search Songs both feed it their own rows.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-5 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">Column steps</span> — 1 column default, 2 at <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">@min-[692px]</code>, 3 at <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">@min-[1164px]</code>; widths are computed from the rail's own 100% so columns line up with Card Rail at the same page width.</li>
          <li><span className="text-foreground">Mobile peek</span> (&lt; 692px) — the single column is undersized so the next peeks (~24px) as the swipe cue.</li>
          <li><span className="text-foreground">Arrows</span> — a pointer affordance only: hidden on touch (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">hover: none</code>) and below 692px, and shown only when the rail actually overflows.</li>
          <li><span className="text-foreground">Show all</span> — optional (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">onShowAll</code>); omitted on Artist Top Songs. When present it appears only on overflow (firms into a secondary pill &lt; 560px).</li>
          <li><span className="text-foreground">Rows passed in</span> — the shell is data-agnostic: each host renders its own keyed rows (player-wired on Artist, <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">SearchSongRow</code> in Search).</li>
        </ul>
        <SubLabel>Live component · <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">&lt;SongRail&gt;</code> from <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">song-rail.tsx</code></SubLabel>
        <SongRail
          title="Top Songs"
          onShowAll={() => {}}
          rows={SONG_RAIL_DEMO.map(s => (
            <SongListItem key={s.id} compact cover={s.cover} title={s.title} album={s.album} duration={s.duration} onPlay={() => {}} />
          ))}
        />
      </Section>

      {/* ══ PRODUCT CARD ══ */}
      {/*
        Compact product tile used on Artist › Shop and any product
        rail. Title clamps at two lines + min-height reserved so a row
        of tiles stays flush, price + price-label inline, full-width
        secondary "Add to cart" pill at the foot.
      */}
      <Section id="product-card" title="Product Card" phase={2}
        usage={[
          { label: "Artist › Shop tab",        href: "/?page=Artist" },
          { label: "Artist › Products rail",   href: "/?page=Artist" },
        ]}>
        <ul className="grid-cards">
          {[
            { id: "kp1", title: "Space Is the Place — Vinyl Reissue", price: "32 $", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
            { id: "kp2", title: "Lanquidity (Deluxe 4LP Box)",         price: "120 $", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b3/2a/5f/b32a5f91-5551-1ac0-17c6-e6dd4dcc0292/4062548021820_3000.jpg/600x600bb.jpg" },
            { id: "kp3", title: "Saturn Records Cap",                  price: "28 $", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music62/v4/fd/56/b8/fd56b88e-1bb8-9be7-c945-61fbaf9da665/Astro_Black_2018_cover-300.jpg/600x600bb.jpg" },
            { id: "kp4", title: "Cosmic Equation Poster",              price: "18 $", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music49/v4/20/db/51/20db5143-be96-6741-6d70-08d9fc0d5605/Cosmos_art_1500.jpg/600x600bb.jpg" },
          ].map(p => (
            <li key={p.id}>
              <ProductCard cover={p.cover} title={p.title} price={p.price} />
            </li>
          ))}
        </ul>
      </Section>

      {/* ══ CHECKOUT CARD ══
           Order/purchase row card from the buyer-side Purchases hub.
           Date header strip + per-shop fulfillment rows (avatar, shop
           name, products, status badge, total). One card per checkout
           — can contain multiple fulfillments when the cart spanned
           multiple shops. */}
      <Section id="checkout-card" title="Checkout Card" phase={2}
        usage={[
          { label: "Purchases hub", href: "/?page=Purchases" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-3xl">
          Buyer-side receipt for one checkout. Wraps every shipment in
          the same payment ("one charge, N fulfillments") under a
          shared date + total header. Each fulfillment row links to
          its detail page; a payment-failure on any sub-row promotes
          a single recovery CTA up to the header strip so the user
          doesn't have to hunt for it.
        </p>
        <div className="max-w-3xl">
          <CheckoutCard
            checkout={CHECKOUTS[0]}
            onOpenFulfillment={() => {}}
            onProductClick={() => {}}
            onUpdatePayment={() => {}}
          />
        </div>
      </Section>

      {/* ══ MEDIA HEADER ══ */}
      {/*
        Shared header for any media detail surface (album, playlist,
        owned variants of both). Cover on the left + title / meta /
        action row on the right. Four variants: `album`, `my-album`,
        `playlist`, `my-playlist`. `hasBuyingOption` toggles the
        "Unlock All Songs" CTA above the Play / Shuffle row. Back
        navigation lives at the PAGE level, not in this component.
      */}
      <Section id="media-header" title="Media Header"
        usage={[
          { label: "Album detail",    href: "/?page=Album" },
          { label: "Playlist detail", href: "/?page=Playlist" },
        ]}>
        <p className="text-base text-muted-foreground mb-2 max-w-2xl">
          <span className="text-foreground font-medium">Responsive</span> — the header is a <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">@container</code> with three tiers by its own width:
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-3 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">≥ 780 — full</span>: cover left, title/meta right, Play + Shuffle and the full icon cluster (Add/Share/Info + a persistent "…").</li>
          <li><span className="text-foreground">560–779 — compact</span>: still horizontal, but Add/Share/Info drop; the "…" <span className="text-foreground">stays put</span> and carries them via its bottom sheet. Play/Shuffle can shrink toward square.</li>
          <li><span className="text-foreground">&lt; 560 — stacked</span>: full-width cover on top, title/meta, then a Play/Shuffle/Add/Share row; Info/More live in the page-gutter "…".</li>
          <li><span className="text-foreground">Title</span> stays on one line; if it's too long to fit it slowly scrolls back and forth (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">MarqueeText</code>) so the full name is readable, rather than wrapping or truncating.</li>
          <li><span className="text-foreground">Meta line</span> is priority-ordered against its own width: year/duration drops first (&lt; 320), then type (&lt; 240), and the owner only <span className="text-foreground">truncates as a last resort</span> once both are gone — so the owner stays readable as long as possible.</li>
        </ul>
        <p className="text-base text-muted-foreground mb-8 max-w-2xl">
          The header's own "…" persists across both horizontal tiers; the <span className="text-foreground">page-gutter</span> "…" (mirroring the back chevron) only appears in the stacked tier (&lt; 560), where there's no cluster. The full-cluster floor of <span className="text-foreground">780px</span> is what the sidebar auto-collapse (<span className="text-foreground">1069</span> = 780 + sidebar + gutters) is synced to; the <a href="/?page=DesignSystem#card-rail" className="text-primary-text hover:underline underline-offset-2">Card Rail</a> peek boundary is synced to the <span className="text-foreground">560</span> stack breakpoint instead. See <a href="/?page=DesignSystem#responsive" className="text-primary-text hover:underline underline-offset-2">Responsive &amp; Pointer</a>.
        </p>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <SubLabel>album — with buying option</SubLabel>
            <MediaHeader
              variant="album"
              cover="https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg"
              title="A Love Supreme"
              owner="John Coltrane"
              ownerAvatar="https://picsum.photos/seed/coltrane-avatar/120/120"
              format="Album"
              year={1965}
              hasBuyingOption
              buyingPrice="$2.99"
            />
          </div>

          <div className="flex flex-col gap-2">
            <SubLabel>album — purchased, streaming tier (buy CTA dropped, inline Purchased badge in meta)</SubLabel>
            <MediaHeader
              variant="album"
              cover="https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg"
              title="A Love Supreme"
              owner="John Coltrane"
              ownerAvatar="https://picsum.photos/seed/coltrane-avatar/120/120"
              format="Album"
              year={1965}
              purchased
            />
          </div>

          <div className="flex flex-col gap-2">
            <SubLabel>album — purchased, download tier (Download MP3 takes the freed slot)</SubLabel>
            <MediaHeader
              variant="album"
              cover="https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg"
              title="Cool Struttin'"
              owner="Sonny Clark"
              ownerAvatar="https://picsum.photos/seed/sonny-clark/120/120"
              format="Album"
              year={1958}
              purchased
              downloadable
            />
          </div>

          <div className="flex flex-col gap-2">
            <SubLabel>my-album — owner view (artist IS the user), Edit instead of Add</SubLabel>
            {/* `my-album` means the logged-in user is also the
                 artist of this release. Owner = artist. Picked a
                 fictional release (matching the Figma reference for
                 this variant — "Beneath the Surface" by Ezra Blue)
                 because using a real Coltrane / Hancock album with
                 a different-name "owner" reads as wrong. */}
            <MediaHeader
              variant="my-album"
              cover="https://picsum.photos/seed/beneath-the-surface/600/600"
              title="Beneath the Surface"
              owner="Ezra Blue"
              ownerAvatar="https://picsum.photos/seed/ezra-blue/120/120"
              format="Single"
              year={2026}
              visibility="public"
            />
          </div>

          <div className="flex flex-col gap-2">
            <SubLabel>playlist — composite 2×2 cover, no format, no buy CTA, user as owner</SubLabel>
            <MediaHeader
              variant="playlist"
              cover="https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg"
              covers={[
                "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg",
                "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg",
                "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg",
                "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg",
              ]}
              title="Late Night Improvisations"
              owner="Jules"
              ownerAvatar="https://picsum.photos/seed/jules/120/120"
              year="42 tracks · 3h 12m"
            />
          </div>

          <div className="flex flex-col gap-2">
            <SubLabel>my-playlist — composite cover + visibility StatusBadge</SubLabel>
            <MediaHeader
              variant="my-playlist"
              cover="https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg"
              covers={[
                "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg",
                "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg",
                "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg",
                "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg",
              ]}
              title="Modal Jazz Meditations"
              owner="You"
              ownerAvatar="https://picsum.photos/seed/you/120/120"
              year="28 tracks"
              visibility="public"
            />
          </div>
        </div>
      </Section>

      {/* ══ ARTIST HEADER ══ */}
      <Section id="artist-header" title="Artist Header"
        usage={[
          { label: "Artist profile (hero)", href: "/?page=Artist&artist=sun-ra" },
        ]}>
        <p className="text-base text-muted-foreground mb-2 max-w-2xl">
          The full-bleed hero on the artist page — distinct from the <a href="/?page=DesignSystem#media-header" className="text-primary-text hover:underline underline-offset-2">Media Header</a> (album / playlist). A cover photo under a dark gradient, with name, bio, and the action row pinned bottom-left.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-3 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">Dual-cap height</span> — <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">aspect-[1072/400]</code>, floor <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">min-h-[320px]</code>, cap <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">max-h-[552px]</code> → <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">min-[1920px]:max-h-[640px]</code>. Derived from the page-width tiers (1480 / 1716 × 400/1072), so it stops growing exactly where the rails do. See <a href="/?page=DesignSystem#responsive" className="text-primary-text hover:underline underline-offset-2">Responsive &amp; Pointer</a>.</li>
          <li><span className="text-foreground">Dark gradient</span> over the photo (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">from-black/35 via-black/40 to-black/80</code>) so white foreground stays readable on any cover; the section is <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">.dark</code>-scoped so outline buttons read correctly.</li>
          <li><span className="text-foreground">Content</span> pinned bottom-left in the same <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">max-w-[1480px]</code> wrapper as the page below — name (fluid <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">clamp(2.5rem,5vw,4rem)</code>), a 3-line bio with read-more, then Play / Artist radio + Share / Save.</li>
        </ul>
        <SubLabel>Live component · <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">&lt;ArtistHero&gt;</code> from <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">artist-hero.tsx</code></SubLabel>
        <ArtistHero
          name="Sun Ra"
          cover="https://miro.medium.com/v2/resize:fit:4800/format:webp/1*lGV1JcK0hYHFLvyimbVK5Q.jpeg"
          avatar="https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Sun_Ra_%281973_publicity_photo_-_Impulse_ABC_Dunhill%29.jpg/500px-Sun_Ra_%281973_publicity_photo_-_Impulse_ABC_Dunhill%29.jpg"
          bio={"Sun Ra (born Herman Poole Blount; May 22, 1914 – May 30, 1993) was an American jazz composer, bandleader, piano and synthesizer player, and poet known for his experimental music, cosmic philosophy, prolific output and theatrical performances.\n\nFor much of his career he led the Arkestra, an ensemble with an ever-changing lineup and name, distinguished by its costumes, choreography and freewheeling sound. Born in Birmingham, Alabama, he abandoned his birth name and claimed to be an alien from Saturn on a mission to preach peace — a persona he used to explore space, mythology and Black liberation.\n\nAcross more than three decades he recorded hundreds of releases, many on his own Saturn label, spanning bebop, big-band swing, free jazz and pioneering electronic music. Long a cult figure, he is now widely regarded as a visionary whose influence reaches across jazz, funk and experimental music."}
          artistId="sun-ra"
          isPlaying={false}
          onPlayToggle={() => {}}
        />
      </Section>

      {/* ══ MOBILE HEADER ══ */}
      <Section id="mobile-header" title="Mobile Header"
        usage={[
          { label: "Phone layouts (< 768px) — Home",     href: "/?page=Home" },
          { label: "Library (Albums / Artists / …)",      href: "/?page=Albums" },
          { label: "Explore search",                       href: "/?page=Explore" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          The frosted top bar for phone layouts. It shares the exact same
          glass material as the bottom <span className="text-foreground">FooterNav</span> —{" "}
          <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">.frosted-glass</code> with
          a hairline border — just flipped to the top edge, so the two
          bookend the screen with one continuous surface as content scrolls
          under them.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-8 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Composed, not configured.</span> Each
            context is just an arrangement of five primitives —{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">MobileTitleRow</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">MobileSearchBar</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">MobilePillTabs</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">MobileScopeToggle</code>,{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">MobileIconButton</code>.
          </li>
          <li>
            <span className="text-foreground">Sticky &amp; safe-area aware.</span>{" "}
            <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">sticky top-0</code> with
            a <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">12px</code> gutter
            matching the phone page padding and a top inset for the status bar.
          </li>
        </ul>

        <div className="flex flex-wrap gap-x-10 gap-y-8">
          {/* Home — title + avatar */}
          <div className="flex flex-col gap-2">
            <SubLabel>Home — title + avatar</SubLabel>
            <PhoneHeaderFrame header={
              <MobileHeader>
                <MobileTitleRow title="Home" trailing={<MobileAvatar src="https://picsum.photos/seed/muza-you/120/120" />} />
              </MobileHeader>
            } />
          </div>

          {/* Library — title + icon actions + pill tabs */}
          <div className="flex flex-col gap-2">
            <SubLabel>Library — actions + filter tabs</SubLabel>
            <PhoneHeaderFrame header={
              <MobileHeader>
                <MobileTitleRow title="Library" trailing={<>
                  <MobileIconButton label="Add"><Plus /></MobileIconButton>
                  <MobileIconButton label="Search"><Search /></MobileIconButton>
                </>} />
                <MobilePillTabs
                  value="all"
                  tabs={[
                    { value: "all", label: "All" },
                    { value: "albums", label: "Albums" },
                    { value: "songs", label: "Songs" },
                    { value: "playlists", label: "Playlists" },
                  ]}
                />
              </MobileHeader>
            } />
          </div>

          {/* Library — search mode */}
          <div className="flex flex-col gap-2">
            <SubLabel>Library — search mode (Cancel + tabs)</SubLabel>
            <PhoneHeaderFrame header={
              <MobileHeader>
                <MobileSearchBar placeholder="Search your library" autoFocus={false} onCancel={() => {}} />
                <MobilePillTabs
                  value="all"
                  tabs={[
                    { value: "all", label: "All" },
                    { value: "albums", label: "Albums" },
                    { value: "songs", label: "Songs" },
                    { value: "playlists", label: "Playlists" },
                  ]}
                />
              </MobileHeader>
            } />
          </div>

          {/* Explore — title + avatar + search */}
          <div className="flex flex-col gap-2">
            <SubLabel>Explore — title + search field</SubLabel>
            <PhoneHeaderFrame header={
              <MobileHeader>
                <MobileTitleRow title="Explore" trailing={<MobileAvatar src="https://picsum.photos/seed/muza-you/120/120" />} />
                <MobileSearchBar placeholder="Search Artists, Albums, Songs or Playlists" />
              </MobileHeader>
            } />
          </div>

          {/* Explore — scrolled (search only) */}
          <div className="flex flex-col gap-2">
            <SubLabel>Explore — scrolled (search collapses up)</SubLabel>
            <PhoneHeaderFrame header={
              <MobileHeader>
                <MobileSearchBar placeholder="Explore Artists, Albums, Songs or Playlists" />
              </MobileHeader>
            } />
          </div>

          {/* Explore — focused (scope toggle) */}
          <div className="flex flex-col gap-2">
            <SubLabel>Explore — focused (catalog scope)</SubLabel>
            <PhoneHeaderFrame header={
              <MobileHeader>
                <MobileSearchBar placeholder="Search" autoFocus={false} onCancel={() => {}} />
                <MobileScopeToggle
                  value="catalog"
                  options={[
                    { value: "catalog", label: "Muza Catalog" },
                    { value: "library", label: "My Library" },
                  ]}
                />
              </MobileHeader>
            } />
          </div>

          {/* Explore — submitted (filter pills) */}
          <div className="flex flex-col gap-2">
            <SubLabel>Explore — submitted (result filters)</SubLabel>
            <PhoneHeaderFrame header={
              <MobileHeader>
                <MobileSearchBar value="miles" onChange={() => {}} onClear={() => {}} onCancel={() => {}} />
                <MobilePillTabs
                  value="all"
                  tabs={[
                    { value: "all", label: "All results" },
                    { value: "albums", label: "Albums" },
                    { value: "songs", label: "Songs" },
                    { value: "playlists", label: "Playlists" },
                  ]}
                />
              </MobileHeader>
            } />
          </div>
        </div>

        <p className="text-small text-muted-foreground mt-8 max-w-2xl">
          (The faux list scrolls under each header so the glass tint + blur
          read — same surface as the live <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">FooterNav</code>.)
        </p>
      </Section>

      {/* ══ FOOTER NAV ══ */}
      <Section id="footer-nav" title="Footer Nav"
        usage={[
          { label: "Phone layouts (< 608px) — replaces the sidebar", href: "/?page=Home" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          The mobile bottom tab bar that replaces the sidebar below the
          footer-nav breakpoint (synced to the <a href="/?page=DesignSystem#media-header" className="text-primary-text hover:underline underline-offset-2">Media Header</a>'s
          stacking point). Three tabs — Home · Library · Search — on the
          same <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">.frosted-glass</code> surface
          as the <span className="text-foreground">Mobile Header</span>, so the two bookend the screen.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-6 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Active = elevated pill.</span> The
            current tab lifts off the bar as an opaque chip with a soft
            shadow; inactive tabs are muted glyphs.
          </li>
          <li>
            <span className="text-foreground">Deep-page aware.</span> The
            Library tab stays lit on album / playlist / artist detail pages,
            not just the library list.
          </li>
        </ul>
        <div className="max-w-[420px] rounded-xl border border-border bg-muted/30 p-4">
          <div className="relative rounded-lg overflow-hidden">
            <FooterNav activeNav="Albums" onNavChange={() => {}} className="!static" />
          </div>
        </div>
        <p className="text-small text-muted-foreground mt-5 max-w-2xl">
          (Static preview — the live bar pins to the bottom of the content
          area below 608px. Library tab shown active.)
        </p>
      </Section>

      {/* ══ PAGE SECTION ══ */}
      {/*
        Page-section primitive shared by the buyer-side purchase detail and
        the seller-side order detail. Heading sits OUT of the box so boxed
        and unboxed sections share the same hierarchy; vertical rhythm
        carries separation between adjacent flat sections.
      */}
      <Section id="page-section" title="Page Section"
        usage={[
          { label: "Shop › Orders → order detail", href: "/?page=Shop&shop-tab=orders" },
          { label: "Purchases → purchase detail",  href: "/?page=Purchases" },
        ]}>
        <div className="flex flex-col gap-10 max-w-2xl">
          <PageSection title="Flat section">
            <p className="text-small text-muted-foreground">
              The default. Heading + content with no chrome — vertical rhythm
              between siblings does the visual separation. Used for fulfillment,
              timeline, refund and communications surfaces.
            </p>
          </PageSection>

          <PageSection
            title="Flat with action"
            action={<Button variant="outline">Action</Button>}
          >
            <p className="text-small text-muted-foreground">
              An action slot right-aligns next to the heading. Use for the
              "next forward step" on a section (e.g. Mark as shipped).
            </p>
          </PageSection>

          <PageSection title="Boxed section" boxed>
            <p className="text-small text-foreground">
              <code className="text-xsmall text-muted-foreground">boxed</code> wraps
              the children in a bordered card. Reserved for product / data lists
              where the container reinforces the grouping (currently only Items).
            </p>
          </PageSection>
        </div>
      </Section>

      {/* ══ ITEMS ══ */}
      {/*
        Shared product-list + money-breakdown card. Same component drives
        both the buyer purchase-detail page (format/type subtitle, no SKU,
        no tax) and the seller order-detail page (variant + SKU, discount,
        labelled tax). Each line collapses to a single price at qty=1 and
        expands to muted "unit × qty" + line total at qty>1.
      */}
      <Section id="items" title="Items" phase={2}
        usage={[
          { label: "Shop › Orders → order detail", href: "/?page=Shop&shop-tab=orders" },
          { label: "Purchases → purchase detail",  href: "/?page=Purchases" },
        ]}>
        <div className="flex flex-col gap-10">
          <div>
            <p className="text-base text-muted-foreground mb-3 max-w-2xl">
              Seller side — variant + SKU + discount + labelled tax. Mixed
              quantities exercise the unit-price expansion.
            </p>
            <div className="max-w-2xl">
              <DetailItemsSection
                items={[
                  {
                    image:     "https://picsum.photos/seed/goldenhour/80/80",
                    title:     "Golden Hour — 12\"",
                    subtitle:  "Translucent blue",
                    meta:      "SKU · VIN-GOLDEN",
                    unitPrice: 24,
                    quantity:  1,
                  },
                  {
                    image:     "https://picsum.photos/seed/tourtee/80/80",
                    title:     "Tour Tee",
                    subtitle:  "Heather grey · L",
                    meta:      "SKU · APP-TEE-L",
                    unitPrice: 22,
                    quantity:  2,
                  },
                ]}
                breakdown={{
                  subtotal:     68,
                  discount:     10,
                  discountCode: "FAN10",
                  shipping:     4,
                  tax:          4.64,
                  taxLabel:     "8% FR VAT",
                  total:        66.64,
                }}
              />
            </div>
          </div>

          <div>
            <p className="text-base text-muted-foreground mb-3 max-w-2xl">
              Buyer side — format/type subtitle, free shipping, no tax row.
              Same component, less content.
            </p>
            <div className="max-w-2xl">
              <DetailItemsSection
                items={[
                  {
                    image:     "https://picsum.photos/seed/spaceisplace/80/80",
                    title:     "Space Is The Place — Reissue LP",
                    subtitle:  "Vinyl",
                    unitPrice: 28,
                    quantity:  1,
                  },
                ]}
                breakdown={{
                  subtotal: 28,
                  shipping: 0,
                  total:    28,
                }}
              />
            </div>
          </div>
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
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>File format not supported. Please upload an MP3 or WAV file.</AlertDescription>
          </Alert>
        </div>
      </Section>

      {/* ══ ALERT DIALOG ══ */}
      <Section id="alertdialog" title="AlertDialog">
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
      <Section id="dialog" title="Dialog">
        <DialogsKitchenSink />
      </Section>

      {/* ══ PURCHASE ALBUM DIALOG ══ */}
      {/*
        Buyer-side checkout modal for the "Unlock All Songs" CTA on
        the album detail page. Four states (details → confirm →
        processing → success) with two tier options (Listening /
        Download) mirroring the seller-side Monetisation step.

        Two triggers below cover both customer states: existing
        customer with a saved card (opens on confirm step), and
        first-time customer with no card on file (opens on details
        step). Real prop: `hasSavedPayment={boolean}`.
      */}
      <Section id="purchase-album-dialog" title="Purchase Album Dialog"
        usage={[
          { label: "Album detail — Unlock All Songs CTA", href: "/?page=Album" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          The one-time checkout — wraps Square's universal form and reads as a transactional cart. The non-obvious bits:
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-5 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Tier picker</span> (Listening vs Download) only shows when both prices are set.
          </li>
          <li>
            <span className="text-foreground">Upgrade mode</span> (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">upgradeMode</code> + <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">upgradePrice</code>) — pay-the-difference "add download" flow: tier picker hidden, cart shows just the delta, success fires <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">onUpgraded</code>.
          </li>
        </ul>
        <PurchaseDialogDemo />
      </Section>

      {/* ══ PAYWALL ══ */}
      <Section id="paywall" title="Paywall"
        usage={[
          { label: "Anonymous user trips the 3-play cap (any track)", href: "/?page=Album" },
          { label: "Settings → Subscription → 'Subscribe' (re-trigger)", href: "/?page=Settings" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          The non-profit paywall. Fires when an anonymous account trips
          the 3-play cap (or as a re-entry from Settings). Built as a
          mini landing page, not a generic dialog — a two-up split:{" "}
          <span className="text-foreground">why</span> (headline, pitch,
          brand) on the left, <span className="text-foreground">action</span>{" "}
          (amount picker + CTA) on the right. Stacks to a single flat column
          on mobile via a container query on the dialog width — the brand
          lockup drops to the footer.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-5 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Inline amount picker</span>
            {" "}— 3 preset pills (<code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">$5 / $10 / $20</code>)
            + a full-width <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">$ _</code>
            custom row below them ("choose your own"), always typeable (no
            click-to-reveal). Pre-selected at $10. <span className="text-foreground">$1 minimum</span> — Subscribe disables below it. Active pill = dark outline.
          </li>
          <li>
            <span className="text-foreground">Primary + secondary CTA</span>
            {" "}— oversized Subscribe (150% of <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">size=lg</code>)
            reading <em>"Subscribe — $10.00/mo"</em>, with a secondary
            <em> "Try a free month"</em> button below it (routes to the checkout's
            free-month mode — first month on us, no charge, no card).
          </li>
          <li>
            <span className="text-foreground">Subscribe hand-off</span>
            {" "}— <code className="text-xsmall font-normal font-sans px-1 mx-1 rounded-sm bg-muted">onSubscribe(amount)</code>
            passes the picked amount to the host so the checkout
            opens with it pre-filled. No re-picking.
          </li>
        </ul>
        <SubscriptionPromptDemo />
      </Section>

      {/* ══ LOGIN ══ */}
      <Section id="login" title="Login"
        usage={[
          { label: "Account entry — sign in / create account (passwordless)", href: "/?page=Settings" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Passwordless <span className="text-foreground">email → one-time passcode</span> entry. A plain
          dialog (not the paywall's landing-page split) — muza mark, semantic type, a single pill CTA. It sets
          only its desktop width (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">sm:max-w-md</code>);
          the bottom-sheet-on-mobile behaviour is inherited from the base <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">DialogContent</code>.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-5 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">One step</span> — email field + "Send me a one-time passcode"; the code-entry step reuses the <a href="/?page=DesignSystem#otp-input" className="text-primary-text hover:underline underline-offset-2">OTP Input</a> when wired to a backend.</li>
          <li><span className="text-foreground">CTA disabled</span> until the email field has a value.</li>
          <li><span className="text-foreground">Mobile</span> — bottom sheet via the base default (no positioning override here).</li>
        </ul>
        <LoginDemo />
      </Section>

      {/* ══ CREDITS DIALOG ══ */}
      <Section id="credits-dialog" title="Credits Dialog"
        usage={[
          { label: "Album detail › ⓘ button / “…” → Show credits", href: "/?page=Album" },
          { label: "Any album card / song row → Show credits", href: "/?page=Albums" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Release metadata, opened by every <span className="text-foreground">“Show credits”</span> action and the MediaHeader <span className="text-foreground">ⓘ</span> button. <span className="text-foreground">Albums only</span> — playlists have no release credits.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-5 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">3:2 cover header</span> — the square artwork floats over a blurred, stretched copy of itself, so non-square frames fill cleanly with no letterboxing.
          </li>
          <li>
            <span className="text-foreground">Metadata</span> — main artist, album, label, recording date, then per-instrument performers (role → name). Main artist, album, and every performer are <span className="text-foreground">navigable links</span> (clicking dismisses the dialog).
          </li>
          <li>
            Mounted once via <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">CreditsProvider</code>; any component opens it with <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">useCredits().open(albumKey)</code>. Data is hand-curated in <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">album-catalog</code> (production would source MusicBrainz / Discogs).
          </li>
        </ul>
        <CreditsDialogDemo />
      </Section>

      {/* ══ DRAWER (Sheet) ══ */}
      <Section id="drawer" title="Drawer"
        usage={[
          { label: "Cart drawer (topbar 🛒 button)", href: "/" },
          { label: "Upload music dialog",            href: "/?page=Music" },
        ]}>
        <div className="flex flex-col gap-3 max-w-md">
          <div className="flex flex-wrap gap-2">
            {(["right", "left", "bottom", "top"] as const).map(side => (
              <Sheet
                key={side}
                swipeDirection={side === "top" ? "up" : side === "bottom" ? "down" : side}
              >
                <SheetTrigger render={<Button variant="outline">Open from {side}</Button>} />
                <SheetContent side={side} className={side === "right" || side === "left" ? "max-w-[420px]" : ""}>
                  <SheetHeader>
                    <SheetTitle>Drawer from {side}</SheetTitle>
                    <SheetDescription>
                      Built on base-ui's Drawer primitive — supports swipe-to-dismiss in
                      the matching direction, focus trapping, scroll lock, and snap points.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-6 py-4 text-small text-muted-foreground">
                    <p>
                      Drawer body content scrolls independently of the header and footer.
                      Try dragging the {side} edge to dismiss.
                    </p>
                  </div>
                  <SheetFooter>
                    <SheetClose render={<Button variant="outline">Cancel</Button>} />
                    <SheetClose render={<Button>Save</Button>} />
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            ))}
          </div>
          <p className="text-xsmall text-muted-foreground">
            Cart drawer is built on this. Anchored to any edge; swipe-to-dismiss matches
            the anchor.
          </p>
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
      <Section id="table" title="Table"
        usage={[{ label: "Studio › Music releases", href: "/?page=Music" }]}>
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

      {/* ══ LIST TABLE ══ */}
      {/*
        Borderless list table — drives the Artist › Discography list
        view. Pattern:
          · No `border-b` on rows; hover paints `bg-muted` per-cell
            with first/last cells rounding the outside corners.
          · Cover cell is a play button with hover overlay + active
            (playing) wave animation.
          · Sortable column headers (label + arrow); sticky `<th>`s
            so the header pins to the top of the page scroll.
          · Rightmost cell holds a kebab menu with the same items
            the AlbumCard cover-menu surfaces.
      */}
      <Section id="list-table" title="List Table"
        usage={[{ label: "Artist › Discography (list view)", href: "/?page=Artist" }]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          Single-line rows, no zebra borders. Title + Band are
          separate hover-underline click targets; Recorded and Tracks
          are sortable; click the cover to play; the ⋯ button opens
          the same menu as the AlbumCard.
        </p>
        <ListTableDemo />
      </Section>

      {/* ══ BULK ACTION BAR ══ */}
      <Section id="bulk-action-bar" title="Bulk Action Bar"
        usage={[
          { label: "Studio › Music (select rows)",     href: "/?page=Music" },
          { label: "Shop › Orders / Products",         href: "/?page=Orders" },
          { label: "Library › Albums / Playlists (list view)", href: "/?page=Albums" },
        ]}>
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          The floating pill that appears when a list/table has a
          multi-row selection: a count, a divider, one or more action
          buttons, and a clear (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">✕</code>).
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-6 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Always in view.</span> The live
            bar <span className="text-foreground">portals into the content area</span> (<code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">#app-content</code>)
            and pins to its bottom — so it stays on-screen, centred over the
            content (clear of the sidebar), no matter how far the list
            scrolls. Rendering it inline in a tall table would park it below
            the fold.
          </li>
          <li>
            <span className="text-foreground">Composable actions.</span> Pass
            any number of <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">BulkActionButton</code>s
            as children (each a light chip on the dark pill). They can carry
            icons and inline counts.
          </li>
        </ul>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <SubLabel>Single action</SubLabel>
            <div className="flex"><BulkActionBarContent count={3} onClear={() => {}}>
              <BulkActionButton>Remove from library</BulkActionButton>
            </BulkActionBarContent></div>
          </div>
          <div className="flex flex-col gap-2">
            <SubLabel>Multiple actions (Studio / Music)</SubLabel>
            <div className="flex"><BulkActionBarContent count={12} onClear={() => {}}>
              <BulkActionButton>Make public</BulkActionButton>
              <BulkActionButton>Make private</BulkActionButton>
            </BulkActionBarContent></div>
          </div>
          <div className="flex flex-col gap-2">
            <SubLabel>Actions with icons + inline counts (Orders)</SubLabel>
            <div className="flex"><BulkActionBarContent count={8} onClear={() => {}}>
              <BulkActionButton><Truck className="size-4" />Mark shipped<span className="text-background/60 tabular-nums">(5)</span></BulkActionButton>
              <BulkActionButton><Mail className="size-4" />Email<span className="text-background/60 tabular-nums">(8)</span></BulkActionButton>
            </BulkActionBarContent></div>
          </div>
        </div>
        <p className="text-small text-muted-foreground mt-5 max-w-2xl">
          (Static previews — the live <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">BulkActionBar</code> portals + auto-hides at count 0.)
        </p>
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
        <p className="text-base text-muted-foreground mb-4 max-w-2xl">
          The persistent glass transport, wired into the app via{" "}
          <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">AppPlayer</code> →{" "}
          <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">player-bar-b.tsx</code>.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-6 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Track info grows with the bar.</span>{" "}
            The left section floors at 240px then keeps growing uncapped
            (~24% of the bar width), so wide screens show more of the title /
            artist / album. The title <span className="text-foreground">marquees</span> with
            soft edge-fades when it overflows; artist + album are links.
          </li>
          <li>
            <span className="text-foreground">State-bound.</span> Play/pause,
            the simulated progress (waveform fill + mobile arc), and{" "}
            <span className="text-foreground">Shuffle</span> are driven by the
            global player store, so they stay in sync with the Media Header
            and the overlay. Shuffle uses the shared pop / halo animation.
          </li>
        </ul>
        <div className="flex flex-col gap-8">
          {/* Player B — the LIVE variant (wired into AppPlayer). */}
          <ResizableBox initialWidth={1000} minWidth={368} maxWidth={1500}>
            <div
              className="relative flex flex-col justify-center gap-4 rounded-xl overflow-hidden p-10"
              style={{
                // Zoomed-in Sun Ra "Space Is the Place" cover (high-res),
                // cropped to fill — colourful atmosphere behind the bar.
                backgroundImage: "url(https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/2000x2000bb.jpg)",
                backgroundSize: "160%",
                backgroundPosition: "center",
                minHeight: 360,
              }}
            >
              {/* Darkening overlay so the busy cover sits back and the
                  glass bar + label read clearly on top. */}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/40 to-black/35" />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="self-start flex items-center gap-2">
                  <span className="text-2xsmall font-medium text-foreground bg-background/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    Player Bar
                  </span>
                </div>
                <PlayerBarB className="w-full" />
              </div>
            </div>
          </ResizableBox>
        </div>
      </Section>

      {/* ══ PLAYER OVERLAY (mobile full-screen "Now listening") ══ */}
      <Section id="player-overlay" title="Player Overlay">
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          The full mobile playback chrome via{" "}
          <code className="text-xsmall font-normal font-sans px-1 rounded-sm bg-muted">MobilePlayerShell</code>:
          the <a href="/?page=DesignSystem#footer-nav" className="text-primary-text hover:underline underline-offset-2">Footer Nav</a> pinned
          to the bottom, the mini <span className="text-foreground">Player Bar</span> resting
          flush on top of it, and the full-screen "Now listening" overlay.
          Tap the mini bar to slide the overlay up; tap its drag handle to
          dismiss. The waveform shows played / unplayed progress and
          Shuffle stays in sync with the rest of the player.
        </p>
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
// Placeholder for the prototype's Explore tab. The previous Explore
// page doubled as the design-system kitchen sink, which has now
// moved to its own `/design-system` route. The product's real
// Explore (discover music) will replace this stub.
function ExplorePlaceholder() {
  return (
    <div className="max-w-[1480px] min-[1920px]:max-w-[1716px] mx-auto px-page py-20">
      {/* Mobile header already shows "Explore" (with the search field). */}
      <h1 className="hidden sm:block text-2xlarge font-medium tracking-tight mb-3">Explore</h1>
      <p className="text-small text-muted-foreground max-w-xl mb-6">
        The discover-music surface lives here. Coming soon.
      </p>
      <p className="text-small text-muted-foreground max-w-xl">
        Looking for the design system?{" "}
        <a href="/design-system" className="text-foreground underline underline-offset-[3px] [text-decoration-thickness:1px]">
          It moved to <code className="text-xsmall font-normal font-sans px-1 mx-0.5 rounded-sm bg-muted">/design-system</code>
        </a>
        .
      </p>
    </div>
  )
}

// Media-detail pages → the list they return "back" to. Drives the top
// bar's back chevron (which replaces the old in-gutter back button).
const DETAIL_BACK: Record<string, string> = {
  Album:    "Albums",
  Playlist: "Playlists",
  Artist:   "Home",
}

// Pages where the persistent player makes sense — the music "listening"
// surfaces. Studio (seller tools), Settings, Wallet, Shop and Purchases
// are intentionally excluded; playback isn't their context.
const LISTENING_PAGES = new Set<string>([
  "Home", "Explore",
  "Library", "Albums", "Artists", "Playlists", "Songs",
  "Album", "Playlist", "Artist",
])

export default function Home() {
  // ── URL-backed navigation ──────────────────────────────────────────────
  // Top-level page lives in the `?page=<View>` query param so links are
  // shareable and survive reload. Anchor `#<section-id>` on the Explore
  // page still works as expected (e.g. `?page=Explore#player-bar`).
  const [params, setParams] = useSearchParams()
  const activeNav = params.get("page") ?? "Home"
  const searchQuery = params.get("q") ?? ""

  // Nav-driven loading state for the top progress bar.
  // Flips true on every activeNav change and back to false after a
  // short hold. The hold needs to exceed the bar's 200ms show-after
  // threshold so the bar actually appears — without it the bar
  // correctly stays hidden because navigation in this prototype is
  // synchronous (<10ms). When real data fetching lands later, swap
  // this fixed timeout for the actual `isFetching` flag.
  const [navLoading, setNavLoading] = useState(false)
  useEffect(() => {
    setNavLoading(true)
    const id = setTimeout(() => setNavLoading(false), 600)
    return () => clearTimeout(id)
  }, [activeNav])

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

  // Sidebar auto-collapses at a breakpoint synced to the MediaHeader's
  // full-cluster tier (see `useSidebarAutoCollapsed`): below ~1069px the
  // expanded 208px sidebar would push the detail-page header out of its
  // richest layout, so we collapse it to reclaim that width. "Auto wins
  // on resize" — the effect only fires when the threshold is crossed, so
  // a manual toggle is respected until the next crossing.
  const autoCollapsed = useSidebarAutoCollapsed()
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => { setCollapsed(autoCollapsed) }, [autoCollapsed])
  // Below the phone breakpoint the sidebar is swapped for a bottom tab bar.
  const footerNav = useFooterNav()
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
    // Wait one frame so the target section is in the layout tree, then use
    // the same snappy ease-out tween as the quick-nav chips.
    requestAnimationFrame(() => scrollToSection(hash))
  }, [activeNav])

  // Design system runs in its own full-bleed layout (its own
  // sidebar, no product AppShell). Render it BEFORE the AppShell
  // wrapper so it isn't nested inside the product sidebar/topbar.
  // Wrapped in a keyed div so the DS↔prototype swap also gets the
  // pageFadeIn transition (otherwise that boundary would be a hard
  // visual cut — every other in-app nav fades, this one wouldn't).
  // Always wrap in the same shape (Fragment > TopProgressBar +
  // CartProvider), regardless of route — flipping between two
  // different top-level structures (`<>` vs `<CartProvider>`) on
  // the same activeNav change confuses React's reconciler and
  // produces a `removeChild` crash. By keeping the outer tree
  // stable, only the inner DS-or-AppShell node remounts.
  // CartProvider runs even on the DS route — harmless, it's just
  // a state holder.
  if (activeNav === "DesignSystem") {
    return (
      <CartProvider>
        <UserLibraryProvider seed={LIBRARY_SEED} savedSeed={LIBRARY_SAVED_SEED}>
          <UserAccountProvider initialTier="anonymous" initialPlayCounts={DEMO_PLAY_COUNTS}>
            <CreditsProvider>
              <PlayerProvider>
                <TopProgressBar loading={navLoading} />
                <div key="ds" className="h-screen [animation:pageFadeIn_250ms_ease-out]">
                  <DesignSystem />
                </div>
              </PlayerProvider>
            </CreditsProvider>
          </UserAccountProvider>
        </UserLibraryProvider>
      </CartProvider>
    )
  }

  return (
    <CartProvider>
    <UserLibraryProvider seed={LIBRARY_SEED} savedSeed={LIBRARY_SAVED_SEED}>
    <UserAccountProvider initialTier="anonymous" initialPlayCounts={DEMO_PLAY_COUNTS}>
    <CreditsProvider>
    <PlayerProvider>
    <DetailActionsProvider>
    {/* Top progress bar — fires on every activeNav change. Sits
        outside the keyed AppShell wrapper so it isn't remounted
        on internal nav. */}
    <TopProgressBar loading={navLoading} />
    {/* Outer keyed wrapper — stable key="app" while inside the
        prototype, so internal navigation doesn't remount the
        AppShell (which would kill sidebar state). The animation
        only fires once when transitioning into the AppShell from
        the DS route. */}
    <div key="app" className="flex h-screen bg-background [animation:pageFadeIn_250ms_ease-out]">
      {/* On phones the sidebar is dropped for a bottom tab bar; the
          content takes the full width. */}
      {!footerNav && (
        <Sidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          activeNav={activeNav}
          onNavChange={navigate}
        />
      )}
      {/* `id="app-content"` is the portal target for the floating
          BulkActionBar — it pins to this fixed-height, content-area box
          (relative, excludes the sidebar) so it stays at the bottom of
          the viewport regardless of how far the list scrolls. */}
      <main id="app-content" className="flex-1 min-w-0 flex flex-col relative">
        {/* Back lives in the chrome (top bar), not a page gutter — so it's
            unaffected by the responsive px-page gutter. Shown on the
            media-detail pages, returning to their list. On phones the
            desktop Topbar is swapped for the frosted MobileAppHeader,
            which lives INSIDE the scroll container below (sticky) so page
            content scrolls under its glass. */}
        {/* Frosted topbar overlays the scroll area (absolute, not in
            flow) so page content scrolls UNDER its glass — same as the
            mobile FooterNav. The scroll area gets `pt-[54px]` to start
            content below it, preserving the original layout. */}
        {!footerNav && (
          <Topbar
            onBack={DETAIL_BACK[activeNav] ? () => navigate(DETAIL_BACK[activeNav]) : undefined}
            actions={<TopbarDefaultActions />}
            className="absolute inset-x-0 top-0 z-30"
          />
        )}
        {/* Bottom gutter on every page so content can always scroll clear of
            the floating player bar (desktop) / footer-nav + mini bar (mobile)
            — nothing ever hides behind them. */}
        <div ref={scrollRef} className={cn("flex-1 overflow-auto pb-32", !footerNav && "pt-[54px]")}>
          {/* Phone header — sticky top of the scroll area so the frosted
              glass reads against scrolling content. Sits OUTSIDE the
              keyed fade wrapper so it doesn't re-fade on every nav. */}
          {footerNav && (
            <MobileAppHeader
              activeNav={activeNav}
              onNavChange={navigate}
              onBack={DETAIL_BACK[activeNav] ? () => navigate(DETAIL_BACK[activeNav]) : undefined}
            />
          )}
          {/* `key={activeNav}` remounts the inner wrapper on every
              navigation, which lets the pageFadeIn keyframe run once
              per view swap. 250ms crossfade (opacity + 6px lift) —
              perceivable enough to register as a transition without
              ever feeling like "loading." */}
          <div key={activeNav} className="[animation:pageFadeIn_250ms_ease-out]">
            {activeNav === "Home"      && <HomeView onNavigate={navigate} />}
            {activeNav === "Explore"   && (
              searchQuery ? <SearchResultsView query={searchQuery} /> : <ExplorePlaceholder />
            )}
            {activeNav === "Purchases" && <PurchasesView />}
            {activeNav === "Settings"  && <SettingsView />}
            {activeNav === "Library"   && <LibraryAllView />}
            {activeNav === "Albums"    && <LibraryAlbumsView />}
            {activeNav === "Artists"   && <LibraryArtistsView />}
            {activeNav === "Playlists" && <LibraryPlaylistsView />}
            {activeNav === "Artist"    && <ArtistProfileView />}
            {activeNav === "Album"     && <AlbumDetailView />}
            {activeNav === "Playlist"  && <PlaylistDetailView />}
            {Object.keys(STUDIO_TABS).includes(activeNav) && (
              <StudioView
                page={activeNav}
                onOpenUpload={() => { setUploadOpen(true); setUploadMinimized(false) }}
              />
            )}
            {activeNav === "Songs"     && <LibrarySongsView />}
          </div>
        </div>

        {/* Persistent player — one instance, shown only on the music
            "listening" surfaces (not Studio / Settings / Wallet / Shop /
            Purchases, where playback isn't the context). Reads the global
            player store; renders nothing until a track is played. */}
        {LISTENING_PAGES.has(activeNav) && <AppPlayer footerNav={footerNav} />}

        {/* Mobile bottom tab bar — replaces the sidebar below the
            footer-nav breakpoint. Absolute within main so it overlays
            the (full-width) content. */}
        {footerNav && <FooterNav activeNav={activeNav} onNavChange={navigate} />}

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
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${uploadProgress}%` }} />
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
    </DetailActionsProvider>
    </PlayerProvider>
    </CreditsProvider>
    </UserAccountProvider>
    </UserLibraryProvider>
    </CartProvider>
  )
}
