"use client"

/*
 * Markdown — a small renderer for the component docs.
 *
 * Deliberately not a library. The docs are ours, so the grammar they use is
 * known and fixed: headings, paragraphs, bullet lists, tables, fenced code,
 * and inline `code` / **bold** / [links](…). A parser that handles the rest
 * of CommonMark would be ~40KB shipped to render text we control.
 *
 * Everything renders with the design system's own tokens, so the info modal
 * looks like the app rather than like a README.
 */

import { cn } from "@/lib/utils"

/* ── inline: `code`, **bold**, [text](href) ─────────────────────────────── */

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g

function inline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const key = `${keyBase}-${i}`
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="text-2xsmall font-normal font-sans px-1 py-px rounded-sm bg-muted text-foreground">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <span key={key} className="text-foreground font-medium">{part.slice(2, -2)}</span>
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      // Repo-relative paths become GitHub links; anything else is left as-is.
      const href = /^https?:|^#/.test(link[2])
        ? link[2]
        : `https://github.com/chris-hug/muza-prototypes/blob/main/${link[2]}`
      return (
        <a
          key={key}
          href={href}
          target={href.startsWith("#") ? undefined : "_blank"}
          rel="noreferrer"
          className="text-primary-text hover:underline underline-offset-2"
        >
          {link[1]}
        </a>
      )
    }
    return <span key={key}>{part}</span>
  })
}

/** One paragraph's worth of inline Markdown, no block wrapper — the section
 *  header renders a doc's lead through this, inside its own `<p>`. */
export function MarkdownInline({ source }: { source: string }) {
  return <>{inline(source, "lead")}</>
}

/* ── block level ───────────────────────────────────────────────────────── */

export function Markdown({ source, className }: { source: string; className?: string }) {
  const lines = source.split(/\r?\n/)
  const out: React.ReactNode[] = []
  let i = 0

  const flushParagraph = (buf: string[]) => {
    if (buf.length === 0) return
    const text = buf.join(" ")
    out.push(
      <p key={`p-${out.length}`} className="text-small font-normal text-muted-foreground leading-6">
        {inline(text, `p${out.length}`)}
      </p>,
    )
    buf.length = 0
  }

  const para: string[] = []

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code — everything until the closing fence, verbatim.
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++])
      i++
      flushParagraph(para)
      out.push(
        <pre
          key={`code-${out.length}`}
          data-lang={lang || undefined}
          className="overflow-x-auto rounded-lg border border-border bg-muted p-3 text-2xsmall leading-5 text-foreground"
        >
          <code>{code.join("\n")}</code>
        </pre>,
      )
      continue
    }

    // Headings — `##` and `###` only; `#` is the frontmatter title.
    const h = line.match(/^(#{2,3})\s+(.*)$/)
    if (h) {
      flushParagraph(para)
      const Tag = h[1].length === 2 ? "h3" : "h4"
      out.push(
        <Tag
          key={`h-${out.length}`}
          className={cn(
            "font-medium text-foreground",
            h[1].length === 2 ? "text-base mt-2" : "text-small mt-1",
          )}
        >
          {inline(h[2], `h${out.length}`)}
        </Tag>,
      )
      i++
      continue
    }

    // Table — a header row, a separator, then body rows.
    // The `-` must come LAST in the class: `[:-|]` is a RANGE from `:` to
    // `|`, which covers every letter and digit — so every row of the table
    // matched as its separator and the parser started mid-table.
    if (line.startsWith("|") && lines[i + 1]?.match(/^\|[\s:|-]+\|$/)) {
      flushParagraph(para)
      const cells = (row: string) =>
        row.replace(/^\||\|$/g, "").split("|").map(c => c.trim())
      const head = cells(line)
      i += 2
      const body: string[][] = []
      while (i < lines.length && lines[i].startsWith("|")) body.push(cells(lines[i++]))
      out.push(
        <div key={`t-${out.length}`} className="overflow-x-auto">
          <table className="w-full border-collapse text-small">
            <thead>
              <tr className="border-b border-border">
                {head.map((c, n) => (
                  <th key={n} className="py-2 pr-4 text-left font-medium text-foreground">
                    {inline(c, `th${n}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rn) => (
                <tr key={rn} className="border-b border-border/60 last:border-0">
                  {row.map((c, n) => (
                    <td key={n} className="py-2 pr-4 align-top text-muted-foreground">
                      {inline(c, `td${rn}-${n}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // Bullet list — consecutive `-` lines, continuation lines folded in.
    if (/^[-*]\s+/.test(line)) {
      flushParagraph(para)
      const items: string[] = []
      while (i < lines.length && (/^[-*]\s+/.test(lines[i]) || /^\s+\S/.test(lines[i]))) {
        if (/^[-*]\s+/.test(lines[i])) items.push(lines[i].replace(/^[-*]\s+/, ""))
        else items[items.length - 1] += " " + lines[i].trim()
        i++
      }
      out.push(
        <ul key={`ul-${out.length}`} className="flex flex-col gap-1.5 list-disc pl-5 text-small text-muted-foreground leading-6">
          {items.map((it, n) => <li key={n}>{inline(it, `li${n}`)}</li>)}
        </ul>,
      )
      continue
    }

    if (line.trim() === "") { flushParagraph(para); i++; continue }

    para.push(line.trim())
    i++
  }
  flushParagraph(para)

  return <div className={cn("flex flex-col gap-4", className)}>{out}</div>
}
