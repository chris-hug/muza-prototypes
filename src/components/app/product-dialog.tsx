"use client"

/*
 * ProductDialog — the buyer's view of one product, opened from a
 * `ProductCard` on the artist page. Figma: MUSA Layouts & Flows › Product
 * Modal (7510:237525 fixed price, 7531:244071 apparel at a chosen price,
 * 7510:239020 record linked to a song, 7531:245070 record at a fixed price).
 *
 * A dialog rather than a page, as designed: buying merch is a short detour
 * from the artist, and closing it returns to the same place in the grid.
 * Below `md` the Dialog is a bottom sheet (see dialog.md), so on a phone this
 * is a sheet you pull down to leave.
 *
 * Built only from the system's parts: Dialog, Avatar, Badge, Separator,
 * Input, Chip, QtyStepper, Button. The four Figma frames are one layout with
 * rows switched on by the product (see `shop-product.ts`), not four screens.
 */

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { QtyStepper } from "@/components/ui/qty-stepper"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { PauseFilledAlt, PlayFilledAlt } from "@/components/ui/transport-icons"
import { useToast } from "@/components/ui/toast"
import { CartDrawer } from "@/components/app/cart-drawer"
import { ColorDot } from "@/components/app/color-dot"
import { useCart } from "@/lib/cart"
import { usePlayer } from "@/lib/player"
import { slugify, useMediaNav } from "@/lib/media-nav"
import { hasArtistProfile } from "@/lib/artist-catalog"
import { hasAlbumDetail } from "@/lib/album-catalog"
import { cropStyle, discountPercent, type ProductImage, type ShopProduct } from "@/lib/shop-product"
import { cn } from "@/lib/utils"
import { useCoarsePointer } from "@/lib/use-media-query"

export function ProductDialog({
  product, onOpenChange,
}: {
  /** The product to show; `null` closes the dialog. */
  product: ShopProduct | null
  onOpenChange: (open: boolean) => void
}) {
  const [cartOpen, setCartOpen] = useState(false)
  // Kept while the dialog animates out, so its content does not vanish
  // before the sheet does.
  const [shown, setShown] = useState(product)
  useEffect(() => { if (product) setShown(product) }, [product])

  return (
    <>
      <Dialog open={!!product} onOpenChange={onOpenChange}>
        {/* `pt-12` on the phone sheet: the close ✕ sits top-right, and the
             gallery starts at the top edge, so without it the ✕ lands on the
             image. Desktop has 48px on every side, as designed. */}
        <DialogContent className="pt-12 md:max-w-[1120px] md:p-12 max-h-[90vh] overflow-y-auto">
          {shown && (
            <ProductBody
              key={shown.id}
              product={shown}
              onDone={() => onOpenChange(false)}
              onBuyNow={() => { onOpenChange(false); setCartOpen(true) }}
            />
          )}
        </DialogContent>
      </Dialog>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  )
}

