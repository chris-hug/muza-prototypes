"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/use-media-query"
import { useSheetDrag } from "@/lib/use-sheet-drag"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

/** Two refs, one element — the popup is both ours (the drag) and the
 *  caller's. React 19 passes `ref` as a plain prop, so it can be forwarded
 *  by hand like any other. */
function useMergedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return React.useCallback((node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node)
      else if (r) (r as React.RefObject<T | null>).current = node
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs)
}

// ─── Shared chrome class strings ─────────────────────────────────────────────
//
// Single source of truth for Dialog visuals. Both the live `DialogContent`
// (rendered through the portal) and the static `DialogPreview` (rendered
// inline for kitchen-sink / docs) consume the same constants — change one,
// both update.
//
// `dialogChromeClass` is everything that's NOT the fixed-positioning of the
// modal itself (size, surface, padding, typography). `dialogPositionClass`
// is the centred-fixed positioning. The live Popup uses both; the inline
// preview uses only the chrome.

export const dialogChromeClass =
  // `overflow-hidden` is the safety-net: it keeps any inner content
  // (long item titles, wide tables) from pushing the dialog past its
  // `max-w` cap and dragging the footer's negative margins with it.
  // Gutter is 12px on phones (matching `--page-px` at that width), 24px from
  // `md` (768) up. A bottom sheet spans the whole screen, so a 24px gutter costs
  // 48px of a 320–375px width — enough to squeeze list rows noticeably.
  // Desktop dialogs are narrow and floating, where 24 still reads right.
  // 8px between bands on a phone, 20px from `md` (768) up. A sheet is the whole
  // screen and its bands already read as separate — the title, the tabs,
  // the list — so the gap only has to keep them from touching; anything
  // more is rows the list doesn't get. Desktop modals are small and
  // floating, where the wider rhythm still reads.
  "grid w-full max-w-[calc(100%-2rem)] gap-2 md:gap-5 rounded-xl md:rounded-2xl bg-popover p-3 md:p-6 text-small text-popover-foreground border border-border outline-none overflow-hidden md:max-w-sm"

// App-wide rule: every Dialog is a BOTTOM SHEET on mobile and a centered
// modal on desktop (md+, 768). Mobile → pinned to the bottom edge, full-width,
// top-rounded, slides up. Desktop → centered, zooms in. Baked in here so
// every Dialog gets it for free; individual dialogs only override their
// desktop width (`md:max-w-*`) / height. Applied AFTER `dialogChromeClass`
// in `DialogContent` so this positioning + the mobile rounding/width win
// over the chrome's defaults (twMerge: last wins).
const dialogDesktopPositionClass =
  // desktop (md+, 768) → centered modal
  "md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm md:rounded-2xl md:max-h-none md:overflow-hidden " +
  "md:[scroll-padding-top:0px] md:[scroll-padding-bottom:0px] " +
  "md:data-open:slide-in-from-bottom-0 md:data-open:zoom-in-95"

export const dialogPositionClass =
  "fixed z-50 duration-100 transition-none data-open:animate-in data-open:fade-in-0 " +
  // mobile → bottom sheet, sitting ON TOP of the on-screen keyboard (`--kb`,
  // published by `useKeyboardInset`; 0 when there is none) and capped to the
  // space that leaves, scrolling internally. Anchoring to `bottom: 0` would
  // park the sheet BEHIND the keyboard on iOS (it shrinks the visual
  // viewport, not the layout one).
  //
  // This is the right shape for pickers and lists. It is the WRONG shape for
  // a form whose primary action lives in the footer: on a phone with browser
  // chrome the keyboard leaves ~200px, which title + field + footer do not
  // fit in. Forms use `mobile="form"` (`dialogFormPositionClass`) instead.
  "inset-x-0 bottom-[var(--kb,0px)] top-auto translate-x-0 translate-y-0 max-w-full rounded-b-none rounded-t-2xl " +
  // `svh`, NOT `dvh`: on iOS the DYNAMIC viewport unit reports the height
  // with the browser chrome COLLAPSED, so while the URL bar is expanded a
  // sheet sized to `100dvh` overflows the top of the screen and its header
  // scrolls off under the chrome. `svh` is the small (chrome-visible)
  // viewport, which always fits.
  "max-h-[calc(100svh-var(--kb,0px)-8px)] overflow-y-auto " +
  // The sticky footer floats OVER the scrolling content, so the browser's
  // "scroll the focused field into view" would park a field underneath it.
  // `scroll-padding-bottom` reserves the footer's height for that scroll.
  "[scroll-padding-bottom:8rem] " +
  "data-open:slide-in-from-bottom-4 data-open:zoom-in-100 " +
  dialogDesktopPositionClass

