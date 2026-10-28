import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
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
    img_url: string
    rating?: number
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
    rating: v.rating ?? 0, // or whatever default you prefer
  }
}

export default function Wishlist() {
    const navigate = useNavigate()
    const [saved, setSaved] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        apiFetch("/wishlist")
            .then((data: ApiVehicle[]) => setSaved(data.map(toVehicle)))
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your wishlist."))
            .finally(() => setLoading(false))
    }, [])
    

    const removeFromSaved = async (id: Vehicle["id"]) => {
        const previous = saved
        setSaved((prev) => prev.filter((v) => v.id !== id))
        try {
            await apiFetch(`/wishlist/${id}`, { method: "DELETE" })
        } catch (err) {
            setSaved(previous)
            setError(err instanceof Error ? err.message : "Couldn't remove this vehicle.")
        }
    }

    return (
        <div className="min-h-screen bg-surface text-default">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold text-default">My Saved Fleet</h1>
                <p className="mt-1 text-sm text-muted">{saved.length} vehicles saved</p>

                {loading && <p className="mt-6 text-sm text-muted">Loading your wishlist...</p>}
                {error && <p className="mt-6 text-sm font-medium text-error">{error}</p>}

                {!loading && !error && saved.length === 0 && (
                    <div className="mt-8 rounded-xl border border-dashed border-default p-12 text-center">
                        <p className="text-sm text-muted">
                            You haven't saved any vehicles yet. Browse the fleet and tap the heart icon
                            on a car to save it here.
                        </p>
                    </div>
                )}

                {!loading && !error && saved.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {saved.map((vehicle) => (
                            <div key={vehicle.id} onClick={() => navigate(`/cars/${vehicle.id}`)} className="cursor-pointer">
                                <VehicleCard
                                    vehicle={vehicle}
                                    isWishlisted
                                    onToggleWishlist={removeFromSaved}
                                    onBook={() => navigate(`/cars/${vehicle.id}`)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}