function ProductBody({
  product, onDone, onBuyNow,
}: {
  product: ShopProduct
  onDone: () => void
  onBuyNow: () => void
}) {
  const cart = useCart()
  const { add: toast } = useToast()
  const fixed = product.priceMode === "fixed"

  const [color, setColor] = useState(product.colors?.[0]?.name)
  const [size, setSize] = useState(product.sizes?.find(s => !s.soldOut)?.label)
  const [qty, setQty] = useState(1)
  const [priceDraft, setPriceDraft] = useState(String(product.price))
  const chosenPrice = Math.max(product.price, parseFloat(priceDraft.replace(/[^\d.]/g, "")) || 0)

  const discount = discountPercent(product)

  const addLine = () => {
    // One line per variant, so a black M and a cream L are two lines.
    const lineId = ["product", product.id, color, size].filter(Boolean).join("-")
    cart.add({
      id:           lineId,
      shopId:       slugify(product.artist),
      shopName:     product.artist,
      productTitle: product.title,
      image:        product.images[0]?.src ?? "",
      kind:         "physical",
      variants:     product.colors || product.sizes
        ? { colors: product.colors?.map(c => c.name), sizes: product.sizes?.map(s => s.label) }
        : undefined,
      selected:     { color, size },
      minPrice:     product.price,
      unitPrice:    fixed ? product.price : chosenPrice,
      fixedPrice:   fixed,
      qty,
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-6">
      <ProductGallery images={product.images} title={product.title} />

      <div className="flex min-w-0 flex-col justify-between gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 min-w-0">
                <Avatar size="sm">
                  {product.artistImage && <AvatarImage src={product.artistImage} alt="" />}
                  <AvatarFallback>{product.artist.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="text-small font-medium text-muted-foreground truncate">{product.artist}</span>
              </span>
              <Badge variant="secondary">{product.kind}</Badge>
            </div>

            <DialogTitle className="text-2xlarge font-medium leading-none tracking-tight text-foreground text-balance">
              {product.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {fixed ? `${cart.format(product.price)}` : `${cart.format(product.price)} or more`}
            </DialogDescription>

            {fixed && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xlarge leading-none text-foreground tabular-nums">{cart.format(product.price)}</span>
                {discount > 0 && (
                  <>
                    <span className="text-large leading-none text-muted-foreground line-through tabular-nums">{cart.format(product.compareAt!)}</span>
                    {/* `new` is the Mint pair from the avatar palette (src/lib/avatar.ts):
                         the system's soft green. `success` is a saturated
                         mint for "Beta"-type flags and shouted next to a
                         price. */}
                    <Badge variant="new">{discount}% off</Badge>
                  </>
                )}
              </div>
            )}

            {product.linkedSong && <SongPreview song={product.linkedSong} />}
          </div>

          {/* `h-px` here because the component's own `data-horizontal:h-px`
               never matches: Base UI sets `data-orientation="horizontal"`,
               so every Separator in the app renders 0px tall. Fixing the
               component would make every one of them appear at once. */}
          <Separator className="h-px" />

          <div className="grid grid-cols-[minmax(64px,auto)_minmax(0,1fr)] items-center gap-x-6 gap-y-6">
            {!fixed && (
              <>
                {/* The minimum lives with the label, as its caption: it is
                     the rule for the field, read before typing. The unit,
                     "per item", lives in the field after the amount, so the
                     two read as one phrase — "$ 10 per item". */}
                <label htmlFor={`price-${product.id}`} className="self-start flex h-10 flex-col justify-center">
                  <span className="text-base leading-tight text-foreground">Choose price</span>
                  <span className="text-2xsmall leading-tight text-muted-foreground">{cart.format(product.price)} or more</span>
                </label>
                <Input
                  id={`price-${product.id}`}
                  inputMode="decimal"
                  size="default"
                  startText={cart.currency.symbol}
                  endText="per item"
                  value={priceDraft}
                  onChange={e => setPriceDraft(e.target.value)}
                  onBlur={() => setPriceDraft(String(chosenPrice))}
                  className="pr-24 tabular-nums"
                />
              </>
            )}

            {product.colors && (
              <>
                <span className="text-base text-foreground">Color</span>
                <div role="group" aria-label="Color" className="flex flex-wrap gap-2">
                  {product.colors.map(c => (
                    // `activeStyle="outline"`: Figma marks the chosen colour
                    // with a ring, not a fill. A primary fill would also
                    // paint over the swatch, the one thing the chip is
                    // there to show. Sizes keep the fill, as designed.
                    <Chip
                      key={c.name}
                      size="md"
                      activeStyle="outline"
                      selected={c.name === color}
                      aria-pressed={c.name === color}
                      onClick={() => setColor(c.name)}
                    >
                      <ColorDot name={c.name} value={c.value} />
                      {c.name}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {product.sizes && (
              <>
                <span className="text-base text-foreground">Size</span>
                <div role="group" aria-label="Size" className="flex flex-wrap gap-2">
                  {product.sizes.map(s => (
                    <Chip
                      key={s.label}
                      size="md"
                      selected={s.label === size}
                      aria-pressed={s.label === size}
                      disabled={s.soldOut}
                      aria-label={s.soldOut ? `${s.label}, sold out` : undefined}
                      onClick={() => setSize(s.label)}
                      className="min-w-14 justify-center"
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            <span className="text-base text-foreground">Quantity</span>
            <QtyStepper value={qty} onChange={setQty} min={1} max={10} className="justify-self-start" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Buy now leads: it is the shortest way to the thing the page
               is for. Add to cart is the secondary path, for someone still
               shopping. */}
          {/* The amount on the button is what the buyer pays for these
               items: the chosen price (never under the minimum) times the
               quantity, so it moves as they type or step. */}
          <Button size="lg" className="w-full tabular-nums" onClick={() => { addLine(); onBuyNow() }}>
            Buy for {cart.format((fixed ? product.price : chosenPrice) * qty)}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={() => {
              addLine()
              toast({ title: "Added to cart", description: product.title, type: "success" })
              onDone()
            }}
          >
            <ShoppingCart />
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  )
}

/*
 * SongPreview — listen before buying, inside the dialog. The app's player bar
 * is behind the dialog's scrim, so starting a song there gave no sign that
 * anything was playing and no way to stop it. This is a very small player of
 * its own over the SAME player state: play / pause, a scrubber, the time.
 * Closing the dialog leaves the song running in the real bar, where it can be
 * found again.
 *
 * Only a product whose music is on muza has it (`linkedSong`).
 */
function SongPreview({ song }: { song: NonNullable<ShopProduct["linkedSong"]> }) {
  const player = usePlayer()
  const { openAlbum, openArtist } = useMediaNav()
  const current = player.track?.title === song.title && player.track?.album === song.album
  const playing = current && player.playing
  // The bar's own duration is 0 when the track was started without one.
  const duration = (current && player.duration) || parseTime(song.duration)
  const elapsed = current ? player.elapsed : 0

  const start = () => current
    ? player.toggle()
    : player.play({ title: song.title, artist: song.artist, album: song.album, image: song.cover, totalTime: song.duration }, song.album)

  return (
    <div className="flex items-center gap-3">
      <Button size="icon" aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`} onClick={start} className="shrink-0">
        {playing ? <PauseFilledAlt className="size-4" /> : <PlayFilledAlt className="size-4" />}
      </Button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-small text-foreground">{song.title}</span>
          <span className="shrink-0 text-2xsmall text-muted-foreground tabular-nums">
            {formatTime(elapsed)} / {formatTime(duration)}
          </span>
        </div>
        {/* Seeking before the song has started starts it there. */}
        <Slider
          aria-label={`Position in ${song.title}`}
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={[elapsed]}
          onValueChange={v => {
            const t = Array.isArray(v) ? v[0] : v
            if (!current) start()
            player.seek(t)
          }}
        />
        {/* Artist and album open their pages when muza has them, like a
             song row anywhere else; a name with no page stays text. */}
        <span className="truncate text-2xsmall text-muted-foreground">
          <MetaLink to={hasArtistProfile(slugify(song.artist)) ? () => openArtist(slugify(song.artist)) : undefined}>{song.artist}</MetaLink>
          {" · "}
          <MetaLink to={hasAlbumDetail(slugify(song.album)) ? () => openAlbum(slugify(song.album)) : undefined}>{song.album}</MetaLink>
          {" · "}{song.year}
        </span>
      </div>
    </div>
  )
}

function MetaLink({ to, children }: { to?: () => void; children: React.ReactNode }) {
  // Text on a coarse pointer, as the meta line is in a song row: a 15px word
  // in a run of text is no finger target, and the sheet is not the place to
  // leave from by accident.
  const coarse = useCoarsePointer()
  if (!to || coarse) return <>{children}</>
  return (
    // Exactly the meta link a song row uses (song-list-item.tsx): the
    // shared wipe and nothing else — no colour change, no box.
    <button type="button" onClick={to} className="link-underline outline-none cursor-pointer">
      {children}
    </button>
  )
}

function parseTime(label?: string): number {
  if (!label) return 0
  return label.split(":").map(Number).reduce((acc, n) => acc * 60 + (Number.isNaN(n) ? 0 : n), 0)
}

function formatTime(s: number): string {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`
}

/*
 * ProductGallery — the main image and a row of every thumbnail, the row
 * cut off at the edge when there are more than four. One strip of every
 * image underneath the main frame: a
 * native scroll-snap scroller, so a finger gets the platform's own swipe, the
 * chevrons and thumbnails step it, and the strip's scroll position decides
 * which image is current. There is no second "selected" state to keep in
 * step with where the strip actually is.
 *
 * The chevrons are `Button variant="secondary" size="icon-sm"`; they appear
 * only where a pointer can hover, because a phone swipes.
 */
function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const stripRef = useRef<HTMLDivElement>(null)
  const thumbRowRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const count = images.length

  // Keep the current thumb in view, however the image changed — swipe,
  // chevron or thumb — AND half of its neighbour on whichever side has more.
  // Bringing only the current thumb into view parked it flush against the
  // edge, so at the fifth of six images the row looked complete and the
  // sixth was nowhere: the cut-off thumb is the only sign there is more, so
  // it has to survive every move. Scrolls the ROW only, as far as needed.
  useEffect(() => {
    const row = thumbRowRef.current
    const thumb = row?.children[active] as HTMLElement | undefined
    if (!row || !thumb || row.scrollWidth <= row.clientWidth) return
    const peek = thumb.offsetWidth / 2
    const left = thumb.offsetLeft - row.offsetLeft - (active > 0 ? peek : 0)
    const right = thumb.offsetLeft - row.offsetLeft + thumb.offsetWidth + (active < count - 1 ? peek : 0)
    if (left < row.scrollLeft) row.scrollTo({ left, behavior: "smooth" })
    else if (right > row.scrollLeft + row.clientWidth) row.scrollTo({ left: right - row.clientWidth, behavior: "smooth" })
  }, [active, count])

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const onScroll = () => {
      const i = Math.round(strip.scrollLeft / Math.max(strip.clientWidth, 1))
      setActive(Math.min(Math.max(i, 0), count - 1))
    }
    strip.addEventListener("scroll", onScroll, { passive: true })
    return () => strip.removeEventListener("scroll", onScroll)
  }, [count])

  const show = (i: number) => {
    const strip = stripRef.current
    if (!strip) return
    const next = (i + count) % count
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    strip.scrollTo({ left: next * strip.clientWidth, behavior: reduce ? "auto" : "smooth" })
  }


  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="relative">
        <div
          ref={stripRef}
          role="group"
          aria-roledescription="carousel"
          aria-label={`${title}, ${count} ${count === 1 ? "image" : "images"}`}
          className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-xl sm:rounded-2xl border border-border bg-muted [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div key={`${img.src}-${i}`} className="aspect-[532/358] w-full shrink-0 snap-center overflow-hidden">
              <img
                src={img.src}
                alt={`${title}, image ${i + 1} of ${count}`}
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                style={cropStyle(img.crop)}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Previous image"
              onClick={() => show(active - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 hidden [@media(hover:hover)]:inline-flex"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Next image"
              onClick={() => show(active + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden [@media(hover:hover)]:inline-flex"
            >
              <ChevronRight />
            </Button>
          </>
        )}
      </div>

      {count > 1 && (
        // Every image, as one row. Up to four fill the width; past four the
        // row scrolls and each thumb is a 4.5th of it, so the fifth is cut
        // in half at the edge — the cut is what says there are more. It
        // replaced a fourth tile reading "+3": a tile with no picture that
        // then looked selected whenever the gallery was past image three.
        // `p-0.5 -m-0.5`: room for the focus ring inside the scroller.
        <div
          ref={thumbRowRef}
          className={cn(
            "flex gap-1.5 p-0.5 -m-0.5",
            count > 4 && "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {images.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              onClick={() => show(i)}
              aria-label={`Show image ${i + 1} of ${count}`}
              aria-current={active === i || undefined}
              className={cn(
                "relative aspect-[4/3] shrink-0 overflow-hidden rounded-lg bg-muted outline-none focus-ring cursor-pointer",
                count > 4 ? "basis-[calc((100%-4*6px)/4.5)]" : "basis-[calc((100%-3*6px)/4)]",
                // The current thumb is the one at full strength; the rest sit
                // at half and come up on hover. Replaced a 2px ink ring that
                // lay ON the picture: heavy, and it covered the edge of the
                // very image it pointed at.
                "transition-opacity duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                // Plus a 0.5px ink line round the current one (one device pixel
                // on a retina screen; 1px read as a frame), drawn inside so it
                // never needs room in the row.
                active === i
                  ? "opacity-100 after:absolute after:inset-0 after:rounded-lg after:ring-[0.5px] after:ring-inset after:ring-foreground"
                  : "opacity-50 hover:opacity-100",
              )}
            >
              <img src={img.src} alt="" draggable={false} loading="lazy" style={cropStyle(img.crop)} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