// `mobile="form"` — the full-screen FORM sheet (Apple Music "New Playlist").
// Anchored to the TOP of the screen and filling it, with the actions in a
// `DialogActionBar` along the top edge where the keyboard can never reach
// them; the field sits near the top; the body scrolls under the bar. The
// sheet still ends at `--kb`, so the browser's scroll-focused-field-into-view
// has a real box to scroll within while the keyboard is up. This removes the
// height budget instead of negotiating with it.
//
// The chrome's padding/gap are zeroed on mobile: the bar is full-bleed and
// `DialogFormBody` re-applies the 12px gutter. Desktop is the same centered
// modal as everything else — the bar hides, the ordinary header/footer show.
export const dialogFormPositionClass =
  "fixed z-50 duration-100 transition-none data-open:animate-in data-open:fade-in-0 " +
  // The sheet reaches the bottom of the screen and holds the keyboard off with
  // PADDING, rather than ending at `bottom: var(--kb)`. Same content position
  // either way, but the surface keeps going: iOS draws its accessory bar as a
  // floating pill with transparent margins around it, and a sheet that stopped
  // at the keyboard's edge let the page show through those margins as a strip
  // of blurred backdrop under the sheet.
  "inset-x-0 top-0 bottom-0 max-md:pb-[var(--kb,0px)] translate-x-0 translate-y-0 max-w-full max-h-none rounded-none " +
  // `overflow-hidden`, NOT `auto`: the sheet is three bands — sticky bar,
  // scrolling body, action row — and only the BODY scrolls. If the popup
  // itself scrolled, a sticky action row would overlay whatever passed under
  // it (it covered the privacy toggle) instead of the body ending above it.
  "flex flex-col gap-0 p-0 overflow-hidden " +
  "[scroll-padding-top:4rem] [scroll-padding-bottom:1rem] " +
  "data-open:slide-in-from-bottom-4 data-open:zoom-in-100 " +
  "md:grid md:gap-5 md:p-6 " +
  dialogDesktopPositionClass

// The form sheet's top bar: Cancel · title · primary action. Same frosted
// glass as `MobileHeader` (it IS a mobile header, for a modal), sticky so
// the actions stay put while the body scrolls beneath. Mobile only.
// No rule under the bar: the sheet is one surface, and a hairline right under
// the title reads as a header that isn't there.
const dialogActionBarBase =
  "sticky top-0 z-10 shrink-0 " +
  // 40px, not 48: the bar is its two 32px controls and a title between them,
  // and the inset above it is a hair, not a gutter — every pixel here is one
  // the list underneath does not get.
  "flex items-center justify-between gap-2 min-h-10 px-1 pt-[max(2px,env(safe-area-inset-top))] pb-1 " +
  "md:hidden"

/* `.sheet-glass`, not `.frosted-glass`: the page's glass mixes `--background`
   and carries a sheen, which over a `--popover` sheet shows as a band the
   width of the bar. The sheet's own glass is its own colour, so it disappears
   into the surface and only shows itself by blurring what scrolls under. */
export const dialogActionBarClass = "sheet-glass " + dialogActionBarBase

// Body of a form sheet on mobile: restores the chrome's gutter + gap that
// `dialogFormPositionClass` zeroed, clears the home indicator at the bottom.
// On desktop it dissolves into the modal's own grid (`display: contents`).
export const dialogFormBodyClass =
  // `flex-1 min-h-0 overflow-y-auto` — the body is the only scrolling band.
  // `gap-3` (not the desktop 20px): on a phone every gap competes with the
  // keyboard for the same ~200px.
  // `overflow-x-hidden`: base-ui's Switch hides its real input as a 1px fixed
  // box, which is enough to give the scroll box a horizontal scrollbar of its
  // own — a grey rule across the sheet, right above the action.
  "flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 md:contents md:overflow-visible"

// The form sheet's action row: the confirming button pinned below the body,
// never overlapping it (the body scrolls, this doesn't). The sheet is ONE
// surface down to the keyboard, action included — it was tried as a floating
// pill over the page, and with the keyboard up there is no page left to float
// over, only a 60px strip that reads as a seam under the form.
// Mobile only — desktop uses the ordinary `DialogFooter`.
export const dialogFormActionsClass =
  "shrink-0 bg-popover px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"

