import { useEffect } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
    LayoutDashboard,
    CalendarCheck,
    User,
    Settings,
    CreditCard,
    HelpCircle,
    LogOut,
    Zap,
    UserRound,
    PanelLeftClose,
    PanelLeftOpen,
    Heart,
    X,
} from "lucide-react"
import { apiFetch } from "../../lib/api"

interface SidebarProps {
    userName: string
    userTier: string
    userAvatar?: string | null
    unreadMessages?: number
    collapsed: boolean
    onCollapsedChange: (collapsed: boolean) => void
    mobileOpen: boolean
    onCloseMobile: () => void
}

type SidebarIcon = typeof LayoutDashboard

type SidebarLinkProps = {
    to: string
    label: string
    icon: SidebarIcon
    collapsed: boolean
    end?: boolean
    badge?: number
    onNavigate?: () => void
}

const EASE = "ease-[cubic-bezier(0.4,0,0.2,1)]"

// Collapsed styles only apply from md up, so the mobile drawer
// always shows full labels.
const labelCollapse = (collapsed: boolean, expandedMax: string) =>
    collapsed
        ? "md:max-w-0 md:-translate-x-2 md:opacity-0"
        : `${expandedMax} md:translate-x-0 md:opacity-100`

export function Sidebar({
    userName,
    userTier,
    userAvatar = null,
    collapsed,
    onCollapsedChange,
    mobileOpen,
    onCloseMobile,
}: SidebarProps) {
    const navigate = useNavigate()

    // Close on Escape + lock body scroll while the mobile drawer is open
    useEffect(() => {
        if (!mobileOpen) return

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onCloseMobile()
            }
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        document.addEventListener("keydown", handleEscape)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener("keydown", handleEscape)
        }
    }, [mobileOpen, onCloseMobile])

    const toggleCollapsed = () => {
        onCollapsedChange(!collapsed)
    }

    const handleSignOut = async () => {
        try {
            await apiFetch("/logout", {
                method: "POST",
            })
        } catch (error) {
            console.error("Logout error:", error)
        } finally {
            onCloseMobile()
            navigate("/login")
        }
    }

    return (
        <>
            {/* Mobile overlay */}
            <div
                onClick={onCloseMobile}
                aria-hidden="true"
                className={[
                    "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
                    mobileOpen
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0",
                ].join(" ")}
            />

            <aside
                className={[
                    // Mobile: off-canvas drawer with a solid background
                    "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col justify-between overflow-y-auto border-r border-default bg-surface-alt",
                    `transition-[transform,width] duration-300 ${EASE}`,
                    mobileOpen
                        ? "translate-x-0"
                        : "-translate-x-full",
                    // Desktop: in-flow sticky sidebar (parent must be a flex row)
                    "md:sticky md:top-0 md:inset-auto md:z-auto md:h-screen md:max-w-none md:translate-x-0 md:overflow-visible md:duration-500",
                    collapsed ? "md:w-[76px]" : "md:w-64",
                ].join(" ")}
            >
                <div className="min-w-0">
                    <div
                        className={[
                            "flex h-16 items-center justify-between gap-2 overflow-hidden border-b border-default px-4",
                            `transition-[padding,gap] duration-500 ${EASE}`,
                            collapsed
                                ? "md:justify-center md:px-3"
                                : "md:justify-start md:px-5",
                        ].join(" ")}
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-white">
                                <Zap
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    strokeWidth={0}
                                />
                            </span>

                            <span
                                className={[
                                    "min-w-0 overflow-hidden whitespace-nowrap text-lg font-bold tracking-tight text-default",
                                    `transition-[max-width,opacity,transform] duration-500 ${EASE}`,
                                    labelCollapse(collapsed, "md:max-w-[160px]"),
                                ].join(" ")}
                            >
                                DRIVE
                                <span className="text-primary">
                                    luxury
                                </span>
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={onCloseMobile}
                            aria-label="Close sidebar"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-default md:hidden"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="space-y-1 px-3 py-4">
                        <SidebarLink
                            to="/dashboard"
                            label="Dashboard"
                            icon={LayoutDashboard}
                            collapsed={collapsed}
                            end
                            onNavigate={onCloseMobile}
                        />

                        <SidebarLink
                            to="/dashboard/bookings"
                            label="My Bookings"
                            icon={CalendarCheck}
                            collapsed={collapsed}
                            onNavigate={onCloseMobile}
                        />

                        <SidebarLink
                            to="/dashboard/wishlist"
                            label="Wishlist"
                            icon={Heart}
                            collapsed={collapsed}
                            end
                            onNavigate={onCloseMobile}
                        />

                        {/* <SidebarLink
                            to="/dashboard/messages"
                            label="Messages"
                            icon={Inbox}
                            collapsed={collapsed}
                            badge={unreadMessages}
                            onNavigate={onCloseMobile}
                        /> */}

                        <SidebarLink
                            to="/dashboard/profile"
                            label="Profile"
                            icon={User}
                            collapsed={collapsed}
                            onNavigate={onCloseMobile}
                        />

                        <SidebarLink
                            to="/dashboard/settings"
                            label="Settings"
                            icon={Settings}
                            collapsed={collapsed}
                            onNavigate={onCloseMobile}
                        />

                        <SidebarLink
                            to="/dashboard/payment-methods"
                            label="Payment Methods"
                            icon={CreditCard}
                            collapsed={collapsed}
                            onNavigate={onCloseMobile}
                        />
                    </nav>
                </div>

                <div className="min-w-0 space-y-1 overflow-hidden border-t border-default px-3 py-4">
                    <SidebarLink
                        to="/dashboard/help"
                        label="Help & Support"
                        icon={HelpCircle}
                        collapsed={collapsed}
                        onNavigate={onCloseMobile}
                    />

                    <button
                        type="button"
                        onClick={handleSignOut}
                        title={collapsed ? "Sign Out" : undefined}
                        className={[
                            "flex w-full items-center rounded-md py-2.5 text-sm font-medium text-muted",
                            `transition-[gap,padding,background-color,color] duration-500 ${EASE} hover:bg-surface hover:text-default`,
                            collapsed
                                ? "gap-3 px-3 md:justify-center"
                                : "gap-3 px-3",
                        ].join(" ")}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />

                        <span
                            className={[
                                "overflow-hidden whitespace-nowrap",
                                `transition-[max-width,opacity,transform] duration-500 ${EASE}`,
                                labelCollapse(collapsed, "md:max-w-[140px]"),
                            ].join(" ")}
                        >
                            Sign Out
                        </span>
                    </button>

                    <div
                        className={[
                            "mt-3 flex items-center gap-3 overflow-hidden border-t border-default px-1 pt-4",
                            `transition-[gap,padding] duration-500 ${EASE}`,
                            collapsed ? "md:justify-center" : "",
                        ].join(" ")}
                    >
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt={userName || "User"}
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

                        <div
                            className={[
                                "min-w-0 overflow-hidden whitespace-nowrap",
                                `transition-[max-width,opacity,transform] duration-500 ${EASE}`,
                                labelCollapse(collapsed, "md:max-w-[150px]"),
                            ].join(" ")}
                        >
                            <p className="truncate text-sm font-semibold text-default">
                                {userName || "User"}
                            </p>

                            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                                {userTier || "Member"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Desktop collapse button (hidden on mobile) */}
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={
                        collapsed ? "Expand sidebar" : "Collapse sidebar"
                    }
                    title={
                        collapsed ? "Expand sidebar" : "Collapse sidebar"
                    }
                    className="absolute -right-5 top-6 z-20 hidden h-10 w-10 items-center justify-center rounded-full border border-default bg-card text-default shadow-md transition-[transform,color,border-color] duration-200 hover:scale-105 hover:border-primary hover:text-primary md:flex"
                >
                    {collapsed ? (
                        <PanelLeftOpen className="h-5 w-5" strokeWidth={2.25} />
                    ) : (
                        <PanelLeftClose className="h-5 w-5" strokeWidth={2.25} />
                    )}
                </button>
            </aside>
        </>
    )
}

function SidebarLink({
    to,
    label,
    icon: Icon,
    collapsed,
    end = false,
    badge = 0,
    onNavigate,
}: SidebarLinkProps) {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
                [
                    "flex h-10 items-center rounded-md text-sm font-medium",
                    `transition-[gap,padding,background-color,color] duration-500 ${EASE}`,
                    collapsed
                        ? "gap-3 px-3 md:justify-center"
                        : "gap-3 px-3",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-surface hover:text-default",
                ].join(" ")
            }
        >
            <Icon className="h-4 w-4 shrink-0" />

            <span
                className={[
                    "min-w-0 flex-1 overflow-hidden whitespace-nowrap",
                    `transition-[max-width,opacity,transform] duration-500 ${EASE}`,
                    labelCollapse(collapsed, "md:max-w-[160px]"),
                ].join(" ")}
            >
                {label}
            </span>

            {badge > 0 && (
                <span
                    className={[
                        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white",
                        collapsed ? "md:hidden" : "",
                    ].join(" ")}
                >
                    {badge}
                </span>
            )}
        </NavLink>
    )
}