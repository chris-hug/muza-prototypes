import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Register custom font-size classes so they don't conflict with text-color classes.
// Without this, tailwind-merge treats `text-xxs` and `text-primary-foreground` as
// the same conflict group — the last one wins and the color gets stripped.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["xxs"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
