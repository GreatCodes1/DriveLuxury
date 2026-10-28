import { useEffect, useMemo, useState } from "react"
import { DollarSign, Car, Percent, UserPlus, Mail, Award, Pencil } from "lucide-react"
import { Link } from "react-router-dom"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { useAuth } from "../../context/Authcontext"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { StatCard } from "../../components/dashboard/StatCard"
import { RevenueBarChart } from "../../components/admin/RevenueBarChart"
import { CategoryDonutChart, type DonutSegment } from "../../components/admin/CategoryDonutChart"
import { FleetUnitCard, type FleetUnit } from "../../components/admin/FleetUnitCard"
import { apiFetch } from "../../lib/api"

// Fixed color per category so the donut chart doesn't shuffle colors
// around every time the underlying category mix changes.
const CATEGORY_COLORS = ["var(--color-primary)", "#3B82F6", "#22C55E", "#A855F7", "#EC4899", "#F59E0B"]

interface TopCustomer {
    id: number
    name: string
    bookings: number
    spent: number
}

interface AdminBookingRow {
    id: number
    username: string
    vehiclename: string
    startdate: string
    enddate: string
    totalprice: number
    status: string
}

const STATUS_STYLES: Record<string, string> = {
    confirmed: "bg-success/10 text-success",
    rented: "bg-success/10 text-success",
    completed: "bg-[var(--border)] text-muted",
    pending: "bg-warning/10 text-warning",
    cancelled: "bg-error/10 text-error",
}

