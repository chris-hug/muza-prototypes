"use client"

/*
 * Settings › Local music — where the listener's own files come from.
 *
 * Built on what the production desktop app ships (v1.0.92): a "Show local
 * files" switch, then "Music sources" with Add folder / Add files and one row
 * per source whose ⋯ offers Rescan and Remove. In the browser production
 * shows a "Get the desktop app" card instead — a page cannot read a folder —
 * so this tab is the desktop app's.
 *
 * What it adds to production, and why:
 *  · Each row says how it is doing: tracks found and when it was scanned,
 *    a running count while it scans, and — for a folder on a drive or server
 *    that is off — "Not connected" with a Reconnect button. Production's row
 *    is the name and path only, so a source that had gone away looked the
 *    same as one that worked, and the library's grey rows had nowhere to
 *    send you. The library's "Reconnect" lands here, on that row.
 *  · The row is titled by the folder's own name and says where it lives
 *    ("This Mac", "Home server") before the path; the path alone, cut at
 *    the end, hid the one part that told two folders apart.
 *  · "Match with muza" is its own switch: it is what puts "Also on muza",
 *    the release's credits and its artist on your files, and someone who
 *    wants a plain player should be able to say no.
 *  · Remove takes the source's music out of the library at once, with Undo
 *    in the toast; nothing on disk is touched, and the row says so.
 */

import { useEffect, useRef } from "react"
import {
  Folder, FolderPlus, FileAudio, HardDrive, Loader2, MoreHorizontal, RefreshCw,
  Trash2, FolderOpen,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/toast"
import {
  localSources, useLocalState, PICKABLE_FOLDER, SHOW_IN_FOLDER, type LocalSource,
} from "@/lib/local-library"

// Same flat-section recipe as the other Settings tabs (settings-view's
// SettingsSection): small heading, optional action, one bordered card.
function Section({ title, action, children }: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-3">
        <h2 className="text-small font-medium text-foreground">{title}</h2>
        {action}
      </div>
      <div className="rounded-xl border border-border bg-background px-4 py-4 sm:px-5">
        {children}
      </div>
    </section>
  )
}

function SwitchRow({ id, title, description, checked, onCheckedChange }: {
  id: string
  title: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
      <label htmlFor={id} className="flex-1 min-w-0 cursor-pointer">
        <p className="text-small text-foreground">{title}</p>
        <p className="text-xsmall text-muted-foreground mt-0.5">{description}</p>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={v => onCheckedChange(Boolean(v))} />
    </div>
  )
}

const folderName = (path: string) => path.split("/").filter(Boolean).pop() ?? path

function SourceIcon({ source }: { source: LocalSource }) {
  const Icon = source.kind === "server" ? HardDrive : source.kind === "files" ? FileAudio : Folder
  return <Icon className="size-5 shrink-0 text-muted-foreground" />
}

function SourceStatus({ source }: { source: LocalSource }) {
  if (source.scanning) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Loader2 className="size-3.5 animate-spin" />
        Scanning… {source.scanning.done} of {source.scanning.total} tracks
      </span>
    )
  }
  if (!source.available) {
    return <span>{source.unavailableReason ?? "Not connected"} · {source.lastSeen}</span>
  }
  return <span>{source.tracks} {source.tracks === 1 ? "track" : "tracks"} · {source.lastSeen}</span>
}

