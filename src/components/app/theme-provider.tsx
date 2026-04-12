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
    // Suppress all transitions for the duration of the theme swap
    document.documentElement.classList.add("theme-switching")
    setTheme(next)
    localStorage.setItem("muza-theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
    // Two rAFs: first lets the class paint, second lets the browser commit
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("theme-switching")
      })
    })
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
