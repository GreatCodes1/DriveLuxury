import { useEffect, useRef, useState } from "react"
import {
    NavLink,
    Link,
    useNavigate,
} from "react-router-dom"
import {
    Menu,
    X,
    Zap,
    Search,
    Heart,
    LayoutDashboard,
    LogOut,
} from "lucide-react"
import gsap from "gsap"
import { ThemeToggle } from "./ToggleTheme"
import { useAuth } from "../context/Authcontext"
import { SearchOverlay } from "./dashboard/SearchOverlay"
import { useTheme } from "../context/ThemeContext"

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Cars", href: "/fleet" },
    { label: "Locations", href: "/locations" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
]

const SCROLL_THRESHOLD = 64

function navLinkClass({
    isActive,
}: {
    isActive: boolean
}) {
    return [
        "rounded-lg px-4 py-1 text-sm font-medium transition-colors",
        isActive
            ? "bg-primary text-white"
            : "text-muted hover:text-default",
    ].join(" ")
}

function mobileNavLinkClass({
    isActive,
}: {
    isActive: boolean
}) {
    return [
        "flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors",
        isActive
            ? "bg-primary text-white"
            : "text-muted hover:bg-surface-alt hover:text-default",
    ].join(" ")
}

export function Navbar() {
    const {theme} = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] =
        useState(false)

    const [scrolled, setScrolled] = useState(
        () =>
            typeof window !== "undefined" &&
            window.scrollY >= SCROLL_THRESHOLD
    )

    const bgRef = useRef<HTMLDivElement>(null)

    const { user, logout } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const onScroll = () => {
            setScrolled(
                window.scrollY >= SCROLL_THRESHOLD
            )
        }

        onScroll()

        window.addEventListener(
            "scroll",
            onScroll,
            { passive: true }
        )

        return () => {
            window.removeEventListener(
                "scroll",
                onScroll
            )
        }
    }, [])

    useEffect(() => {
        const navbarBackground = bgRef.current

        if (!navbarBackground) return

        const shouldShowBackground =
            scrolled || isOpen

        const reduceMotion =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches

        const animation = gsap.to(
            navbarBackground,
            {
                opacity: shouldShowBackground
                    ? 1
                    : 0,
                duration: reduceMotion ? 0 : 0.35,
                ease: "power2.out",
                overwrite: "auto",
            }
        )

        return () => {
            animation.kill()
        }
    }, [scrolled, isOpen])

    useEffect(() => {
        const handleEscape = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                setIsOpen(false)
                setIsSearchOpen(false)
            }
        }

        document.addEventListener(
            "keydown",
            handleEscape
        )

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            )
        }
    }, [])

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsOpen(false)
            }
        }

        window.addEventListener(
            "resize",
            handleResize
        )

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            )
        }
    }, [])

    useEffect(() => {
        if (!isOpen) {
            document.body.style.overflow = ""
            return
        }

        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    const closeMobileMenu = () => {
        setIsOpen(false)
    }

    const openSearch = () => {
        setIsOpen(false)
        setIsSearchOpen(true)
    }

    const handleSignOut = async () => {
        try {
            await logout()
            setIsOpen(false)
            navigate("/login")
        } catch (error) {
            console.error(
                "Failed to sign out:",
                error
            )
        }
    }

    const accountHref =
        user?.role === "admin"
            ? "/admin"
            : "/dashboard"

    return (
        <header className="fixed inset-x-0 top-0 z-50 py-2">
            <div
                ref={bgRef}
                aria-hidden="true"
                style={{
                    opacity:
                        scrolled || isOpen ? 1 : 0,
                }}
                className="pointer-events-none absolute inset-0 -z-10 border-b border-default bg-surface"
            />

            {/* Main navbar */}
            <div className="relative">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <Link
                        to="/"
                        onClick={closeMobileMenu}
                        className="flex shrink-0 items-center gap-2"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
                            <Zap
                                className="h-4 w-4"
                                fill="currentColor"
                                strokeWidth={0}
                            />
                        </span>

                        <span className="text-lg font-bold tracking-tight text-default">
                            DRIVE
                            <span className="text-primary">
                                luxury
                            </span>
                        </span>
                    </Link>

                    {/* Desktop navigation */}
                    <nav className="hidden items-center gap-1 rounded-2xl border border-default p-3 md:flex">
                        {NAV_LINKS.map((link) => (
                            <NavLink
                                key={link.href}
                                to={link.href}
                                className={navLinkClass}
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Desktop actions */}
                    <div className="hidden items-center gap-4 md:flex">
                        <button
                            type="button"
                            onClick={openSearch}
                            aria-label="Search available cars"
                            className="text-muted transition-colors hover:text-default"
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        <Link
                            to="/wishlist"
                            aria-label="View wishlist"
                            className="text-muted transition-colors hover:text-default"
                        >
                            <Heart className="h-4 w-4" />
                        </Link>

                        <ThemeToggle />

                        <span className="h-5 w-px bg-[var(--border)]" />

                        {user ? (
                            <>
                                <Link
                                    to={accountHref}
                                    className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-default"
                                >
                                    <LayoutDashboard className="h-4 w-4" />

                                    {user.role === "admin"
                                        ? "Admin"
                                        : "Dashboard"}
                                </Link>

                                <button
                                    type="button"
                                    onClick={
                                        handleSignOut
                                    }
                                    aria-label="Sign out"
                                    className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-default"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-muted transition-colors hover:text-default"
                                    style={{
                                        color: theme === "Dark" ? "primary": "black"
                                    }}
                                >
                                    Sign In
                                </Link>

                                <Link
                                    to="/signup"
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile actions */}
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            type="button"
                            onClick={openSearch}
                            aria-label="Search available cars"
                            className="flex h-9 w-9 items-center justify-center rounded-md text-default transition-colors hover:bg-surface-alt"
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        <Link
                            to="/wishlist"
                            aria-label="View wishlist"
                            onClick={closeMobileMenu}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-default transition-colors hover:bg-surface-alt"
                        >
                            <Heart className="h-4 w-4" />
                        </Link>

                        <ThemeToggle />

                        <button
                            type="button"
                            onClick={() =>
                                setIsOpen(
                                    (current) => !current
                                )
                            }
                            aria-label={
                                isOpen
                                    ? "Close menu"
                                    : "Open menu"
                            }
                            aria-expanded={isOpen}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-default transition-colors hover:bg-surface-alt"
                        >
                            {isOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Search overlay */}
                {isSearchOpen && (
                    <SearchOverlay
                        onClose={() =>
                            setIsSearchOpen(false)
                        }
                    />
                )}
            </div>

            {/* Mobile backdrop */}
            <div
                aria-hidden="true"
                onClick={closeMobileMenu}
                className={[
                    "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden",
                    isOpen
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0",
                ].join(" ")}
            />

            {/* Mobile sidebar */}
            <aside
                id="mobile-navigation"
                aria-label="Mobile navigation"
                className={[
                    "fixed right-0 top-0 z-50 flex h-dvh w-[82%] max-w-sm flex-col border-l border-default bg-surface shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
                    isOpen
                        ? "translate-x-0"
                        : "translate-x-full",
                ].join(" ")}
            >
                {/* Sidebar header */}
                <div className="flex h-20 shrink-0 items-center justify-between border-b border-default px-5">
                    <Link
                        to="/"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
                            <Zap
                                className="h-4 w-4"
                                fill="currentColor"
                                strokeWidth={0}
                            />
                        </span>

                        <span className="text-lg font-bold tracking-tight text-default">
                            DRIVE
                            <span className="text-primary">
                                luxury
                            </span>
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={closeMobileMenu}
                        aria-label="Close mobile navigation"
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-default transition-colors hover:bg-surface-alt"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Sidebar content */}
                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
                    <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                        Navigation
                    </p>

                    <nav className="flex flex-col gap-1">
                        {NAV_LINKS.map((link) => (
                            <NavLink
                                key={link.href}
                                to={link.href}
                                onClick={closeMobileMenu}
                                className={mobileNavLinkClass}
                            >
                                {link.label}
                            </NavLink>
                        ))}

                        <button
                            type="button"
                            onClick={openSearch}
                            className="flex items-center rounded-lg px-4 py-3 text-left text-base font-medium text-muted transition-colors hover:bg-surface-alt hover:text-default"
                        >
                            Search Cars
                        </button>
                    </nav>

                    <div className="my-6 border-t border-default" />

                    <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                        Account
                    </p>

                    <div className="flex flex-col gap-1">
                        <Link
                            to="/wishlist"
                            onClick={closeMobileMenu}
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-muted transition-colors hover:bg-surface-alt hover:text-default"
                        >
                            <Heart className="h-5 w-5" />
                            Wishlist
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to={accountHref}
                                    onClick={closeMobileMenu}
                                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-muted transition-colors hover:bg-surface-alt hover:text-default"
                                >
                                    <LayoutDashboard className="h-5 w-5" />

                                    {user.role === "admin"
                                        ? "Admin Dashboard"
                                        : "My Dashboard"}
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleSignOut()
                                    }}
                                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-medium text-muted transition-colors hover:bg-surface-alt hover:text-default"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={closeMobileMenu}
                                    className="mt-2 rounded-lg border border-default px-4 py-3 text-center text-sm font-semibold text-default transition-colors hover:bg-surface-alt"
                                >
                                    Sign In
                                </Link>

                                <Link
                                    to="/signup"
                                    onClick={closeMobileMenu}
                                    className="rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar footer */}
                <div className="shrink-0 border-t border-default px-5 py-5">
                    <p className="text-xs leading-relaxed text-muted">
                        Premium vehicles for every journey.
                    </p>
                </div>
            </aside>
        </header>
    )
}