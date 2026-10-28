import { useState } from "react"
import { Star, Trash2 } from "lucide-react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"

interface AdminReview {
    id: number
    customer: string
    avatar: string
    vehicle: string
    rating: number
    comment: string
    date: string
}

const MOCK_REVIEWS: AdminReview[] = [
    {
        id: 1,
        customer: "Marcus Sterling",
        avatar: "https://i.pravatar.cc/100?img=12",
        vehicle: "Porsche 911 Carrera S",
        rating: 5,
        comment: "The reservation was flawless. Delivered directly to my private terminal at LAX.",
        date: "Mar 2, 2026",
    },
    {
        id: 2,
        customer: "Elena Rostova",
        avatar: "https://i.pravatar.cc/100?img=32",
        vehicle: "Range Rover Sport HSE",
        rating: 5,
        comment: "Spacious, ultra-premium interior, and perfect mechanical condition.",
        date: "Feb 26, 2026",
    },
    {
        id: 3,
        customer: "Devon Carter",
        avatar: "https://i.pravatar.cc/100?img=51",
        vehicle: "Tesla Model S Plaid",
        rating: 2,
        comment: "Car arrived with a low battery and delivery was over an hour late.",
        date: "Jan 15, 2026",
    },
]

export default function AdminReviews() {
    const [reviews, setReviews] = useState(MOCK_REVIEWS)

    const removeReview = (id: number) => {
        setReviews((prev) => prev.filter((r) => r.id !== id))
    }

    return (
        <AdminLayout>
            <AdminTopBar
                title="Reviews"
                subtitle="Moderate patron feedback across the fleet."
                dateRangeLabel="Jun 01 - Jun 30, 2026"
                adminName="Admin"
                adminAvatar={null}
            />

            <div className="p-6 space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="flex items-start justify-between gap-4 rounded-xl border border-default bg-card p-5">
                        <div className="flex items-start gap-3">
                            <img src={review.avatar} alt={review.customer} className="h-10 w-10 rounded-full object-cover" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-default">{review.customer}</p>
                                    <span className="text-xs text-muted">· {review.date}</span>
                                </div>
                                <p className="text-xs text-muted">{review.vehicle}</p>
                                <div className="mt-1 flex gap-0.5 text-primary">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="h-3.5 w-3.5" fill={i < review.rating ? "currentColor" : "none"} />
                                    ))}
                                </div>
                                <p className="mt-2 text-sm text-muted">"{review.comment}"</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeReview(review.id)}
                            aria-label="Remove review"
                            className="shrink-0 text-muted transition-colors hover:text-error"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <p className="text-sm text-muted">No reviews to moderate.</p>
                )}

                <p className="text-xs text-muted">
                    Fully mocked — your backend has no admin endpoint to list or delete reviews yet.
                    See the notes below.
                </p>
            </div>
        </AdminLayout>
    )
}