/*
 * theme-writer — the dev-server endpoint the ramp controller saves through.
 *
 * The controller edits colours live by writing inline custom properties onto
 * `<html>`. That is enough to SEE a theme and nothing at all to keep one: a
 * reload and the work is gone. Saving has to produce a file.
 *
 * A browser cannot write into the repo, so the dev server does it. This plugin
 * adds one route, POST `/__theme`, which takes the controller's config and
 * writes two files into `app/themes/`:
 *
 *   <name>.json   the config — the five curve numbers per ramp plus the steps
 *                 that are pinned to an exact value. This is the source: it is
 *                 what the controller re-loads, and what a later edit starts
 *                 from.
 *   <name>.css    the same thing as plain declarations, for pasting into
 *                 `app.css` or importing after it.
 *
 * Dev only, and deliberately: it writes to disk from an unauthenticated local
 * request, which is fine for a machine-local dev server and would not be fine
 * anywhere else. `apply: "serve"` keeps it out of every build.
 *
 * The name is sanitised to `[a-z0-9-]` and the write is confined to
 * `app/themes/` — a name is user input, and user input that becomes a path is
 * how a save button turns into an arbitrary file write.
 */

import { mkdirSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import type { Plugin } from "vite"

const DIR = "app/themes"

export function themeWriter(): Plugin {
  return {
    name: "muza:theme-writer",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__theme", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405
          res.end("POST only")
          return
        }
        let body = ""
        req.on("data", chunk => { body += chunk })
        req.on("end", () => {
          try {
            const { name, json, css } = JSON.parse(body) as
              { name: string; json: unknown; css: string }
            const safe = String(name).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
            if (!safe) throw new Error("empty name")

            const dir = resolve(process.cwd(), DIR)
            mkdirSync(dir, { recursive: true })
            // `join` on the sanitised name only — never on the raw input.
            writeFileSync(join(dir, `${safe}.json`), JSON.stringify(json, null, 2) + "\n")
            writeFileSync(join(dir, `${safe}.css`), css)

            res.setHeader("content-type", "application/json")
            res.end(JSON.stringify({ ok: true, name: safe, files: [`${DIR}/${safe}.json`, `${DIR}/${safe}.css`] }))
          } catch (err) {
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
        })
      })
    },
  }
}
