"use client"

import {
  Wallet, ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex-1 min-w-0 bg-background border border-border rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
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
    <div className="flex flex-col gap-8 px-16 py-8 pb-40">

      {/* ── Balance ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex gap-4">
          <StatCard
            label="Total Balance"
            value="$24,582.50"
            icon={<Wallet className="size-4" />}
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
        </div>
      </section>

      {/* ── Transactions ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium text-foreground">Transactions</h2>
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <Table>
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
