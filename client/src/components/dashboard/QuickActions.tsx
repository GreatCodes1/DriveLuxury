import { Car, CalendarClock, AlertTriangle, Download } from "lucide-react"
import { Link } from "react-router-dom"

const ACTIONS = [
    { label: "Book a New Car", icon: Car, href: "/fleet" },
    { label: "Extend Current Rental", icon: CalendarClock, href: "/dashboard/bookings" },
    { label: "Report an Issue", icon: AlertTriangle, href: "/dashboard/help" },
    { label: "Download Last Receipt", icon: Download, href: "/dashboard/bookings" },
]

export function QuickActions() {
    return (
        <div className="rounded-xl border border-default bg-card p-4">
            <h3 className="text-sm font-semibold text-default">Quick Actions</h3>
            <div className="mt-3 space-y-2">
                {ACTIONS.map((action) => (
                    <Link
                        key={action.label}
                        to={action.href}
                        className="flex items-center gap-3 rounded-md border border-default px-3 py-2.5 text-sm font-medium text-default transition-colors hover:border-primary"
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <action.icon className="h-3.5 w-3.5" />
                        </span>
                        {action.label}
                    </Link>
                ))}
            </div>
        </div>
    )
}