import { useEffect, useState } from "react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { apiFetch } from "../../lib/api"

interface AdminBooking {
    id: number
    username: string
    vehiclename: string
    img_url: string
    startdate: string
    enddate: string
    totalprice: number
    status: string
}

const STATUS_OPTIONS = ["pending", "confirmed", "rented", "completed", "cancelled"]

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    confirmed: "bg-success/10 text-success",
    rented: "bg-success/10 text-success",
    completed: "bg-[var(--border)] text-muted",
    cancelled: "bg-error/10 text-error",
}

// Shown until GET /admin/bookings is reachable — replace with [] once wired live.
const MOCK_BOOKINGS: AdminBooking[] = [
    {
        id: 9281,
        username: "Marcus Vance",
        vehiclename: "Porsche 911 GT3 RS",
        img_url: "https://picsum.photos/seed/bookingrow1/200/140",
        startdate: "2026-06-14",
        enddate: "2026-06-18",
        totalprice: 3400,
        status: "confirmed",
    },
    {
        id: 8812,
        username: "Helena Rostova",
        vehiclename: "Ferrari F8 Tributo",
        img_url: "https://picsum.photos/seed/bookingrow2/200/140",
        startdate: "2026-06-15",
        enddate: "2026-06-20",
        totalprice: 4950,
        status: "confirmed",
    },
    {
        id: 7740,
        username: "Devon Lane",
        vehiclename: "Tesla Model S Plaid",
        img_url: "https://picsum.photos/seed/bookingrow3/200/140",
        startdate: "2026-06-16",
        enddate: "2026-06-19",
        totalprice: 1120,
        status: "pending",
    },
]

export default function AdminBookings() {
    const [bookings, setBookings] = useState<AdminBooking[]>(MOCK_BOOKINGS)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        apiFetch("/admin/bookings")
            .then((data) => setBookings(data))
            .catch(() => {
                // Fall back to mock data silently — keeps the page usable
                // while the backend/session isn't available in this preview.
            })
            .finally(() => setLoading(false))
    }, [])

    const updateStatus = async (id: number, status: string) => {
        setError(null)
        const previous = bookings
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))

        try {
            await apiFetch(`/admin/booking/${id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            })
        } catch (err) {
            setBookings(previous)
            setError(err instanceof Error ? err.message : "Couldn't update booking status.")
        }
    }

    return (
        <AdminLayout>
            <AdminTopBar
                title="Bookings"
                subtitle="Every reservation across the fleet, live."
                dateRangeLabel="Jun 01 - Jun 30, 2026"
                adminName="Admin"
                adminAvatar={null}
            />

            <div className="p-6">
                {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}
                {loading && <p className="mb-4 text-sm text-muted">Loading bookings...</p>}

                <div className="overflow-x-auto rounded-xl border border-default bg-card">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                                <th className="px-4 py-3 font-medium">Booking</th>
                                <th className="px-4 py-3 font-medium">Customer</th>
                                <th className="px-4 py-3 font-medium">Dates</th>
                                <th className="px-4 py-3 font-medium">Total</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b.id} className="border-b border-default last:border-0">
                                    <td className="flex items-center gap-3 px-4 py-3">
                                        <img src={b.img_url} alt={b.vehiclename} className="h-9 w-12 rounded-md object-cover" />
                                        <div>
                                            <p className="font-medium text-default">{b.vehiclename}</p>
                                            <p className="text-[10px] text-muted">#{b.id}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted">{b.username}</td>
                                    <td className="px-4 py-3 text-muted">
                                        {b.startdate} → {b.enddate}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-default">${b.totalprice.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={b.status}
                                            onChange={(e) => updateStatus(b.id, e.target.value)}
                                            className={[
                                                "rounded-full border-0 px-2.5 py-1 text-[10px] font-semibold capitalize focus:outline-none",
                                                STATUS_STYLES[b.status] ?? "bg-[var(--border)] text-muted",
                                            ].join(" ")}
                                        >
                                            {STATUS_OPTIONS.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    )
}