"use client"

/*
 * Nav Row — a stack of browse entry points: icon · label · optional trailing
 * value · chevron. The real `NavRow`, with real handlers left as no-ops;
 * in a product surface `onClick` navigates.
 *
 * Rows stack with no gap and no dividers — the `rounded-lg` hover fill is
 * what separates them. The last row has neither icon nor value, to show
 * that both slots collapse rather than reserve space.
 */

import { Clock, Disc3, ListMusic, Mic } from "lucide-react"

import { NavRow } from "@/components/ui/nav-row"

export default function NavRowBasicExample() {
  return (
    <div className="flex flex-col">
      <NavRow icon={<Mic />}       label="Artists"        onClick={() => {}} />
      <NavRow icon={<Disc3 />}     label="Albums"         onClick={() => {}} />
      <NavRow icon={<ListMusic />} label="Playlists"      onClick={() => {}} />
      <NavRow icon={<Clock />}     label="Recently added" onClick={() => {}} value="24" />
      <NavRow                      label="No icon, no value" onClick={() => {}} />
    </div>
  )
}