/*
 * The scrolling list band of a sheet. `-mx-2` (and NO matching padding):
 * `MediaListItem` brings its own `pl-2`, so a symmetric `px-2` would push
 * every cover 8px past the gutter and out of line with the title, the
 * field and the footer. Letting the rows' hover surface bleed into the
 * gutter is the point of the negative margin.
 *
 * Height comes from flex — `flex-1 min-h-0` inside a `flex flex-col`
 * sheet — never a `vh` cap, which can't know what the other bands cost.
 */
export const dialogListClass =
  "flex flex-col min-w-0 flex-1 min-h-0 overflow-y-auto -mx-2"

// `text-small` (19px): a sheet title sits on the same line as the ✕ and
// reads as a label for the screen, not a headline — 21px crowded it.
export const dialogTitleClass =
  "font-heading text-small leading-none font-medium"

export const dialogDescriptionClass =
  "text-small text-muted-foreground *:[a]:state-fade *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground"

/*
 * Header: [leading control] then the title stack, both starting on the
 * sheet's gutter line — the same left edge as the rows, the field and the
 * footer below it. A back control takes its OWN line rather than sitting
 * beside the title: inline it would indent the title by its own width and
 * nothing underneath would line up.
 *
 * Everything is left-aligned, phones included. A centred title reads as a
 * screen header, but it breaks the one vertical edge the sheet otherwise
 * holds, and a title that grows then shifts against fixed content below.
 */
// `min-h-8` matches the close button, so a title-only header is exactly as
// tall as one with a control in it — and no more: on a phone the space
// above the title is rows the list doesn't get.
export const dialogHeaderClass = "flex flex-col items-start gap-1 min-w-0 min-h-8 justify-center"
// `pr-8` keeps a long title clear of the ✕, which is positioned absolutely
// in the sheet's corner and so takes no space of its own.
export const dialogHeaderStackClass = "w-full min-w-0 flex flex-col gap-1.5 pr-8"
export const dialogHeaderSpacerClass = "size-8 shrink-0 md:hidden"

// Negative margins must match the chrome's padding at BOTH sizes, or the
// full-bleed footer stops reaching the edges. `pb` also clears the iOS home
// indicator, so the actions sit at the bottom of the sheet without the OS
// handle overlapping them.
export const dialogFooterClass =
  "-mx-3 -mb-3 md:-mx-6 md:-mb-6 mt-2 flex flex-col-reverse gap-2 rounded-b-xl md:rounded-b-2xl border-t bg-muted " +
  // Sticky on mobile so the actions never scroll out of reach when the sheet
  // is short. `bottom` cancels the footer's own negative margin so it parks
  // flush with the sheet's edge. The sheet itself already clears the keyboard,
  // so no `--kb` here. Desktop doesn't scroll: static.
  "sticky bottom-[-0.75rem] z-10 md:static " +
  "px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:p-6 md:flex-row md:justify-end"

