import { useState } from "react"

import { CreditsDialogPreview } from "@/components/app/credits-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserLibraryProvider } from "@/lib/user-library"
import { WindowWidthContext } from "@/lib/use-media-query"

// A review page for one decision: the credits dialog's CURRENT version — an
// album, a song with the cover, a song without it — side by side, as desktop
// dialogs or as phone sheets. Deliberately not the design-system frame: no
// width ladder, no code, only the two sizes a reviewer needs. The design
// system (Credits Dialog) keeps every width and the draft.
//
// Opens on Mobile, where most people will meet it. Phone = a 375px window: `WindowWidthContext` tells `useIsMobile()` the
// window is 375, so each preview takes the sheet shape (full width, the
// sheet's top corners, the grabber), and the box is 375 wide. Desktop = the
// 576px dialog.
//
// Deep link: the demo host has no SPA fallback, so `npm run build` copies the
// SPA index.html to review/credits/index.html (see research-credits.tsx).

export function meta() {
  return [{ title: "Credits · current version · muza review" }]
}

const PREVIEWS = [
  { label: "Album", props: { albumKey: "a30" } },
  { label: "Song — with cover", props: { albumKey: "a30", track: "Afro Blue" } },
  { label: "Song — without cover", props: { albumKey: "a30", track: "Afro Blue", songCover: false } },
] as const

export default function ReviewCredits() {
  const [size, setSize] = useState<"desktop" | "mobile">("mobile")
  const mobile = size === "mobile"

  return (
    // The root shell sets `body { overflow: hidden }`, so the page scrolls itself.
    <main className="h-full overflow-y-auto bg-background">
      <UserLibraryProvider>
        <div className="px-page mx-auto flex max-w-[1920px] flex-col gap-10 py-12">
          <header className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xsmall text-muted-foreground">muza review · credits</p>
              <h1 className="text-2xlarge font-medium leading-tight tracking-tight text-foreground">Credits — current version</h1>
              <p className="text-small text-muted-foreground max-w-2xl">
                Black Radio, and its song “Afro Blue”. Mobile shows the bottom sheet of a 375px phone, desktop the dialog.
              </p>
            </div>
            <Tabs value={size} onValueChange={v => setSize(v as "desktop" | "mobile")}>
              <TabsList>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
              </TabsList>
            </Tabs>
          </header>

          <div className="flex flex-wrap items-start justify-center gap-8">
            {PREVIEWS.map(p => (
              <section key={p.label} className="flex flex-col gap-3" style={{ width: mobile ? 375 : 576 }}>
                <h2 className="text-small font-medium text-foreground">{p.label}</h2>
                <WindowWidthContext.Provider value={mobile ? 375 : null}>
                  <CreditsDialogPreview {...p.props} variant="current" />
                </WindowWidthContext.Provider>
              </section>
            ))}
          </div>
        </div>
      </UserLibraryProvider>
    </main>
  )
}
