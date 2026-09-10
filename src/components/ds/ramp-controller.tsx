"use client"

/*
 * RampController — muza's two primitive ramps, editable, live, and saveable.
 *
 * The Colors section above shows what the tokens ARE. This is where their
 * colours come from, and the only place in the app where they can be changed
 * without editing `app.css`.
 *
 * ── What it edits ────────────────────────────────────────────────────────
 * Primitives only: `--muza-neutrals-*` and `--muza-brand-*`. The semantic
 * layer is untouched on purpose — `--muted` points at `--muza-neutrals-900`
 * in light and `--muza-neutrals-900` in dark by a decision that belongs in the
 * stylesheet, and a theme that could re-point it would put that decision in
 * two places. Change a ramp and both modes follow, because both modes already
 * point at the ramp.
 *
 * ── Curve, and the steps that refuse it ──────────────────────────────────
 * A ramp can be described by five numbers (hue · tint · top · bottom ·
 * contrast — see `lib/ramp.ts`). muza's ramps are NOT: fitting a curve to the
 * neutrals misses by 17 L, because the ladder was picked by hand and skips
 * 500 and 600 entirely. So both models are here at once: every step either
 * FOLLOWS the curve or is PINNED to an exact value, and the row says which.
 * On load every step is pinned to what `app.css` declares, so the page starts
 * as itself; unpinning a step is what asks "what would the curve have done".
 *
 * ── Nothing is lost ──────────────────────────────────────────────────────
 * Every change lands on an undo stack (⌘Z / ⇧⌘Z). `muza-default.json` is
 * generated from `app.css` and is always one click away. Save writes a real
 * pair of files through the dev server (`app/themes/<name>.json` + `.css`),
 * so a theme survives a reload, can be compared against another, and can be
 * pasted back into `app.css` when it wins.
 */

