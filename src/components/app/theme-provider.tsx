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
    // Inject a temporary <style> to kill all transitions for exactly one frame
    const style = document.createElement("style")
    style.textContent = "*, *::before, *::after { transition: none !important; }"
    document.head.appendChild(style)
    // Apply theme
    setTheme(next)
    localStorage.setItem("muza-theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
    // Remove after browser has painted the new colours
    requestAnimationFrame(() => document.head.removeChild(style))
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
