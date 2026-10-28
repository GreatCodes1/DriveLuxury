import {
    useEffect,
    useRef,
    useState,
} from "react"
import {
    Bell,
    Menu,
    Search,
    UserRound,
} from "lucide-react"
import { apiFetch } from "../../lib/api"

interface TopBarProps {
    userName: string
    userAvatar?: string | null
    onOpenSidebar: () => void
}

interface Notification {
    id: number
    message: string
    isread: boolean
    createdat: string
}

export function TopBar({
    userName,
    userAvatar = null,
    onOpenSidebar,
}: TopBarProps) {
    const [notifications, setNotifications] =
        useState<Notification[]>([])

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    const panelRef = useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter(
        (notification) => !notification.isread
    ).length

    useEffect(() => {
        let mounted = true

        const loadNotifications = async () => {
            try {
                setLoading(true)

                const data =
                    await apiFetch("/notifications")

                if (!mounted) return

                setNotifications(
                    Array.isArray(data)
                        ? data
                        : []
                )
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
                    setLoading(false)
                }
            }
        }

        loadNotifications()

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent
        ) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(
                    event.target as Node
                )
            ) {
                setOpen(false)
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

    const handleOpen = async () => {
        const nextOpen = !open

        setOpen(nextOpen)

        if (!nextOpen) return

        const unreadNotifications =
            notifications.filter(
                (notification) =>
                    !notification.isread
            )

        setNotifications(
            (currentNotifications) =>
                currentNotifications.map(
                    (notification) => ({
                        ...notification,
                        isread: true,
                    })
                )
        )

        await Promise.all(
            unreadNotifications.map(
                (notification) =>
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

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-default bg-surface/95 px-4 backdrop-blur sm:px-6">
            {/* Mobile sidebar button */}
            <button
                type="button"
                onClick={onOpenSidebar}
                aria-label="Open sidebar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-default md:hidden"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-default bg-surface-alt px-3 py-2 sm:flex sm:max-w-sm lg:max-w-md">
                <Search className="h-4 w-4 shrink-0 text-muted" />

                <input
                    type="text"
                    placeholder="Search dispatch, fleets..."
                    aria-label="Search"
                    className="min-w-0 flex-1 bg-transparent text-sm text-default placeholder:text-muted focus:outline-none"
                />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
                {/* Notifications */}
                <div
                    className="relative"
                    ref={panelRef}
                >
                    <button
                        type="button"
                        onClick={handleOpen}
                        aria-label="Notifications"
                        aria-expanded={open}
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

                    {open && (
                        <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-default bg-card p-2 shadow-xl">
                            <div className="flex items-center justify-between px-2 py-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                    Notifications
                                </p>

                                {unreadCount > 0 && (
                                    <span className="text-[10px] text-primary">
                                        {
                                            unreadCount
                                        }{" "}
                                        unread
                                    </span>
                                )}
                            </div>

                            <div className="max-h-72 overflow-y-auto">
                                {loading && (
                                    <p className="px-2 py-4 text-center text-sm text-muted">
                                        Loading notifications...
                                    </p>
                                )}

                                {!loading &&
                                    notifications.length ===
                                        0 && (
                                        <p className="px-2 py-4 text-center text-sm text-muted">
                                            No notifications
                                            yet.
                                        </p>
                                    )}

                                {!loading &&
                                    notifications.map(
                                        (
                                            notification
                                        ) => (
                                            <div
                                                key={
                                                    notification.id
                                                }
                                                className="rounded-md px-2 py-2 text-sm hover:bg-surface-alt"
                                            >
                                                <p className="break-words text-default">
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

                {/* User avatar */}
                {userAvatar ? (
                    <img
                        src={userAvatar}
                        alt={
                            userName || "User"
                        }
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                        aria-label="Default user profile icon"
                    >
                        <UserRound className="h-5 w-5" />
                    </div>
                )}
            </div>
        </header>
    )
}