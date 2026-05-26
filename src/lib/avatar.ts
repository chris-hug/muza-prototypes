/*
 * User-avatar placeholder palette.
 *
 * 10 soft, earthy tones that share the warm-olive character of Muza's
 * secondary color so every default avatar feels like part of the same
 * family. Each entry is a bg/fg pair tuned for ≥ 4.5:1 contrast on
 * uppercase initials.
 *
 * Use these helpers anywhere a user avatar needs a deterministic
 * default — the same `seed` (typically the username) always produces
 * the same color across sessions.
 */

export const AVATAR_PALETTE = [
  { name: "Sage",   bg: "#FAFCF9", fg: "#3D5A3D" },
  { name: "Sand",   bg: "#FFFCF6", fg: "#6B5A35" },
  { name: "Sky",    bg: "#F8FBFE", fg: "#1F4A7A" },
  { name: "Clay",   bg: "#FEF7EE", fg: "#7A4326" },
  { name: "Mauve",  bg: "#FBF7FA", fg: "#583B5E" },
  { name: "Moss",   bg: "#F5F8F2", fg: "#3E5C36" },
  { name: "Taupe",  bg: "#F4EDE0", fg: "#5C4830" },
  { name: "Blush",  bg: "#FEF7F8", fg: "#7A3D48" },
  { name: "Rose",   bg: "#FCF1F3", fg: "#7D3447" },
  { name: "Lilac",  bg: "#F8F4FC", fg: "#4A3675" },
  { name: "Honey",  bg: "#FEF8E0", fg: "#5C4612" },
  { name: "Ochre",  bg: "#FAEFD2", fg: "#5C3F1B" },
  { name: "Mint",   bg: "#F4FAF6", fg: "#27563F" },
  { name: "Coral",  bg: "#FEF4EC", fg: "#7E3D26" },
  { name: "Sea",    bg: "#F2F7F5", fg: "#1F4F4A" },
] as const

export type AvatarColor = (typeof AVATAR_PALETTE)[number]

/** Hash the seed and pick a deterministic color from the palette. */
export function pickAvatarColor(seed: string): AvatarColor {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

/** First alphanumeric char of each `-` / `_` / whitespace separated
 *  segment, max two. "Chris-123" → "C1", "naomi-smith" → "NS",
 *  "jordan" → "J". */
export function initialsFromUsername(username: string): string {
  const parts = username.split(/[-_\s]+/).filter(Boolean)
  return parts
    .map(p => p.match(/[A-Za-z0-9]/)?.[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