import * as React from "react"
import { Check, Copy, Pin, PinOff, RotateCcw, Save, Undo2, Redo2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { PRIMITIVES, SEMANTIC_DARK, SEMANTIC_LIGHT } from "@/lib/tokens"
import { CHROMA_CEILING, fitRamp, stepCss, type RampShape } from "@/lib/ramp"
import { readColour } from "@/lib/oklch"
import {
  DEFAULT_THEME, THEMES, applyTheme, clearTheme, saveTheme, themeCss,
  type Theme, type ThemeRamp,
} from "@/lib/themes"

/* ── The two ramps ─────────────────────────────────────────────────────── */
const RAMPS = [
  {
    id: "neutrals",
    prefix: "muza-neutrals-",
    lead: "Warm, olive-tinted grey. 50 is the ground in light and the ink in dark; 950 is the reverse. Every surface in the app stands on a step of this.",
  },
  {
    id: "brand",
    prefix: "muza-brand-",
    lead: "The one accent, named for its role rather than its colour — it is blue today and a theme is free to make it anything. 200 is the fill, 100 the ink on dark.",
  },
] as const

type RampId = typeof RAMPS[number]["id"]

interface RampState {
  curve: RampShape
  /** step → exact value. A step in here is pinned; one that is not follows the curve. */
  pins: Record<string, string>
}
type State = Record<RampId, RampState>

/* ── Reading the shipped palette ───────────────────────────────────────── */
function declaredRamp(prefix: string) {
  return PRIMITIVES
    .map(t => {
      if (!t.name.startsWith(prefix)) return null
      const step = Number(t.name.slice(prefix.length))
      const colour = readColour(t.value)
      return Number.isFinite(step) && colour ? { step, colour, raw: t.value } : null
    })
    .filter((x): x is { step: number; colour: { l: number; c: number; h: number }; raw: string } => x !== null)
    .sort((a, b) => a.step - b.step)
}

const DECLARED = Object.fromEntries(
  RAMPS.map(r => [r.id, declaredRamp(r.prefix)]),
) as Record<RampId, ReturnType<typeof declaredRamp>>

/** The starting state: pinned to the stylesheet, curve fitted underneath. */
function stateFromTheme(theme: Theme | undefined): State {
  const out = {} as State
  for (const r of RAMPS) {
    const declared = DECLARED[r.id]
    const fit = fitRamp(declared.map(d => ({ step: d.step, colour: d.colour })))
    const saved: ThemeRamp | undefined = theme?.ramps?.[r.id]
    out[r.id] = {
      curve: saved?.curve ?? fit?.shape ?? { hue: 100, chroma: 0.02, top: 0.98, bottom: 0.15, contrast: 1 },
      pins: saved
        // A saved theme lists every step; the ones it calls pinned stay exact,
        // the rest are left to the curve so re-opening it can still be shaped.
        ? Object.fromEntries(
            Object.entries(saved.steps).filter(([s]) => !saved.pinned || saved.pinned.includes(s)),
          )
        : Object.fromEntries(declared.map(d => [String(d.step), d.raw])),
    }
  }
  return out
}

function valueFor(state: RampState, step: number): string {
  return state.pins[String(step)] ?? stepCss(step, state.curve)
}

function toTheme(name: string, state: State): Theme {
  return {
    name,
    label: name,
    created: new Date().toISOString().slice(0, 10),
    ramps: Object.fromEntries(RAMPS.map(r => [r.id, {
      prefix: r.prefix,
      curve: state[r.id].curve,
      pinned: Object.keys(state[r.id].pins),
      steps: Object.fromEntries(
        DECLARED[r.id].map(d => [String(d.step), valueFor(state[r.id], d.step)]),
      ),
    }])),
  }
}

/* ── Which semantic tokens point at a step ─────────────────────────────── */
function rolesFor(primitive: string) {
  const pick = (list: typeof SEMANTIC_LIGHT) =>
    list.filter(t => t.refers === primitive).map(t => t.name)
  return { light: pick(SEMANTIC_LIGHT), dark: pick(SEMANTIC_DARK) }
}

/* ── One labelled control ──────────────────────────────────────────────── */
function Control({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number
  unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 shrink-0 text-xsmall text-muted-foreground">{label}</span>
      <Slider
        className="flex-1 min-w-0"
        value={[value]} min={min} max={max} step={step}
        onValueChange={v => onChange(Array.isArray(v) ? v[0] : v)}
      />
      <div className="flex items-center gap-1.5 shrink-0">
        <Input
          size="sm"
          className="w-24 text-right tabular-nums"
          value={String(Number(value.toFixed(3)))}
          onChange={e => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)))
          }}
        />
        {unit && <span className="w-3 text-2xsmall text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

export function RampController() {
  const initial = React.useMemo(() => stateFromTheme(DEFAULT_THEME), [])
  const [state, setState] = React.useState<State>(initial)
  const [name, setName] = React.useState("my-theme")
  const [saved, setSaved] = React.useState<string[]>([])
  const [copied, setCopied] = React.useState(false)

  /* Undo is a stack of whole states, not of diffs: a colour tool's changes are
     small and frequent, and reconstructing one from a diff chain is how an
     undo ends up one step off. */
  const past = React.useRef<State[]>([])
  const future = React.useRef<State[]>([])
  const [depth, setDepth] = React.useState({ past: 0, future: 0 })

  const commit = React.useCallback((next: State) => {
    past.current.push(state)
    future.current = []
    setState(next)
    setDepth({ past: past.current.length, future: 0 })
  }, [state])

  const undo = React.useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(state)
    setState(prev)
    setDepth({ past: past.current.length, future: future.current.length })
  }, [state])

  const redo = React.useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(state)
    setState(next)
    setDepth({ past: past.current.length, future: future.current.length })
  }, [state])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return
      e.preventDefault()
      if (e.shiftKey) redo(); else undo()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo])

  /* Live, always: the point of the tool is the page, not the swatches. */
  React.useEffect(() => {
    const el = document.documentElement
    for (const r of RAMPS) {
      for (const d of DECLARED[r.id]) {
        el.style.setProperty(`--${r.prefix}${d.step}`, valueFor(state[r.id], d.step))
      }
    }
  }, [state])

  React.useEffect(() => () => { if (DEFAULT_THEME) clearTheme(DEFAULT_THEME) }, [])

  const theme = toTheme(name, state)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Bar: which theme, undo, save ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border px-4 py-3">
        <span className="text-xsmall text-muted-foreground">Theme</span>
        {THEMES.map(t => (
          <Button
            key={t.name}
            size="sm"
            variant="outline"
            onClick={() => { commit(stateFromTheme(t)); setName(t.name === "muza-default" ? "my-theme" : t.name) }}
          >
            {t.label ?? t.name}
          </Button>
        ))}

        <span className="flex-1" />

        <Button size="sm" variant="ghost" onClick={undo} disabled={depth.past === 0} aria-label="Undo">
          <Undo2 />
          Undo{depth.past ? ` (${depth.past})` : ""}
        </Button>
        <Button size="sm" variant="ghost" onClick={redo} disabled={depth.future === 0} aria-label="Redo">
          <Redo2 />
          Redo
        </Button>
        <Button size="sm" variant="outline" onClick={() => commit(initial)}>
          <RotateCcw />
          muza default
        </Button>

        <Input
          size="sm"
          className="w-40"
          value={name}
          onChange={e => setName(e.target.value)}
          aria-label="Theme name"
        />
        <Button
          size="sm"
          onClick={async () => {
            try { setSaved(await saveTheme(theme)) }
            catch { setSaved(["save failed — is the dev server running?"]) }
          }}
        >
          <Save />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void navigator.clipboard?.writeText(themeCss(theme))
            setCopied(true); window.setTimeout(() => setCopied(false), 1200)
          }}
        >
          {copied ? <Check /> : <Copy />}
          CSS
        </Button>
        {saved.length > 0 && (
          <p className="w-full font-mono text-3xsmall text-muted-foreground">
            wrote {saved.join(" · ")} — reload to see it in the list
          </p>
        )}
      </div>

      {RAMPS.map(r => {
        const rs = state[r.id]
        const set = (next: Partial<RampState>) =>
          commit({ ...state, [r.id]: { ...rs, ...next } })

        return (
          <div key={r.id} className="rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-mono text-small text-foreground">--{r.prefix}*</p>
              <p className="text-xsmall text-muted-foreground max-w-prose">{r.lead}</p>
            </div>

            <div className="grid gap-8 p-5 @min-[900px]/section:grid-cols-[minmax(280px,380px)_1fr]">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <p className="text-xsmall font-medium text-foreground">Colour</p>
                  <Control label="Hue" value={rs.curve.hue} min={0} max={360} step={1} unit="°"
                           onChange={hue => set({ curve: { ...rs.curve, hue } })} />
                  {/* Absolute chroma, not a percentage: a neutral peaks near
                      0.022 and the brand near 0.24, and a shared 0–100 scale
                      would give the neutrals four usable notches. */}
                  <Control label="Chroma" value={rs.curve.chroma} min={0} max={CHROMA_CEILING} step={0.001} unit="C"
                           onChange={chroma => set({ curve: { ...rs.curve, chroma } })} />
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xsmall font-medium text-foreground">Shape of the ladder</p>
                  <Control label="Contrast" value={rs.curve.contrast} min={0.2} max={2.4} step={0.01} unit="×"
                           onChange={contrast => set({ curve: { ...rs.curve, contrast } })} />
                  <Control label="Top" value={rs.curve.top} min={0} max={1} step={0.005} unit="L"
                           onChange={top => set({ curve: { ...rs.curve, top } })} />
                  <Control label="Bottom" value={rs.curve.bottom} min={0} max={1} step={0.005} unit="L"
                           onChange={bottom => set({ curve: { ...rs.curve, bottom } })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => set({ pins: {} })}
                    disabled={Object.keys(rs.pins).length === 0}
                  >
                    <PinOff />
                    Let every step follow the curve
                  </Button>
                  <p className="text-3xsmall text-muted-foreground">
                    {Object.keys(rs.pins).length} of {DECLARED[r.id].length} steps pinned to an exact value.
                  </p>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-border min-w-0">
                {DECLARED[r.id].map(d => {
                  const step = d.step
                  const pinned = String(step) in rs.pins
                  const value = valueFor(rs, step)
                  const { light, dark } = rolesFor(`${r.prefix}${step}`)
                  return (
                    <div key={step} className="flex items-center gap-3 py-2.5 min-w-0">
                      <span
                        className="size-9 shrink-0 rounded-lg border border-border art-edge"
                        style={{ background: value }}
                      />
                      <div className="w-52 shrink-0 min-w-0">
                        <p className="font-mono text-xsmall text-foreground">{r.prefix}{step}</p>
                        <p className="font-mono text-3xsmall text-muted-foreground/70 tabular-nums truncate">
                          {value}
                        </p>
                      </div>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={pinned ? `Let ${r.prefix}${step} follow the curve` : `Pin ${r.prefix}${step}`}
                        title={pinned ? "Pinned to an exact value" : "Follows the curve"}
                        className={cn("shrink-0", pinned ? "text-foreground" : "text-muted-foreground/50")}
                        onClick={() => {
                          const pins = { ...rs.pins }
                          if (pinned) delete pins[String(step)]
                          else pins[String(step)] = value
                          set({ pins })
                        }}
                      >
                        {pinned ? <Pin /> : <PinOff />}
                      </Button>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        {light.length === 0 && dark.length === 0 && (
                          <p className="text-3xsmall text-muted-foreground/60">unused</p>
                        )}
                        {light.length > 0 && (
                          <p className="text-3xsmall text-muted-foreground truncate">
                            <span className="text-foreground/70">light</span> · {light.join(", ")}
                          </p>
                        )}
                        {dark.length > 0 && (
                          <p className="text-3xsmall text-muted-foreground truncate">
                            <span className="text-foreground/70">dark</span> · {dark.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
