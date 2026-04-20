// Carbon-style filled transport icons used by the player bars and the
// full-screen player overlay. Kept in a shared module so all three stay in
// visual lockstep.

import type { CSSProperties } from "react"

type IconProps = { className?: string; style?: CSSProperties }

const svgProps = {
  xmlns:         "http://www.w3.org/2000/svg",
  viewBox:       "0 0 24 24",
  fill:          "currentColor",
  "aria-hidden": true as const,
}

export const SkipBackFilled = ({ className, style }: IconProps) => (
  <svg {...svgProps} className={className} style={style}>
    <path d="M3 3h2.5v18H3z" />
    <path d="M22.5 3v18L7.5 12z" />
  </svg>
)

export const PlayFilledAlt = ({ className, style }: IconProps) => (
  <svg {...svgProps} className={className} style={style}>
    <path d="M4.5 3l16 9-16 9z" />
  </svg>
)

export const SkipForwardFilled = ({ className, style }: IconProps) => (
  <svg {...svgProps} className={className} style={style}>
    <path d="M1.5 3v18l15-9z" />
    <path d="M18.5 3H21v18h-2.5z" />
  </svg>
)
