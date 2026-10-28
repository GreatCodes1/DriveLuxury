import { Sun, Moon } from "lucide-react"
import { useTheme } from "../context/ThemeContext"

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === "Dark"

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-default text-default transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
            {isDark ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
            ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
            )}
        </button>
    )
}