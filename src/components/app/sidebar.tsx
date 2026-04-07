"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Collapsible } from "@base-ui/react/collapsible"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LogoHorizontal, LogoMark } from "@/components/ui/logo"
import {
  Home, Compass, ListMusic, Disc3, Mic, Music2,
  Paintbrush, FileText, ShoppingBag, CreditCard, Library,
  Plus, PanelLeftClose, PanelLeftOpen, ChevronRight,
} from "lucide-react"

import {
  ContextMenu, ContextMenuTitle, ContextMenuItem,
} from "@/components/ui/context-menu"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem  { label: string; icon: React.ReactNode }
interface NavGroup { label: string; icon: React.ReactNode; children: NavItem[] }
interface Playlist { id: string; title: string }

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  activeNav?: string
  onNavChange?: (nav: string) => void
  playlists?: Playlist[]
  className?: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_TOP: NavItem[] = [
  { label: "Home",    icon: <Home    className="size-4" /> },
  { label: "Explore", icon: <Compass className="size-4" /> },
]

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Studio",
    icon: <Paintbrush className="size-4" />,
    children: [
      { label: "Pages",  icon: <FileText    className="size-4" /> },
      { label: "Music",  icon: <Music2      className="size-4" /> },
      { label: "Shop",   icon: <ShoppingBag className="size-4" /> },
      { label: "Wallet", icon: <CreditCard  className="size-4" /> },
    ],
  },
  {
    label: "Library",
    icon: <Library className="size-4" />,
    children: [
      { label: "Albums",    icon: <Disc3     className="size-4" /> },
      { label: "Artists",   icon: <Mic       className="size-4" /> },
      { label: "Songs",     icon: <Music2    className="size-4" /> },
      { label: "Playlists", icon: <ListMusic className="size-4" /> },
    ],
  },
]

const DEFAULT_PLAYLISTS: Playlist[] = [
  { id: "1",  title: "Blue Train Late Night" },
  { id: "2",  title: "Kind of Blue Mornings" },
  { id: "3",  title: "Coltrane & Coffee" },
  { id: "4",  title: "Hard Bop Hustle" },
  { id: "5",  title: "Midnight at the Village Vanguard" },
  { id: "6",  title: "Bossa Nova Sundays" },
  { id: "7",  title: "Modal Jazz Meditations" },
  { id: "8",  title: "Bird Lives: Parker Essentials" },
  { id: "9",  title: "Monk's Moody Shuffles" },
  { id: "10", title: "West Coast Cool Sessions" },
  { id: "11", title: "Afro-Cuban Jazz Heat" },
  { id: "12", title: "Smooth Sax Sundays" },
  { id: "13", title: "Bebop After Midnight" },
  { id: "14", title: "Soul Jazz Saturdays" },
  { id: "15", title: "Late Night Improvisation" },
  { id: "16", title: "Modern Jazz Discoveries" },
  { id: "17", title: "Vibes for Stargazing" },
  { id: "18", title: "Chill Beats for Rainy Days" },
  { id: "19", title: "Epic Road Trip Anthems" },
  { id: "20", title: "Songs to Dance Like Nobody's Watching" },
  { id: "21", title: "Melodies for Midnight Musing" },
  { id: "22", title: "Harlem Renaissance Revisited" },
  { id: "23", title: "Blue Note Classics" },
  { id: "24", title: "Django & the Hot Club" },
]

// ─── NavButton ────────────────────────────────────────────────────────────────

function NavButton({
  item, collapsed, active, onClick,
}: { item: NavItem; collapsed: boolean; active: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 w-full font-medium text-sidebar-foreground transition-colors rounded-lg text-left",
        collapsed ? "size-11 justify-center rounded-full" : "h-9 px-3",
        active ? "bg-sidebar-primary" : "hover:bg-sidebar-accent",
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="text-sm truncate">{item.label}</span>}
    </button>
  )
}

// ─── GroupTrigger (expanded) ──────────────────────────────────────────────────

