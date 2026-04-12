import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const stored = localStorage.getItem("muza-theme") as Theme | null
    const resolved = stored ?? "light"
    setTheme(resolved)
    document.documentElement.classList.toggle("dark", resolved === "dark")
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light"
    // Kill transitions for the duration of the repaint, then restore
    const css = document.createElement("style")
    css.textContent = "* { transition-duration: 0s !important; }"
    document.head.appendChild(css)
    document.documentElement.classList.toggle("dark", next === "dark")
    setTheme(next)
    localStorage.setItem("muza-theme", next)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    window.getComputedStyle(document.documentElement).opacity // force reflow
    document.head.removeChild(css)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
