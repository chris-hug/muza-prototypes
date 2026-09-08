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
 * Frontmatter is a deliberately tiny subset of YAML — `key: value` and
 * `key: [a, b]`. A real parser would be a dependency for four fields.
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
  /** Everything after the frontmatter block. */
  body: string
  /** Repo-relative path of the doc itself — for the GitHub link. */
  path: string
}

function parse(path: string, raw: string): ComponentDoc {
  const id = path.replace(/^.*\//, "").replace(/\.md$/, "")
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const body = m ? raw.slice(m[0].length) : raw
  const meta: Record<string, string> = {}
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/)
      if (kv) meta[kv[1]] = kv[2].trim()
    }
  }
  const list = (v?: string) =>
    v ? v.replace(/^\[|\]$/g, "").split(",").map(s => s.trim()).filter(Boolean) : []

  return {
    id,
    title:   meta.title || id,
    status:  meta.status || undefined,
    source:  meta.source || undefined,
    related: list(meta.related),
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