// ─── Live Dialog (portal-rendered, modal) ────────────────────────────────────

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 transition-none supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  mobile = "sheet",
  ref,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  /** Phone presentation. `sheet` (default) — bottom sheet, actions in the
   *  footer. `form` — full-screen sheet anchored top, actions in a
   *  `DialogActionBar`; use for anything with a text field whose primary
   *  action must survive the keyboard. Desktop is identical either way. */
  mobile?: "sheet" | "form"
}) {
  const form = mobile === "form"

  /* Pull-down-to-dismiss. A `Sheet` inherits this from Base UI's Drawer; a
     Dialog presented as a bottom sheet by CSS has to be given it, or the only
     way out on a phone is a 32px ✕ in the far corner. Bottom sheets only —
     the form sheet fills the screen and is a form, where a stray downward
     drag would throw away what was typed. The hook closes by clicking the
     dialog's own close button, so focus goes back where it came from. */
  const [popupEl, setPopupEl] = React.useState<HTMLDivElement | null>(null)

  /* A sheet's own box must never scroll. `overflow-hidden` stops a FINGER
     from scrolling it, but not the browser: focusing a field near the bottom
     makes the engine scroll the nearest scrollable ancestor to reveal the
     caret, and an `overflow: hidden` box still qualifies. That is what took
     the title bar off the top of the Add-music sheet the moment the keyboard
     opened — the bands are positioned against the popup, so all of them went
     up with it, leaving a blank sheet with a field at the bottom.
     Scrolling it back is the only reliable answer: the engine does this
     without an event we can decline. */
  React.useEffect(() => {
    if (!popupEl) return
    const pin = () => {
      if (popupEl.scrollTop !== 0) popupEl.scrollTop = 0
      if (popupEl.scrollLeft !== 0) popupEl.scrollLeft = 0
    }
    popupEl.addEventListener("scroll", pin, { passive: true })
    return () => popupEl.removeEventListener("scroll", pin)
  }, [popupEl])
  const closeRef = React.useRef<HTMLButtonElement>(null)
  useSheetDrag(popupEl, {
    enabled: !form,
    onClose: React.useCallback(() => closeRef.current?.click(), []),
  })
  return (
    <DialogPortal>
      <DialogOverlay />
      {/* The keyboard skirt: the sheet's surface, continued down behind the
          keyboard. iOS draws the accessory bar as a floating pill with
          transparent margins, and a sheet that simply ends at the keyboard's
          edge lets the page show through them — a strip of blurred backdrop
          wedged between the sheet and the bar. Its own element rather than
          padding on the popup, because the popup is also the SCROLL box here
          and its footer positions against the padding edge; the form sheet,
          which scrolls in a band instead, pads itself and needs none of this.
          Zero-height (so invisible) whenever there is no keyboard. */}
      {!form && (
        <div
          aria-hidden="true"
          data-slot="dialog-keyboard-skirt"
          className="fixed inset-x-0 bottom-0 z-50 h-[var(--kb,0px)] bg-popover md:hidden"
        />
      )}
      <DialogPrimitive.Popup
        ref={useMergedRefs(setPopupEl, ref)}
        data-slot="dialog-content"
        data-mobile={mobile}
        className={cn(dialogChromeClass, form ? dialogFormPositionClass : dialogPositionClass, className)}
        {...props}
      >
        {children}
        {/* The gesture's own exit door: always mounted, even when the visible
            ✕ is not, so a pull-down works on a sheet that hides its ✕. */}
        <DialogPrimitive.Close ref={closeRef} className="hidden" aria-hidden="true" tabIndex={-1} />
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                // The form sheet's bar carries Cancel — no X on phones there.
                // Vertically centred on the HEADER ROW, not on the sheet's
                // corner — it sits at the gutter, exactly where the row
                // starts, so title and ✕ share a centre line. `right-2`
                // keeps it nearer the edge than the gutter, where a 32px
                // target wants to be.
                /* One inset, both axes, both breakpoints. It was
                   `top-3 right-2 md:top-6` — three different numbers, so the
                   ✕ measured 25px from the top and 9px from the right and sat
                   visibly low and tight in the corner. A corner control has
                   exactly one distance to get right, and it is the same one
                   twice. */
                className={cn("absolute top-4 right-4", form && "max-md:hidden")}
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({
  className, children, leading, ...props
}: React.ComponentProps<"div"> & {
  /** Optional control at the left edge — a back chevron on a drilled-in
   *  step. Without one the slot still holds its width on a phone, so the
   *  title doesn't shift when a step gains or loses it. */
  leading?: React.ReactNode
}) {
  return (
    <div data-slot="dialog-header" className={cn(dialogHeaderClass, className)} {...props}>
      {/* Optical, not box, alignment: an icon button is 32px around a 16px
          glyph, so its box hangs 8px left for the glyph to land on the same
          line as the content below. */}
      {leading && <span className="shrink-0 -ml-2">{leading}</span>}
      <div className={dialogHeaderStackClass}>{children}</div>
    </div>
  )
}

/*
 * DialogActionBar — the top bar of a `mobile="form"` sheet on phones:
 * `leading` (Cancel) · title · `trailing` (the primary action, as a text
 * button). Hidden from `md` (768) up, where the ordinary DialogHeader / DialogFooter
 * take over — so a form renders BOTH, gated by `useIsMobile()`, never two
 * `DialogTitle`s at once.
 */
function DialogActionBar({
  className,
  leading,
  trailing,
  children,
  plain = false,
  ...props
}: React.ComponentProps<"div"> & {
  leading?: React.ReactNode
  trailing?: React.ReactNode
  /** Drop the glass entirely — for a bar with nothing behind it at all.
   *  Rarely what you want now that the glass is the sheet's own colour
   *  (`.sheet-glass`) and therefore invisible at rest; it was the answer when
   *  the bar wore the PAGE's glass and showed as a band. Unlayered CSS either
   *  way, so a utility class cannot override it — the bar has to leave it
   *  off. */
  plain?: boolean
}) {
  return (
    <div
      data-slot="dialog-action-bar"
      className={cn(plain ? dialogActionBarBase : dialogActionBarClass, className)}
      {...props}
    >
      <div className="flex min-w-0 shrink-0 items-center">{leading}</div>
      {/* Title centred on the bar, not between the two buttons, so it
          doesn't drift when Cancel and the action differ in width. */}
      <div className="absolute inset-x-0 pointer-events-none flex justify-center px-20">
        {children}
      </div>
      <div className="flex min-w-0 shrink-0 items-center justify-end">{trailing}</div>
    </div>
  )
}

function DialogFormBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-form-body"
      className={cn(dialogFormBodyClass, className)}
      {...props}
    />
  )
}

