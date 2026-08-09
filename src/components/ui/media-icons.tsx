// Bespoke Muza glyphs that have no Lucide equivalent. Stroked (not filled),
// so they sit alongside the Lucide set without looking heavier.
//
// Figma: file dbSHgvquI2o4TFie2iAJxv › node 5953:182065 ("Add music" row).

import type { CSSProperties } from "react"

type IconProps = { className?: string; style?: CSSProperties }

/** Music note + plus — the "Add music" affordance. */
export const AddMusicIcon = ({ className, style }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.33}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    style={style}
  >
    <path d="M12 11.9997C12 13.4724 10.8061 14.6663 9.33335 14.6663C7.86059 14.6663 6.66669 13.4724 6.66669 11.9997C6.66669 10.5269 7.86059 9.33301 9.33335 9.33301C10.8061 9.33301 12 10.5269 12 11.9997ZM12 11.9997V1.33301L14.7531 2.90621" />
    <path d="M1.33331 5H7.33331M4.33331 2V8" />
  </svg>
)
