/*
 * component-docs — the design system's single source of truth.
 *
 * One Markdown file per component under `docs/components/<section-id>.md`
 * (see the README there). Vite inlines them at build time, so:
 *
 *   · the docs page renders the SAME text an agent reads off disk — there is
 *     no second copy to drift;
 *   · a missing file is simply "no info button", not a crash;
 *   · nothing has to be fetched at runtime, so the info modal opens instantly
 *     and works in a static export.
 *
 * Frontmatter is a deliberately tiny subset of YAML — `key: value`,
 * `key: [a, b]`, and block lists of `- …` lines (`usage`, `summary`).
 * A real parser would be a dependency for six fields.
 */

const FILES = import.meta.glob("/docs/components/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

export interface ComponentDoc {
  /** Section id — the file's basename, e.g. `dialog`. */
  id: string
  title: string
  status?: string
  /** Repo-relative path of the component's source file. */
  source?: string
  /** Other section ids worth reading next. */
  related: string[]
  /** Where the component is used in the product — the section's "Used in:"
   *  line. Frontmatter, not a prop on the page: these links are prose about
   *  the component, so they belong with the rest of its prose.
   *
   *  An entry with no `href` renders as plain text rather than a link, which
   *  is how a component that nothing uses yet still ANSWERS the question. A
   *  blank "Used in:" is indistinguishable from a forgotten one. */
  usage: Array<{ label: string; href?: string }>
  /** The three or four lines a reader needs ON the page, when the lead alone
   *  is not enough to use the section. Frontmatter, like `usage`, so it stays
   *  in the same file as the rest of the prose instead of being typed into
   *  `home.tsx` — which is exactly how the Responsive section ended up with a
   *  hand-written second copy of its own table.
   *
   *  Rendered as `**Lead** — the rest`, Markdown-inline, under the intro.
   *  Most sections need none: write one only when the section is a RULE the
   *  page is measured against rather than a component you can look at. */
  summary: string[]
  /** Everything after the frontmatter block. */
  body: string
  /** The first paragraph of the body — one or two sentences on what the
   *  component is FOR. The design-system section renders it as its intro,
   *  so the page's prose is a slice of this file, never a second copy. */
  lead: string
  /** Repo-relative path of the doc itself — for the GitHub link. */
  path: string
}

function parse(path: string, raw: string): ComponentDoc {
  const id = path.replace(/^.*\//, "").replace(/\.md$/, "")
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const body = m ? raw.slice(m[0].length) : raw
  const meta: Record<string, string> = {}
  /* Block lists: a key whose value is empty, followed by `  - …` lines.
     Collected generically — which is why `summary` needed no parser change
     when it was added after `usage`. */
  const blocks: Record<string, string[]> = {}
  if (m) {
    let openKey: string | null = null
    for (const line of m[1].split(/\r?\n/)) {
      const item = line.match(/^\s+-\s+(.*)$/)
      if (item && openKey) { blocks[openKey].push(item[1].trim()); continue }
      const kv = line.match(/^(\w+):\s*(.*)$/)
      if (!kv) continue
      const [, key, value] = kv
      if (value.trim() === "") { openKey = key; blocks[key] = [] }
      else { openKey = null; meta[key] = value.trim() }
    }
  }
  const list = (v?: string) =>
    v ? v.replace(/^\[|\]$/g, "").split(",").map(s => s.trim()).filter(Boolean) : []

  // First paragraph = the first block that is not a heading, fence, list,
  // table or blank line. Fences are skipped whole so a doc that opens with a
  // usage snippet still yields its sentence, not the code.
  let lead = ""
  {
    const blocks = body.split(/\r?\n\s*\r?\n/)
    let inFence = false
    for (const b of blocks) {
      const t = b.trim()
      if (!t) continue
      if (t.startsWith("```")) { inFence = !t.endsWith("```") || t === "```"; continue }
      if (inFence) { if (t.endsWith("```")) inFence = false; continue }
      if (/^(#|[-*] |\d+\. |\||>)/.test(t)) continue
      lead = t.replace(/\s*\n\s*/g, " ")
      break
    }
  }

  return {
    id,
    lead,
    title:   meta.title || id,
    status:  meta.status || undefined,
    source:  meta.source || undefined,
    related: list(meta.related),
    /* `Label | href` per line. The pipe rather than YAML mapping syntax so a
       label can hold the `›` and `·` these lines are full of without quoting,
       and so the parser stays four lines long. */
    usage: (blocks.usage ?? []).map(entry => {
      const at = entry.lastIndexOf("|")
      return at === -1
        ? { label: entry.trim() }
        : { label: entry.slice(0, at).trim(), href: entry.slice(at + 1).trim() }
    }),
    summary: blocks.summary ?? [],
    body,
    // `path` from the glob is absolute-from-root; store it repo-relative so
    // it can be pasted into a GitHub URL or opened in an editor as-is.
    path: path.replace(/^\//, ""),
  }
}

const DOCS: Record<string, ComponentDoc> = Object.fromEntries(
  Object.entries(FILES).map(([path, raw]) => {
    const doc = parse(path, raw)
    return [doc.id, doc]
  }),
)

/** The doc for a design-system section id, if one has been written. */
export function componentDoc(id: string): ComponentDoc | undefined {
  return DOCS[id]
}

/** Every id that has a doc — for coverage reporting on the docs page. */
export function documentedIds(): string[] {
  return Object.keys(DOCS).sort()
}
