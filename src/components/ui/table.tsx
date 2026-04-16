"use client"

import * as React from "react"
import { useRef } from "react"
import { cn } from "@/lib/utils"

// ─── ResizeHandle — shared visual, exported for use in custom tables ──────────

export function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="absolute right-0 top-0 h-full w-3 flex items-center justify-center cursor-col-resize select-none z-10"
      onMouseDown={onMouseDown}
    >
      <div className="w-px h-3/4 rounded-full bg-border opacity-0 group-hover/th:opacity-100 transition-opacity" />
    </div>
  )
}

// ─── Table primitives ─────────────────────────────────────────────────────────

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-wrapper" className="relative w-full overflow-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-border [&_tr]:hover:bg-transparent", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors hover:bg-muted data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

// ─── TableHead — built-in column resize via shared startColumnResize ──────────

interface TableHeadProps extends React.ComponentProps<"th"> {
  /** Show a drag handle on the right edge to resize this column. Default: true */
  resizable?: boolean
  /** Minimum width in px when resizing. Default: 60 */
  minWidth?: number
}

function TableHead({
  className,
  resizable = true,
  minWidth = 60,
  children,
  ...props
}: TableHeadProps) {
  const thRef = useRef<HTMLTableCellElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    const th = thRef.current
    if (!th) return

    e.preventDefault()
    e.stopPropagation()

    const startX     = e.clientX
    const startWidth = th.offsetWidth

    // Snapshot following resizable siblings and their starting widths
    const row = th.parentElement
    const siblings = row
      ? Array.from(row.children).slice(Array.from(row.children).indexOf(th) + 1)
          .filter((el): el is HTMLTableCellElement =>
            el.tagName === "TH" && el.getAttribute("data-resizable") === "true"
          )
      : []
    const siblingStarts = siblings.map(el => el.offsetWidth)

    // Snapshot the total width of all columns OTHER than this one,
    // used to cap growth when there is no resizable right sibling.
    const wrapperWidth  = th.closest("table")?.parentElement?.clientWidth ?? Infinity
    const othersWidth   = row
      ? Array.from(row.children).reduce((sum, el) => sum + (el !== th ? (el as HTMLElement).offsetWidth : 0), 0)
      : 0

    const onMove = (ev: MouseEvent) => {
      if (siblings.length > 0) {
        // Has a resizable right neighbor — cap growth to what that neighbor can give up
        const next   = siblings[0]
        const sibMin = parseInt(next.getAttribute("data-min-width") ?? "60", 10)
        const maxW   = startWidth + siblingStarts[0] - sibMin
        const newW   = Math.min(maxW, Math.max(minWidth, startWidth + (ev.clientX - startX)))

        th.style.width    = `${newW}px`
        th.style.minWidth = `${newW}px`

        const newSibW = Math.max(sibMin, siblingStarts[0] - (newW - startWidth))
        next.style.width    = `${newSibW}px`
        next.style.minWidth = `${newSibW}px`
      } else {
        // No resizable right sibling — cap growth so the table never exceeds its wrapper
        const maxW = Math.max(minWidth, wrapperWidth - othersWidth)
        const newW = Math.min(maxW, Math.max(minWidth, startWidth + (ev.clientX - startX)))
        th.style.width    = `${newW}px`
        th.style.minWidth = `${newW}px`
      }
    }

    const onUp = () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup",   onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup",   onUp)
  }

  return (
    <th
      ref={thRef}
      data-slot="table-head"
      data-resizable={resizable ? "true" : undefined}
      data-min-width={minWidth}
      className={cn(
        "relative group/th h-11 px-4 text-left align-middle text-xs font-normal text-muted-foreground hover:bg-muted transition-colors [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    >
      {children}
      {resizable && <ResizeHandle onMouseDown={handleMouseDown} />}
    </th>
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-4 align-middle text-sm [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
