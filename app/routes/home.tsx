import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router"
import { cn } from "@/lib/utils"
import { useSidebarAutoCollapsed, useFooterNav, WindowWidthContext } from "@/lib/use-media-query"
import { useKeyboardInset } from "@/lib/use-keyboard-inset"
import { FooterNav } from "@/components/app/footer-nav"
import { MobileAppHeader } from "@/components/app/mobile-app-header"
import { MediaListItem } from "@/components/ui/media-list-item"
import { SearchResultsView } from "@/components/app/search-results-view"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { registerAlbums } from "@/lib/album-catalog"
import { CreditsProvider } from "@/components/app/credits-dialog"
import { AddToPlaylistProvider } from "@/components/app/add-to-playlist-dialog"
import { CreatePlaylistProvider } from "@/components/app/create-playlist-dialog"
import { PlaylistEditDrawer, PlaylistEditorProvider } from "@/components/app/playlist-edit-drawer"
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
import { AVATAR_PALETTE } from "@/lib/avatar"
import { CartProvider } from "@/lib/cart"
import { UserLibraryProvider, useUserLibrary } from "@/lib/user-library"
import { UserAccountProvider } from "@/lib/user-account"
import { albumMetaFor, libraryIdForTitle } from "@/lib/album-meta"
import { AddMusicIcon } from "@/components/ui/media-icons"
import { componentDoc } from "@/lib/component-docs"
import { Markdown, MarkdownInline } from "@/components/ds/markdown"
import { Example, WINDOW_WIDTHS } from "@/components/ds/example"
import { FOOTER_NAV_BELOW } from "@/lib/use-media-query"
import { ResponsiveLab } from "@/components/ds/responsive-lab"
import DialogFormExample from "@/ds-examples/dialog-form"
import dialogFormSrc from "@/ds-examples/dialog-form.tsx?raw"
import CardRailRowExample from "@/ds-examples/card-rail-row"
import cardRailRowSrc from "@/ds-examples/card-rail-row.tsx?raw"
import CardRailGridExample from "@/ds-examples/card-rail-grid"
import cardRailGridSrc from "@/ds-examples/card-rail-grid.tsx?raw"
import SelectBasicExample from "@/ds-examples/select-basic"
import selectBasicExampleSrc from "@/ds-examples/select-basic.tsx?raw"
import AlbumCardBasicExample from "@/ds-examples/album-card-basic"
import albumCardBasicExampleSrc from "@/ds-examples/album-card-basic.tsx?raw"
import SongListItemBasicExample from "@/ds-examples/song-list-item-basic"
import songListItemBasicExampleSrc from "@/ds-examples/song-list-item-basic.tsx?raw"
import DetailMenuBasicExample from "@/ds-examples/detail-menu-basic"
import detailMenuBasicExampleSrc from "@/ds-examples/detail-menu-basic.tsx?raw"
import SkeletonBasicExample from "@/ds-examples/skeleton-basic"
import skeletonBasicExampleSrc from "@/ds-examples/skeleton-basic.tsx?raw"
import PopoverBasicExample from "@/ds-examples/popover-basic"
import popoverBasicExampleSrc from "@/ds-examples/popover-basic.tsx?raw"
import TableBasicExample from "@/ds-examples/table-basic"
import tableBasicExampleSrc from "@/ds-examples/table-basic.tsx?raw"
import ListTableBasicExample from "@/ds-examples/list-table-basic"
import listTableBasicExampleSrc from "@/ds-examples/list-table-basic.tsx?raw"
import BulkActionBarBasicExample from "@/ds-examples/bulk-action-bar-basic"
import bulkActionBarBasicExampleSrc from "@/ds-examples/bulk-action-bar-basic.tsx?raw"
import BulkActionBarCountsExample from "@/ds-examples/bulk-action-bar-counts"
import bulkActionBarCountsExampleSrc from "@/ds-examples/bulk-action-bar-counts.tsx?raw"
import PaginationBasicExample from "@/ds-examples/pagination-basic"
import paginationBasicExampleSrc from "@/ds-examples/pagination-basic.tsx?raw"
import CommandBasicExample from "@/ds-examples/command-basic"
import commandBasicExampleSrc from "@/ds-examples/command-basic.tsx?raw"
import CommandDialogExample from "@/ds-examples/command-dialog"
import commandDialogExampleSrc from "@/ds-examples/command-dialog.tsx?raw"
import OtpInputBasicExample from "@/ds-examples/otp-input-basic"
import otpInputBasicExampleSrc from "@/ds-examples/otp-input-basic.tsx?raw"
import FormBasicExample from "@/ds-examples/form-basic"
import formBasicExampleSrc from "@/ds-examples/form-basic.tsx?raw"
import MenuBasicExample from "@/ds-examples/menu-basic"
import menuBasicExampleSrc from "@/ds-examples/menu-basic.tsx?raw"
import NavRowBasicExample from "@/ds-examples/nav-row-basic"
import navRowBasicExampleSrc from "@/ds-examples/nav-row-basic.tsx?raw"
import NavigationMenuBasicExample from "@/ds-examples/navigationmenu-basic"
import navigationMenuBasicExampleSrc from "@/ds-examples/navigationmenu-basic.tsx?raw"
import DatePickerBasicExample from "@/ds-examples/datepicker-basic"
import datePickerBasicExampleSrc from "@/ds-examples/datepicker-basic.tsx?raw"
import CheckboxBasicExample from "@/ds-examples/checkbox-basic"
import checkboxBasicExampleSrc from "@/ds-examples/checkbox-basic.tsx?raw"
import SelectTrackBasicExample from "@/ds-examples/select-track-basic"
import selectTrackBasicExampleSrc from "@/ds-examples/select-track-basic.tsx?raw"
import RadioCardBasicExample from "@/ds-examples/radio-card-basic"
import radioCardBasicExampleSrc from "@/ds-examples/radio-card-basic.tsx?raw"
import SwitchBasicExample from "@/ds-examples/switch-basic"
import switchBasicExampleSrc from "@/ds-examples/switch-basic.tsx?raw"
import SliderBasicExample from "@/ds-examples/slider-basic"
import sliderBasicExampleSrc from "@/ds-examples/slider-basic.tsx?raw"
import ProgressBasicExample from "@/ds-examples/progress-basic"
import progressBasicExampleSrc from "@/ds-examples/progress-basic.tsx?raw"
import MeterBasicExample from "@/ds-examples/meter-basic"
import meterBasicExampleSrc from "@/ds-examples/meter-basic.tsx?raw"
import SpinnerBasicExample from "@/ds-examples/spinner-basic"
import spinnerBasicExampleSrc from "@/ds-examples/spinner-basic.tsx?raw"
import TopProgressBarBasicExample from "@/ds-examples/top-progress-bar-basic"
import topProgressBarBasicExampleSrc from "@/ds-examples/top-progress-bar-basic.tsx?raw"
import SeparatorBasicExample from "@/ds-examples/separator-basic"
import separatorBasicExampleSrc from "@/ds-examples/separator-basic.tsx?raw"
import AvatarBasicExample from "@/ds-examples/avatar-basic"
import avatarBasicExampleSrc from "@/ds-examples/avatar-basic.tsx?raw"
import UserAvatarBasicExample from "@/ds-examples/user-avatar-basic"
import userAvatarBasicExampleSrc from "@/ds-examples/user-avatar-basic.tsx?raw"
import UserAvatarPaletteExample from "@/ds-examples/user-avatar-palette"
import userAvatarPaletteExampleSrc from "@/ds-examples/user-avatar-palette.tsx?raw"
import TabsBasicExample from "@/ds-examples/tabs-basic"
import tabsBasicExampleSrc from "@/ds-examples/tabs-basic.tsx?raw"
import TabsSizesExample from "@/ds-examples/tabs-sizes"
import tabsSizesExampleSrc from "@/ds-examples/tabs-sizes.tsx?raw"
import TooltipBasicExample from "@/ds-examples/tooltip-basic"
import tooltipBasicExampleSrc from "@/ds-examples/tooltip-basic.tsx?raw"
import ScrollAreaBasicExample from "@/ds-examples/scrollarea-basic"
import scrollAreaBasicExampleSrc from "@/ds-examples/scrollarea-basic.tsx?raw"
import CollapsibleBasicExample from "@/ds-examples/collapsible-basic"
import collapsibleBasicExampleSrc from "@/ds-examples/collapsible-basic.tsx?raw"
import AccordionBasicExample from "@/ds-examples/accordion-basic"
import accordionBasicExampleSrc from "@/ds-examples/accordion-basic.tsx?raw"
import InputBasicExample from "@/ds-examples/input-basic"
import inputBasicExampleSrc from "@/ds-examples/input-basic.tsx?raw"
import ControlSizeLadderExample from "@/ds-examples/control-size-ladder"
import controlSizeLadderExampleSrc from "@/ds-examples/control-size-ladder.tsx?raw"
import InputComposedExample from "@/ds-examples/input-composed"
import inputComposedExampleSrc from "@/ds-examples/input-composed.tsx?raw"
import ChipInputBasicExample from "@/ds-examples/chip-input-basic"
import chipInputBasicExampleSrc from "@/ds-examples/chip-input-basic.tsx?raw"
import NumberFieldBasicExample from "@/ds-examples/numberfield-basic"
import numberFieldBasicExampleSrc from "@/ds-examples/numberfield-basic.tsx?raw"
import MultiSelectBasicExample from "@/ds-examples/multi-select-basic"
import multiSelectBasicExampleSrc from "@/ds-examples/multi-select-basic.tsx?raw"
import SingleSelectBasicExample from "@/ds-examples/single-select-basic"
import singleSelectBasicExampleSrc from "@/ds-examples/single-select-basic.tsx?raw"
import ComboboxBasicExample from "@/ds-examples/combobox-basic"
import comboboxBasicExampleSrc from "@/ds-examples/combobox-basic.tsx?raw"
import AlertsBasicExample from "@/ds-examples/alerts-basic"
import alertsBasicExampleSrc from "@/ds-examples/alerts-basic.tsx?raw"
import AlertDialogBasicExample from "@/ds-examples/alertdialog-basic"
import alertDialogBasicExampleSrc from "@/ds-examples/alertdialog-basic.tsx?raw"
import DialogBasicExample from "@/ds-examples/dialog-basic"
import dialogBasicExampleSrc from "@/ds-examples/dialog-basic.tsx?raw"
import PurchaseAlbumDialogBasicExample from "@/ds-examples/purchase-album-dialog-basic"
import purchaseAlbumDialogBasicExampleSrc from "@/ds-examples/purchase-album-dialog-basic.tsx?raw"
import PurchaseAlbumDialogLiveExample from "@/ds-examples/purchase-album-dialog-live"
import purchaseAlbumDialogLiveExampleSrc from "@/ds-examples/purchase-album-dialog-live.tsx?raw"
import PaywallBasicExample from "@/ds-examples/paywall-basic"
import paywallBasicExampleSrc from "@/ds-examples/paywall-basic.tsx?raw"
import PaywallCheckoutExample from "@/ds-examples/paywall-checkout"
import PaywallCheckoutFreeExample from "@/ds-examples/paywall-checkout-free"
import paywallCheckoutExampleSrc from "@/ds-examples/paywall-checkout.tsx?raw"
import paywallCheckoutFreeExampleSrc from "@/ds-examples/paywall-checkout-free.tsx?raw"
import PaywallLiveExample from "@/ds-examples/paywall-live"
import paywallLiveExampleSrc from "@/ds-examples/paywall-live.tsx?raw"
import LoginBasicExample from "@/ds-examples/login-basic"
import loginBasicExampleSrc from "@/ds-examples/login-basic.tsx?raw"
import LoginLiveExample from "@/ds-examples/login-live"
import loginLiveExampleSrc from "@/ds-examples/login-live.tsx?raw"
import CreditsDialogBasicExample from "@/ds-examples/credits-dialog-basic"
import creditsDialogBasicExampleSrc from "@/ds-examples/credits-dialog-basic.tsx?raw"
import CreditsDialogLiveExample from "@/ds-examples/credits-dialog-live"
import creditsDialogLiveExampleSrc from "@/ds-examples/credits-dialog-live.tsx?raw"
import DrawerBasicExample from "@/ds-examples/drawer-basic"
import drawerBasicExampleSrc from "@/ds-examples/drawer-basic.tsx?raw"
import { ToastPreview } from "@/components/ui/toast"
import ToastBasicExample from "@/ds-examples/toast-basic"
import toastBasicExampleSrc from "@/ds-examples/toast-basic.tsx?raw"
import ToastLiveExample from "@/ds-examples/toast-live"
import toastLiveExampleSrc from "@/ds-examples/toast-live.tsx?raw"
import ButtonBasicExample from "@/ds-examples/button-basic"
import buttonBasicExampleSrc from "@/ds-examples/button-basic.tsx?raw"
import ToggleBasicExample from "@/ds-examples/toggle-basic"
import toggleBasicExampleSrc from "@/ds-examples/toggle-basic.tsx?raw"
import ToggleGroupBasicExample from "@/ds-examples/togglegroup-basic"
import toggleGroupBasicExampleSrc from "@/ds-examples/togglegroup-basic.tsx?raw"
import ToggleGroupSizesExample from "@/ds-examples/togglegroup-sizes"
import toggleGroupSizesExampleSrc from "@/ds-examples/togglegroup-sizes.tsx?raw"
import ToolbarBasicExample from "@/ds-examples/toolbar-basic"
import toolbarBasicExampleSrc from "@/ds-examples/toolbar-basic.tsx?raw"
import BadgeBasicExample from "@/ds-examples/badge-basic"
import badgeBasicExampleSrc from "@/ds-examples/badge-basic.tsx?raw"
import StatusBadgeBasicExample from "@/ds-examples/status-badge-basic"
import statusBadgeBasicExampleSrc from "@/ds-examples/status-badge-basic.tsx?raw"
import OrderStatusBadgeBasicExample from "@/ds-examples/order-status-badge-basic"
import orderStatusBadgeBasicExampleSrc from "@/ds-examples/order-status-badge-basic.tsx?raw"
import PurchasedBadgeBasicExample from "@/ds-examples/purchased-badge-basic"
import purchasedBadgeBasicExampleSrc from "@/ds-examples/purchased-badge-basic.tsx?raw"
import ChipsBasicExample from "@/ds-examples/chips-basic"
import chipsBasicExampleSrc from "@/ds-examples/chips-basic.tsx?raw"
import ChipsCountExample from "@/ds-examples/chips-count"
import chipsCountExampleSrc from "@/ds-examples/chips-count.tsx?raw"
import AlbumCardVariantsExample from "@/ds-examples/album-card-variants"
import albumCardVariantsExampleSrc from "@/ds-examples/album-card-variants.tsx?raw"
import ArtistCardBasicExample from "@/ds-examples/artist-card-basic"
import artistCardBasicExampleSrc from "@/ds-examples/artist-card-basic.tsx?raw"
import PlaylistCardBasicExample from "@/ds-examples/playlist-card-basic"
import playlistCardBasicExampleSrc from "@/ds-examples/playlist-card-basic.tsx?raw"
import CoverPlayButtonBasicExample from "@/ds-examples/cover-play-button-basic"
import coverPlayButtonBasicExampleSrc from "@/ds-examples/cover-play-button-basic.tsx?raw"
import CoverPlayButtonWaveExample from "@/ds-examples/cover-play-button-wave"
import coverPlayButtonWaveExampleSrc from "@/ds-examples/cover-play-button-wave.tsx?raw"
import SongListItemTrackNumberExample from "@/ds-examples/song-list-item-track-number"
import songListItemTrackNumberExampleSrc from "@/ds-examples/song-list-item-track-number.tsx?raw"
import MediaListItemBasicExample from "@/ds-examples/media-list-item-basic"
import mediaListItemBasicExampleSrc from "@/ds-examples/media-list-item-basic.tsx?raw"
import SearchBasicExample from "@/ds-examples/search-basic"
import searchBasicExampleSrc from "@/ds-examples/search-basic.tsx?raw"
import SearchPanelExample from "@/ds-examples/search-panel"
import searchPanelExampleSrc from "@/ds-examples/search-panel.tsx?raw"
import SongRailBasicExample from "@/ds-examples/song-rail-basic"
import songRailBasicExampleSrc from "@/ds-examples/song-rail-basic.tsx?raw"
import ProductCardBasicExample from "@/ds-examples/product-card-basic"
import productCardBasicExampleSrc from "@/ds-examples/product-card-basic.tsx?raw"
import CheckoutCardBasicExample from "@/ds-examples/checkout-card-basic"
import checkoutCardBasicExampleSrc from "@/ds-examples/checkout-card-basic.tsx?raw"
import MobileHeaderBasicExample from "@/ds-examples/mobile-header-basic"
import mobileHeaderBasicExampleSrc from "@/ds-examples/mobile-header-basic.tsx?raw"
import MediaHeaderBasicExample from "@/ds-examples/media-header-basic"
import mediaHeaderBasicExampleSrc from "@/ds-examples/media-header-basic.tsx?raw"
import MediaHeaderPurchasedExample from "@/ds-examples/media-header-purchased"
import mediaHeaderPurchasedExampleSrc from "@/ds-examples/media-header-purchased.tsx?raw"
import MediaHeaderPlaylistExample from "@/ds-examples/media-header-playlist"
import mediaHeaderPlaylistExampleSrc from "@/ds-examples/media-header-playlist.tsx?raw"
import ArtistHeaderBasicExample from "@/ds-examples/artist-header-basic"
import artistHeaderBasicExampleSrc from "@/ds-examples/artist-header-basic.tsx?raw"
import MobileHeaderExploreExample from "@/ds-examples/mobile-header-explore"
import mobileHeaderExploreExampleSrc from "@/ds-examples/mobile-header-explore.tsx?raw"
import FooterNavBasicExample from "@/ds-examples/footer-nav-basic"
import footerNavBasicExampleSrc from "@/ds-examples/footer-nav-basic.tsx?raw"
import PageSectionBasicExample from "@/ds-examples/page-section-basic"
import pageSectionBasicExampleSrc from "@/ds-examples/page-section-basic.tsx?raw"
import ItemsBasicExample from "@/ds-examples/items-basic"
import itemsBasicExampleSrc from "@/ds-examples/items-basic.tsx?raw"
import ItemsBuyerExample from "@/ds-examples/items-buyer"
import itemsBuyerExampleSrc from "@/ds-examples/items-buyer.tsx?raw"
import PlayerBarBasicExample from "@/ds-examples/player-bar-basic"
import playerBarBasicExampleSrc from "@/ds-examples/player-bar-basic.tsx?raw"
import PlayerOverlayBasicExample from "@/ds-examples/player-overlay-basic"
import playerOverlayBasicExampleSrc from "@/ds-examples/player-overlay-basic.tsx?raw"
import { SECTION_STATUS_BY_ID, LAST_GIT_PUSH, sectionLastChanged, sectionSourceUrl, formatStatusDate, type SectionStatus } from "./ds-status"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge, ContentTypeBadge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { InputSelect } from "@/components/ui/input-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox, CheckboxField } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { QtyStepper } from "@/components/ui/qty-stepper"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Combobox, ComboboxTrigger, ComboboxContent, ComboboxItem } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Chip, ChipDismiss, ChipGroup } from "@/components/ui/chip"
import { SingleSelect } from "@/components/ui/single-select"
import {
  AlertCircle, CheckCircle2, Info, Music2, Heart, Share,
  SkipBack, SkipForward, Play, Pause, Shuffle, Repeat,
  Settings, User, LogOut, Upload, MoreHorizontal,
  Plus, Search, ChevronDown, Trash2, Maximize2,
  Radio as RadioIcon, ShoppingBag, Disc3, Disc, CassetteTape, Shirt, Ghost,
  ChevronLeft, ChevronRight, Globe, X, Sun, Moon, MapPin, CircleCheckBig,
  ArrowUpRight,
  ListPlus, ListStart, ListEnd, Mic, Flag, Clock, Lock, ListMusic,
} from "lucide-react"
import { NavRow } from "@/components/ui/nav-row"
import { SelectTrackButton } from "@/components/ui/select-track-button"
import { DetailMoreButton, DetailMenuSurface } from "@/components/ui/detail-more-button"
import { SearchPanel } from "@/components/ui/search-panel"
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
import { LibraryArtistsView, SAVED_ARTISTS } from "@/components/app/library-artists-view"
import { LibraryPlaylistsView, SAVED_PLAYLISTS } from "@/components/app/library-playlists-view"
import { LibrarySongsView, SAVED_SONGS_SEED } from "@/components/app/library-songs-view"
import { ExperimentsView } from "@/components/app/experiments-view"
// Imported after the per-type views so the SAVED_* data modules they
// own are initialised before this combined view (which reads them)
// enters the playlist-catalog import cycle.
import { LibraryAllView } from "@/components/app/library-all-view"
import { DetailActionsProvider } from "@/lib/detail-actions"
import { AlbumCard } from "@/components/ui/album-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { PlaylistCard } from "@/components/ui/playlist-card"
import { ProductCard } from "@/components/ui/product-card"
import { SongListItem, ROW_STEPS } from "@/components/ui/song-list-item"
import { PlayingWave } from "@/components/ui/playing-wave"
import { Spinner } from "@/components/ui/spinner"
import { TopProgressBar } from "@/components/ui/top-progress-bar"
import { PlaylistCardMenuItems } from "@/components/ui/cover-card-menu"
import { CardRail } from "@/components/app/card-rail"
import { SongRail } from "@/components/app/song-rail"
import { PlaylistCreateCard } from "@/components/ui/playlist-create-card"
import { COUNTRY_CODES, countryName } from "@/lib/countries"
import { MultiSelect } from "@/components/ui/multi-select"
import { PlayerProvider } from "@/lib/player"
import { AppPlayer }     from "@/components/app/app-player"
import { Wordmark }      from "@/components/ui/logo"
import DesignSystem      from "./design-system"

