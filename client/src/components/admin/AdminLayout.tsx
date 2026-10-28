import {
    useEffect,
    useState,
    type ReactNode,
} from "react"
import { Menu, Zap } from "lucide-react"
import { AdminSidebar } from "./AdminSidebar"
import { apiFetch } from "../../lib/api"

interface AdminLayoutProps {
    children: ReactNode
}

interface AdminSessionUser {
    id: number
    name: string
    email: string
    role: "admin" | "customer"
    image_url: string | null
}

export function AdminLayout({
    children,
}: AdminLayoutProps) {
    const [admin, setAdmin] =
        useState<AdminSessionUser | null>(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        let mounted = true

        const loadAdminSession = async () => {
            try {
                setLoading(true)
                setError(null)

                const sessionUser =
                    await apiFetch<AdminSessionUser>(
                        "/session"
                    )

                if (!mounted) return

                if (sessionUser.role !== "admin") {
                    throw new Error(
                        "You are not authorized to access the admin area."
                    )
                }

                setAdmin(sessionUser)
            } catch (err) {
                if (!mounted) return

                setError(
                    err instanceof Error
                        ? err.message
                        : "Couldn't load the admin session."
                )
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        loadAdminSession()

        return () => {
            mounted = false
        }
    }, [])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface text-default">
                <p className="text-sm text-muted">
                    Loading admin dashboard...
                </p>
            </div>
        )
    }

    if (error || !admin) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-default">
                <div className="max-w-md text-center">
                    <p className="text-sm font-medium text-error">
                        {error ??
                            "Admin session not found."}
                    </p>

                    <p className="mt-2 text-sm text-muted">
                        Please sign in again to continue.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-surface text-default">
            <AdminSidebar
                adminName={admin.name}
                adminAvatar={admin.image_url}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                {/* Mobile top bar: logo + hamburger (hidden on md+) */}
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-default bg-card px-4 md:hidden">
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
                            <Zap
                                className="h-4 w-4"
                                fill="currentColor"
                                strokeWidth={0}
                            />
                        </span>

                        <span className="text-base font-bold tracking-tight text-default">
                            DRIVE
                            <span className="text-primary">
                                luxury
                            </span>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open sidebar"
                        className="flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-default"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </header>

                <main className="min-w-0 flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}