export default function AdminDashboard() {
    const { user } = useAuth()

    const [revenueByMonth, setRevenueByMonth] = useState<{ label: string; value: number }[]>([])
    const [categorySegments, setCategorySegments] = useState<DonutSegment[]>([])
    const [bookings, setBookings] = useState<AdminBookingRow[]>([])
    const [activeBookingsCount, setActiveBookingsCount] = useState(0)
    const [newCustomers, setNewCustomers] = useState<number | null>(null)
    const [fleetUtilization, setFleetUtilization] = useState<number | null>(null)
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
    const [fleetUnits, setFleetUnits] = useState<FleetUnit[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        Promise.all([
            apiFetch("/admin/analytics"),
            apiFetch("/admin/bookings"),
            apiFetch("/admin/dashboard/stats"),
        ])
            .then(([analytics, allBookings, dashboardStats]) => {
                setRevenueByMonth(
                    analytics.revenueByMonth.map((r: { month: string; revenue: string }) => ({
                        label: r.month,
                        value: Number(r.revenue),
                    }))
                )
                setCategorySegments(
                    analytics.bookingsByCategory.map(
                        (c: { category: string; bookings: string }, i: number) => ({
                            label: c.category,
                            value: Number(c.bookings),
                            color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                        })
                    )
                )
                setBookings(allBookings.slice(0, 5))
                setActiveBookingsCount(
                    allBookings.filter((b: AdminBookingRow) =>
                        ["confirmed", "pending", "rented"].includes(b.status)
                    ).length
                )
                setNewCustomers(dashboardStats.newCustomers)
                setFleetUtilization(dashboardStats.fleetUtilization)
                setTopCustomers(dashboardStats.topCustomers)
                setFleetUnits(
                    dashboardStats.topVehicles.map(
                        (v: { id: number; name: string; image: string; dailyRate: number; utilization: number }) => ({
                            id: v.id,
                            name: v.name,
                            image: v.image,
                            dailyRate: v.dailyRate,
                            utilization: v.utilization,
                        })
                    )
                )
            })
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load dashboard data."))
            .finally(() => setLoading(false))
    }, [])

    const totalRevenue = useMemo(
        () => revenueByMonth.reduce((sum, m) => sum + m.value, 0),
        [revenueByMonth]
    )

    const stats = [
        { icon: DollarSign, value: `$${totalRevenue.toLocaleString()}`, label: "Total Revenue" },
        { icon: Car, value: String(activeBookingsCount), label: "Active Bookings" },
        { icon: Percent, value: fleetUtilization !== null ? `${fleetUtilization}%` : "—", label: "Fleet Utilization" },
        { icon: UserPlus, value: newCustomers !== null ? String(newCustomers) : "—", label: "New Customers (30d)" },
    ]

    return (
        <AdminLayout>
            <AdminTopBar
                title="Admin Overview"
                subtitle="Analytical workspace & fleet operations terminal"
                dateRangeLabel="Jun 01 - Jun 30, 2026"
                adminName={user?.name ?? "Admin"}
                adminAvatar="https://i.pravatar.cc/100?img=47"
                hasNotifications
            />

            <div className="p-6">
                {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}
                {loading && <p className="mb-4 text-sm text-muted">Loading dashboard...</p>}

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-default bg-card p-5 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-default">Monthly Revenue</h3>
                            <span className="text-xs font-semibold text-primary">
                                ${totalRevenue.toLocaleString()} Total
                            </span>
                        </div>
                        <p className="text-[10px] text-muted">Revenue from paid transactions</p>
                        <div className="mt-4">
                            {revenueByMonth.length > 0 ? (
                                <RevenueBarChart data={revenueByMonth} />
                            ) : (
                                !loading && <p className="text-xs text-muted">No revenue data yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-default bg-card p-5 lg:col-span-1">
                        <h3 className="text-sm font-semibold text-default">Bookings by Category</h3>
                        <p className="text-[10px] text-muted">Fleet market share split</p>
                        <div className="mt-4">
                            {categorySegments.length > 0 ? (
                                <CategoryDonutChart segments={categorySegments} centerLabel="100%" />
                            ) : (
                                !loading && <p className="text-xs text-muted">No booking data yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-default bg-card p-5 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-default">Customer Insights</h3>
                            <Link to="/admin/customers" className="text-xs font-medium text-primary hover:underline">
                                View CRM
                            </Link>
                        </div>
                        <div className="mt-3 space-y-3">
                            {topCustomers.map((customer, i) => (
                                <div key={customer.id} className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-default">{customer.name}</p>
                                        <p className="text-[10px] text-muted">{customer.bookings} bookings logged</p>
                                    </div>
                                    <p className="text-xs font-semibold text-default">
                                        ${customer.spent.toLocaleString()} spent
                                    </p>
                                </div>
                            ))}
                            {!loading && topCustomers.length === 0 && (
                                <p className="text-xs text-muted">No customer activity yet.</p>
                            )}
                        </div>

                        <div className="mt-4 space-y-2 border-t border-default pt-4">
                            <button
                                type="button"
                                disabled
                                title="Not wired to a backend action yet"
                                className="flex w-full cursor-not-allowed items-center gap-2 rounded-md border border-default px-3 py-2 text-xs font-semibold text-muted opacity-60"
                            >
                                <Mail className="h-3.5 w-3.5" />
                                Broadcast Campaign Mail
                            </button>
                            <Link
                                to="/admin/settings"
                                className="flex w-full items-center gap-2 rounded-md border border-default px-3 py-2 text-xs font-semibold text-default transition-colors hover:border-primary"
                            >
                                <Award className="h-3.5 w-3.5 text-primary" />
                                Configure Elite Loyalty Rates
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-xl border border-default bg-card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-default">Live Operations Desk</h3>
                            <p className="text-[10px] text-muted">Most recent bookings across the fleet</p>
                        </div>
                        <Link
                            to="/admin/bookings"
                            className="rounded-md border border-default px-3 py-2 text-xs font-semibold text-default hover:border-primary"
                        >
                            Full Dispatch Log
                        </Link>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                                    <th className="px-3 py-2 font-medium">Booking ID</th>
                                    <th className="px-3 py-2 font-medium">Customer</th>
                                    <th className="px-3 py-2 font-medium">Vehicle Fleet</th>
                                    <th className="px-3 py-2 font-medium">Rental Window</th>
                                    <th className="px-3 py-2 font-medium">Total Amount</th>
                                    <th className="px-3 py-2 font-medium">Dispatch Status</th>
                                    <th className="px-3 py-2 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((row) => (
                                    <tr key={row.id} className="border-b border-default last:border-0">
                                        <td className="px-3 py-3 font-medium text-default">#{row.id}</td>
                                        <td className="px-3 py-3 text-muted">{row.username}</td>
                                        <td className="px-3 py-3 font-medium text-default">{row.vehiclename}</td>
                                        <td className="px-3 py-3 text-muted">
                                            {row.startdate} → {row.enddate}
                                        </td>
                                        <td className="px-3 py-3 font-semibold text-default">
                                            ${Number(row.totalprice).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className={[
                                                    "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                                                    STATUS_STYLES[row.status] ?? "bg-[var(--border)] text-muted",
                                                ].join(" ")}
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <Link to="/admin/bookings" aria-label="Edit booking" className="text-muted hover:text-primary">
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && bookings.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted">
                                            No bookings yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-default">Vehicle Fleet Management</h3>
                            <p className="text-[10px] text-muted">Overview of top performance assets in high dispatch</p>
                        </div>
                        <Link to="/admin/vehicles" className="text-xs font-medium text-primary hover:underline">
                            View Full Fleet
                        </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {fleetUnits.map((unit) => (
                            <FleetUnitCard key={unit.id} unit={unit} />
                        ))}
                        {!loading && fleetUnits.length === 0 && (
                            <p className="text-sm text-muted">No booking activity yet to rank vehicles by.</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}