function SourceRow({ source, index, focused }: { source: LocalSource; index: number; focused: boolean }) {
  const { add: toast } = useToast()
  const ref = useRef<HTMLDivElement>(null)

  // Arriving from the library's "Reconnect": bring the row into view and
  // mark it, so the one that needs you is the first thing you see.
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [focused])

  const reconnect = () => {
    const ok = localSources.reconnect(source.id)
    toast(ok
      ? { title: `${source.name} is connected`, description: "Its music plays again." }
      : { title: `Can't reach ${source.name}`, description: "Check that it is switched on and on this network, then try again." })
  }
  const remove = () => {
    localSources.remove(source.id)
    toast({
      title: `Removed “${folderName(source.path)}”`,
      description: "Its music left your library. Nothing was deleted from disk.",
      data: { actionLabel: "Undo", onAction: () => localSources.restore(source, index) },
    })
  }
  const showInFolder = SHOW_IN_FOLDER && source.available
    ? () => toast({ title: SHOW_IN_FOLDER, description: `${source.name} › ${source.path}` })
    : undefined

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 py-3 first:pt-0 last:pb-0 state-fade",
        // The focus mark is a tint behind the row, bled into the card's
        // padding so it does not shift the content.
        focused && "-mx-4 px-4 sm:-mx-5 sm:px-5 bg-muted rounded-lg first:pt-3 last:pb-3",
      )}
    >
      <SourceIcon source={source} />
      <div className={cn("flex-1 min-w-0", !source.available && "text-muted-foreground")}>
        <p className={cn("text-small truncate", source.available ? "text-foreground" : "text-muted-foreground")}>
          {source.kind === "files" ? "Added files" : folderName(source.path)}
        </p>
        <p className="text-xsmall text-muted-foreground truncate" title={source.path}>
          {source.name} · {source.path}
        </p>
        <p className="text-xsmall text-muted-foreground mt-0.5 tabular-nums">
          <SourceStatus source={source} />
        </p>
      </div>
      {!source.available && (
        <Button variant="outline" size="sm" onClick={reconnect} className="shrink-0">
          <RefreshCw />Reconnect
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Manage ${folderName(source.path)}`}
          className="relative touch-target size-8 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-ring"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {source.available ? (
            <DropdownMenuItem onClick={() => localSources.rescan(source.id)} disabled={!!source.scanning}>
              <RefreshCw />Rescan
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={reconnect}><RefreshCw />Reconnect</DropdownMenuItem>
          )}
          {showInFolder && <DropdownMenuItem onClick={showInFolder}><FolderOpen />{SHOW_IN_FOLDER}</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={remove}><Trash2 />Remove</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function LocalMusicTab({ focusSource }: { focusSource?: string | null }) {
  const { sources, enabled, matching } = useLocalState()
  const { add: toast } = useToast()

  // The system's folder picker, simulated: it always picks the one folder
  // the prototype has music for, so adding visibly fills the library.
  const addFolder = () => {
    if (sources.some(s => s.id === PICKABLE_FOLDER.id)) {
      toast({ title: "Already added", description: `${folderName(PICKABLE_FOLDER.path)} is one of your sources.` })
      return
    }
    localSources.add(PICKABLE_FOLDER)
  }
  const addFiles = () => {
    if (sources.some(s => s.id === "files")) { localSources.rescan("files"); return }
    localSources.add({ id: "files", kind: "files", name: "This Mac", path: "~/Desktop" })
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <Section title="Local files">
        <SwitchRow
          id="local-show"
          title="Show local files"
          description="Play music stored on this computer or your network alongside muza. Files are never uploaded."
          checked={enabled}
          onCheckedChange={localSources.setEnabled}
        />
        <div className="h-px bg-border/60" />
        <SwitchRow
          id="local-match"
          title="Match with muza"
          description="Recognise your files as releases on muza, to show “Also on muza”, the credits and the artist."
          checked={matching}
          onCheckedChange={localSources.setMatching}
        />
      </Section>

      <Section
        title="Music sources"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addFolder}><FolderPlus />Add folder</Button>
            <Button variant="outline" size="sm" onClick={addFiles}><FileAudio />Add files</Button>
          </div>
        }
      >
        {sources.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-1 py-6">
            <Folder className="size-6 text-muted-foreground mb-2" />
            <p className="text-small text-foreground">No music sources yet</p>
            <p className="text-xsmall text-muted-foreground max-w-xs">
              Add a folder from this computer or a network drive. muza plays what is in it and keeps it up to date.
            </p>
          </div>
        ) : (
          <div className={cn("flex flex-col divide-y divide-border/60", !enabled && "opacity-60")}>
            {sources.map((s, i) => (
              <SourceRow key={s.id} source={s} index={i} focused={focusSource === s.id} />
            ))}
          </div>
        )}
        {!enabled && sources.length > 0 && (
          <p className="text-xsmall text-muted-foreground mt-4">
            Local files are hidden. Your sources stay here, ready when you switch them back on.
          </p>
        )}
      </Section>
    </div>
  )
}
