import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardLayout } from "../../components/dashboard/DashboardLayout"
import {
    VehicleCard,
    type Vehicle,
} from "../../components/vehicles/VehicleCart"
import { apiFetch } from "../../lib/api"

interface ApiVehicle {
    id: number
    name: string
    category: string
    brand: string | null
    model: string | null
    year: number | null
    colour: string | null
    dailyprice: number | string
    img_url: string | null
    rating?: number | string | null
}

function toVehicle(vehicle: ApiVehicle): Vehicle {
    return {
        id: vehicle.id,
        name: vehicle.name,
        category: vehicle.category,
        image: vehicle.img_url || "/placeholder-car.jpg",
        rating: Number(vehicle.rating) || 0,
        specs: [
            vehicle.brand,
            vehicle.model,
            vehicle.year ? String(vehicle.year) : null,
            vehicle.colour,
        ].filter(Boolean) as string[],
        price: Number(vehicle.dailyprice) || 0,
        ctaLabel: "Book Now",
    }
}

export default function DashboardWishlist() {
    const navigate = useNavigate()

    const [saved, setSaved] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        const loadWishlist = async () => {
            try {
                setLoading(true)
                setError(null)

                const data = await apiFetch("/wishlist")

                if (!mounted) return

                const vehicles: ApiVehicle[] = Array.isArray(data)
                    ? data
                    : []

                setSaved(vehicles.map(toVehicle))
            } catch (err) {
                if (mounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Couldn't load your wishlist."
                    )
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        loadWishlist()

        return () => {
            mounted = false
        }
    }, [])

    const removeFromSaved = async (id: Vehicle["id"]) => {
        const previousSaved = saved

        setSaved((currentSaved) =>
            currentSaved.filter((vehicle) => vehicle.id !== id)
        )

        try {
            await apiFetch(`/wishlist/${id}`, {
                method: "DELETE",
            })
        } catch (err) {
            setSaved(previousSaved)

            setError(
                err instanceof Error
                    ? err.message
                    : "Couldn't remove this vehicle from your wishlist."
            )
        }
    }

    const openVehicle = (id: Vehicle["id"]) => {
        navigate(`/cars/${id}`)
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-default">
                My Wishlist
            </h1>

            <p className="mt-1 text-sm text-muted">
                {saved.length}{" "}
                {saved.length === 1 ? "vehicle" : "vehicles"} saved for later.
            </p>

            {loading && (
                <p className="mt-6 text-sm text-muted">
                    Loading your wishlist...
                </p>
            )}

            {error && (
                <p className="mt-6 text-sm font-medium text-error">
                    {error}
                </p>
            )}

            {!loading && !error && saved.length === 0 && (
                <div className="mt-8 rounded-xl border border-dashed border-default p-12 text-center">
                    <p className="text-sm text-muted">
                        You haven't saved any vehicles yet. Browse the fleet
                        and tap the heart icon on a car to save it here.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/fleet")}
                        className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        Browse Fleet
                    </button>
                </div>
            )}

            {!loading && !error && saved.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {saved.map((vehicle) => (
                        <div
                            key={vehicle.id}
                            className="cursor-pointer"
                            onClick={() => openVehicle(vehicle.id)}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                ) {
                                    event.preventDefault()
                                    openVehicle(vehicle.id)
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <VehicleCard
                                vehicle={vehicle}
                                isWishlisted
                                onToggleWishlist={removeFromSaved}
                                onBook={() => openVehicle(vehicle.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    )
}