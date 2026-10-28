import { useContext, createContext, type ReactNode, useState, useEffect } from "react"

export type Theme = 'Dark' | 'Light'

export interface ThemeContextValue {
    theme: Theme,
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
    children: ReactNode
}

const STORAGE_KEY = "theme"

function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "Light"

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "Dark" || stored === "Light") return stored

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    return prefersDark ? "Dark" : "Light"
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme)

    useEffect(() => {
        const root = document.documentElement

        if (theme === "Dark") {
            root.classList.add("dark")
        } else {
            root.classList.remove("dark")
        }

        window.localStorage.setItem(STORAGE_KEY, theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'Light' ? 'Dark' : 'Light'))
    }

    const value: ThemeContextValue = { theme, toggleTheme }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('Theme not set')
    }
    return context
}