function GroupTrigger({
  group, open, active,
}: { group: NavGroup; open: boolean; active: boolean }) {
  return (
    <Collapsible.Trigger
      className={cn(
        "flex items-center gap-2.5 h-9 px-3 w-full font-medium text-sidebar-foreground transition-colors rounded-lg text-left",
        active ? "bg-sidebar-primary" : "hover:bg-sidebar-accent",
      )}
    >
      <span className="shrink-0">{group.icon}</span>
      <span className="text-sm truncate flex-1">{group.label}</span>
      <ChevronRight
        className={cn(
          "size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200",
          open && "rotate-90",
        )}
      />
    </Collapsible.Trigger>
  )
}

// ─── CollapsedGroupFlyout ─────────────────────────────────────────────────────

function CollapsedGroupFlyout({
  group, onNavChange, currentActive,
}: { group: NavGroup; onNavChange: (l: string) => void; currentActive: string }) {
  const [show, setShow] = useState(false)
  const [top,  setTop]  = useState(0)
  const btnRef          = useRef<HTMLButtonElement>(null)
  const hideTimer       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasActive       = group.children.some(c => c.label === currentActive)

  const cancelHide = () => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
  }

  const scheduleHide = () => {
    hideTimer.current = setTimeout(() => setShow(false), 120)
  }

  const handleEnter = () => {
    cancelHide()
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setTop(rect.top)
    setShow(true)
  }

  return (
    <>
      <button
        ref={btnRef}
        onMouseEnter={handleEnter}
        onMouseLeave={scheduleHide}
        title={group.label}
        className={cn(
          "size-11 flex items-center justify-center rounded-full text-sidebar-foreground transition-colors",
          hasActive ? "bg-sidebar-primary" : "hover:bg-sidebar-accent",
        )}
      >
        {group.icon}
      </button>

      {show && (
        <div
          className="fixed left-[56px] z-50"
          style={{ top }}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        >
          <ContextMenu>
            <ContextMenuTitle>{group.label}</ContextMenuTitle>
            {group.children.map(child => (
              <ContextMenuItem
                key={child.label}
                icon={child.icon}
                onClick={() => { onNavChange(child.label); setShow(false) }}
                className={currentActive === child.label ? "bg-sidebar-accent" : ""}
              >
                {child.label}
              </ContextMenuItem>
            ))}
          </ContextMenu>
        </div>
      )}
    </>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const MIN_W = 208
const MAX_W = Math.round(208 * 1.4) // 291px — 40% wider

export function Sidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  activeNav = "Home",
  onNavChange,
  playlists = DEFAULT_PLAYLISTS,
  className,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState(activeNav)
  const [openGroup,  setOpenGroup]  = useState<string>("")
  const [sidebarWidth, setSidebarWidth] = useState(MIN_W)
  const [resizing, setResizing] = useState(false)

  const isResizingRef  = useRef(false)
  const resizeStartX   = useRef(0)
  const resizeStartW   = useRef(MIN_W)

  const collapsed     = controlledCollapsed ?? internalCollapsed
  const currentActive = activeNav ?? activeItem

  // ── Resize logic ────────────────────────────────────────────────
  const startResize = useCallback((e: React.MouseEvent) => {
    isResizingRef.current = true
    resizeStartX.current  = e.clientX
    resizeStartW.current  = sidebarWidth
    setResizing(true)
    e.preventDefault()
  }, [sidebarWidth])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return
      const delta = e.clientX - resizeStartX.current
      const newW  = Math.min(MAX_W, Math.max(MIN_W, resizeStartW.current + delta))
      setSidebarWidth(newW)
    }
    const onUp = () => {
      if (!isResizingRef.current) return
      isResizingRef.current = false
      setResizing(false)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup",   onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup",   onUp)
    }
  }, [])

  // ── Nav handlers ────────────────────────────────────────────────
  const toggle = () => {
    const next = !collapsed
    setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }

  const handleNavChange = (label: string) => {
    setActiveItem(label)
    onNavChange?.(label)
  }

  const groupHasActive = (group: NavGroup) =>
    group.children.some(c => c.label === currentActive)

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0",
        !resizing && "transition-[width] duration-200",
        className,
      )}
      style={{ width: collapsed ? 52 : sidebarWidth }}
    >
      {/* ── Main scroll body ─────────────────────────────────────── */}
      <div className={cn(
        "flex flex-col flex-1 min-h-0 py-5",
        collapsed ? "px-1 items-center" : "px-3",
      )}>

        {/* Logo */}
        <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "px-1")}>
          {collapsed
            ? <LogoMark className="h-7 w-auto" />
            : <LogoHorizontal className="h-[22px] w-auto" />
          }
        </div>

        {/* Top nav: Home / Explore */}
        <nav className={cn("flex flex-col gap-1 mb-1", collapsed && "items-center w-full")}>
          {NAV_TOP.map(item => (
            <NavButton
              key={item.label}
              item={item}
              collapsed={collapsed}
              active={currentActive === item.label}
              onClick={() => handleNavChange(item.label)}
            />
          ))}
        </nav>

        {/* Accordion groups: Studio + Library */}
        <div className={cn("flex flex-col gap-1", collapsed && "items-center w-full")}>
          {NAV_GROUPS.map(group => {
            const isOpen = !collapsed && openGroup === group.label

            if (collapsed) {
              return (
                <CollapsedGroupFlyout
                  key={group.label}
                  group={group}
                  onNavChange={handleNavChange}
                  currentActive={currentActive}
                />
              )
            }

            return (
              <Collapsible.Root
                key={group.label}
                open={isOpen}
                onOpenChange={open => setOpenGroup(open ? group.label : "")}
                className="flex flex-col"
              >
                <GroupTrigger
                  group={group}
                  open={isOpen}
                  active={groupHasActive(group)}
                />
                <Collapsible.Panel className="sidebar-panel overflow-hidden">
                  <div className="flex flex-col gap-0.5 pt-0.5 pb-1 pl-3">
                    {group.children.map(child => (
                      <button
                        key={child.label}
                        onClick={() => handleNavChange(child.label)}
                        className={cn(
                          "h-9 px-3 w-full text-left rounded-lg font-normal text-xs text-sidebar-foreground transition-colors",
                          currentActive === child.label ? "bg-sidebar-primary" : "hover:bg-sidebar-accent",
                        )}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </Collapsible.Panel>
              </Collapsible.Root>
            )
          })}
        </div>

        {/* My Playlists — always open, fills remaining space */}
        <div className={cn("border-t border-sidebar-border", collapsed ? "w-7 my-3" : "mx-1 my-2")} />
        {collapsed ? (
          /* Collapsed: single "+" create button */
          <button
            title="Create playlist"
            className="size-11 flex items-center justify-center rounded-full text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Plus className="size-4" />
          </button>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header row: section label + create button */}
            <div className="flex items-center px-3 py-1.5 gap-2">
              <span className="text-xs font-medium text-muted-foreground flex-1 truncate">
                My Playlists
              </span>
              <Button variant="ghost" size="icon-sm" title="Create playlist" className="-mr-2">
                <Plus />
              </Button>
            </div>

            {/* Scrollable list — fills remaining height, fades at bottom */}
            <div className="relative flex-1 min-h-0 pl-3">
              <div className="h-full overflow-y-auto pr-1 -mr-1 pb-10">
                <div className="flex flex-col gap-0.5">
                  {playlists.map(pl => (
                    <button
                      key={pl.id}
                      className="flex h-8 px-3 w-full text-left rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors items-center"
                    >
                      <span className="text-sm font-normal truncate">{pl.title}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Gradient fade — no border */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-sidebar to-transparent" />
            </div>
          </div>
        )}

      </div>

      {/* ── Collapse toggle ───────────────────────────────────────── */}
      <div className={cn(
        "shrink-0 py-3 border-t border-sidebar-border flex",
        collapsed ? "justify-center px-1" : "px-3",
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <PanelLeftOpen  className="size-4" />
            : <PanelLeftClose className="size-4" />
          }
        </Button>
      </div>

      {/* ── Resize handle ─────────────────────────────────────────── */}
      {!collapsed && (
        <div
          onMouseDown={startResize}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize group"
        >
          {/* Subtle visible indicator on hover */}
          <div className="h-full w-full group-hover:bg-sidebar-border transition-colors" />
        </div>
      )}
    </aside>
  )
}
