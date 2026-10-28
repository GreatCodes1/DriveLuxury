import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { SlidersHorizontal } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import {
    VehicleCard,
    type Vehicle,
} from "../components/vehicles/VehicleCart"
import { FilterGroup } from "../components/vehicles/FilterGroup"
import { PriceRangeFilter } from "../components/vehicles/PriceRangeFilter"
import { Pagination } from "../components/vehicles/Pagination"
import { useAuth } from "../context/Authcontext"
import { useCategories } from "../lib/useCAtegores"
import { apiFetch } from "../lib/api"
import Popup from "../components/Popup"

const SORT_OPTIONS = [
    "Price: High to Low",
    "Price: Low to High",
    "Newest Arrivals",
]

const PAGE_SIZE = 6

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
    rating?: number
}

interface PopupState {
    message: string
    error: boolean
}

function toVehicle(v: ApiVehicle): Vehicle {
    return {
        id: v.id,
        name: v.name,
        category: v.category,
        image: v.img_url,
        price: Number(v.dailyprice),
        specs: [
            v.brand,
            v.model,
            v.year ? String(v.year) : null,
            v.colour,
        ].filter(Boolean) as string[],
        rating: v.rating ?? 0,
    }
}

function toggleValue(list: string[], value: string) {
    return list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
}

export default function Fleet() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const {
        categories,
        loading: categoriesLoading,
        error: categoriesError,
    } = useCategories()

    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [popup, setPopup] = useState<PopupState | null>(
        null
    )

    const [wishlistIds, setWishlistIds] = useState<
        Set<Vehicle["id"]>
    >(new Set())

    // Pre-select a category when arriving from the home page (/fleet?category=Name)
    const [selectedCategories, setSelectedCategories] =
        useState<string[]>(() => {
            const fromUrl = searchParams.get("category")

            return fromUrl ? [fromUrl] : []
        })

    const [priceValue, setPriceValue] = useState(1800)
    const [sortBy, setSortBy] = useState(SORT_OPTIONS[0])
    const [page, setPage] = useState(1)

    const categoryOptions = useMemo(
        () =>
            categories.map((category) => ({
                label: category.name,
            })),
        [categories]
    )

    // Once categories load, align any URL-selected category with its real name
    // (case-insensitive) and drop ones that don't exist.
    useEffect(() => {
        if (categories.length === 0) return

        setSelectedCategories((prev) => {
            const next = prev.flatMap((selected) => {
                const match = categories.find(
                    (category) =>
                        category.name.toLowerCase() ===
                        selected.toLowerCase()
                )

                return match ? [match.name] : []
            })

            const unchanged =
                next.length === prev.length &&
                next.every((name, index) => name === prev[index])

            return unchanged ? prev : next
        })
    }, [categories])

    useEffect(() => {
        if (!categoriesError) return

        setPopup({
            message: categoriesError,
            error: true,
        })
    }, [categoriesError])

   useEffect(() => {
    apiFetch<ApiVehicle[]>("/vehicles")
        .then((data) => {
            setVehicles(data.map(toVehicle))
        })
        .catch((err: unknown) => {
            const message =
                err instanceof Error
                    ? err.message
                    : "Couldn't load the fleet."

            setError(message)

            setPopup({
                message,
                error: true,
            })
        })
        .finally(() => {
            setLoading(false)
        })
}, [])

