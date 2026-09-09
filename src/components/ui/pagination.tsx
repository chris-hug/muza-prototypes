import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { type VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="pagination"
      role="navigation"
      aria-label="pagination"
      /*
       * `@container/pagination` — the row measures ITSELF, because it is not
       * always the page column: it sits in back-office tables, and a table can
       * be beside the docked editor or inside a narrow panel.
       *
       * The one step is at 380px, and it is arithmetic rather than taste. With
       * both words spelled out the row needs roughly
       *   "Previous" 95 + "Next" 75 + 5 links/ellipsis × 36 + 6 gaps × 4 ≈ 374
       * so it overflowed a 296px content column (a 320px phone) — the numbers
       * were pushed off the edge. With the words gone the same row is ~250 and
       * fits, and the chevrons still say which way each control goes.
       */
      className={cn("@container/pagination mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li data-slot="pagination-item" className={cn("", className)} {...props} />
  )
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<VariantProps<typeof buttonVariants>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      /* Below the step the control becomes the square icon button the number
         links already are — the padding has to go with the word, or it leaves
         a lopsided pill around a lone chevron. `aria-label` carries the name
         either way, so nothing is lost to a screen reader. */
      className={cn(
        "gap-1 pl-2.5",
        "@max-[380px]/pagination:size-9 @max-[380px]/pagination:p-0 @max-[380px]/pagination:gap-0",
        className,
      )}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span className="@max-[380px]/pagination:hidden">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn(
        "gap-1 pr-2.5",
        "@max-[380px]/pagination:size-9 @max-[380px]/pagination:p-0 @max-[380px]/pagination:gap-0",
        className,
      )}
      {...props}
    >
      <span className="@max-[380px]/pagination:hidden">Next</span>
      <ChevronRight className="size-4" />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
