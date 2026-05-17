import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  /** Set theme to a specific value (used by ToggleGroup-style pickers). */
  setTheme: (next: Theme) => void
  /** Convenience: flip light↔dark (used by single-button toggles). */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    const stored = localStorage.getItem("muza-theme") as Theme | null
    const resolved = stored ?? "light"
    setThemeState(resolved)
    document.documentElement.classList.toggle("dark", resolved === "dark")
  }, [])

  // Single source of truth for "apply this theme now". Kills CSS transitions
  // for the repaint so the swap is instant (no half-tinted intermediate
  // colors), then restores them.
  const applyTheme = (next: Theme) => {
    if (next === theme) return
    const css = document.createElement("style")
    css.textContent = "* { transition-duration: 0s !important; }"
    document.head.appendChild(css)
    document.documentElement.classList.toggle("dark", next === "dark")
    setThemeState(next)
    localStorage.setItem("muza-theme", next)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    window.getComputedStyle(document.documentElement).opacity // force reflow
    document.head.removeChild(css)
  }

  const setTheme    = (next: Theme) => applyTheme(next)
  const toggleTheme = ()           => applyTheme(theme === "light" ? "dark" : "light")

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
