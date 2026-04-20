"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

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
      <span className="text-white text-2xsmall font-bold tracking-tight leading-none">CHASE</span>
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
      <span className="text-[#1a1f71] text-small font-extrabold italic tracking-tight">VISA</span>
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

// ─── Logo map ─────────────────────────────────────────────────────────────────

const LOGO_MAP: Record<string, React.ReactNode> = {
  "JP Morgan Chase": <ChaseLogo />,
  "Bank of America": <BankOfAmericaLogo />,
  "Visa 1":          <VisaLogo />,
  "Ege card":        <MastercardLogo />,
}

// ─── Payment row ──────────────────────────────────────────────────────────────

interface PaymentRowProps {
  logo:     React.ReactNode
  name:     string
  detail:   string
  active?:  boolean
  onEdit:   () => void
}

function PaymentRow({ logo, name, detail, active, onEdit }: PaymentRowProps) {
  return (
    <div className={`border rounded-xl p-4 flex items-center gap-4 h-[68px] transition-colors ${
      active
        ? "bg-accent border-foreground/20"
        : "bg-background border-border"
    }`}>
      {logo}
      <div className="flex-1 min-w-0">
        <p className="text-small font-medium text-foreground leading-snug">{name}</p>
        <p className="text-xsmall text-muted-foreground leading-snug">{detail}</p>
      </div>
      <Button variant="link" className="text-primary shrink-0 px-0" onClick={onEdit}>
        Edit
      </Button>
    </div>
  )
}

// ─── Add new row ──────────────────────────────────────────────────────────────

function AddRow({ label }: { label: string }) {
  return (
    <button className="w-full bg-muted/50 border border-border rounded-xl p-4 flex items-center gap-4 h-[68px] cursor-pointer hover:bg-muted transition-colors">
      <div className="shrink-0 size-[52px] rounded-full bg-foreground flex items-center justify-center">
        <Plus className="size-[18px] text-background" />
      </div>
      <span className="text-small text-foreground">{label}</span>
    </button>
  )
}

// ─── Edit panel ───────────────────────────────────────────────────────────────

interface EditPanelProps {
  name:   string
  detail: string
  logo:   React.ReactNode
  onClose: () => void
}

function EditPanel({ name, detail, logo, onClose }: EditPanelProps) {
  return (
    <div className="bg-background border border-border rounded-xl p-6 flex flex-col gap-6">

      {/* Header row */}
      <div className="flex items-center gap-4">
        {logo}
        <div className="flex-1 min-w-0">
          <p className="text-small font-medium text-foreground leading-snug">{name}</p>
          <p className="text-xsmall text-muted-foreground leading-snug">{detail}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <Separator />

      {/* Fields */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Name of card</Label>
          <Input defaultValue={name} />
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
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <Button variant="link" className="text-destructive px-0 h-auto">
          Delete card
        </Button>
        <Button>Save</Button>
      </div>

    </div>
  )
}

// ─── Account data ─────────────────────────────────────────────────────────────

interface Account {
  id:     string
  name:   string
  detail: string
}

const BANK_ACCOUNTS: Account[] = [
  { id: "chase", name: "JP Morgan Chase", detail: "**** 2345" },
  { id: "boa",   name: "Bank of America", detail: "**** 2345" },
]

const CARDS: Account[] = [
  { id: "visa", name: "Visa 1",    detail: "Debit **2345" },
  { id: "ege",  name: "Ege card",  detail: "Debit **2345" },
]

// ─── ManageView ───────────────────────────────────────────────────────────────

export function ManageView() {
  const [editingId, setEditingId] = useState<string | null>(null)

  const allAccounts = [...BANK_ACCOUNTS, ...CARDS]
  const editingAccount = allAccounts.find(a => a.id === editingId) ?? null

  return (
    <div className="flex gap-6 px-16 py-8 pb-40 items-start">

      {/* Left column */}
      <div className="flex flex-col gap-10 w-1/2 min-w-0">

        {/* Bank accounts */}
        <section className="flex flex-col gap-6">
          <h2 className="text-base font-medium text-foreground">Bank accounts</h2>
          <div className="flex flex-col gap-2.5">
            {BANK_ACCOUNTS.map(acc => (
              <PaymentRow
                key={acc.id}
                logo={LOGO_MAP[acc.name]}
                name={acc.name}
                detail={acc.detail}
                active={editingId === acc.id}
                onEdit={() => setEditingId(editingId === acc.id ? null : acc.id)}
              />
            ))}
            <AddRow label="Add a new Bank Account" />
          </div>
        </section>

        {/* Cards */}
        <section className="flex flex-col gap-6">
          <h2 className="text-base font-medium text-foreground">Cards</h2>
          <div className="flex flex-col gap-2.5">
            {CARDS.map(acc => (
              <PaymentRow
                key={acc.id}
                logo={LOGO_MAP[acc.name]}
                name={acc.name}
                detail={acc.detail}
                active={editingId === acc.id}
                onEdit={() => setEditingId(editingId === acc.id ? null : acc.id)}
              />
            ))}
            <AddRow label="Add a new Card" />
          </div>
        </section>

      </div>

      {/* Right column — edit panel, offset to align with first row */}
      <div className="w-1/2 min-w-0 mt-12">
        {editingAccount && (
          <EditPanel
            name={editingAccount.name}
            detail={editingAccount.detail}
            logo={LOGO_MAP[editingAccount.name]}
            onClose={() => setEditingId(null)}
          />
        )}
      </div>

    </div>
  )
}
