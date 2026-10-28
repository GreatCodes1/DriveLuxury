import { Calendar, MapPin } from "lucide-react"
import { Link } from "react-router-dom"

export interface UpcomingBooking {
    id: string | number
    category: string
    name: string
    image: string
    dateRange: string
    location: string
    startsIn: string
    status: "Confirmed" | "Pending Inspect" | "Cancelled"
}

const STATUS_STYLES: Record<UpcomingBooking["status"], string> = {
    Confirmed: "bg-success/10 text-success",
    "Pending Inspect": "bg-warning/10 text-warning",
    Cancelled: "bg-error/10 text-error",
}

interface UpcomingBookingCardProps {
    booking: UpcomingBooking
    onCancel?: (id: UpcomingBooking["id"]) => void
}

export function UpcomingBookingCard({ booking, onCancel }: UpcomingBookingCardProps) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border border-default bg-card p-4 sm:flex-row">
            <img
                src={booking.image}
                alt={booking.name}
                className="h-24 w-full rounded-lg object-cover sm:w-32"
            />

            <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {booking.category}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-default">{booking.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {booking.dateRange}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {booking.location}
                        </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-default">Starts {booking.startsIn}</p>
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                    <span
                        className={[
                            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                            STATUS_STYLES[booking.status],
                        ].join(" ")}
                    >
                        {booking.status}
                    </span>
                    <div className="flex items-center gap-3 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => onCancel?.(booking.id)}
                            className="text-muted transition-colors hover:text-error"
                        >
                            Cancel
                        </button>
                        <Link to={`/dashboard/bookings/${booking.id}`} className="text-primary hover:underline">
                            View Details
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}