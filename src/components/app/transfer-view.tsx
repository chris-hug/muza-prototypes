"use client"

import { useState } from "react"
import { ArrowDownToLine, Send, DollarSign } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

// ─── TransferView ─────────────────────────────────────────────────────────────

export function TransferView() {
  const [amount, setAmount] = useState("")
  const BALANCE = 2380.00

  return (
    <div className="flex flex-col items-center pt-8 pb-40 px-16">
      <div className="flex flex-col gap-6 w-full max-w-[490px]">

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div className="bg-background border border-border rounded-xl p-6 flex flex-col gap-10">

          {/* ── Segmented control ─────────────────────────────────────── */}
          <Tabs defaultValue="withdraw" className="w-full">
            <TabsList variant="default" size="lg" className="w-full">
              <TabsTrigger value="withdraw">
                <ArrowDownToLine className="size-4" />
                Withdraw
              </TabsTrigger>
              <TabsTrigger value="transfer">
                <Send className="size-4" />
                Transfer
              </TabsTrigger>
            </TabsList>

            {/* ── Withdraw fields ──────────────────────────────────────── */}
            <TabsContent value="withdraw" className="mt-10 flex flex-col gap-10">
              <div className="flex flex-col gap-6">
                {/* Amount */}
                <div className="flex flex-col gap-2">
                  <Label>How much?</Label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        className="pl-8"
                        placeholder="00.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You have ${BALANCE.toFixed(2)} in your balance
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setAmount(BALANCE.toFixed(2))}
                  >
                    Withdraw all your balance
                  </Button>
                </div>

                {/* Connected account */}
                <div className="flex flex-col gap-2">
                  <Label>Connected Account</Label>
                  <Input
                    readOnly
                    value="Jane's Main Account  - Chase Saving (..8643)"
                  />
                </div>

                {/* Note */}
                <Textarea
                  placeholder="Note to self (optional)"
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* ── Transfer fields ──────────────────────────────────────── */}
            <TabsContent value="transfer" className="mt-10 flex flex-col gap-10">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label>How much?</Label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input className="pl-8" placeholder="00.00" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You have ${BALANCE.toFixed(2)} in your balance
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Recipient</Label>
                  <Input placeholder="Name or account" />
                </div>
                <Textarea placeholder="Note (optional)" rows={4} />
              </div>
            </TabsContent>
          </Tabs>

          {/* ── Total row ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">Total Transfer</span>
              <span className="font-medium text-foreground">
                ${amount ? parseFloat(amount || "0").toFixed(2) : "00.00"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex gap-6 justify-end">
          <Button variant="outline" size="lg">Cancel</Button>
          <Button size="lg">Confirm Withdraw</Button>
        </div>
      </div>
    </div>
  )
}
