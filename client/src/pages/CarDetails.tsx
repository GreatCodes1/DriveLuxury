import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Star } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { ImageGallery } from "../components/car-details/ImageGallery"
import {
    SpecGrid,
    type Spec,
} from "../components/car-details/SpecGrid"
import {
    ReviewCard,
    type Review,
} from "../components/car-details/ReviewCard"
import {
    BookingSidebar,
    type AvailabilityStatus,
} from "../components/car-details/BookingSidebar"
import { useAuth } from "../context/Authcontext"
import { apiFetch } from "../lib/api"
import Popup from "../components/Popup"

interface ApiVehicle {
    id: number
    name: string
    category: string
    description: string | null
    brand: string | null
    model: string | null
    year: number | null
    colour: string | null
    dailyprice: number
    isavailable: boolean
    img_url: string
    images: string[]
}

interface ApiReviewsResponse {
    reviews: ApiReview[]
    averageReview: number | string | null
}

interface ApiAvailabilityResponse {
    available: boolean
}

interface ApiReview {
    rating: number
    comment: string
    name: string
}

interface PopupState {
    message: string
    error: boolean
}

function todayIso() {
    return new Date().toISOString().slice(0, 10)
}

function addDaysIso(dateStr: string, days: number) {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string) {
    const diff =
        new Date(end).getTime() -
        new Date(start).getTime()

    return Math.round(
        diff / (1000 * 60 * 60 * 24)
    )
}