// ─── Section heading component ────────────────────────────────────────────────
// `scroll-mt-6` gives the section 24px of breathing room from the top of the
// scroll container when the quick-nav scrolls to it.
type SectionUsage  = ReadonlyArray<{ label: string; href: string }>

/*
 * The ⓘ on a section header. Opens the component's Markdown docs — one file
 * per component under `docs/components/`, rendered with the app's own tokens.
 * Absent until that file is written, so the button is never a dead end.
 */
function SectionDocButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const entry = componentDoc(id)
  if (!entry) return null
  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label={`About ${entry.title}`} onClick={() => setOpen(true)}>
        <Info />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="md:max-w-[min(46rem,90vw)] flex flex-col"
          // Inline, not a class: the base sheet sets `md:max-h-none`, and
          // between two utilities for the same property the GENERATED CSS
          // order decides, not the order they are listed in — `max-h-none`
          // wins there whatever tailwind-merge keeps. Without a cap the docs
          // modal grew to its content: 5,490px tall in a 1,216px viewport,
          // with its own header scrolled off the top of the screen.
          style={{ maxHeight: "85svh" }}>
          <DialogHeader className="shrink-0">
            <DialogTitle className="md:text-large">{entry.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <Markdown source={entry.body} />
            <p className="mt-6 pt-4 border-t border-border text-2xsmall text-muted-foreground">
              Source of truth:{" "}
              <a
                href={`https://github.com/chris-hug/muza-prototypes/blob/main/${entry.path}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary-text hover:underline underline-offset-2"
              >
                {entry.path}
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

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
  /** Optional override. Normally omitted: the "Used in:" links live in the
   *  component's Markdown frontmatter, like the rest of its prose, so they
   *  stay coupled to the doc instead of being a second copy on this page. */
  usage?:   SectionUsage
  children: React.ReactNode
}) {
  // Fall back to the cycle's central status map when no explicit
  // prop is passed. Lets the prop API stay flexible while keeping
  // 99% of usages driven by the single source of truth.
  const entry           = SECTION_STATUS_BY_ID[id]
  const resolvedStatus  = status ?? entry?.status
  const docEntry        = componentDoc(id)
  const resolvedUsage   = usage ?? (docEntry?.usage.length ? docEntry.usage : undefined)
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

          {(changedDate || sourceUrl || componentDoc(id)) && (
            <div className="ml-auto flex items-center gap-2">
              {/* The component's own Markdown — `docs/components/<id>.md`,
                   the same file an agent reads. Only shows once that file
                   exists, so writing docs is what turns the button on. */}
              <SectionDocButton id={id} />
              {changedDate && (
                <span className="text-small text-muted-foreground tabular-nums">
                  Changed{" "}<span className="text-foreground">{formatStatusDate(changedDate)}</span>
                </span>
              )}
              {sourceUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  // Names the file: this button points at the COMPONENT,
                  // while the one in an Example's `</>` panel points at that
                  // demo's own file. Two links, two different things — and
                  // "GitHub" alone said neither.
                  title={sourceUrl.replace(/^.*\/blob\/main\//, "")}
                  render={<a href={sourceUrl} target="_blank" rel="noreferrer" />}
                >
                  Source
                  <ArrowUpRight className="size-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        {resolvedUsage && resolvedUsage.length > 0 && (
          <p className="text-xsmall font-normal text-muted-foreground mt-3">
            <span className="opacity-70">Used in: </span>
            {resolvedUsage.map((u, i) => (
              <span key={u.label}>
                {i > 0 && <span className="opacity-50"> · </span>}
                {/* No `href` → plain text. That is how a component nothing
                    uses yet still ANSWERS "used in", instead of leaving the
                    line out and looking like an oversight. */}
                {u.href ? (
                  <a href={u.href} className="hover:text-foreground hover:underline underline-offset-[3px] [text-decoration-thickness:1px] transition-colors">
                    {u.label}
                  </a>
                ) : (
                  <span className="italic opacity-80">{u.label}</span>
                )}
              </span>
            ))}
          </p>
        )}
        {/* The intro is the doc's LEAD — the first paragraph of
             docs/components/<id>.md — so the page's prose is a slice of the
             single source of truth, never a second copy. A section without
             a doc shows no intro; write the doc to get one. */}
        {docEntry?.lead && (
          <p className="text-base text-muted-foreground mt-4 max-w-2xl text-pretty">
            <MarkdownInline source={docEntry.lead} />
          </p>
        )}
      </div>
      {/* One example's frame used to sit flush against the next one's title,
          so a title read as a caption on the frame above it. 48px between
          consecutive examples — six times the 8px inside a block, so the
          title clearly belongs to what is UNDER it. Scoped to
          example-after-example so prose between two examples keeps its own
          spacing instead of getting both. */}
      <div className="[&>[data-slot=ds-example]+[data-slot=ds-example]]:mt-12">
        {children}
      </div>
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

function SubLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-xsmall font-normal text-muted-foreground mb-3", className)}>{children}</p>
  )
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

// ─── Home view ────────────────────────────────────────────────────────────────
// The hero logo tracks the viewport in CSS, not in React — a resize listener
// that re-renders HomeView (every rail, every card) on each pixel made
// window-resizing visibly stutter.
const LOGO_SIZE = "clamp(160px, 20vw, 304px)"

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
        <AnimatedLogo size={LOGO_SIZE} />
      </div>
      <p className="text-[clamp(2rem,_3vw,_4rem)] leading-[1.1] font-normal text-foreground mt-16">Built as a non-profit, muza exists to fix streaming's broken economics. Instead of paying artists per click, muza rewards attention — distributing revenue based on actual listening time and direct listener support. Your subscription goes only to the artists you play.</p>
      <p className="text-[clamp(2rem,_3vw,_4rem)] leading-[1.1] font-normal text-foreground mt-10">We combine subscription streaming with direct artist uploads, giving musicians full control over how their music is shared and monetised. Artists retain ownership, receive up to 90–95% of revenue, and are paid directly — no hidden intermediaries.</p>
      <div className="flex justify-center mt-24">
        {/* Padding and type scale with the viewport: at a flat `px-[5.5rem]`
             this button measured 374px wide, so on a 360px phone it hung ~7px
             off BOTH edges. Nothing here scrolls horizontally, so it was
             clipped rather than reachable — but iOS still pans the visual
             viewport when content exceeds it, which is the stray horizontal
             drag on small phones. `max-w-full` is the backstop. */}
        <Button
          size="lg"
          className="max-w-full text-[clamp(1.5rem,_5vw,_2rem)] px-[clamp(2rem,_12vw,_5.5rem)] h-[clamp(4rem,_14vw,_5.5rem)] rounded-full transition-transform duration-300 ease-out hover:transition-transform hover:duration-250 hover:ease-[cubic-bezier(0.22,1.8,0.36,1)] hover:scale-[1.07]"
          onClick={() => onNavigate("Music")}
        >
          Join muza now
        </Button>
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


// Borderless list table — pattern used by Artist › Discography list
// view. Demo wires a small set of releases with hover + active-row
// states + sortable headers + kebab menu.
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

// ─── Kitchen sink (Explore view) ──────────────────────────────────────────────
export function ExploreView({ showHero = true, showQuickNav = true }: { showHero?: boolean; showQuickNav?: boolean } = {}) {
  const [playing, setPlaying] = useState(false)
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
        {/* SUMMARY ONLY. The full write-up — arithmetic, ladders, why the two
            window gates are not one, the duplication map, what the stage can
            and cannot show — is docs/components/responsive.md behind ⓘ, and
            prose lives in exactly one place (docs/components/README.md). This
            section states the rule, shows it happening, and points. */}
        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          The common ground every component builds on: how it adapts to <span className="text-foreground">width</span> and to{" "}
          <span className="text-foreground">pointer type</span>. Width is measured <span className="text-foreground">three ways, and only three</span> —
          the full account, with the arithmetic, is behind ⓘ; each component's own steps live in its section.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-2 mb-5 max-w-2xl list-disc pl-5">
          <li>
            <span className="text-foreground">Window</span> — the browser — decides the <span className="text-foreground">chrome</span> and how a thing is <span className="text-foreground">presented</span>.
            Two gates, each with a job: <span className="text-foreground">608 = chrome</span> (<code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">useFooterNav</code>: tab bar ⇄ icon rail, mobile header, mini player) and{" "}
            <span className="text-foreground">768 = presentation</span> (<code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">useIsMobile</code> and Tailwind <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">md:</code>, the same gate in TS and CSS: sheets ⇄ dialogs and dropdowns, toast placement, the docked editor).
            <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">sm:</code> / <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">lg:</code> reflow in-page content only.
          </li>
          <li>
            <span className="text-foreground">Column</span> — what the window leaves after chrome, cap and editor — decides <span className="text-foreground">how many fit</span>:
            cards step at <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">304→2 · 464→3 · 692→4 · 928→5 · 1164→6 · 1500→7</code>, rails and the MediaHeader change mode at <span className="text-foreground">560</span> (a 660px window, not 608 — the icon rail arrives there and takes the column back to 508).
            Steps are written <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">@min-[N]</code> / <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">@max-[N]</code>; Tailwind's <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">@max-[N]</code> is exclusive.
          </li>
          <li>
            <span className="text-foreground">Box</span> — a component's own width — only where the same window can hand it two widths (a song row in a list vs a rail cell, the player bar beside the docked editor), and then the container is <span className="text-foreground">named</span>.
          </li>
          <li>
            <span className="text-foreground">Pointer, not width</span>, for touch: hover is pointer-only (Tailwind wraps <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">hover:</code> in <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">@media (hover: hover)</code>);
            show/hide a control with <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">[@media(hover:none)]:!hidden</code>; swap a <span className="text-foreground">component</span> on the window, never on hover. Cards tap with <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">useLongPress</code> on the browser's real click; rails pan both axes and snap <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">mandatory</code>.
          </li>
        </ul>

        <p className="text-base text-muted-foreground mb-3 max-w-2xl">
          <span className="text-foreground font-medium">The window decides, the column pays</span> —
          pick a width and watch it happen to real components:
        </p>
        <ResponsiveLab />

        <p className="text-small text-muted-foreground max-w-2xl">
          Per-component specifics live in each component's section (e.g. <a href="/?page=DesignSystem#card-rail" className="text-primary-text hover:underline underline-offset-2">Card Rail</a>, <a href="/?page=DesignSystem#song-list-item" className="text-primary-text hover:underline underline-offset-2">Song List Item</a>, <a href="/?page=DesignSystem#dialog" className="text-primary-text hover:underline underline-offset-2">Dialog</a>); the sheet rules that span components sit in <a href="/?page=DesignSystem#detail-more-button" className="text-primary-text hover:underline underline-offset-2">Detail Menu</a> and Dialog.
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
          Display sizes <code className="font-mono text-xsmall">text-2xl</code>–<code className="font-mono text-xsmall">text-9xl</code> are <span className="text-foreground">fluid</span> — they clamp from a mobile floor up to the listed max across a 360→1280px viewport.
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
          Default choice in product code. Each alias resolves to a primitive via <code className="font-mono text-xsmall">var()</code> — never a hardcoded px.
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

        {/* The second face. Sans is everything the product says; Mono is the
            one signal that a string is meant to be read literally and typed
            back exactly — so it is code, and nothing but code. */}
        <p className="text-xsmall font-normal text-muted-foreground mt-10 mb-4">Founders Grotesk Mono — the second face, and only for code</p>
        <div className="flex flex-col gap-3">
          <p className="text-small font-normal">
            Anything printed as code wears the Mono cut:{" "}
            <code className="font-mono text-2xsmall font-normal px-1 rounded-sm bg-muted">useIsMobile</code>{" "}
            in a sentence, a class string in a table, a fenced block. Regular
            weight only — a synthesised bold would break the fixed advance
            width that is the point of the face.
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 text-2xsmall leading-5 text-foreground">
            <code>{`--font-sans: "Founders Grotesk", ui-sans-serif, system-ui, sans-serif;
--font-mono: "Founders Grotesk Mono", ui-monospace, "SF Mono", monospace;`}</code>
          </pre>
        </div>

      </Section>

      {/* ══ BUTTONS ══ */}
      <Section id="button" title="Button">
        <Example
          title="Variants × sizes — text and icon-only"
          doc="button"
          align="center"
          /* No width picker: a Button takes its size from a prop and renders
             identically at 320 and at 1920. Chips here would advertise a
             responsiveness it does not have and send the reader looking for a
             difference between two chips that is not there. */
          responsive={false}
          code={buttonBasicExampleSrc}
          codePath="src/ds-examples/button-basic.tsx"
        >
          <ButtonBasicExample />
        </Example>
      </Section>

      {/* ══ BADGES ══ */}
      {/* ══ TOGGLE ══ */}
      <Section id="toggle" title="Toggle">
        <Example
          title="States · standalone sizes"
          doc="toggle"
          align="center"
          code={toggleBasicExampleSrc}
          codePath="src/ds-examples/toggle-basic.tsx"
        >
          <ToggleBasicExample />
        </Example>
      </Section>

      {/* ══ TOGGLE GROUP ══ */}
      <Section id="togglegroup" title="ToggleGroup">
        <Example
          title="View mode · search scope · theme · multi-select"
          doc="togglegroup"
          align="center"
          code={toggleGroupBasicExampleSrc}
          codePath="src/ds-examples/togglegroup-basic.tsx"
        >
          <ToggleGroupBasicExample />
        </Example>
        <Example
          title="Sizes — sm · default · lg"
          doc="togglegroup"
          align="center"
          code={toggleGroupSizesExampleSrc}
          codePath="src/ds-examples/togglegroup-sizes.tsx"
        >
          <ToggleGroupSizesExample />
        </Example>
      </Section>

      {/* ══ TOOLBAR ══ */}
      <Section id="toolbar" title="Toolbar">
        <Example
          title="Groups · separators"
          doc="toolbar"
          align="center"
          code={toolbarBasicExampleSrc}
          codePath="src/ds-examples/toolbar-basic.tsx"
        >
          <ToolbarBasicExample />
        </Example>
      </Section>

      {/* ══ BADGE (base + content type) ══ */}
      <Section id="badge" title="Badge">
        <Example
          title="Variants · content type"
          doc="badge"
          align="center"
          code={badgeBasicExampleSrc}
          codePath="src/ds-examples/badge-basic.tsx"
        >
          <BadgeBasicExample />
        </Example>
      </Section>

      {/* ══ STATUS BADGE (privacy) ══ */}
      <Section id="status-badge" title="Status Badge">
        <Example
          title="Public ⇄ private — click to switch"
          doc="status-badge"
          align="center"
          code={statusBadgeBasicExampleSrc}
          codePath="src/ds-examples/status-badge-basic.tsx"
        >
          <StatusBadgeBasicExample />
        </Example>
      </Section>

      {/* ══ ORDER STATUS BADGE (shop) ══ */}
      <Section id="order-status-badge" title="Order Status Badge" phase={2}>
        <Example
          title="All statuses · interactive transitions"
          doc="order-status-badge"
          align="center"
          code={orderStatusBadgeBasicExampleSrc}
          codePath="src/ds-examples/order-status-badge-basic.tsx"
        >
          <OrderStatusBadgeBasicExample />
        </Example>
      </Section>

      {/* ══ PURCHASED BADGE ══ */}
      <Section id="purchased-badge" title="Purchased Badge">
        <Example
          title="Header size · card-row size"
          doc="purchased-badge"
          align="center"
          code={purchasedBadgeBasicExampleSrc}
          codePath="src/ds-examples/purchased-badge-basic.tsx"
        >
          <PurchasedBadgeBasicExample />
        </Example>
      </Section>

      {/* ══ CHIPS ══ */}
      <Section id="chips" title="Chips">
        <Example
          title="Filter · outline active · dismissible"
          doc="chips"
          align="center"
          code={chipsBasicExampleSrc}
          codePath="src/ds-examples/chips-basic.tsx"
        >
          <ChipsBasicExample />
        </Example>
        <Example
          title="Ghost + count — not used yet"
          doc="chips"
          align="center"
          code={chipsCountExampleSrc}
          codePath="src/ds-examples/chips-count.tsx"
        >
          <ChipsCountExample />
        </Example>
      </Section>

      {/* ══ INPUT ══ */}
      <Section id="input" title="Input">
        <Example
          title="Field · hint · error · search"
          doc="input"
          align="center"
          code={inputBasicExampleSrc}
          codePath="src/ds-examples/input-basic.tsx"
        >
          <InputBasicExample />
        </Example>

        <Example
          title="One size ladder — every control, every step"
          doc="input"
          align="center"
          code={controlSizeLadderExampleSrc}
          codePath="src/ds-examples/control-size-ladder.tsx"
        >
          <ControlSizeLadderExample />
        </Example>

        <Example
          title="Composed — with action · InputSelect · Textarea"
          doc="input"
          align="center"
          code={inputComposedExampleSrc}
          codePath="src/ds-examples/input-composed.tsx"
        >
          <InputComposedExample />
        </Example>
      </Section>

      {/* ══ CHIP INPUT ══ */}
      <Section id="chip-input" title="Chip Input">
        <Example
          title="Chips above · ChipInput below"
          doc="chip-input"
          align="center"
          code={chipInputBasicExampleSrc}
          codePath="src/ds-examples/chip-input-basic.tsx"
        >
          <ChipInputBasicExample />
        </Example>
      </Section>

      {/* ══ QTY STEPPER ══ */}
      <Section id="numberfield" title="NumberField">
        <Example
          title="Sizes · boundary · disabled · block in a grid"
          doc="numberfield"
          align="center"
          code={numberFieldBasicExampleSrc}
          codePath="src/ds-examples/numberfield-basic.tsx"
        >
          <NumberFieldBasicExample />
        </Example>
      </Section>

      {/* ══ SELECT ══ */}
      <Section id="select" title="Select">
        <Example
          title="Trigger · popup · groups"
          doc="select"
          align="center"
          code={selectBasicExampleSrc}
          codePath="src/ds-examples/select-basic.tsx"
        >
          <SelectBasicExample />
        </Example>
      </Section>

      {/* ══ MULTI SELECT ══
           base-ui `Menu` with left-checkbox items + pill trigger,
           count badge, and a clear-all row. */}
      <Section id="multi-select" title="MultiSelect">
        <Example
          title="Filter row — active · searchable · idle"
          doc="multi-select"
          align="center"
          code={multiSelectBasicExampleSrc}
          codePath="src/ds-examples/multi-select-basic.tsx"
          // The popup is a DropdownMenu, a bottom sheet below the
          // presentation gate — window wide, over the tab bar.
          bleed={w => w < 768}
        >
          <MultiSelectBasicExample />
        </Example>
      </Section>

      {/* ══ PICKER ══ */}
      <Section id="single-select" title="SingleSelect">
        <Example
          title="Sort trigger · fixed label · no icon"
          doc="single-select"
          align="center"
          code={singleSelectBasicExampleSrc}
          codePath="src/ds-examples/single-select-basic.tsx"
          // The menu is a DropdownMenu, a bottom sheet below the
          // presentation gate — window wide, over the tab bar.
          bleed={w => w < 768}
        >
          <SingleSelectBasicExample />
        </Example>
      </Section>

      {/* ══ COMBOBOX ══ */}
      <Section id="combobox" title="Combobox">
        <Example
          title="Country · Artist — filtering with `items`"
          doc="combobox"
          align="center"
          code={comboboxBasicExampleSrc}
          codePath="src/ds-examples/combobox-basic.tsx"
        >
          <ComboboxBasicExample />
        </Example>
      </Section>

      {/* ══ MENU ══ */}
      <Section id="menu" title="Menu">
        <Example
          title="Account menu · row “…”"
          doc="menu"
          align="center"
          code={menuBasicExampleSrc}
          codePath="src/ds-examples/menu-basic.tsx"
          // Below the presentation gate the menu is a bottom sheet: window
          // wide, over the tab bar — so the frame draws no gutters there.
          bleed={w => w < 768}
        >
          <MenuBasicExample />
        </Example>
      </Section>

      {/* ══ DETAIL "…" MENU — advanced bottom sheet ══ */}
      <Section id="detail-more-button" title="Detail Menu">
        <Example
          title="Album — the live menu"
          doc="detail-more-button"
          align="center"
          code={detailMenuBasicExampleSrc}
          codePath="src/ds-examples/detail-menu-basic.tsx"
          // Below the presentation gate the surface is a bottom sheet: window
          // wide, over the tab bar — so the frame draws no gutters there.
          bleed={w => w < 768}
        >
          <DetailMenuBasicExample />
        </Example>

        <p className="text-base text-muted-foreground mb-5 max-w-2xl">
          <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">DetailMoreButton</code> — the
          overflow affordance on media detail pages. <span className="text-foreground">Window-aware</span>{" "}
          (<code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">useIsMobile</code>, the 768 presentation gate — inside the frame above, the window chip):
          desktop opens an anchored <a href="/?page=DesignSystem#menu" className="text-primary-text hover:underline underline-offset-2">dropdown</a>;
          phones open an <span className="text-foreground">advanced bottom sheet</span> — one action model, two surfaces.
        </p>
        <ul className="text-base text-muted-foreground flex flex-col gap-1.5 mb-6 max-w-2xl list-disc pl-5">
          <li><span className="text-foreground">Rich header</span> — <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">MenuCover</code> (square cover · 2×2 playlist collage · round artist avatar, 72px ≈ the three text lines) + title + <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">ContentTypeBadge</code> + meta.</li>
          <li><span className="text-foreground">Quick actions</span> — icon-over-label pills (<code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">flex-1 rounded-2xl bg-secondary</code>): Share · <span className="text-foreground">Save</span> · (Edit / Play radio …).</li>
          <li><span className="text-foreground">Grouped rows</span> — 44px tap targets split by <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">h-px bg-border</code> dividers; the destructive row (Delete) is last.</li>
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

          {/* The phone sheet, open — the real surface, forced to a 375px
              window through WindowWidthContext (the same override the frame
              above uses), so nothing here is hand-built. Playlist variant:
              2×2 collage cover, "Play radio" quick action. */}
          <div className="flex flex-col gap-2">
            <SubLabel>Phone bottom sheet · playlist variant (window forced to 375)</SubLabel>
            <div className="w-[340px]">
              <WindowWidthContext.Provider value={375}>
                <DetailMenuSurface
                  kind="playlist"
                  title="Late Night Improvisations"
                  subtitle="by Jules"
                  meta="8 tracks"
                  covers={[
                    "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/120x120bb.jpg",
                    "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/120x120bb.jpg",
                    "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/120x120bb.jpg",
                    "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/120x120bb.jpg",
                  ]}
                  libraryType="playlist"
                  libraryId="late-night-improvisations"
                  libraryName="Late Night Improvisations"
                  onGoToArtist={() => {}}
                  onPlayRadio={() => {}}
                />
              </WindowWidthContext.Provider>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ NAV ROW ══ */}
      <Section id="nav-row" title="Nav Row">
        <Example
          title="Browse entry points"
          doc="nav-row"
          align="stretch"
          code={navRowBasicExampleSrc}
          codePath="src/ds-examples/nav-row-basic.tsx"
        >
          <NavRowBasicExample />
        </Example>
      </Section>

      {/* ══ NAVIGATION MENU ══ */}
      <Section id="navigationmenu" title="NavigationMenu">
        <Example
          title="Discover · Studio"
          doc="navigationmenu"
          align="center"
          code={navigationMenuBasicExampleSrc}
          codePath="src/ds-examples/navigationmenu-basic.tsx"
        >
          <NavigationMenuBasicExample />
        </Example>
      </Section>

      {/* ══ DATE PICKER ══ */}
      <Section id="datepicker" title="DatePicker">
        <Example
          title="Fields · open the calendar"
          doc="datepicker"
          align="center"
          code={datePickerBasicExampleSrc}
          codePath="src/ds-examples/datepicker-basic.tsx"
        >
          <DatePickerBasicExample />
        </Example>
      </Section>

      {/* ══ CHECKBOX & RADIO ══ */}
      <Section id="checkbox" title="Checkbox & Radio">
        <Example
          title="Checkbox · field · radio group"
          doc="checkbox"
          align="center"
          code={checkboxBasicExampleSrc}
          codePath="src/ds-examples/checkbox-basic.tsx"
        >
          <CheckboxBasicExample />
        </Example>
      </Section>

      {/* ══ SELECT TRACK ══ */}
      <Section id="select-track" title="Select Track">
        <Example
          title="Track rows — tap to pick"
          doc="select-track"
          align="stretch"
          code={selectTrackBasicExampleSrc}
          codePath="src/ds-examples/select-track-basic.tsx"
        >
          <SelectTrackBasicExample />
        </Example>
      </Section>

      {/* ══ RADIO CARD ══ */}
      <Section id="radio-card" title="Radio Card">
        <Example
          title="Monetisation — plain card · card with a children band"
          doc="radio-card"
          align="stretch"
          code={radioCardBasicExampleSrc}
          codePath="src/ds-examples/radio-card-basic.tsx"
        >
          <RadioCardBasicExample />
        </Example>
      </Section>

      {/* ══ SWITCH ══ */}
      <Section id="switch" title="Switch">
        <Example
          title="Sizes · the setting row"
          doc="switch"
          align="center"
          code={switchBasicExampleSrc}
          codePath="src/ds-examples/switch-basic.tsx"
        >
          <SwitchBasicExample />
        </Example>
      </Section>

      {/* ══ SLIDER ══ */}
      <Section id="slider" title="Slider">
        <Example
          title="Horizontal · vertical (player volume)"
          doc="slider"
          align="stretch"
          code={sliderBasicExampleSrc}
          codePath="src/ds-examples/slider-basic.tsx"
        >
          <SliderBasicExample />
        </Example>
      </Section>

      {/* ══ PROGRESS ══ */}
      <Section id="progress" title="Progress">
        <Example
          doc="progress"
          align="stretch"
          code={progressBasicExampleSrc}
          codePath="src/ds-examples/progress-basic.tsx"
        >
          <ProgressBasicExample />
        </Example>
      </Section>

      {/* ══ METER ══ */}
      <Section id="meter" title="Meter">
        <Example
          doc="meter"
          align="stretch"
          code={meterBasicExampleSrc}
          codePath="src/ds-examples/meter-basic.tsx"
        >
          <MeterBasicExample />
        </Example>
      </Section>

      {/* ══ SPINNER ══ */}
      <Section id="spinner" title="Spinner">
        <Example
          doc="spinner"
          align="center"
          code={spinnerBasicExampleSrc}
          codePath="src/ds-examples/spinner-basic.tsx"
        >
          <SpinnerBasicExample />
        </Example>
      </Section>

      {/* ══ TOP PROGRESS BAR ══ */}
      <Section id="top-progress-bar" title="Top Progress Bar">
        <Example
          doc="top-progress-bar"
          align="center"
          code={topProgressBarBasicExampleSrc}
          codePath="src/ds-examples/top-progress-bar-basic.tsx"
        >
          <TopProgressBarBasicExample />
        </Example>
      </Section>

      {/* ══ SEPARATOR ══ */}
      <Section id="separator" title="Separator">
        <Example
          doc="separator"
          align="stretch"
          code={separatorBasicExampleSrc}
          codePath="src/ds-examples/separator-basic.tsx"
        >
          <SeparatorBasicExample />
        </Example>
      </Section>

      {/* ══ AVATAR ══ */}
      <Section id="avatar" title="Avatar">
        <Example
          doc="avatar"
          align="center"
          code={avatarBasicExampleSrc}
          codePath="src/ds-examples/avatar-basic.tsx"
        >
          <AvatarBasicExample />
        </Example>
      </Section>

      {/* ══ USER AVATAR (placeholder palette) ══ */}
      <Section id="user-avatar" title="User Avatar">
        <div className="flex flex-col gap-12">
          <Example
            title="Sizes, and initials from the username"
            doc="user-avatar"
            align="center"
            code={userAvatarBasicExampleSrc}
            codePath="src/ds-examples/user-avatar-basic.tsx"
          >
            <UserAvatarBasicExample />
          </Example>
          <Example
            title={`Palette — ${AVATAR_PALETTE.length} colours`}
            doc="user-avatar"
            align="center"
            code={userAvatarPaletteExampleSrc}
            codePath="src/ds-examples/user-avatar-palette.tsx"
          >
            <UserAvatarPaletteExample />
          </Example>
        </div>
      </Section>

      {/* ══ TABS ══ */}
      <Section id="tabs" title="Tabs">
        <div className="flex flex-col gap-12">
          <Example
            title="Segment · line · pill"
            doc="tabs"
            align="stretch"
            code={tabsBasicExampleSrc}
            codePath="src/ds-examples/tabs-basic.tsx"
          >
            <TabsBasicExample />
          </Example>
          <Example
            title="Segment sizes — sm · default · lg"
            doc="tabs"
            align="stretch"
            code={tabsSizesExampleSrc}
            codePath="src/ds-examples/tabs-sizes.tsx"
          >
            <TabsSizesExample />
          </Example>
        </div>
      </Section>

      {/* ══ TOOLTIP ══ */}
      <Section id="tooltip" title="Tooltip">
        <Example
          doc="tooltip"
          align="center"
          code={tooltipBasicExampleSrc}
          codePath="src/ds-examples/tooltip-basic.tsx"
        >
          <TooltipBasicExample />
        </Example>
      </Section>

      {/* ══ SCROLL AREA ══ */}
      <Section id="scrollarea" title="ScrollArea">
        <Example
          doc="scrollarea"
          align="center"
          code={scrollAreaBasicExampleSrc}
          codePath="src/ds-examples/scrollarea-basic.tsx"
        >
          <ScrollAreaBasicExample />
        </Example>
      </Section>

      {/* ══ COLLAPSIBLE ══ */}
      <Section id="collapsible" title="Collapsible">
        <Example
          doc="collapsible"
          align="stretch"
          code={collapsibleBasicExampleSrc}
          codePath="src/ds-examples/collapsible-basic.tsx"
        >
          <CollapsibleBasicExample />
        </Example>
      </Section>

      {/* ══ ACCORDION ══ */}
      <Section id="accordion" title="Accordion">
        <Example
          doc="accordion"
          align="stretch"
          code={accordionBasicExampleSrc}
          codePath="src/ds-examples/accordion-basic.tsx"
        >
          <AccordionBasicExample />
        </Example>
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
      <Section id="album-card" title="Album Card">
        <Example
          title="States — free · stream · owned"
          doc="album-card"
          defaultWidth="375"
          align="stretch"
          code={albumCardBasicExampleSrc}
          codePath="src/ds-examples/album-card-basic.tsx"
        >
          <AlbumCardBasicExample />
        </Example>

        <Example
          title="Long title · owned · missing artwork"
          doc="album-card"
          defaultWidth="375"
          align="stretch"
          code={albumCardVariantsExampleSrc}
          codePath="src/ds-examples/album-card-variants.tsx"
        >
          <AlbumCardVariantsExample />
        </Example>
      </Section>

      {/* ══ ARTIST CARD ══ */}
      <Section id="artist-card" title="Artist Card">
        <Example
          title="Library grid — portraits and the no-photo fallback"
          doc="artist-card"
          defaultWidth="375"
          align="stretch"
          code={artistCardBasicExampleSrc}
          codePath="src/ds-examples/artist-card-basic.tsx"
        >
          <ArtistCardBasicExample />
        </Example>
      </Section>

      {/* ══ PLAYLIST CARD ══ */}
      <Section id="playlist-card" title="Playlist Card">
        <Example
          title="Library grid — create tile · owned · saved"
          doc="playlist-card"
          defaultWidth="375"
          align="stretch"
          code={playlistCardBasicExampleSrc}
          codePath="src/ds-examples/playlist-card-basic.tsx"
        >
          <PlaylistCardBasicExample />
        </Example>
      </Section>

      {/* ══ COVER PLAY BUTTON ══ */}
      <Section id="cover-play-button" title="Cover Play Button">
        <Example
          title="Standalone — click to toggle playing"
          doc="cover-play-button"
          align="center"
          code={coverPlayButtonBasicExampleSrc}
          codePath="src/ds-examples/cover-play-button-basic.tsx"
        >
          <CoverPlayButtonBasicExample />
        </Example>
        <Example
          title="PlayingWave — the animation on its own"
          doc="cover-play-button"
          align="center"
          code={coverPlayButtonWaveExampleSrc}
          codePath="src/ds-examples/cover-play-button-wave.tsx"
        >
          <CoverPlayButtonWaveExample />
        </Example>
      </Section>

      <Section id="song-list-item" title="Song List Item">
        {/* This section gets the ROW's own chips, not the page column's. The
            row drops fields at 260/300/380 — widths the default ladder cannot
            reach, since it starts at 304 — so the four documented steps were
            unreachable in the very frame that was meant to show them. */}
        <Example
          title="Cover rows"
          doc="song-list-item"
          defaultWidth="380"
          align="stretch"
          widthLabel="row"
          widths={ROW_STEPS.map(s => ({
            label: String(s.px),
            px: s.framePx,
            note: s.note,
            /* The chip's own number, not `framePx`. The frame is a little
               wider on purpose (the row's padding, plus a pixel to land
               inside the bound), and printing 395 beside a chip marked 380
               would be one more unexplained number on this page. */
            readout: `${s.px}px`,
          }))}
          /* No stage padding here, and that is not cosmetic: the chips name
             the ROW's width, and the stage's usual `p-6` would take 48px off
             it — a 380 chip would hand the row 332 and the steps would fire
             one chip early. The row carries its own `pl-2 pr-2`, so flush is
             what it looks like in a real list anyway. */
          stageClassName="p-0"
          code={songListItemBasicExampleSrc}
          codePath="src/ds-examples/song-list-item-basic.tsx"
        >
          <SongListItemBasicExample />
        </Example>

        {/* `trackNumber` mode keeps the row's chips too: with no meta line
            the row has nothing to shed, and the frame shows exactly that. */}
        <Example
          title="Track-number rows — album detail, no meta line"
          doc="song-list-item"
          defaultWidth="380"
          align="stretch"
          widthLabel="row"
          widths={ROW_STEPS.map(s => ({
            label: String(s.px),
            px: s.framePx,
            note: s.note,
            readout: `${s.px}px`,
          }))}
          stageClassName="p-0"
          code={songListItemTrackNumberExampleSrc}
          codePath="src/ds-examples/song-list-item-track-number.tsx"
        >
          <SongListItemTrackNumberExample />
        </Example>
      </Section>

      {/* ══ MEDIA LIST ITEM ══ */}
      <Section id="media-list-item" title="Media List Item">
        <Example
          title="Mixed rows — album · playlist · song · artist · label"
          doc="media-list-item"
          defaultWidth="375"
          align="stretch"
          code={mediaListItemBasicExampleSrc}
          codePath="src/ds-examples/media-list-item-basic.tsx"
        >
          <MediaListItemBasicExample />
        </Example>
      </Section>

      {/* ══ SEARCH ══ */}
      <Section id="search" title="Search">
        <Example
          title="Results — live, for “coltrane”"
          doc="search"
          align="stretch"
          code={searchBasicExampleSrc}
          codePath="src/ds-examples/search-basic.tsx"
        >
          <SearchBasicExample />
        </Example>
        <Example
          title="Panel — suggestions while typing"
          doc="search"
          align="center"
          code={searchPanelExampleSrc}
          codePath="src/ds-examples/search-panel.tsx"
        >
          <SearchPanelExample />
        </Example>
      </Section>

      {/* ══ CARD RAIL ══ */}
      <Section id="card-rail" title="Card Rail">
        <Example
          title="Row mode — peek + snap"
          doc="card-rail"
          defaultWidth="375"
          align="stretch"
          code={cardRailRowSrc}
          codePath="src/ds-examples/card-rail-row.tsx"
        >
          <CardRailRowExample />
        </Example>
        <Example
          title="Grid mode (`mobileGrid`) — two rows, column-major"
          doc="card-rail"
          defaultWidth="375"
          align="stretch"
          code={cardRailGridSrc}
          codePath="src/ds-examples/card-rail-grid.tsx"
        >
          <CardRailGridExample />
        </Example>
      </Section>

      {/* ══ SONG RAIL ══ */}
      <Section id="song-rail" title="Song Rail">
        <Example
          title="Top Songs — columns of three, sideways"
          doc="song-rail"
          defaultWidth="375"
          align="stretch"
          code={songRailBasicExampleSrc}
          codePath="src/ds-examples/song-rail-basic.tsx"
        >
          <SongRailBasicExample />
        </Example>
      </Section>

      {/* ══ PRODUCT CARD ══ */}
      <Section id="product-card" title="Product Card" phase={2}>
        <Example
          title="Shop grid — four tiles"
          doc="product-card"
          defaultWidth="375"
          align="stretch"
          code={productCardBasicExampleSrc}
          codePath="src/ds-examples/product-card-basic.tsx"
        >
          <ProductCardBasicExample />
        </Example>
      </Section>

      {/* ══ CHECKOUT CARD ══ */}
      <Section id="checkout-card" title="Checkout Card" phase={2}>
        <Example
          title="Purchases hub — three shops · payment failed"
          doc="checkout-card"
          align="stretch"
          code={checkoutCardBasicExampleSrc}
          codePath="src/ds-examples/checkout-card-basic.tsx"
        >
          <CheckoutCardBasicExample />
        </Example>
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
      <Section id="media-header" title="Media Header">
        {/* The header measures the COLUMN — stacked below 560, horizontal
            from 560, the full action cluster from 780 — so the window chips
            are its ladder, and the frame has to stretch it to the column. */}
        <div className="flex flex-col gap-12">
          <Example
            title="Album — with buying option"
            doc="media-header"
            align="stretch"
            code={mediaHeaderBasicExampleSrc}
            codePath="src/ds-examples/media-header-basic.tsx"
          >
            <MediaHeaderBasicExample />
          </Example>
          <Example
            title="Album — purchased, download tier"
            doc="media-header"
            align="stretch"
            code={mediaHeaderPurchasedExampleSrc}
            codePath="src/ds-examples/media-header-purchased.tsx"
          >
            <MediaHeaderPurchasedExample />
          </Example>
          <Example
            title="My playlist — composite cover, visibility badge"
            doc="media-header"
            align="stretch"
            code={mediaHeaderPlaylistExampleSrc}
            codePath="src/ds-examples/media-header-playlist.tsx"
          >
            <MediaHeaderPlaylistExample />
          </Example>
        </div>
      </Section>

      {/* ══ ARTIST HEADER ══ */}
      <Section id="artist-header" title="Artist Header">
        {/* Full-bleed: the hero fills the column, reads the window for its
            height cap, and hides Share + Save below the 608 chrome gate —
            inside the frame the chip is that window. */}
        <Example
          doc="artist-header"
          align="stretch"
          code={artistHeaderBasicExampleSrc}
          codePath="src/ds-examples/artist-header-basic.tsx"
        >
          <ArtistHeaderBasicExample />
        </Example>
      </Section>

      {/* ══ MOBILE HEADER ══ */}
      <Section id="mobile-header" title="Mobile Header">
        {/* Chrome, not column: below the 608 gate the header spans the
            window edge to edge, so the frame draws no gutters or tab bar
            there. From 608 up the app shows the Topbar instead. */}
        <div className="flex flex-col gap-12">
          <Example
            title="Library — title row · actions · pill tabs"
            doc="mobile-header"
            defaultWidth="375"
            align="stretch"
            bleed={w => w < 608}
            code={mobileHeaderBasicExampleSrc}
            codePath="src/ds-examples/mobile-header-basic.tsx"
          >
            <MobileHeaderBasicExample />
          </Example>
          <Example
            title="Explore — title · avatar · search field"
            doc="mobile-header"
            defaultWidth="375"
            align="stretch"
            bleed={w => w < 608}
            code={mobileHeaderExploreExampleSrc}
            codePath="src/ds-examples/mobile-header-explore.tsx"
          >
            <MobileHeaderExploreExample />
          </Example>
        </div>
      </Section>

      {/* ══ FOOTER NAV ══ */}
      <Section id="footer-nav" title="Footer Nav">
        {/* Chrome, not column: below the 608 gate the bar spans the window
            edge to edge over the tab-bar slot, so the frame draws no gutters
            or schematic tab bar there. From 608 up the app shows the icon
            rail instead. */}
        <Example
          doc="footer-nav"
          defaultWidth="375"
          align="stretch"
          bleed={w => w < 608}
          code={footerNavBasicExampleSrc}
          codePath="src/ds-examples/footer-nav-basic.tsx"
        >
          <FooterNavBasicExample />
        </Example>
      </Section>

      {/* ══ PAGE SECTION ══ */}
      {/*
        Page-section primitive shared by the buyer-side purchase detail and
        the seller-side order detail. Heading sits OUT of the box so boxed
        and unboxed sections share the same hierarchy; vertical rhythm
        carries separation between adjacent flat sections.
      */}
      <Section id="page-section" title="Page Section">
        <Example
          doc="page-section"
          align="stretch"
          code={pageSectionBasicExampleSrc}
          codePath="src/ds-examples/page-section-basic.tsx"
        >
          <PageSectionBasicExample />
        </Example>
      </Section>

      {/* ══ ITEMS ══ */}
      {/*
        Shared product-list + money-breakdown card. Same component drives
        both the buyer purchase-detail page (format/type subtitle, no SKU,
        no tax) and the seller order-detail page (variant + SKU, discount,
        labelled tax). Each line collapses to a single price at qty=1 and
        expands to muted "unit × qty" + line total at qty>1.
      */}
      <Section id="items" title="Items" phase={2}>
        <div className="flex flex-col gap-12">
          <Example
            title="Seller — variant · SKU · discount · labelled tax"
            doc="items"
            align="stretch"
            code={itemsBasicExampleSrc}
            codePath="src/ds-examples/items-basic.tsx"
          >
            <ItemsBasicExample />
          </Example>
          <Example
            title="Buyer — type only · free shipping · no tax row"
            doc="items"
            align="stretch"
            code={itemsBuyerExampleSrc}
            codePath="src/ds-examples/items-buyer.tsx"
          >
            <ItemsBuyerExample />
          </Example>
        </div>
      </Section>

      {/* ══ ALERTS ══ */}
      <Section id="alerts" title="Alerts">
        <Example
          title="Default · destructive · with an action"
          doc="alerts"
          align="stretch"
          code={alertsBasicExampleSrc}
          codePath="src/ds-examples/alerts-basic.tsx"
        >
          <AlertsBasicExample />
        </Example>
      </Section>

      {/* ══ ALERT DIALOG ══ */}
      <Section id="alertdialog" title="AlertDialog">
        {/* The real AlertDialog behind two triggers — a destructive confirm
            and a reversible one. No static preview export exists; the old
            static frame was a DialogPreview look-alike with Dialog chrome.
            Below the presentation gate it opens as a bottom sheet, so the
            frame draws no gutters there. */}
        <Example
          title="Confirm — destructive · non-destructive"
          doc="alertdialog"
          align="center"
          code={alertDialogBasicExampleSrc}
          codePath="src/ds-examples/alertdialog-basic.tsx"
          bleed={w => w < 768}
        >
          <AlertDialogBasicExample />
        </Example>
      </Section>

      {/* ══ DIALOGS ══ */}
      <Section id="dialog" title="Dialog">
        {/* Static preview and live trigger of the SAME dialog. Below the
            presentation gate a dialog IS a bottom sheet — window wide, over
            the tab bar — so both frames draw no gutters there; the preview
            takes the sheet shape (DialogPreview reads the chip). */}
        <Example
          title="Form — choice list"
          doc="dialog"
          align="center"
          code={dialogFormSrc}
          codePath="src/ds-examples/dialog-form.tsx"
          bleed={w => w < 768}
        >
          <DialogFormExample />
        </Example>
        <Example
          title="Live — open the real Dialog"
          doc="dialog"
          align="center"
          code={dialogBasicExampleSrc}
          codePath="src/ds-examples/dialog-basic.tsx"
          bleed={w => w < 768}
          className="mt-8"
        >
          <DialogBasicExample />
        </Example>
      </Section>

      {/* ══ PURCHASE ALBUM DIALOG ══ */}
      <Section id="purchase-album-dialog" title="Purchase Album Dialog">
        <Example
          title="Summary step — static preview"
          doc="purchase-album-dialog"
          align="center"
          code={purchaseAlbumDialogBasicExampleSrc}
          codePath="src/ds-examples/purchase-album-dialog-basic.tsx"
          bleed={w => w < 768}
        >
          <PurchaseAlbumDialogBasicExample />
        </Example>
        <Example
          title="Live — processing and success steps"
          doc="purchase-album-dialog"
          align="center"
          code={purchaseAlbumDialogLiveExampleSrc}
          codePath="src/ds-examples/purchase-album-dialog-live.tsx"
          bleed={w => w < 768}
          className="mt-8"
        >
          <PurchaseAlbumDialogLiveExample />
        </Example>
      </Section>

      {/* ══ PAYWALL ══ */}
      <Section id="paywall" title="Paywall">
        {/* The prompt measures its OWN box (two-column from 760px of dialog
            width), so the window chips show both layouts: 1069 splits, 768
            stacks. Below the presentation gate every dialog is a sheet — no
            gutters drawn there. */}
        <Example
          title="Prompt — the paywall"
          doc="paywall"
          align="center"
          code={paywallBasicExampleSrc}
          codePath="src/ds-examples/paywall-basic.tsx"
          bleed={w => w < 768}
        >
          <PaywallBasicExample />
        </Example>
        <Example
          title="Checkout — paid"
          doc="paywall"
          align="stretch"
          code={paywallCheckoutExampleSrc}
          codePath="src/ds-examples/paywall-checkout.tsx"
          bleed={w => w < 768}
          className="mt-8"
        >
          <PaywallCheckoutExample />
        </Example>
        {/* Its own frame. The two variants are alternative steps a person
            never sees together, and side by side in one frame the width was
            changing the demo's two-column wrapper rather than the dialog. */}
        <Example
          title="Checkout — free month"
          doc="paywall"
          align="stretch"
          code={paywallCheckoutFreeExampleSrc}
          codePath="src/ds-examples/paywall-checkout-free.tsx"
          bleed={w => w < 768}
          className="mt-8"
        >
          <PaywallCheckoutFreeExample />
        </Example>
        <Example
          title="Live — prompt → checkout hand-off"
          doc="paywall"
          align="center"
          code={paywallLiveExampleSrc}
          codePath="src/ds-examples/paywall-live.tsx"
          bleed={w => w < 768}
          className="mt-8"
        >
          <PaywallLiveExample />
        </Example>
      </Section>

      {/* ══ LOGIN ══ */}
      <Section id="login" title="Login">
        <Example
          title="Static preview"
          doc="login"
          align="center"
          code={loginBasicExampleSrc}
          codePath="src/ds-examples/login-basic.tsx"
          bleed={w => w < 768}
        >
          <LoginBasicExample />
        </Example>
        <Example
          title="Live — open the real dialog"
          doc="login"
          align="center"
          code={loginLiveExampleSrc}
          codePath="src/ds-examples/login-live.tsx"
          bleed={w => w < 768}
          className="mt-8"
        >
          <LoginLiveExample />
        </Example>
      </Section>

      {/* ══ CREDITS DIALOG ══ */}
      <Section id="credits-dialog" title="Credits Dialog">
        <Example
          title="Static preview"
          doc="credits-dialog"
          align="center"
          code={creditsDialogBasicExampleSrc}
          codePath="src/ds-examples/credits-dialog-basic.tsx"
          bleed={w => w < 768}
        >
          <CreditsDialogBasicExample />
        </Example>
        <Example
          title="Live — useCredits().open(key)"
          doc="credits-dialog"
          align="center"
          code={creditsDialogLiveExampleSrc}
          codePath="src/ds-examples/credits-dialog-live.tsx"
          bleed={w => w < 768}
          className="mt-8"
        >
          <CreditsDialogLiveExample />
        </Example>
      </Section>

      {/* ══ DRAWER (Sheet) ══ */}
      <Section id="drawer" title="Drawer">
        <Example
          title="One trigger per edge"
          doc="drawer"
          align="center"
          code={drawerBasicExampleSrc}
          codePath="src/ds-examples/drawer-basic.tsx"
          bleed={w => w < 768}
        >
          <DrawerBasicExample />
        </Example>
      </Section>

      {/* ══ TOAST ══ */}
      <Section id="toast" title="Toast">
        {/* Below the presentation gate the toast is a bottom bar spanning the
            window, so the frames draw no gutters there. */}
        <Example
          title="One toast, where the viewport puts it"
          doc="toast"
          align="stretch"
          /* The demo owns its spacing, because the offsets are the real
             viewport's — `right-4 top-4` on desktop, `inset-x-3` at the
             bottom on a phone. Stage padding on top of that would put the
             toast at a distance from the corner that the app never uses. */
          stageClassName="p-0"
          code={toastBasicExampleSrc}
          codePath="src/ds-examples/toast-basic.tsx"
          bleed={w => w < 768}
        >
          <ToastBasicExample />
        </Example>

        {/* The other types as a plain catalogue, OUTSIDE the frame. Six toasts
            never appear at once, so putting all six in the frame made it a
            poster: the two-column grid was the demo's own layout, and at a
            narrow chip what changed was the column count rather than the
            toast. Here a grid is honest, because a catalogue is what it is. */}
        <p className="mt-6 mb-3 text-base text-muted-foreground max-w-2xl">
          <span className="text-foreground font-medium">The other types.</span> Same shell, same
          layout — only the icon and its colour change, and{" "}
          <code className="text-xsmall font-normal font-mono px-1 rounded-sm bg-muted">loading</code>{" "}
          swaps the icon for a spinner.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-2">
          <ToastPreview title="Blue Afternoon added to playlist" />
          <ToastPreview type="error" title="Upload failed" description="File format not supported. Please upload an MP3 or WAV file." />
          <ToastPreview type="warning" title="Heads up" description="Your storage is almost full. Upgrade your plan to continue uploading." />
          <ToastPreview type="info" title="New release alert" description="River Lotus just dropped a new album." />
          <ToastPreview type="loading" title="Processing track…" description="Blue Afternoon is being transcoded. This may take a minute." />
        </div>
        <Example
          title="Live — fire the real toast"
          doc="toast"
          align="center"
          code={toastLiveExampleSrc}
          codePath="src/ds-examples/toast-live.tsx"
          bleed={w => w < 768}
          className="mt-8"
        >
          <ToastLiveExample />
        </Example>
      </Section>

      {/* ══ SKELETON ══ */}
      <Section id="skeleton" title="Skeleton">
        <Example
          title="Text · avatar · cover"
          doc="skeleton"
          align="center"
          code={skeletonBasicExampleSrc}
          codePath="src/ds-examples/skeleton-basic.tsx"
        >
          <SkeletonBasicExample />
        </Example>
      </Section>

      {/* ══ POPOVER ══ */}
      <Section id="popover" title="Popover">
        <Example
          title="Info card · side panel"
          doc="popover"
          align="center"
          code={popoverBasicExampleSrc}
          codePath="src/ds-examples/popover-basic.tsx"
        >
          <PopoverBasicExample />
        </Example>
      </Section>

      {/* ══ TABLE ══ */}
      <Section id="table" title="Table">
        <Example
          title="Releases with totals"
          doc="table"
          align="stretch"
          code={tableBasicExampleSrc}
          codePath="src/ds-examples/table-basic.tsx"
        >
          <TableBasicExample />
        </Example>
      </Section>

      {/* ══ LIST TABLE ══ */}
      <Section id="list-table" title="List Table">
        <Example
          title="Discography — sortable, sticky, playing"
          doc="list-table"
          align="stretch"
          code={listTableBasicExampleSrc}
          codePath="src/ds-examples/list-table-basic.tsx"
        >
          <ListTableBasicExample />
        </Example>
      </Section>

      {/* ══ BULK ACTION BAR ══ */}
      <Section id="bulk-action-bar" title="Bulk Action Bar">
        {/* The frames show `BulkActionBarContent` — the pill the live bar
            renders — because the live `BulkActionBar` portals to the page's
            `#app-content`, out of any frame. The chip is the window inside
            the frame, so at 320 / 375 the pill wraps as on a phone; the
            `useFooterNav` (608) lift is a live-bar concern and is documented,
            not drawn. */}
        <Example
          title="Studio › Music — two actions"
          doc="bulk-action-bar"
          align="stretch"
          code={bulkActionBarBasicExampleSrc}
          codePath="src/ds-examples/bulk-action-bar-basic.tsx"
        >
          <BulkActionBarBasicExample />
        </Example>
        <Example
          title="Orders — icons and inline counts"
          doc="bulk-action-bar"
          align="stretch"
          className="mt-6"
          code={bulkActionBarCountsExampleSrc}
          codePath="src/ds-examples/bulk-action-bar-counts.tsx"
        >
          <BulkActionBarCountsExample />
        </Example>
      </Section>

      {/* ══ PAGINATION ══ */}
      <Section id="pagination" title="Pagination">
        <Example
          title="Previous · 1 2 3 … 8 · Next"
          doc="pagination"
          align="center"
          code={paginationBasicExampleSrc}
          codePath="src/ds-examples/pagination-basic.tsx"
        >
          <PaginationBasicExample />
        </Example>
      </Section>

      {/* ══ COMMAND ══ */}
      <Section id="command" title="Command">
        <Example
          title="Inline — always open"
          doc="command"
          align="center"
          code={commandBasicExampleSrc}
          codePath="src/ds-examples/command-basic.tsx"
        >
          <CommandBasicExample />
        </Example>
        {/* The palette is a `Dialog`, so below 768 it opens as a bottom sheet
            — portaled to the real window, like every dialog trigger. What sits
            in the frame is the trigger, so the frame keeps its chrome rather
            than bleeding. */}
        <Example
          title="Dialog — ⌘K"
          doc="command"
          align="center"
          className="mt-6"
          code={commandDialogExampleSrc}
          codePath="src/ds-examples/command-dialog.tsx"
        >
          <CommandDialogExample />
        </Example>
      </Section>

      {/* ══ OTP INPUT ══ */}
      <Section id="otp-input" title="OTP Input">
        <Example
          title="Six digits, two groups"
          doc="otp-input"
          align="center"
          code={otpInputBasicExampleSrc}
          codePath="src/ds-examples/otp-input-basic.tsx"
        >
          <OtpInputBasicExample />
        </Example>
      </Section>

      {/* ══ FORM ══ */}
      <Section id="form" title="Form">
        <Example
          title="Zod-validated — submit empty"
          doc="form"
          align="center"
          code={formBasicExampleSrc}
          codePath="src/ds-examples/form-basic.tsx"
        >
          <FormBasicExample />
        </Example>
      </Section>

      {/* ══ PLAYER BAR ══ */}
      <Section id="player-bar" title="Player Bar">
        {/* Window chips, like everything else. The bar has exactly ONE
            placement — `AppPlayer` — and its width follows from the window
            with no ambiguity: `inset-x-3` below 608 (window − 24, which is
            the phone gutter twice over), `px-page` inside `main` above it,
            which is the content column. So a window chip hands the bar the
            width it really has, and its own steps (640 · 688 · 800) are
            crossed along the way: 608 leaves it 508 and still compact, 768
            leaves 668, 1440 leaves 1152 and the timestamps appear.

            It briefly had a private `bar` scale. That was drift: a component
            earns its own chips only when a window does not determine its
            width — one placement is not that case. */}
        <Example
          doc="player-bar"
          align="stretch"
          stageClassName="p-0"
          code={playerBarBasicExampleSrc}
          codePath="src/ds-examples/player-bar-basic.tsx"
        >
          <PlayerBarBasicExample />
        </Example>
      </Section>

      {/* ══ PLAYER OVERLAY (mobile full-screen "Now listening") ══ */}
      <Section id="player-overlay" title="Player Overlay">
        {/* Window chips, and only the ones where the overlay exists: it is
            mounted `absolute inset-0` of `<main>` in the `footerNav` branch,
            so it is exactly as wide as the window and only below 608. Above
            that there is nothing to show, which is why the ladder stops —
            a subset of the one ladder, not a scale of its own.

            Its single box step is at 380 (the lyric size), and the window
            chips straddle it: 320 and 375 below, 584 above. Height follows at
            a phone's proportions, because the cover, waveform and transport
            are sized from the height the overlay is given. */}
        <Example
          doc="player-overlay"
          align="stretch"
          defaultWidth="375"
          bleed={() => true}
          widths={WINDOW_WIDTHS.filter(w => Number(w.label) < FOOTER_NAV_BELOW)}
          code={playerOverlayBasicExampleSrc}
          codePath="src/ds-examples/player-overlay-basic.tsx"
        >
          <PlayerOverlayBasicExample />
        </Example>
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
          It moved to <code className="text-xsmall font-normal font-mono px-1 mx-0.5 rounded-sm bg-muted">/design-system</code>
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
  // Publishes the on-screen keyboard height as `--kb` so bottom sheets and
  // toasts sit above it instead of behind it (iOS doesn't resize the layout
  // viewport for the keyboard).
  useKeyboardInset()

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

  // Sidebar auto-collapses at a window gate (1069) synced to the MediaHeader's
  // full-cluster tier (see `useSidebarAutoCollapsed`): below ~1069px the
  // expanded 208px sidebar would push the detail-page header out of its
  // richest layout, so we collapse it to reclaim that width. "Auto wins
  // on resize" — the effect only fires when the threshold is crossed, so
  // a manual toggle is respected until the next crossing.
  const autoCollapsed = useSidebarAutoCollapsed()
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => { setCollapsed(autoCollapsed) }, [autoCollapsed])
  // Below the chrome gate (608, useFooterNav) the sidebar is swapped for a bottom tab bar.
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
    <AddToPlaylistProvider>
    <CreatePlaylistProvider>
    <PlaylistEditorProvider>
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
            {activeNav === "Experiments" && <ExperimentsView />}
          </div>
        </div>

        {/* Persistent player — one instance, shown only on the music
            "listening" surfaces (not Studio / Settings / Wallet / Shop /
            Purchases, where playback isn't the context). Reads the global
            player store; renders nothing until a track is played. */}
        {LISTENING_PAGES.has(activeNav) && <AppPlayer footerNav={footerNav} />}

        {/* Mobile bottom tab bar — replaces the sidebar below the
            footer-nav gate (608). Absolute within main so it overlays
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

      {/* Playlist editor — docks beside the content (not an overlay) and
          persists across navigation, so tracks can be dragged in from any
          page. Renders nothing until a playlist is opened for editing. */}
      <PlaylistEditDrawer />

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
    </PlaylistEditorProvider>
    </CreatePlaylistProvider>
    </AddToPlaylistProvider>
    </CreditsProvider>
    </UserAccountProvider>
    </UserLibraryProvider>
    </CartProvider>
  )
}