useEffect(() => {
    if (!user) return

    apiFetch<ApiVehicle[]>("/wishlist")
        .then((data) => {
            setWishlistIds(
                new Set(data.map((vehicle) => vehicle.id))
            )
        })
        .catch((err: unknown) => {
            setPopup({
                message:
                    err instanceof Error
                        ? err.message
                        : "Couldn't load your wishlist.",
                error: true,
            })
        })
}, [user])


    const filteredVehicles = useMemo(() => {
        let list = vehicles.filter(
            (v) => v.price <= priceValue
        )

        if (selectedCategories.length > 0) {
            list = list.filter((v) =>
                selectedCategories.includes(v.category)
            )
        }

        list = [...list]

        if (sortBy === "Price: High to Low") {
            list.sort((a, b) => b.price - a.price)
        }

        if (sortBy === "Price: Low to High") {
            list.sort((a, b) => a.price - b.price)
        }

        if (sortBy === "Newest Arrivals") {
            list.sort(
                (a, b) => Number(b.id) - Number(a.id)
            )
        }

        return list
    }, [vehicles, selectedCategories, priceValue, sortBy])

    const totalPages = Math.max(
        1,
        Math.ceil(filteredVehicles.length / PAGE_SIZE)
    )

    const pagedVehicles = filteredVehicles.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    )

    const toggleWishlist = async (id: Vehicle["id"]) => {
        if (!user) {
            navigate("/login")
            return
        }

        const isSaved = wishlistIds.has(id)

        setWishlistIds((prev) => {
            const next = new Set(prev)

            if (isSaved) {
                next.delete(id)
            } else {
                next.add(id)
            }

            return next
        })

        try {
            if (isSaved) {
                await apiFetch(`/wishlist/${id}`, {
                    method: "DELETE",
                })

                setPopup({
                    message:
                        "Vehicle removed from your wishlist.",
                    error: false,
                })
            } else {
                await apiFetch(`/addWishlist/${id}`, {
                    method: "POST",
                })

                setPopup({
                    message:
                        "Vehicle added to your wishlist.",
                    error: false,
                })
            }
        } catch (err) {
            setWishlistIds((prev) => {
                const next = new Set(prev)

                if (isSaved) {
                    next.add(id)
                } else {
                    next.delete(id)
                }

                return next
            })

            setPopup({
                message:
                    err instanceof Error
                        ? err.message
                        : "Couldn't update your wishlist.",
                error: true,
            })
        }
    }

    return (
        <div className="min-h-screen bg-surface text-default pt-20">
            {popup && (
                <Popup
                    message={popup.message}
                    error={popup.error}
                    onClose={() => setPopup(null)}
                />
            )}

            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    <aside className="w-full shrink-0 space-y-6 rounded-xl border border-default bg-card p-5 lg:w-64">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-default">
                                Filters
                            </h3>

                            <SlidersHorizontal className="h-4 w-4 text-muted" />
                        </div>

                        {categoriesLoading ? (
                            <p className="text-xs text-muted">
                                Loading categories...
                            </p>
                        ) : (
                            categoryOptions.length > 0 && (
                                <FilterGroup
                                    title="Category"
                                    options={categoryOptions}
                                    selected={selectedCategories}
                                    onChange={(label) => {
                                        setPage(1)

                                        setSelectedCategories(
                                            (prev) =>
                                                toggleValue(
                                                    prev,
                                                    label
                                                )
                                        )
                                    }}
                                />
                            )
                        )}

                        <PriceRangeFilter
                            min={150}
                            max={1800}
                            value={priceValue}
                            onChange={(v) => {
                                setPage(1)
                                setPriceValue(v)
                            }}
                        />
                    </aside>

                    <div className="flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                                    Our Current Fleet
                                </p>

                                <h1 className="mt-1 text-2xl font-bold text-default">
                                    Explore Elite Fleet{" "}
                                    <span className="text-base font-normal text-muted">
                                        ({filteredVehicles.length}{" "}
                                        models)
                                    </span>
                                </h1>
                            </div>

                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value)
                                    setPage(1)
                                }}
                                className="rounded-md border border-default bg-card px-3 py-2 text-xs font-medium text-default focus:outline-none"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option
                                        key={option}
                                        value={option}
                                    >
                                        Sort by: {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {loading && (
                            <p className="mt-6 text-sm text-muted">
                                Loading the fleet...
                            </p>
                        )}

                        {error && !loading && (
                            <p className="mt-6 text-sm font-medium text-error">
                                {error}
                            </p>
                        )}

                        {!loading && !error && (
                            <>
                                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {pagedVehicles.map((vehicle) => (
                                        <div
                                            key={vehicle.id}
                                            onClick={() =>
                                                navigate(
                                                    `/cars/${vehicle.id}`
                                                )
                                            }
                                            className="cursor-pointer"
                                        >
                                            <VehicleCard
                                                vehicle={vehicle}
                                                isWishlisted={wishlistIds.has(
                                                    vehicle.id
                                                )}
                                                onToggleWishlist={
                                                    toggleWishlist
                                                }
                                                onBook={() =>
                                                    navigate(
                                                        `/cars/${vehicle.id}`
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>

                                {filteredVehicles.length ===
                                    0 && (
                                        <p className="mt-8 text-center text-sm text-muted">
                                            No vehicles match your
                                            filters.
                                        </p>
                                    )}

                                {filteredVehicles.length >
                                    PAGE_SIZE && (
                                        <Pagination
                                            page={page}
                                            totalPages={totalPages}
                                            onPageChange={setPage}
                                        />
                                    )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            <div className="hidden md:block">
                <Footer />
            </div>
        </div>
    )
}