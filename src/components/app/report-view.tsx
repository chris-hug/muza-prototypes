"use client"

import { useState } from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import { Users, Activity, DollarSign, Zap, TrendingUp, TrendingDown, TrendingUpIcon, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Period    = "day" | "week" | "month" | "year"
type Metric    = "listeners" | "streams" | "earnings"
type ChartView = "cumulative" | "per-period"
type DataPoint = { label: string; listeners: number | null; streams: number | null; earnings: number | null; current?: boolean }

// ─── Chart data ───────────────────────────────────────────────────────────────

// current = the label where data stops (today's granularity boundary)
const CURRENT_LABEL: Record<Period, string> = {
  day: "16h", week: "Sun", month: "Apr", year: "2026",
}

const CHART_DATA: Record<Period, DataPoint[]> = {
  day: [
    { label: "0h",  listeners: 420,  streams: 1100,  earnings: 110 },
    { label: "2h",  listeners: 180,  streams: 480,   earnings: 48  },
    { label: "4h",  listeners: 640,  streams: 1700,  earnings: 170 },
    { label: "6h",  listeners: 290,  streams: 760,   earnings: 76  },
    { label: "8h",  listeners: 870,  streams: 2300,  earnings: 230 },
    { label: "10h", listeners: 1240, streams: 3300,  earnings: 330 },
    { label: "12h", listeners: 760,  streams: 2000,  earnings: 200 },
    { label: "14h", listeners: 1580, streams: 4200,  earnings: 420 },
    { label: "16h", listeners: 920,  streams: 2440,  earnings: 244, current: true },
    { label: "18h", listeners: null, streams: null,  earnings: null },
    { label: "20h", listeners: null, streams: null,  earnings: null },
    { label: "22h", listeners: null, streams: null,  earnings: null },
  ],
  week: [
    { label: "Mon", listeners: 6800,  streams: 18200, earnings: 1820 },
    { label: "Tue", listeners: 3200,  streams: 8500,  earnings: 850  },
    { label: "Wed", listeners: 8900,  streams: 23700, earnings: 2370 },
    { label: "Thu", listeners: 4100,  streams: 10900, earnings: 1090 },
    { label: "Fri", listeners: 11200, streams: 29900, earnings: 2990 },
    { label: "Sat", listeners: 5600,  streams: 14900, earnings: 1490 },
    { label: "Sun", listeners: 9400,  streams: 25100, earnings: 2510, current: true },
  ],
  month: [
    { label: "Jan", listeners: 52000, streams: 138800, earnings: 13880 },
    { label: "Feb", listeners: 31400, streams: 83700,  earnings: 8370  },
    { label: "Mar", listeners: 67800, streams: 180900, earnings: 18090 },
    { label: "Apr", listeners: 39200, streams: 104600, earnings: 10460, current: true },
    { label: "May", listeners: null,  streams: null,   earnings: null  },
    { label: "Jun", listeners: null,  streams: null,   earnings: null  },
    { label: "Jul", listeners: null,  streams: null,   earnings: null  },
    { label: "Aug", listeners: null,  streams: null,   earnings: null  },
    { label: "Sep", listeners: null,  streams: null,   earnings: null  },
    { label: "Oct", listeners: null,  streams: null,   earnings: null  },
    { label: "Nov", listeners: null,  streams: null,   earnings: null  },
    { label: "Dec", listeners: null,  streams: null,   earnings: null  },
  ],
  year: [
    { label: "2021", listeners: 210000, streams: 560000,  earnings: 56000  },
    { label: "2022", listeners: 390000, streams: 1040000, earnings: 104000 },
    { label: "2023", listeners: 180000, streams: 480000,  earnings: 48000  },
    { label: "2024", listeners: 620000, streams: 1650000, earnings: 165000 },
    { label: "2025", listeners: 310000, streams: 826000,  earnings: 82600  },
    { label: "2026", listeners: 480000, streams: 1280000, earnings: 128000, current: true },
  ],
}

// ─── KPI data ─────────────────────────────────────────────────────────────────

interface KpiData {
  listeners: string; streams: string; earnings: string; eps: string
  listenersDelta: number; streamsDelta: number; earningsDelta: number
}

const KPI: Record<Period, KpiData> = {
  day:   { listeners: "3,360",     streams: "8,920",      earnings: "$892",     eps: "$0.10", listenersDelta:  8.2, streamsDelta: 12.4, earningsDelta: 12.4 },
  week:  { listeners: "38,700",    streams: "103,100",    earnings: "$10,310",  eps: "$0.10", listenersDelta:  4.1, streamsDelta:  6.8, earningsDelta:  6.8 },
  month: { listeners: "39,200",    streams: "104,600",    earnings: "$10,460",  eps: "$0.10", listenersDelta: -5.5, streamsDelta: -5.6, earningsDelta: -5.6 },
  year:  { listeners: "480,000",   streams: "1,280,000",  earnings: "$128,000", eps: "$0.10", listenersDelta: 14.3, streamsDelta: 14.3, earningsDelta: 14.3 },
}

// ─── Rankings data ────────────────────────────────────────────────────────────

const TRACKS = [
  { rank: 1, title: "City Lights",     listeners: "15,200", streams: "42,100", earnings: "$4,210", purchases: 230 },
  { rank: 2, title: "Golden Hour",     listeners: "13,400", streams: "37,200", earnings: "$3,720", purchases: 178 },
  { rank: 3, title: "Summer Nights",   listeners: "12,500", streams: "34,800", earnings: "$3,480", purchases: 145 },
  { rank: 4, title: "Midnight Dreams", listeners: "10,800", streams: "30,100", earnings: "$3,010", purchases:   0 },
  { rank: 5, title: "Ocean Waves",     listeners:  "8,900", streams: "24,800", earnings: "$2,480", purchases:   0 },
]

const ALBUMS = [
  { rank: 1, title: "Echoes of Tomorrow", sold: 285, price: "$30", total: "$8,550" },
  { rank: 2, title: "Night Sessions",     sold: 251, price: "$30", total: "$7,530" },
  { rank: 3, title: "Urban Soundscapes",  sold: 223, price: "$30", total: "$6,690" },
  { rank: 4, title: "Reflections",        sold: 198, price: "$30", total: "$5,940" },
]

const PLAYLISTS = [
  { rank: 1, title: "City Lights",     playlists: 32, reach: "284,000" },
  { rank: 2, title: "Golden Hour",     playlists: 28, reach: "241,000" },
  { rank: 3, title: "Summer Nights",   playlists: 24, reach: "198,000" },
  { rank: 4, title: "Midnight Dreams", playlists: 18, reach: "145,000" },
  { rank: 5, title: "Ocean Waves",     playlists: 15, reach: "118,000" },
]

const PERIOD_LABEL: Record<Period, string> = {
  day:   "Today",
  week:  "This week",
  month: "This month",
  year:  "This year",
}

const PERIODS: { label: string; value: Period }[] = [
  { label: "Day",   value: "day"   },
  { label: "Week",  value: "week"  },
  { label: "Month", value: "month" },
  { label: "Year",  value: "year"  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cumulative(data: DataPoint[]): DataPoint[] {
  let l = 0, s = 0, e = 0
  return data.map(d => {
    if (d.listeners === null) return { ...d, listeners: null, streams: null, earnings: null }
    l += d.listeners; s += d.streams!; e += d.earnings!
    return { ...d, listeners: l, streams: s, earnings: e }
  })
}

function fmt(value: number, metric: Metric): string {
  if (metric === "earnings") {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value}`
  }
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000)    return `${(value / 1000).toFixed(0)}K`
  return String(value)
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, delta, icon }: {
  label: string; value: string; delta?: number; icon: React.ReactNode
}) {
  return (
    <div className="min-w-0 bg-background border border-border rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <span className="text-xl font-medium text-foreground tabular-nums">{value}</span>
      {delta !== undefined && delta !== 0 && (
        <div className={cn(
          "flex items-center gap-1 text-xs",
          delta > 0 ? "text-teal-600 dark:text-teal-400" : "text-red-500"
        )}>
          {delta > 0
            ? <TrendingUp   className="size-3 shrink-0" />
            : <TrendingDown className="size-3 shrink-0" />}
          <span>{delta > 0 ? "+" : ""}{delta.toFixed(1)}% vs prev period</span>
        </div>
      )}
    </div>
  )
}

// ─── Custom X-axis tick — highlights the current period label ─────────────────

function XTick({ x, y, payload, currentLabel }: { x?: number; y?: number; payload?: { value: string }; currentLabel: string }) {
  const isCurrent = payload?.value === currentLabel
  return (
    <text
      x={x} y={(y ?? 0) + 12}
      textAnchor="middle"
      fontSize={14}
      fontWeight={400}
      fill={isCurrent ? "var(--foreground)" : "var(--muted-foreground)"}
    >
      {payload?.value}
    </text>
  )
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, metric }: {
  active?: boolean; payload?: { value: number }[]; label?: string; metric: Metric
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium text-foreground tabular-nums">{fmt(payload[0].value, metric)}</p>
    </div>
  )
}

// ─── ReportView ───────────────────────────────────────────────────────────────

export function ReportView({ embedded = false }: { embedded?: boolean }) {
  const [period,    setPeriod]    = useState<Period>("month")
  const [metric,    setMetric]    = useState<Metric>("listeners")
  const [chartView, setChartView] = useState<ChartView>("cumulative")

  const kpi        = KPI[period]
  const rawData    = CHART_DATA[period]
  const chartData  = chartView === "cumulative" ? cumulative(rawData) : rawData

  return (
    <div className="flex flex-col gap-12 px-16 pb-40">

      {/* ── Analytics ────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6 bg-muted -mx-16 -mt-px px-16 pt-8 pb-16">

        {/* Page heading + period tabs in one row */}
        {embedded ? (
          <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
            <TabsList variant="pill">
              {PERIODS.map(p => (
                <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
              <TabsList variant="pill">
                {PERIODS.map(p => (
                  <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Chart card */}
        <div className="relative mt-6">
          {/* Floating metric tabs — centred on the card's top border */}
          <div className="absolute -top-6 inset-x-0 flex items-center justify-center pointer-events-none z-10">
            <div className="pointer-events-auto">
              <Tabs value={metric} onValueChange={v => setMetric(v as Metric)}>
                <TabsList className="border border-border">
                  <TabsTrigger value="listeners">Listeners</TabsTrigger>
                  <TabsTrigger value="streams">Streams</TabsTrigger>
                  <TabsTrigger value="earnings">Earnings</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          {/* ③ view toggle */}
          <div className="relative flex items-center justify-end px-4 pt-8 pb-2">
            <div className="absolute right-4 inline-flex items-center rounded-full bg-muted p-1 gap-0.5">
              <button onClick={() => setChartView("cumulative")} title="Cumulative"
                className={cn("inline-flex items-center justify-center rounded-full size-7 transition-all",
                  chartView === "cumulative" ? "bg-background border border-border text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
                <TrendingUpIcon className="size-3.5" />
              </button>
              <button onClick={() => setChartView("per-period")} title="Per period"
                className={cn("inline-flex items-center justify-center rounded-full size-7 transition-all",
                  chartView === "per-period" ? "bg-background border border-border text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
                <BarChart2 className="size-3.5" />
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            {chartView === "cumulative" ? (
              <AreaChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <YAxis axisLine={false} tickLine={false} width={48}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 400 }}
                  tickFormatter={(v) => metric === "earnings" ? (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`) : (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                <XAxis dataKey="label" axisLine={false} tickLine={false}
                  tick={(props) => <XTick {...props} currentLabel={CURRENT_LABEL[period]} />} />
                <Tooltip content={({ active, payload, label }) =>
                  <ChartTooltip active={active} payload={payload as { value: number }[]} label={label} metric={metric} />}
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                <ReferenceLine x={CURRENT_LABEL[period]} stroke="var(--border)" strokeDasharray="3 3" />
                <Area type="monotone" dataKey={metric} stroke="var(--primary)" strokeWidth={2}
                  fill="url(#chartGradient)" dot={false} connectNulls={false}
                  activeDot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }} />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }} barSize={chartData.length > 8 ? 8 : 14}>
                <YAxis axisLine={false} tickLine={false} width={48}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 400 }}
                  tickFormatter={(v) => metric === "earnings" ? (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`) : (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                <XAxis dataKey="label" axisLine={false} tickLine={false}
                  tick={(props) => <XTick {...props} currentLabel={CURRENT_LABEL[period]} />} />
                <Tooltip content={({ active, payload, label }) =>
                  <ChartTooltip active={active} payload={payload as { value: number }[]} label={label} metric={metric} />}
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                <ReferenceLine x={CURRENT_LABEL[period]} stroke="var(--border)" strokeDasharray="3 3" />
                <Bar dataKey={metric} fill="var(--primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        </div>

        {/* KPI strip — open, no card */}
        <div className="flex flex-col gap-1 -mt-3">
          <span className="text-xs text-muted-foreground px-1">{PERIOD_LABEL[period]}</span>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Listeners"         value={kpi.listeners} delta={kpi.listenersDelta} icon={<Users      className="size-4" />} />
            <KpiCard label="Streams"           value={kpi.streams}   delta={kpi.streamsDelta}   icon={<Activity   className="size-4" />} />
            <KpiCard label="Earnings"          value={kpi.earnings}  delta={kpi.earningsDelta}  icon={<DollarSign className="size-4" />} />
            <KpiCard label="Earnings / Stream" value={kpi.eps}                                  icon={<Zap        className="size-4" />} />
          </div>
        </div>
      </section>

      {/* ── Rankings ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-16">
        {/* Track Ranking */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium text-foreground px-1">Track Ranking</h2>
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-6" resizable={false}>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Listeners</TableHead>
                  <TableHead>Streams</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead className="pr-6" resizable={false}>Purchases</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TRACKS.map(row => (
                  <TableRow key={row.rank}>
                    <TableCell className="pl-6 text-muted-foreground tabular-nums">{row.rank}</TableCell>
                    <TableCell className="text-foreground font-medium">{row.title}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{row.listeners}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{row.streams}</TableCell>
                    <TableCell className="tabular-nums text-foreground">{row.earnings}</TableCell>
                    <TableCell className="pr-6 tabular-nums text-muted-foreground">{row.purchases > 0 ? row.purchases : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Album Ranking */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium text-foreground px-1">Album Ranking</h2>
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-6" resizable={false}>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="pr-6" resizable={false}>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALBUMS.map(row => (
                  <TableRow key={row.rank}>
                    <TableCell className="pl-6 text-muted-foreground tabular-nums">{row.rank}</TableCell>
                    <TableCell className="text-foreground font-medium">{row.title}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{row.sold}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{row.price}</TableCell>
                    <TableCell className="pr-6 tabular-nums text-foreground">{row.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Playlists */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium text-foreground px-1">Playlist Reach</h2>
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-6" resizable={false}>#</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Playlists</TableHead>
                  <TableHead className="pr-6" resizable={false}>Est. Reach</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PLAYLISTS.map(row => (
                  <TableRow key={row.rank}>
                    <TableCell className="pl-6 text-muted-foreground tabular-nums">{row.rank}</TableCell>
                    <TableCell className="text-foreground font-medium">{row.title}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{row.playlists}</TableCell>
                    <TableCell className="pr-6 tabular-nums text-muted-foreground">{row.reach}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

    </div>
  )
}
