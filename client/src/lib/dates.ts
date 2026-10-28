// Bookings store DATE values (no time, no timezone) and the API returns them
// as plain "YYYY-MM-DD" strings. Passing that to `new Date("2026-09-21")`
// parses it as UTC midnight, which then displays as the *previous day* for
// anyone in a timezone behind UTC. Building the Date from its parts keeps it
// local, so the day never shifts.
function parseDateOnly(value: string): Date {
    const [datePart] = value.split("T")
    const [year, month, day] = datePart.split("-").map(Number)
    return new Date(year, month - 1, day)
}

export function formatDateOnly(value: string, style: "short" | "long" = "short"): string {
    const date = parseDateOnly(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("en-US", {
        month: style === "long" ? "long" : "short",
        day: "numeric",
        year: "numeric",
    })
}

export function formatDateRange(start: string, end: string): string {
    return `${formatDateOnly(start)} – ${formatDateOnly(end)}`
}

// Whole days from today (local midnight) until the given date. Negative if past.
export function daysUntilDate(value: string): number {
    const target = parseDateOnly(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// "today", "tomorrow", "in 5 days" — reads naturally after "Starts".
export function startsInLabel(value: string): string {
    const days = daysUntilDate(value)
    if (days <= 0) return "today"
    if (days === 1) return "tomorrow"
    return `in ${days} days`
}