"use client"

/*
 * Product Card in the Shop grid — four merch tiles in the same `.grid-cards`
 * layout the artist page's Shop tab uses.
 *
 * This file is a CALL SITE, not a copy: it renders the real `ProductCard`.
 * There is no product catalog yet (the artist page keeps its own list), so
 * the items live here; the covers are real release artwork from the
 * catalog's CDN. `price` is a formatted string on purpose — the card carries
 * no currency logic. `onClick` opens the product and `onAddToCart` adds it in
 * the app; both are no-ops here.
 */

import { ProductCard } from "@/components/ui/product-card"

const PRODUCTS = [
  { id: "kp1", title: "Space Is the Place — Vinyl Reissue", price: "32 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/31/78/e731786e-eba2-2d1c-6ff6-ff6e2354d48c/00011105024921.rgb.jpg/600x600bb.jpg" },
  { id: "kp2", title: "Lanquidity (Deluxe 4LP Box)",         price: "120 $", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b3/2a/5f/b32a5f91-5551-1ac0-17c6-e6dd4dcc0292/4062548021820_3000.jpg/600x600bb.jpg" },
  { id: "kp3", title: "Saturn Records Cap",                  price: "28 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music62/v4/fd/56/b8/fd56b88e-1bb8-9be7-c945-61fbaf9da665/Astro_Black_2018_cover-300.jpg/600x600bb.jpg" },
  { id: "kp4", title: "Cosmic Equation Poster",              price: "18 $",  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music49/v4/20/db/51/20db5143-be96-6741-6d70-08d9fc0d5605/Cosmos_art_1500.jpg/600x600bb.jpg" },
]

export default function ProductCardBasicExample() {
  return (
    <div className="@container">
      <ul className="grid-cards">
        {PRODUCTS.map(p => (
          <li key={p.id}>
            <ProductCard cover={p.cover} title={p.title} price={p.price} onClick={() => {}} onAddToCart={() => {}} />
          </li>
        ))}
      </ul>
    </div>
  )
}
