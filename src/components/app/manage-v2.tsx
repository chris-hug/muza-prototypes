"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog"

// ─── Payment method logo ───────────────────────────────────────────────────────

function PaymentLogo({ children, bg = "bg-white" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className={`shrink-0 w-[52px] h-9 rounded-[4px] border border-border ${bg} flex items-center justify-center overflow-hidden`}>
      {children}
    </div>
  )
}

function ChaseLogo() {
  return (
    <PaymentLogo bg="bg-[#005eb8]">
      <span className="text-white text-[9px] font-bold tracking-tight leading-none">CHASE</span>
    </PaymentLogo>
  )
}

function BankOfAmericaLogo() {
  return (
    <PaymentLogo>
      <svg viewBox="0 0 48 32" className="w-10 h-auto" fill="none">
        <path d="M8 10 Q24 4 40 10 Q24 16 8 10Z" fill="#e31837" />
        <path d="M8 16 Q24 10 40 16 Q24 22 8 16Z" fill="#012169" />
        <path d="M8 22 Q24 16 40 22 Q24 28 8 22Z" fill="#e31837" />
      </svg>
    </PaymentLogo>
  )
}

function VisaLogo() {
  return (
    <PaymentLogo>
      <span className="text-[#1a1f71] text-sm font-extrabold italic tracking-tight">VISA</span>
    </PaymentLogo>
  )
}

function MastercardLogo() {
  return (
    <PaymentLogo>
      <svg viewBox="0 0 38 24" className="w-9 h-auto">
        <circle cx="14" cy="12" r="10" fill="#eb001b" />
        <circle cx="24" cy="12" r="10" fill="#f79e1b" />
        <path d="M19 4.8a10 10 0 0 1 0 14.4A10 10 0 0 1 19 4.8Z" fill="#ff5f00" />
      </svg>
    </PaymentLogo>
  )
}

// ─── Account card ─────────────────────────────────────────────────────────────

interface Account {
  id:     string
  name:   string
  detail: string
  logo:   React.ReactNode
}

function AccountCard({ account, expanded, onEdit, onClose }: {
  account:  Account
  expanded: boolean
  onEdit:   () => void
  onClose:  () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <div className={`bg-background border rounded-xl overflow-hidden transition-all duration-200 ${
        expanded ? "border-foreground/20" : "border-border"
      }`}>

        {/* Always-visible summary row */}
        <div className="p-4 flex items-center gap-4 h-[68px]">
          {account.logo}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug">{account.name}</p>
            <p className="text-xs text-muted-foreground leading-snug">{account.detail}</p>
          </div>
          {expanded ? (
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          ) : (
            <Button variant="link" className="text-primary shrink-0 px-0" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>

        {/* Expandable edit form */}
        {expanded && (
          <>
            <Separator />
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name of card</Label>
                <Input defaultValue={account.name} />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Card Number</Label>
                <Input placeholder="**** **** **** ****" />
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-2 flex-1">
                  <Label>Expiration Month</Label>
                  <Input placeholder="MM" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <Label>Expiration Year</Label>
                  <Input placeholder="YY" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>CVV</Label>
                <Input placeholder="•••" type="password" className="max-w-[120px]" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="link"
                  className="text-destructive px-0 h-auto"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete card
                </Button>
                <Button onClick={onClose}>Save</Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete {account.name}?</DialogTitle>
            <DialogDescription>
              This will permanently remove this card from your account. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" onClick={() => setConfirmDelete(false)}>
              Delete card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Add row ──────────────────────────────────────────────────────────────────

function AddRow({ label }: { label: string }) {
  return (
    <button className="w-full bg-muted rounded-xl px-4 flex items-center gap-3 h-[68px] cursor-pointer hover:bg-accent transition-colors">
      <Plus className="size-4 shrink-0 text-foreground" />
      <span className="text-sm text-foreground">{label}</span>
    </button>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BANK_ACCOUNTS: Account[] = [
  { id: "chase", name: "JP Morgan Chase", detail: "**** 2345", logo: <ChaseLogo /> },
  { id: "boa",   name: "Bank of America", detail: "**** 2345", logo: <BankOfAmericaLogo /> },
]

const CARDS: Account[] = [
  { id: "visa", name: "Visa 1",   detail: "Debit **2345", logo: <VisaLogo /> },
  { id: "ege",  name: "Ege card", detail: "Debit **2345", logo: <MastercardLogo /> },
]

// ─── ManageV2 ─────────────────────────────────────────────────────────────────

export function ManageV2() {
  const [editingId, setEditingId] = useState<string | null>(null)

  const toggle = (id: string) => setEditingId(prev => prev === id ? null : id)

  return (
    <div className="flex flex-col items-center pt-8 pb-40 px-16">
      <div className="flex flex-col gap-10 w-full max-w-[560px]">

        {/* Bank accounts */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-foreground">Bank accounts</h2>
          <div className="flex flex-col gap-2.5">
            {BANK_ACCOUNTS.map(acc => (
              <AccountCard
                key={acc.id}
                account={acc}
                expanded={editingId === acc.id}
                onEdit={() => toggle(acc.id)}
                onClose={() => setEditingId(null)}
              />
            ))}
            <AddRow label="Add a new Bank Account" />
          </div>
        </section>

        {/* Cards */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-foreground">Cards</h2>
          <div className="flex flex-col gap-2.5">
            {CARDS.map(acc => (
              <AccountCard
                key={acc.id}
                account={acc}
                expanded={editingId === acc.id}
                onEdit={() => toggle(acc.id)}
                onClose={() => setEditingId(null)}
              />
            ))}
            <AddRow label="Add a new Card" />
          </div>
        </section>

      </div>
    </div>
  )
}
