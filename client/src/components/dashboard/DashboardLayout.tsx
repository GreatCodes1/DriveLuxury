import {
    useEffect,
    useState,
    type ReactNode,
} from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { apiFetch } from "../../lib/api"

interface DashboardLayoutProps {
    children: ReactNode
}

interface SessionUser {
    id: number
    name: string
    email: string
    role: "customer" | "admin"
    image_url: string | null
}

interface MessageThread {
    id: number
    subject: string
    unread_count: number | string
}

export function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    const [user, setUser] =
        useState<SessionUser | null>(null)

    const [unreadMessages, setUnreadMessages] =
        useState(0)

    const [loading, setLoading] = useState(true)

    const [mobileOpen, setMobileOpen] =
        useState(false)

    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === "undefined") {
            return false
        }

        return (
            window.localStorage.getItem(
                "customer-sidebar-collapsed"
            ) === "true"
        )
    })

    useEffect(() => {
        let mounted = true

        const loadDashboardData = async () => {
            try {
                setLoading(true)

                const [
                    sessionUserData,
                    messageThreadsData,
                ] = await Promise.all([
                    apiFetch("/session"),
                    apiFetch("/messages"),
                ])

                if (!mounted) return

                const sessionUser =
                    sessionUserData as SessionUser

                const messageThreads: MessageThread[] =
                    Array.isArray(messageThreadsData)
                        ? (messageThreadsData as MessageThread[])
                        : []

                setUser(sessionUser)

                const unreadCount =
                    messageThreads.reduce(
                        (total, thread) =>
                            total +
                            Number(
                                thread.unread_count ||
                                    0
                            ),
                        0
                    )

                setUnreadMessages(unreadCount)
            } catch (error) {
                console.error(
                    "Failed to load dashboard data:",
                    error
                )

                if (mounted) {
                    setUser(null)
                    setUnreadMessages(0)
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        loadDashboardData()

        return () => {
            mounted = false
        }
    }, [])

    const userName = user?.name ?? "User"
    const userAvatar = user?.image_url ?? null

    const handleCollapsedChange = (
        nextCollapsed: boolean
    ) => {
        setCollapsed(nextCollapsed)

        window.localStorage.setItem(
            "customer-sidebar-collapsed",
            String(nextCollapsed)
        )
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface text-default">
                <p className="text-sm text-muted">
                    Loading dashboard...
                </p>
            </div>
        )
    }

    return (
        // Flex row, same as AdminLayout: sidebar in flow, content fills the rest
        <div className="flex min-h-screen bg-surface text-default">
            <Sidebar
                userName={userName}
                userTier="Member"
                userAvatar={userAvatar}
                unreadMessages={unreadMessages}
                collapsed={collapsed}
                onCollapsedChange={handleCollapsedChange}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <TopBar
                    userName={userName}
                    userAvatar={userAvatar}
                    onOpenSidebar={() =>
                        setMobileOpen(true)
                    }
                />

                <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}