import { useEffect, useState } from "react"
import { Key, Tag, CreditCard, Award } from "lucide-react"
import { Link } from "react-router-dom"
import { DashboardLayout } from "../../components/dashboard/DashboardLayout"
import { StatCard } from "../../components/dashboard/StatCard"
import { UpcomingBookingCard, type UpcomingBooking } from "../../components/dashboard/UpcomingBookingCad"
import { BookingHistoryTable, type HistoryRow } from "../../components/dashboard/BookingHistoryTable"
import { ConciergeMessages, type ConciergeMessage } from "../../components/dashboard/ConciergeMessages"
import { QuickActions } from "../../components/dashboard/QuickActions"
import { useAuth } from "../../context/Authcontext"
import { apiFetch } from "../../lib/api"
import { formatDateRange, startsInLabel } from "../../lib/dates"
import { WishlistPreviewCard, type WishlistPreviewItem } from "../../components/dashboard/WishlistPreviewCard"

// Real concierge threads are fetched below (GET /messages).

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

interface ApiVehicle {
    id: number
    name: string
    dailyprice: number
    img_url: string
}

interface ApiThread {
    id: number
    subject: string
    updatedat: string
    last_message: string | null
    unread_count: string
}

interface Stats {
    totalTrips: number
    activeBookings: number
    totalSpent: number
    loyaltyPoints: number
}

function timeAgo(dateStr: string) {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days === 1 ? "" : "s"} ago`
}

export default function DashboardHome() {
    const { user } = useAuth()

    const [stats, setStats] = useState<Stats | null>(null)
    const [bookings, setBookings] = useState<ApiBooking[]>([])
    const [wishlist, setWishlist] = useState<WishlistPreviewItem[]>([])
    const [threads, setThreads] = useState<ApiThread[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    useEffect(() => {
        Promise.all([
            apiFetch<Stats>("/dashboard/stats"),
            apiFetch<ApiBooking[]>("/myBookings"),
            apiFetch<ApiVehicle[]>("/wishlist"),
            apiFetch<ApiThread[]>("/messages"),
        ])
            .then(
                ([
                    statsData,
                    bookingsData,
                    wishlistData,
                    threadsData,
                ]) => {
                    setStats(statsData)
                    setBookings(bookingsData)

                    setWishlist(
                        wishlistData.slice(0, 4).map((vehicle) => ({
                            id: vehicle.id,
                            name: vehicle.name,
                            image: vehicle.img_url,
                            price: Number(vehicle.dailyprice),
                        }))
                    )

                    setThreads(threadsData.slice(0, 3))
                }
            )
            .catch((err: unknown) => {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Couldn't load your dashboard."
                )
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    const upcomingBookings: UpcomingBooking[] = bookings
        .filter((b) => ["pending", "confirmed", "rented"].includes(b.status))
        .slice(0, 2)
        .map((b) => ({
            id: b.id,
            category: b.vehiclecategory,
            name: b.vehiclename,
            image: b.img_url,
            dateRange: formatDateRange(b.startdate, b.enddate),
            location: "—",
            startsIn: startsInLabel(b.startdate),
            status: b.status === "pending" ? "Pending Inspect" : "Confirmed",
        }))

    const history: HistoryRow[] = bookings
        .filter((b) => ["completed", "cancelled"].includes(b.status))
        .slice(0, 4)
        .map((b) => ({
            id: b.id,
            image: b.img_url,
            name: b.vehiclename,
            location: "—",
            total: Number(b.totalprice),
            status: b.status === "completed" ? "Completed" : "Cancelled",
        }))

    const conciergeMessages: ConciergeMessage[] = threads.map((t) => ({
        id: t.id,
        sender: t.subject,
        avatar: "https://i.pravatar.cc/100?img=68",
        preview: t.last_message ?? "",
        timeAgo: timeAgo(t.updatedat),
        unread: Number(t.unread_count) > 0,
    }))

    const statCards = [
        { icon: Key, value: String(stats?.totalTrips ?? "—"), label: "Total Trips" },
        { icon: Tag, value: String(stats?.activeBookings ?? "—"), label: "Active Bookings" },
        { icon: CreditCard, value: `$${(stats?.totalSpent ?? 0).toLocaleString()}`, label: "Total Spent" },
        { icon: Award, value: String(stats?.loyaltyPoints ?? "—"), label: "Loyalty Points" },
    ]

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-default">Welcome back, {user?.name?.split(" ")[0] ?? "there"}</h1>
            <p className="mt-1 text-sm text-muted">Here is your DRIVEluxury dispatch for today.</p>

            {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}
            {loading && <p className="mt-4 text-sm text-muted">Loading your dashboard...</p>}

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
                <div>
                    <h2 className="text-base font-semibold text-default">Upcoming Bookings</h2>
                    <div className="mt-4 space-y-4">
                        {upcomingBookings.map((booking) => (
                            <UpcomingBookingCard key={booking.id} booking={booking} />
                        ))}
                        {!loading && upcomingBookings.length === 0 && (
                            <p className="text-sm text-muted">No upcoming bookings.</p>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-default">Booking History</h2>
                        <Link to="/dashboard/bookings" className="text-xs font-medium text-primary hover:underline">
                            View All History
                        </Link>
                    </div>
                    <div className="mt-4">
                        {history.length > 0 ? (
                            <BookingHistoryTable rows={history} />
                        ) : (
                            !loading && <p className="text-sm text-muted">No booking history yet.</p>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-default">My Wishlist Preview</h2>
                        <Link to="/dashboard/wishlist" className="text-xs font-medium text-primary hover:underline">
                            View Full Wishlist ({wishlist.length})
                        </Link>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {wishlist.map((item) => (
                            <WishlistPreviewCard key={item.id} item={item} />
                        ))}
                        {!loading && wishlist.length === 0 && (
                            <p className="col-span-full text-sm text-muted">Nothing saved yet.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* {conciergeMessages.length > 0 ? (
                        <ConciergeMessages messages={conciergeMessages} />
                    ) : (
                        !loading && (
                            <div className="rounded-xl border border-default bg-card p-4 text-center">
                                <p className="text-sm text-muted">No messages yet.</p>
                                <Link
                                    to="/dashboard/messages"
                                    className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                                >
                                    Message your concierge
                                </Link>
                            </div>
                        )
                    )} */}
                    <QuickActions />
                </div>
            </div>
        </DashboardLayout>
    )
}