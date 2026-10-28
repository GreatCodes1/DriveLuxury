import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { useAuth } from "../context/Authcontext"
import { FilterGroup } from "../components/vehicles/FilterGroup"
import { VehicleCard, type Vehicle } from "../components/vehicles/VehicleCart"
import { apiFetch } from "../lib/api"

interface ApiVehicle {
    id: number
    name: string
    category: string
    brand: string | null
    model: string | null
    year: number | null
    colour: string | null
    dailyprice: number
    isavailable: boolean
    img_url: string
    rating? : number
}

function toVehicle(v: ApiVehicle): Vehicle {
  return {
    id: v.id,
    name: v.name,
    category: v.category,
    image: v.img_url,
    price: Number(v.dailyprice),
    specs: [v.brand, v.model, v.year ? String(v.year) : null, v.colour]
      .filter(Boolean) as string[],
    rating: v.rating ?? 0, // or whatever default makes sense
  }
}

function toggleValue(list: string[], value: string) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function SearchResults() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const query = searchParams.get("q") ?? ""

    const [inputValue, setInputValue] = useState(query)
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [wishlistIds, setWishlistIds] = useState<Set<Vehicle["id"]>>(new Set())
    const [brands, setBrands] = useState<string[]>([])

    // Keep the on-page search box in sync if the URL changes (e.g. the
    // navbar overlay is used again while already on this page).
    useEffect(() => {
        setInputValue(query)
    }, [query])

    useEffect(() => {
        setLoading(true)
        setError(null)

        apiFetch("/vehicles")
            .then((data: ApiVehicle[]) => {
                const available = data.filter((v) => v.isavailable)
                const matched = query.trim()
                    ? available.filter((v) => v.name.toLowerCase().includes(query.trim().toLowerCase()))
                    : available
                setVehicles(matched.map(toVehicle))
            })
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load results."))
            .finally(() => setLoading(false))
    }, [query])

    useEffect(() => {
        if (!user) return
        apiFetch("/wishlist")
            .then((data: ApiVehicle[]) => setWishlistIds(new Set(data.map((v) => v.id))))
            .catch(() => {})
    }, [user])

    const brandOptions = useMemo(() => {
        const set = new Set(vehicles.flatMap((v) => (v.specs?.[0] ? [v.specs[0]] : [])))
        return Array.from(set).map((label) => ({ label }))
    }, [vehicles])

    const results = useMemo(() => {
        if (brands.length === 0) return vehicles
        return vehicles.filter((v) => v.specs?.[0] && brands.includes(v.specs[0]))
    }, [vehicles, brands])

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault()
        setSearchParams(inputValue.trim() ? { q: inputValue.trim() } : {})
    }

    const toggleWishlist = async (id: Vehicle["id"]) => {
        if (!user) {
            navigate("/login")
            return
        }
        const isSaved = wishlistIds.has(id)
        setWishlistIds((prev) => {
            const next = new Set(prev)
            isSaved ? next.delete(id) : next.add(id)
            return next
        })
        try {
            if (isSaved) await apiFetch(`/wishlist/${id}`, { method: "DELETE" })
            else await apiFetch(`/addWishlist/${id}`, { method: "POST" })
        } catch {
            setWishlistIds((prev) => {
                const next = new Set(prev)
                isSaved ? next.add(id) : next.delete(id)
                return next
            })
        }
    }

    return (
        <div className="min-h-screen bg-surface text-default">
            <Navbar />

            <div className="border-b border-default bg-surface-alt">
                <form
                    onSubmit={handleSearchSubmit}
                    className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8"
                >
                    <Search className="h-4 w-4 shrink-0 text-muted" />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Search for a car by name..."
                        className="w-full bg-transparent text-sm text-default placeholder:text-muted focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="shrink-0 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                        Search
                    </button>
                </form>
            </div>

            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Sidebar */}
                    {brandOptions.length > 0 && (
                        <aside className="w-full shrink-0 space-y-6 rounded-xl border border-default bg-card p-5 lg:w-64">
                            <h3 className="text-sm font-semibold text-default">Filters</h3>
                            <FilterGroup
                                title="Brand"
                                options={brandOptions}
                                selected={brands}
                                onChange={(label) => setBrands((prev) => toggleValue(prev, label))}
                            />
                        </aside>
                    )}

                    {/* Results */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-default">
                            {query ? (
                                <>
                                    Results for "{query}"{" "}
                                    <span className="text-base font-normal text-muted">
                                        ({results.length} matches found)
                                    </span>
                                </>
                            ) : (
                                <>
                                    Available Models{" "}
                                    <span className="text-base font-normal text-muted">
                                        ({results.length} matches found)
                                    </span>
                                </>
                            )}
                        </h1>

                        {loading && <p className="mt-6 text-sm text-muted">Loading...</p>}
                        {error && <p className="mt-6 text-sm font-medium text-error">{error}</p>}

                        {!loading && !error && (
                            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {results.map((vehicle) => (
                                    <div key={vehicle.id} onClick={() => navigate(`/cars/${vehicle.id}`)} className="cursor-pointer">
                                        <VehicleCard
                                            vehicle={vehicle}
                                            isWishlisted={wishlistIds.has(vehicle.id)}
                                            onToggleWishlist={toggleWishlist}
                                            onBook={() => navigate(`/cars/${vehicle.id}`)}
                                        />
                                    </div>
                                ))}
                                {results.length === 0 && (
                                    <p className="col-span-full text-center text-sm text-muted">
                                        {query
                                            ? `No vehicles match "${query}".`
                                            : "No available vehicles match your filters."}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}