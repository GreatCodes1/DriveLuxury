import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X } from "lucide-react"
import { apiFetch } from "../../lib/api"

interface ApiVehicle {
    id: number
    name: string
    category: string
    dailyprice: number
    img_url: string
}

interface SearchOverlayProps {
    onClose: () => void
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement>(null)

    const [query, setQuery] = useState("")
    const [allVehicles, setAllVehicles] = useState<ApiVehicle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiFetch<ApiVehicle[]>("/vehicles")
            .then((data) => setAllVehicles(data))
            .catch(() => setAllVehicles([]))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        document.addEventListener("keydown", handleKey)
        return () => document.removeEventListener("keydown", handleKey)
    }, [onClose])

    const suggestions = query.trim()
        ? allVehicles
              .filter((v) => v.name.toLowerCase().includes(query.trim().toLowerCase()))
              .slice(0, 6)
        : []

    const runSearch = (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) return
        navigate(`/search-results?q=${encodeURIComponent(trimmed)}`)
        onClose()
    }

    const handleSuggestionClick = (vehicleName: string) => {
        setQuery(vehicleName)
        runSearch(vehicleName)
    }

    return (
        <div className="absolute inset-0 z-50 flex h-16 items-center bg-surface px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
                <Search className="h-5 w-5 shrink-0 text-muted" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") runSearch(query)
                    }}
                    placeholder="Search for a car by name..."
                    className="w-full bg-transparent text-base text-default placeholder:text-muted focus:outline-none"
                />
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close search"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-alt hover:text-default"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Suggestions dropdown */}
                {query.trim() && (
                    <div className="absolute left-0 right-0 top-16 border-t border-default bg-surface shadow-xl">
                        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                            {loading && <p className="px-2 py-3 text-sm text-muted">Loading vehicles...</p>}

                            {!loading && suggestions.length === 0 && (
                                <p className="px-2 py-3 text-sm text-muted">
                                    No cars match "{query}". Press Enter to search anyway.
                                </p>
                            )}

                            {!loading &&
                                suggestions.map((vehicle) => (
                                    <button
                                        key={vehicle.id}
                                        type="button"
                                        onClick={() => handleSuggestionClick(vehicle.name)}
                                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-alt"
                                    >
                                        <img
                                            src={vehicle.img_url}
                                            alt={vehicle.name}
                                            className="h-10 w-14 shrink-0 rounded-md object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-default">
                                                {vehicle.name}
                                            </p>
                                            <p className="text-xs text-muted">{vehicle.category}</p>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold text-default">
                                            ${vehicle.dailyprice}/day
                                        </p>
                                    </button>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}