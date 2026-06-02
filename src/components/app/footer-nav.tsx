"use client"

/*
 * FooterNav — mobile bottom tab bar that replaces the sidebar on small
 * viewports (see `useFooterNav`). Four equal-width tabs: Home · Library
 * · Search · Studio.
 *
 * The first three navigate directly. Studio is special: it has four
 * surfaces (Pages / Music / Analytics / Shop) and there's no sidebar on
 * mobile to switch between them, so tapping it opens a bottom sheet that
 * lists those surfaces — mirroring the desktop sidebar's Studio accordion.
 *
 * It's a frosted strip: a translucent, backdrop-blurred surface with a
 * hairline top border, so page content stays legible scrolling behind
 * it. The ACTIVE tab is an elevated pill; inactive tabs are muted icons.
 * Clears the iOS home indicator via the bottom safe-area inset.
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 4973:204096.
 */

import { Home, Library, Search, Sliders, FileText, Music2, BarChart2, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"

interface FooterNavProps {
  activeNav: string
  onNavChange: (nav: string) => void
  className?: string
}

// Direct-navigation tabs: the target they route to, plus which app
// sections count as "active" (so deep pages like an album/artist still
// light up the Library tab).
const NAV_TABS: { target: string; label: string; icon: typeof Home; active: (nav: string) => boolean }[] = [
  { target: "Home",    label: "Home",    icon: Home,    active: n => n === "Home" },
  {
    target: "Library", label: "Library", icon: Library,
    active: n => ["Library", "Albums", "Artists", "Songs", "Playlists", "Album", "Playlist", "Artist", "Purchases"].includes(n),
  },
  { target: "Explore", label: "Search",  icon: Search,  active: n => n === "Explore" },
]

// Studio surfaces shown in the bottom sheet (Wallet lives in the avatar
// menu, not here — it's a per-user concept, not a studio surface).
const STUDIO_PAGES = ["Pages", "Music", "Analytics", "Shop"]
const STUDIO_ITEMS: { target: string; label: string; desc: string; icon: typeof Home }[] = [
  { target: "Pages",     label: "Pages",     desc: "Artist & label pages",  icon: FileText },
  { target: "Music",     label: "Music",     desc: "Releases & uploads",    icon: Music2 },
  { target: "Analytics", label: "Analytics", desc: "Streams & earnings",    icon: BarChart2 },
  { target: "Shop",      label: "Shop",      desc: "Products & orders",     icon: ShoppingCart },
]

// Shared tab-button chrome (elevated pill when active, muted glyph when not).
const tabButtonClass = (isActive: boolean) =>
  cn(
    "flex h-12 flex-1 items-center justify-center rounded-full outline-none",
    "transition-[background,box-shadow,color,transform] duration-150",
    "focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.96]",
    isActive
      ? "bg-background text-foreground ring-1 ring-border/60 shadow-[0_1px_2px_rgba(13,13,4,0.10),0_6px_16px_rgba(13,13,4,0.10)]"
      : "text-muted-foreground hover:text-foreground active:text-foreground",
  )

export function FooterNav({ activeNav, onNavChange, className }: FooterNavProps) {
  const studioActive = STUDIO_PAGES.includes(activeNav)

  return (
    <nav
      aria-label="Primary"
      className={cn(
        // `.frosted-glass` (app.css): blurred + saturated translucent
        // surface with a faint sheen + grain. A single subtle hairline
        // (`border-t border-border/50`) defines the top edge — simple,
        // not the bright rim.
        "absolute inset-x-0 bottom-0 z-30 select-none frosted-glass border-t border-border/50",
        "px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-center gap-2">
        {NAV_TABS.map(tab => {
          const isActive = tab.active(activeNav)
          const Icon = tab.icon
          return (
            <button
              key={tab.target}
              type="button"
              onClick={() => onNavChange(tab.target)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={tabButtonClass(isActive)}
            >
              <Icon className="size-6" strokeWidth={isActive ? 2.25 : 2} />
            </button>
          )
        })}

        {/* Studio — opens a surface picker rather than navigating, since
             there's no sidebar on mobile to switch the four surfaces. */}
        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Studio"
                aria-current={studioActive ? "page" : undefined}
                className={tabButtonClass(studioActive)}
              />
            }
          >
            <Sliders className="size-6" strokeWidth={studioActive ? 2.25 : 2} />
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Studio</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col px-2 pb-4">
              {STUDIO_ITEMS.map(item => {
                const Icon = item.icon
                const active = activeNav === item.target
                return (
                  <SheetClose
                    key={item.target}
                    render={
                      <button
                        type="button"
                        onClick={() => onNavChange(item.target)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left outline-none transition-colors",
                          "hover:bg-muted active:bg-muted focus-visible:bg-muted",
                          "[&_svg]:size-5 [&_svg]:shrink-0",
                          active ? "[&_svg]:text-foreground" : "[&_svg]:text-muted-foreground",
                        )}
                      />
                    }
                  >
                    <Icon />
                    <span className="flex flex-col min-w-0">
                      <span className={cn("text-base leading-tight", active ? "text-foreground font-medium" : "text-foreground")}>
                        {item.label}
                      </span>
                      <span className="text-xsmall text-muted-foreground leading-tight truncate">{item.desc}</span>
                    </span>
                  </SheetClose>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