/**
 * DialogFormActions — the confirming action of a `mobile="form"` sheet,
 * pinned below the scrolling body. Renders nothing on desktop, where
 * `DialogFooter` does the job.
 */
function DialogFormActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-form-actions"
      className={cn(dialogFormActionsClass, className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(dialogFooterClass, className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(dialogTitleClass, className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(dialogDescriptionClass, className)}
      {...props}
    />
  )
}

// ─── Static preview (kitchen-sink + design docs) ─────────────────────────────
//
// Renders the same visual chrome as a live Dialog, but as an inline styled
// div — no portal, no backdrop, no fixed positioning. Use to show every
// dialog variant at a glance in documentation. Shares the chrome class
// constants with the live components, so chrome changes update both.
//
// Inside, you compose with `DialogPreviewHeader` / `DialogPreviewTitle` /
// `DialogPreviewDescription` / `DialogPreviewFooter` — these are plain
// elements styled with the same class constants the real components use.

// What the preview looks like when `useIsMobile()` says phone — inside the
// design system's frame that is the window CHIP, not the browser. The live
// dialog gets this shape from `md:` classes, which read the real browser and
// so cannot follow a chip; the preview therefore restates the phone half with
// `!` so it beats the `md:` half that still matches on a desktop screen:
// full width, top corners only, the 12px sheet gutter and 8px band gap.
export const dialogPreviewPhoneClass =
  "!w-full !max-w-full !rounded-t-2xl !rounded-b-none !p-3 !gap-2 " +
  "[&_[data-slot=dialog-preview-title]]:!text-small"

/*
 * The bottom-sheet recipe for an ANCHORED popup — a Select list, a DatePicker
 * calendar — below the 768 presentation gate.
 *
 * It lives here, with the rest of the sheet vocabulary, because more than one
 * component needs it: it was private to `select.tsx`, and the DatePicker then
 * had to either copy it or stay a floating popover on a phone. Two copies of
 * a shape is how two surfaces stop matching.
 *
 * Tailwind v4 marks a utility important with a TRAILING `!`, not with
 * `!important` inside the brackets — the latter silently produces no rule.
 * The important is load-bearing: Base UI writes the anchored position as an
 * inline style, and an inline style loses only to `!important`.
 */
export const sheetPositionerClass =
  "[position:fixed]! [inset:auto_0_0_0]! [transform:none]! " +
  "[min-width:0]! [max-width:100%]! [width:100%]!"

export const sheetPopupClass =
  "[width:100%]! [max-width:100%]! [max-height:75svh]! " +
  "rounded-b-none rounded-t-2xl border-t border-border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] " +
  "shadow-[0_-8px_32px_rgba(0,0,0,0.18)]"

function DialogPreview({
  className,
  children,
  showCloseButton = true,
}: {
  className?: string
  children: React.ReactNode
  showCloseButton?: boolean
}) {
  const phone = useIsMobile()
  return (
    <div
      data-slot="dialog-preview"
      data-mobile={phone ? "sheet" : undefined}
      className={cn("relative", dialogChromeClass, className, phone && dialogPreviewPhoneClass)}
    >
      {children}
      {showCloseButton && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-4 right-4"
          aria-label="Close (preview)"
        >
          <XIcon />
        </Button>
      )}
    </div>
  )
}

function DialogPreviewHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn(dialogHeaderClass, className)} {...props}>
      <div className={dialogHeaderStackClass}>{children}</div>
    </div>
  )
}

function DialogPreviewTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="dialog-preview-title" className={cn(dialogTitleClass, className)} {...props} />
}

function DialogPreviewDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn(dialogDescriptionClass, className)} {...props} />
}

function DialogPreviewFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(dialogFooterClass, className)} {...props} />
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogActionBar,
  DialogFormBody,
  DialogFormActions,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  // Preview helpers (static, inline)
  DialogPreview,
  DialogPreviewHeader,
  DialogPreviewTitle,
  DialogPreviewDescription,
  DialogPreviewFooter,
}
