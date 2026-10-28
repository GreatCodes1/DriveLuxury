import { useEffect, useState } from "react"
import { DashboardLayout } from "../../components/dashboard/DashboardLayout"
import { UpcomingBookingCard, type UpcomingBooking } from "../../components/dashboard/UpcomingBookingCad"
import { BookingHistoryTable, type HistoryRow } from "../../components/dashboard/BookingHistoryTable"
import { apiFetch } from "../../lib/api"
import { formatDateRange, startsInLabel } from "../../lib/dates"

const TABS = ["Upcoming", "Completed", "Cancelled"] as const
type Tab = (typeof TABS)[number]

interface ApiBooking {
    id: number
    vehiclename: string
    vehiclecategory: string
    img_url: string
    startdate: string
    enddate: string
    totalprice: number
    status: string
}

export default function MyBookings() {
    const [activeTab, setActiveTab] = useState<Tab>("Upcoming")
    const [bookings, setBookings] = useState<ApiBooking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        apiFetch("/myBookings")
            .then((data) => setBookings(data))
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your bookings."))
            .finally(() => setLoading(false))
    }, [])

    const upcoming: UpcomingBooking[] = bookings
        .filter((b) => ["pending", "confirmed", "rented"].includes(b.status))
        .map((b) => ({
            id: b.id,
            category: b.vehiclecategory,
            name: b.vehiclename,
            image: b.img_url,
            dateRange: formatDateRange(b.startdate, b.enddate),
            location: "—",
            startsIn: startsInLabel(b.startdate),
            status:
                b.status === "confirmed"
                    ? "Confirmed"
                    : b.status === "rented"
                      ? "Confirmed"
                      : "Pending Inspect",
        }))

    const completed: HistoryRow[] = bookings
        .filter((b) => b.status === "completed")
        .map((b) => ({
            id: b.id,
            image: b.img_url,
            name: b.vehiclename,
            location: "—",
            total: Number(b.totalprice),
            status: "Completed",
        }))

    const cancelled: HistoryRow[] = bookings
        .filter((b) => b.status === "cancelled")
        .map((b) => ({
            id: b.id,
            image: b.img_url,
            name: b.vehiclename,
            location: "—",
            total: Number(b.totalprice),
            status: "Cancelled",
        }))

    const handleCancel = async (id: UpcomingBooking["id"]) => {
        setError(null)
        const previous = bookings
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)))
        try {
            await apiFetch(`/booking/${id}/cancel`, { method: "POST" })
        } catch (err) {
            setBookings(previous)
            setError(err instanceof Error ? err.message : "Couldn't cancel this booking.")
        }
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-default">My Bookings</h1>
            <p className="mt-1 text-sm text-muted">Track upcoming trips and review your rental history.</p>

            <div className="mt-6 flex gap-2 border-b border-default">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={[
                            "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                            activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-muted hover:text-default",
                        ].join(" ")}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading && <p className="mt-4 text-sm text-muted">Loading bookings...</p>}
            {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

            {!loading && (
                <div className="mt-6">
                    {activeTab === "Upcoming" &&
                        (upcoming.length > 0 ? (
                            <div className="space-y-4">
                                {upcoming.map((booking) => (
                                    <UpcomingBookingCard key={booking.id} booking={booking} onCancel={handleCancel} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted">You have no upcoming bookings.</p>
                        ))}

                    {activeTab === "Completed" &&
                        (completed.length > 0 ? (
                            <BookingHistoryTable rows={completed} />
                        ) : (
                            <p className="text-sm text-muted">No completed bookings yet.</p>
                        ))}

                    {activeTab === "Cancelled" &&
                        (cancelled.length > 0 ? (
                            <BookingHistoryTable rows={cancelled} />
                        ) : (
                            <p className="text-sm text-muted">No cancelled bookings.</p>
                        ))}
                </div>
            )}
        </DashboardLayout>
    )
}