import { useEffect, useRef, useState } from "react"
import {
    Bell,
    Calendar,
    UserRound,
} from "lucide-react"
import { apiFetch } from "../../lib/api"

interface AdminTopBarProps {
    title: string
    subtitle: string
    dateRangeLabel?: string
    adminName: string
    adminAvatar?: string | null
    onDateRangeChange?: (
        startDate: string,
        endDate: string
    ) => void
}

interface Notification {
    id: number
    message: string
    isread: boolean
    createdat: string
}

interface DateRange {
    startDate: string
    endDate: string
}

function formatDateLabel(
    startDate: string,
    endDate: string,
    fallbackLabel: string
) {
    if (!startDate || !endDate) {
        return fallbackLabel
    }

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)

    return `${start.toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })} - ${end.toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })}`
}

export function AdminTopBar({
    title,
    subtitle,
    dateRangeLabel = "Select date range",
    adminName,
    adminAvatar = null,
    onDateRangeChange,
}: AdminTopBarProps) {
    const [notifications, setNotifications] = useState<
        Notification[]
    >([])

    const [notificationsOpen, setNotificationsOpen] =
        useState(false)

    const [datePickerOpen, setDatePickerOpen] =
        useState(false)

    const [loadingNotifications, setLoadingNotifications] =
        useState(true)

    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: "",
        endDate: "",
    })

    const [draftRange, setDraftRange] = useState<DateRange>({
        startDate: "",
        endDate: "",
    })

    const [dateError, setDateError] = useState<string | null>(
        null
    )

    const notificationRef = useRef<HTMLDivElement>(null)
    const datePickerRef = useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter(
        (notification) => !notification.isread
    ).length

    const selectedDateLabel = formatDateLabel(
        dateRange.startDate,
        dateRange.endDate,
        dateRangeLabel
    )

    useEffect(() => {
        let mounted = true

        const loadNotifications = async () => {
            try {
                setLoadingNotifications(true)

                const data = await apiFetch("/notifications")

                if (mounted) {
                    setNotifications(
                        Array.isArray(data) ? data : []
                    )
                }
            } catch (error) {
                console.error(
                    "Failed to load notifications:",
                    error
                )

                if (mounted) {
                    setNotifications([])
                }
            } finally {
                if (mounted) {
                    setLoadingNotifications(false)
                }
            }
        }

        loadNotifications()

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node

            if (
                datePickerRef.current &&
                !datePickerRef.current.contains(target)
            ) {
                setDatePickerOpen(false)
            }

            if (
                notificationRef.current &&
                !notificationRef.current.contains(target)
            ) {
                setNotificationsOpen(false)
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        )

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            )
        }
    }, [])

    const handleNotificationToggle = async () => {
        const nextOpen = !notificationsOpen
        setNotificationsOpen(nextOpen)

        if (!nextOpen) return

        const unreadNotifications = notifications.filter(
            (notification) => !notification.isread
        )

        setNotifications((currentNotifications) =>
            currentNotifications.map((notification) => ({
                ...notification,
                isread: true,
            }))
        )

        await Promise.all(
            unreadNotifications.map((notification) =>
                apiFetch(
                    `/notifications/${notification.id}/read`,
                    {
                        method: "PATCH",
                    }
                ).catch((error) => {
                    console.error(
                        "Failed to mark notification as read:",
                        error
                    )
                })
            )
        )
    }

    const handleOpenDatePicker = () => {
        setDraftRange(dateRange)
        setDateError(null)
        setDatePickerOpen((current) => !current)
    }

    const handleApplyDateRange = () => {
        if (
            !draftRange.startDate ||
            !draftRange.endDate
        ) {
            setDateError(
                "Please select both a start date and an end date."
            )
            return
        }

        if (
            draftRange.startDate >
            draftRange.endDate
        ) {
            setDateError(
                "The start date cannot be later than the end date."
            )
            return
        }

        setDateRange(draftRange)
        setDatePickerOpen(false)
        setDateError(null)

        onDateRangeChange?.(
            draftRange.startDate,
            draftRange.endDate
        )
    }

    const handleClearDateRange = () => {
        const emptyRange: DateRange = {
            startDate: "",
            endDate: "",
        }

        setDateRange(emptyRange)
        setDraftRange(emptyRange)
        setDateError(null)
        setDatePickerOpen(false)

        onDateRangeChange?.("", "")
    }

    return (
        <div className="flex flex-col gap-4 border-b border-default bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-default">
                    {title}
                </h1>

                <p className="mt-1 text-sm text-muted">
                    {subtitle}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <div
                    ref={datePickerRef}
                    className="relative"
                >
                    <button
                        type="button"
                        onClick={handleOpenDatePicker}
                        aria-label="Choose date range"
                        aria-expanded={datePickerOpen}
                        className="flex items-center gap-2 rounded-md border border-default bg-card px-3 py-2 text-xs font-medium text-default transition hover:bg-surface-alt"
                    >
                        <Calendar className="h-3.5 w-3.5 text-muted" />

                        {selectedDateLabel}
                    </button>

                    {datePickerOpen && (
                        <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-default bg-card p-4 shadow-xl">
                            <p className="text-sm font-semibold text-default">
                                Select date range
                            </p>

                            <p className="mt-1 text-xs text-muted">
                                Choose the period for the report.
                            </p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label
                                        htmlFor="admin-start-date"
                                        className="text-xs font-medium text-muted"
                                    >
                                        Start date
                                    </label>

                                    <input
                                        id="admin-start-date"
                                        type="date"
                                        value={
                                            draftRange.startDate
                                        }
                                        max={
                                            draftRange.endDate ||
                                            undefined
                                        }
                                        onChange={(event) => {
                                            setDateError(null)

                                            setDraftRange(
                                                (current) => ({
                                                    ...current,
                                                    startDate:
                                                        event.target
                                                            .value,
                                                })
                                            )
                                        }}
                                        className="mt-1 block w-full cursor-pointer rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="admin-end-date"
                                        className="text-xs font-medium text-muted"
                                    >
                                        End date
                                    </label>

                                    <input
                                        id="admin-end-date"
                                        type="date"
                                        value={
                                            draftRange.endDate
                                        }
                                        min={
                                            draftRange.startDate ||
                                            undefined
                                        }
                                        onChange={(event) => {
                                            setDateError(null)

                                            setDraftRange(
                                                (current) => ({
                                                    ...current,
                                                    endDate:
                                                        event.target
                                                            .value,
                                                })
                                            )
                                        }}
                                        className="mt-1 block w-full cursor-pointer rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {dateError && (
                                <p className="mt-3 text-xs font-medium text-error">
                                    {dateError}
                                </p>
                            )}

                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleApplyDateRange}
                                    className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-dark"
                                >
                                    Apply
                                </button>

                                <button
                                    type="button"
                                    onClick={handleClearDateRange}
                                    className="flex-1 rounded-md border border-default px-3 py-2 text-xs font-semibold text-muted transition hover:bg-surface-alt hover:text-default"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div
                    ref={notificationRef}
                    className="relative"
                >
                    <button
                        type="button"
                        onClick={handleNotificationToggle}
                        aria-label="Notifications"
                        aria-expanded={notificationsOpen}
                        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-default text-muted transition-colors hover:text-default"
                    >
                        <Bell className="h-4 w-4" />

                        {unreadCount > 0 && (
                            <span
                                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"
                                aria-label={`${unreadCount} unread notifications`}
                            />
                        )}
                    </button>

                    {notificationsOpen && (
                        <div className="absolute right-0 top-11 z-50 w-72 rounded-lg border border-default bg-card p-2 shadow-xl">
                            <div className="flex items-center justify-between px-2 py-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                    Notifications
                                </p>

                                {unreadCount > 0 && (
                                    <span className="text-[10px] text-primary">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>

                            <div className="max-h-72 overflow-y-auto">
                                {loadingNotifications && (
                                    <p className="px-2 py-4 text-center text-sm text-muted">
                                        Loading notifications...
                                    </p>
                                )}

                                {!loadingNotifications &&
                                    notifications.length ===
                                        0 && (
                                        <p className="px-2 py-4 text-center text-sm text-muted">
                                            No notifications yet.
                                        </p>
                                    )}

                                {!loadingNotifications &&
                                    notifications.map(
                                        (notification) => (
                                            <div
                                                key={notification.id}
                                                className="rounded-md px-2 py-2 text-sm hover:bg-surface-alt"
                                            >
                                                <p className="text-default">
                                                    {
                                                        notification.message
                                                    }
                                                </p>

                                                <p className="mt-0.5 text-[10px] text-muted">
                                                    {new Date(
                                                        notification.createdat
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                        )
                                    )}
                            </div>
                        </div>
                    )}
                </div>

                {adminAvatar ? (
                    <img
                        src={adminAvatar}
                        alt={adminName || "Admin"}
                        className="h-9 w-9 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"
                        aria-label="Default admin profile icon"
                    >
                        <UserRound className="h-5 w-5" />
                    </div>
                )}
            </div>
        </div>
    )
}