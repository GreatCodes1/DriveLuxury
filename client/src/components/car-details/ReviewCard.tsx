import { Star } from "lucide-react"

export interface Review {
    name: string
    date: string
    avatar: string
    rating: number
    comment: string
}

interface ReviewCardProps {
    review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
    return (
        <div className="rounded-xl border border-default bg-card p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={review.avatar}
                        alt={review.name}
                        className="h-9 w-9 rounded-full object-cover"
                    />
                    <div>
                        <p className="text-sm font-semibold text-default">{review.name}</p>
                        <p className="text-xs text-muted">{review.date}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex gap-0.5 text-primary">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className="h-3.5 w-3.5"
                                fill={i < Math.round(review.rating) ? "currentColor" : "none"}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-medium text-default">{review.rating.toFixed(1)}</span>
                </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">"{review.comment}"</p>
        </div>
    )
}