export default function CarDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [vehicle, setVehicle] =
        useState<ApiVehicle | null>(null)

    const [reviews, setReviews] = useState<ApiReview[]>([])
    const [averageReview, setAverageReview] =
        useState<number | null>(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [popup, setPopup] = useState<PopupState | null>(
        null
    )

    const [liabilityCover, setLiabilityCover] =
        useState(true)

    const [pickupDate, setPickupDate] =
        useState(todayIso())

    const [returnDate, setReturnDate] = useState(
        addDaysIso(todayIso(), 4)
    )

    const [availabilityStatus, setAvailabilityStatus] =
        useState<AvailabilityStatus>("idle")

    useEffect(() => {
        if (!id) return

        setLoading(true)
        setError(null)

        Promise.all([
            apiFetch<ApiVehicle>(`/vehicle/${id}`),
            apiFetch<ApiReviewsResponse>(
                `/vehicle/${id}/reviews`
            ),
        ])
            .then(([vehicleData, reviewData]) => {
                setVehicle(vehicleData)
                setReviews(reviewData.reviews)

                setAverageReview(
                    reviewData.averageReview !== null
                        ? Number(reviewData.averageReview)
                        : null
                )
            })
            .catch((err: unknown) => {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Couldn't load this vehicle."

                setError(message)

                setPopup({
                    message,
                    error: true,
                })
            })
            .finally(() => {
                setLoading(false)
            })
    }, [id])

    useEffect(() => {
        if (!id || !pickupDate || !returnDate) return

        if (
            new Date(returnDate) <=
            new Date(pickupDate)
        ) {
            setAvailabilityStatus("idle")
            return
        }

        setAvailabilityStatus("checking")

        const timeout = setTimeout(() => {
            apiFetch<ApiAvailabilityResponse>(
                `/vehicles/${id}/availability?start=${pickupDate}&end=${returnDate}`
            )
                .then((data) => {
                    setAvailabilityStatus(
                        data.available
                            ? "available"
                            : "unavailable"
                    )
                })
                .catch((err) => {
                    setAvailabilityStatus("error")

                    setPopup({
                        message:
                            err instanceof Error
                                ? err.message
                                : "Couldn't check vehicle availability.",
                        error: true,
                    })
                })
        }, 400)

        return () => clearTimeout(timeout)
    }, [id, pickupDate, returnDate])

    const handleReserve = () => {
        if (!user) {
            navigate("/login")
            return
        }

        navigate("/checkout", {
            state: {
                vehicleId: vehicle?.id,
                name: vehicle?.name,
                category: vehicle?.category,
                image: vehicle?.img_url,
                dailyRate: Number(vehicle?.dailyprice),
                liabilityCover,
                pickupLocation: "Los Angeles, CA (LAX)",
                pickupDateTime: pickupDate,
                returnDateTime: returnDate,
                days,
            },
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface text-default">
                {popup && (
                    <Popup
                        message={popup.message}
                        error={popup.error}
                        onClose={() => setPopup(null)}
                    />
                )}

                <Navbar />

                <p className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted">
                    Loading vehicle...
                </p>

                <Footer />
            </div>
        )
    }

    if (error || !vehicle) {
        return (
            <div className="min-h-screen bg-surface text-default">
                {popup && (
                    <Popup
                        message={popup.message}
                        error={popup.error}
                        onClose={() => setPopup(null)}
                    />
                )}

                <Navbar />

                <p className="mx-auto max-w-7xl px-4 py-16 text-sm font-medium text-error">
                    {error ?? "Vehicle not found."}
                </p>

                <Footer />
            </div>
        )
    }

    const specs: Spec[] = [
        { label: "Category", value: vehicle.category },
        { label: "Brand", value: vehicle.brand ?? "—" },
        { label: "Model", value: vehicle.model ?? "—" },
        {
            label: "Year",
            value: vehicle.year
                ? String(vehicle.year)
                : "—",
        },
        { label: "Colour", value: vehicle.colour ?? "—" },
        {
            label: "Daily Rate",
            value: `$${vehicle.dailyprice}/day`,
        },
    ]

    const mappedReviews: Review[] = reviews.map((r) => ({
        name: r.name,
        date: "",
        avatar: `https://i.pravatar.cc/100?u=${encodeURIComponent(
            r.name
        )}`,
        rating: r.rating,
        comment: r.comment,
    }))

    const days = daysBetween(
        pickupDate,
        returnDate
    )

    return (
        <div className="min-h-screen bg-surface text-default">
            {popup && (
                <Popup
                    message={popup.message}
                    error={popup.error}
                    onClose={() => setPopup(null)}
                />
            )}

            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
                    <div>
                        <ImageGallery
                            images={vehicle.images}
                            alt={vehicle.name}
                        />

                        <div className="mt-6 flex flex-wrap items-center gap-2">
                            {vehicle.year && (
                                <span className="rounded-md bg-[var(--border)] px-2 py-1 text-[10px] font-semibold text-default">
                                    {vehicle.year}
                                </span>
                            )}

                            <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold uppercase text-white">
                                {vehicle.category}
                            </span>

                            {averageReview !== null && (
                                <span className="flex items-center gap-1 text-xs font-medium text-default">
                                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                                    {averageReview.toFixed(1)}{" "}
                                    ({reviews.length} Reviews)
                                </span>
                            )}

                            {!vehicle.isavailable && (
                                <span className="rounded-md bg-error/10 px-2 py-1 text-[10px] font-semibold text-error">
                                    Currently Unavailable
                                </span>
                            )}
                        </div>

                        <h1 className="mt-2 text-3xl font-bold text-default">
                            {vehicle.name}
                        </h1>

                        {vehicle.description && (
                            <p className="mt-3 text-sm leading-relaxed text-muted">
                                {vehicle.description}
                            </p>
                        )}

                        <section className="mt-8">
                            <h2 className="text-base font-semibold text-default">
                                Vehicle Details
                            </h2>

                            <div className="mt-4">
                                <SpecGrid specs={specs} />
                            </div>
                        </section>

                        <section className="mt-10 border-t border-default pt-8">
                            <h2 className="text-base font-semibold text-default">
                                Patron Journals
                            </h2>

                            <div className="mt-4 space-y-4">
                                {mappedReviews.map((review, i) => (
                                    <ReviewCard
                                        key={i}
                                        review={review}
                                    />
                                ))}

                                {mappedReviews.length === 0 && (
                                    <p className="text-sm text-muted">
                                        No reviews yet for this vehicle.
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>

                    <div>
                        <BookingSidebar
                            dailyRate={Number(
                                vehicle.dailyprice
                            )}
                            pickupLocation="Los Angeles, CA (LAX)"
                            pickupDate={pickupDate}
                            returnDate={returnDate}
                            onPickupDateChange={setPickupDate}
                            onReturnDateChange={setReturnDate}
                            minDate={todayIso()}
                            days={days}
                            availabilityStatus={
                                vehicle.isavailable
                                    ? availabilityStatus
                                    : "unavailable"
                            }
                            liabilityCover={liabilityCover}
                            onToggleLiabilityCover={
                                setLiabilityCover
                            }
                            liabilityCoverPricePerDay={45}
                            concierServiceFee={65}
                            onReserve={handleReserve}
                        />
                    </div>
                </div>
            </main>

        </div>
    )
}