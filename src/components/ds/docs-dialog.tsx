"use client"

/*
 * DocsDialog — the component's write-up, in ONE implementation.
 *
 * There were two. `Section` had a copy and `Example` had another, and they
 * had already drifted: the file path moved into the header in one of them and
 * stayed in a footer in the other, so the same document looked like two
 * different pages depending on which button you pressed. Two renderings of
 * one file is the same defect this whole page exists to prevent, one level up.
 *
 * So: one dialog, one button, one place the path is printed. Both surfaces
 * import these; neither can style, order or word anything of its own.
 *
 * The content itself is `docs/components/<id>.md` — the same file an agent
 * reads off disk. Nothing here is written by hand.
 */

import * as React from "react"
import { BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Markdown } from "@/components/ds/markdown"
import { componentDoc } from "@/lib/component-docs"

const REPO = "https://github.com/chris-hug/muza-prototypes/blob/main"

/**
 * The "Docs" button and its dialog. Renders nothing when the component has no
 * `docs/components/<id>.md` — writing the doc is what turns the button on.
 */
export function DocsButton({ id, className }: { id: string; className?: string }) {
  const [open, setOpen] = React.useState(false)
  const entry = componentDoc(id)
  if (!entry) return null

  return (
    <>
      {/* Named, not a bare ⓘ. The dialog holds the component's whole
          write-up — anatomy, the arithmetic behind its numbers, behaviour,
          and the open questions nobody has answered yet. That is not "info"
          in the tooltip sense, it is THE document, and the word on the button
          is the word for the file it renders. */}
      <Button variant="secondary" size="sm" className={className} onClick={() => setOpen(true)}>
        <BookOpen className="size-3.5" />
        Docs
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="md:max-w-[min(46rem,90vw)] flex flex-col"
          /* Inline, not a class: the base sheet sets `md:max-h-none`, and
             between two utilities for the same property the GENERATED CSS
             order decides, not the order they are listed in — `max-h-none`
             wins there whatever tailwind-merge keeps. Without a cap the docs
             dialog grew to its content: 5,490px tall in a 1,216px viewport,
             with its own header scrolled off the top of the screen. */
          style={{ maxHeight: "85svh" }}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="md:text-large">{entry.title}</DialogTitle>
            {/* The file, beside the title rather than at the very bottom. It
                answers "where does this text live" — a question you ask
                BEFORE reading, when deciding whether to trust it, not after
                scrolling three thousand words to find out. */}
            <a
              href={`${REPO}/${entry.path}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block w-fit font-mono text-3xsmall text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              {entry.path}
            </a>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <Markdown source={entry.body} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
