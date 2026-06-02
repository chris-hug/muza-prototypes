"use client"

import {
  Wallet, ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  className?: string
}

function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cn(
      "min-w-0 bg-background border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-2",
      className,
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xsmall text-muted-foreground truncate">{label}</span>
        <span className="text-muted-foreground shrink-0">{icon}</span>
      </div>
      <span className="text-base font-medium text-foreground whitespace-nowrap">{value}</span>
    </div>
  )
}

// ─── Transaction type icon ────────────────────────────────────────────────────

function EarningIcon() {
  return <ArrowDownLeft className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
}

function WithdrawIcon() {
  return <ArrowUpRight className="size-4 text-red-500 shrink-0" />
}

// ─── Transaction data ─────────────────────────────────────────────────────────

type TxType = "earning" | "withdraw"

interface Transaction {
  type: TxType
  date: string
  description: string
  amount: string
  total: string
}

const TRANSACTIONS: Transaction[] = [
  { type: "earning",  date: "Feb 18, 2026", description: "Royalties Earnings", amount: "+ $1,250.00", total: "$24,582.50" },
  { type: "earning",  date: "Feb 18, 2026", description: "Royalties Earnings", amount: "+   $250.00", total: "$24,582.50" },
  { type: "withdraw", date: "Feb 16, 2026", description: "Withdraw",           amount: "-   $335.00", total: "$24,248.50" },
  { type: "earning",  date: "Feb 18, 2026", description: "Royalties Earnings", amount: "+   $125.00", total: "$24,582.50" },
  { type: "withdraw", date: "Feb 16, 2026", description: "Withdraw",           amount: "-   $335.00", total: "$24,248.50" },
  { type: "earning",  date: "Feb 18, 2026", description: "Royalties Earnings", amount: "+ $1,250.00", total: "$24,582.50" },
  { type: "withdraw", date: "Feb 16, 2026", description: "Withdraw",           amount: "-    $35.00", total: "$24,248.50" },
  { type: "earning",  date: "Feb 18, 2026", description: "Royalties Earnings", amount: "+    $50.00", total: "$24,582.50" },
]

// ─── WalletView ───────────────────────────────────────────────────────────────

export function WalletView() {
  return (
    <div className="flex flex-col gap-8 px-page py-8 pb-40">

      {/* ── Balance ─────────────────────────────────────────────────────── */}
      {/* 4 stat cards wrap into a 2×2 grid on mobile (they squish below
           readable width in a single row on a phone) and spread to a
           single 4-across row at lg. Total Balance spans the full width
           on mobile as the hero figure. */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Balance"
          value="$24,582.50"
          icon={<Wallet className="size-4" />}
          className="col-span-2 lg:col-span-1"
        />
        <StatCard
          label="Monthly Earning"
          value="$3,582.50"
          icon={<ArrowDownLeft className="size-4 text-teal-600 dark:text-teal-400" />}
        />
        <StatCard
          label="Monthly Expenses"
          value="$1,882.50"
          icon={<ArrowUpRight className="size-4 text-red-500" />}
        />
        <StatCard
          label="Monthly Withdraws"
          value="$2,500.50"
          icon={<CalendarDays className="size-4" />}
        />
      </section>

      {/* ── Transactions ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium text-foreground">Transactions</h2>
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          {/* Desktop — the full 6-column table. Hidden on mobile, where
               the table would overflow the viewport. */}
          <Table className="hidden sm:table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-4" resizable={false} />
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-10 pr-4" resizable={false} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {TRANSACTIONS.map((tx, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    {tx.type === "earning" ? <EarningIcon /> : <WithdrawIcon />}
                  </TableCell>
                  <TableCell className="text-foreground whitespace-nowrap">{tx.date}</TableCell>
                  <TableCell className="text-foreground whitespace-nowrap">{tx.description}</TableCell>
                  <TableCell className={`text-right font-medium whitespace-nowrap tabular-nums ${
                    tx.type === "earning" ? "text-teal-600 dark:text-teal-400" : "text-foreground"
                  }`}>
                    {tx.amount}
                  </TableCell>
                  <TableCell className="text-right text-foreground whitespace-nowrap tabular-nums">{tx.total}</TableCell>
                  <TableCell className="pr-4">
                    <Button size="icon-sm" variant="outline">
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Mobile — a stacked card list: type icon + description/date on
               the left, signed amount + running total on the right. */}
          <ul className="sm:hidden flex flex-col">
            {TRANSACTIONS.map((tx, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i > 0 && "border-t border-border/60",
                )}
              >
                <span className="size-9 shrink-0 rounded-full bg-muted flex items-center justify-center">
                  {tx.type === "earning" ? <EarningIcon /> : <WithdrawIcon />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-small text-foreground truncate">{tx.description}</p>
                  <p className="text-2xsmall text-muted-foreground">{tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-small font-medium whitespace-nowrap tabular-nums",
                    tx.type === "earning" ? "text-teal-600 dark:text-teal-400" : "text-foreground",
                  )}>
                    {tx.amount.replace(/\s+/g, " ")}
                  </p>
                  <p className="text-2xsmall text-muted-foreground whitespace-nowrap tabular-nums">{tx.total}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Show all */}
          <div className="flex justify-center py-4 border-t border-border">
            <Button variant="outline" size="sm">
              Show all <ChevronDown className="size-3.5" />
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}
