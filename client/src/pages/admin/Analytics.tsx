import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { RevenueBarChart } from "../../components/admin/RevenueBarChart"
import {
    CategoryDonutChart,
    type DonutSegment,
} from "../../components/admin/CategoryDonutChart"
import { useAuth } from "../../context/Authcontext"
import { apiFetch } from "../../lib/api"

interface RevenueMonth {
    month: string
    month_start: string
    revenue: number | string
}

interface BookingMonth {
    month: string
    month_start: string
    bookings: number | string
}

interface BookingCategory {
    category: string
    bookings: number | string
}

interface TopVehicle {
    id: number
    name: string
    bookings: number | string
    revenue: number | string
}

interface AnalyticsResponse {
    revenueByMonth: RevenueMonth[]
    bookingsByMonth: BookingMonth[]
    bookingsByCategory: BookingCategory[]
    topVehicles: TopVehicle[]
}

interface ChartDataItem {
    label: string
    value: number
}

interface DateRange {
    startDate: string
    endDate: string
}

const CATEGORY_COLORS = [
    "var(--color-primary)",
    "#3B82F6",
    "#22C55E",
    "#A855F7",
    "#EC4899",
    "#F59E0B",
    "#14B8A6",
]

const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0)
}

const formatNumber = (value: number | string) => {
    return Number(value || 0).toLocaleString("en-NG")
}

export default function AdminAnalytics() {
    const { user } = useAuth()

    const [analytics, setAnalytics] =
        useState<AnalyticsResponse | null>(null)

    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: "",
        endDate: "",
    })

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        const loadAnalytics = async () => {
            try {
                setLoading(true)
                setError(null)

                const query = new URLSearchParams()

                if (
                    dateRange.startDate &&
                    dateRange.endDate
                ) {
                    query.set(
                        "startDate",
                        dateRange.startDate
                    )

                    query.set(
                        "endDate",
                        dateRange.endDate
                    )
                }

                const endpoint = query.toString()
                    ? `/admin/analytics?${query.toString()}`
                    : "/admin/analytics"

                const data: AnalyticsResponse =
                    await apiFetch(endpoint)

                if (mounted) {
                    setAnalytics(data)
                }
            } catch (err) {
                if (mounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load analytics."
                    )
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        loadAnalytics()

        return () => {
            mounted = false
        }
    }, [dateRange.startDate, dateRange.endDate])

    const revenueTrend: ChartDataItem[] = useMemo(() => {
        return (
            analytics?.revenueByMonth.map((item) => ({
                label: item.month,
                value: Math.round(
                    Number(item.revenue || 0) / 1000
                ),
            })) ?? []
        )
    }, [analytics])

    const bookingTrend: ChartDataItem[] = useMemo(() => {
        return (
            analytics?.bookingsByMonth.map((item) => ({
                label: item.month,
                value: Number(item.bookings || 0),
            })) ?? []
        )
    }, [analytics])

    const categorySegments: DonutSegment[] = useMemo(() => {
        return (
            analytics?.bookingsByCategory.map(
                (item, index) => ({
                    label: item.category,
                    value: Number(item.bookings || 0),
                    color:
                        CATEGORY_COLORS[
                            index % CATEGORY_COLORS.length
                        ],
                })
            ) ?? []
        )
    }, [analytics])

    const totalCategoryBookings = useMemo(() => {
        return categorySegments.reduce(
            (total, segment) => total + segment.value,
            0
        )
    }, [categorySegments])

    const handleDateRangeChange = (
        startDate: string,
        endDate: string
    ) => {
        setDateRange({
            startDate,
            endDate,
        })
    }

    return (
        <AdminLayout>
            <AdminTopBar
                title="Analytics"
                subtitle="Deeper performance trends across the fleet."
                dateRangeLabel="All available data"
                adminName={user?.name ?? "Admin"}
                adminAvatar={user?.image_url ?? null}
                onDateRangeChange={handleDateRangeChange}
            />

            <div className="p-6">
                {loading && (
                    <p className="text-sm text-muted">
                        Loading analytics...
                    </p>
                )}

                {error && (
                    <div className="rounded-lg border border-error/20 bg-error/5 p-4">
                        <p className="text-sm font-medium text-error">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setDateRange((current) => ({
                                    ...current,
                                }))
                            }
                            className="mt-2 text-xs font-medium text-error underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && analytics && (
                    <>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-default bg-card p-5">
                                <h3 className="text-sm font-semibold text-default">
                                    Revenue Trend
                                </h3>

                                <p className="text-[10px] text-muted">
                                    Monthly revenue in thousands of naira
                                </p>

                                <div className="mt-4">
                                    {revenueTrend.length > 0 ? (
                                        <RevenueBarChart
                                            data={revenueTrend}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted">
                                            No revenue data available for this period.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-default bg-card p-5">
                                <h3 className="text-sm font-semibold text-default">
                                    Bookings Trend
                                </h3>

                                <p className="text-[10px] text-muted">
                                    Monthly booking count
                                </p>

                                <div className="mt-4">
                                    {bookingTrend.length > 0 ? (
                                        <RevenueBarChart
                                            data={bookingTrend}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted">
                                            No booking data available for this period.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-default bg-card p-5">
                                <h3 className="text-sm font-semibold text-default">
                                    Bookings by Vehicle Category
                                </h3>

                                <div className="mt-4">
                                    {categorySegments.length > 0 ? (
                                        <CategoryDonutChart
                                            segments={categorySegments}
                                            centerLabel={formatNumber(
                                                totalCategoryBookings
                                            )}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted">
                                            No category data available for this period.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-default bg-card p-5">
                                <h3 className="text-sm font-semibold text-default">
                                    Top Performing Vehicles
                                </h3>

                                <div className="mt-4 space-y-3">
                                    {analytics.topVehicles.length > 0 ? (
                                        analytics.topVehicles.map(
                                            (vehicle, index) => (
                                                <div
                                                    key={vehicle.id}
                                                    className="flex items-center justify-between gap-4 text-sm"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                            {index + 1}
                                                        </span>

                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium text-default">
                                                                {
                                                                    vehicle.name
                                                                }
                                                            </p>

                                                            <p className="text-[10px] text-muted">
                                                                {formatNumber(
                                                                    vehicle.bookings
                                                                )}{" "}
                                                                bookings
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <p className="shrink-0 font-semibold text-default">
                                                        {formatCurrency(
                                                            vehicle.revenue
                                                        )}
                                                    </p>
                                                </div>
                                            )
                                        )
                                    ) : (
                                        <p className="text-sm text-muted">
                                            No vehicle data available for this period.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    )
}