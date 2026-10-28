import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { Toggle } from "../common/Toggle"

export type AvailabilityStatus = "idle" | "checking" | "available" | "unavailable" | "error"

interface BookingSidebarProps {
    dailyRate: number
    pickupLocation: string
    pickupDate: string
    returnDate: string
    onPickupDateChange: (date: string) => void
    onReturnDateChange: (date: string) => void
    minDate: string
    days: number
    availabilityStatus: AvailabilityStatus
    liabilityCover: boolean
    onToggleLiabilityCover: (checked: boolean) => void
    liabilityCoverPricePerDay: number
    concierServiceFee: number
    onReserve: () => void
}

const AVAILABILITY_COPY: Record<AvailabilityStatus, { icon: typeof CheckCircle2 | null; text: string; tone: string } | null> = {
    idle: null,
    checking: { icon: Loader2, text: "Checking availability...", tone: "text-muted" },
    available: { icon: CheckCircle2, text: "Available for these dates", tone: "text-success" },
    unavailable: { icon: AlertTriangle, text: "Already booked for part of this range", tone: "text-error" },
    error: { icon: AlertTriangle, text: "Couldn't check availability right now", tone: "text-warning" },
}

export function BookingSidebar({
    dailyRate,
    pickupLocation,
    pickupDate,
    returnDate,
    onPickupDateChange,
    onReturnDateChange,
    minDate,
    days,
    availabilityStatus,
    liabilityCover,
    onToggleLiabilityCover,
    liabilityCoverPricePerDay,
    concierServiceFee,
    onReserve,
}: BookingSidebarProps) {
    const rentalTotal = dailyRate * days
    const insuranceTotal = liabilityCover ? liabilityCoverPricePerDay * days : 0
    const totalPrice = rentalTotal + insuranceTotal + concierServiceFee

    const availabilityCopy = AVAILABILITY_COPY[availabilityStatus]
    const canReserve = days > 0 && availabilityStatus !== "unavailable" && availabilityStatus !== "checking"

    return (
        <div className="sticky top-24 space-y-4 rounded-xl border border-default bg-card p-5">
            <div>
                <p className="text-[10px] uppercase tracking-wide text-muted">Daily Reservation Rate</p>
                <p className="text-2xl font-bold text-default">
                    ${dailyRate}
                    <span className="text-sm font-normal text-muted">/day</span>
                </p>
            </div>

            <div className="space-y-3 border-t border-default pt-4">
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted">Pickup Location</p>
                    <p className="mt-1 rounded-md border border-default bg-surface px-3 py-2 text-sm text-default">
                        {pickupLocation}
                    </p>
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-wide text-muted">Pickup Date</label>
                    <input
                        type="date"
                        min={minDate}
                        value={pickupDate}
                        onChange={(e) => onPickupDateChange(e.target.value)}
                        className="mt-1 w-full rounded-md border border-default bg-surface px-3 py-2 text-sm text-default focus:outline-none focus:border-primary"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-wide text-muted">Return Date</label>
                    <input
                        type="date"
                        min={pickupDate || minDate}
                        value={returnDate}
                        onChange={(e) => onReturnDateChange(e.target.value)}
                        className="mt-1 w-full rounded-md border border-default bg-surface px-3 py-2 text-sm text-default focus:outline-none focus:border-primary"
                    />
                </div>

                {availabilityCopy && (
                    <p className={["flex items-center gap-1.5 text-xs font-medium", availabilityCopy.tone].join(" ")}>
                        {availabilityCopy.icon && (
                            <availabilityCopy.icon
                                className={["h-3.5 w-3.5", availabilityStatus === "checking" ? "animate-spin" : ""].join(" ")}
                            />
                        )}
                        {availabilityCopy.text}
                    </p>
                )}
            </div>

            <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-default">Premium Liability Cover</p>
                        <p className="mt-0.5 text-xs text-muted">
                            Zero deductible, full coverage of at-fault protection.
                        </p>
                    </div>
                    <Toggle
                        checked={liabilityCover}
                        onChange={onToggleLiabilityCover}
                        label="Premium Liability Cover"
                    />
                </div>
                <p className="mt-1 text-xs font-medium text-primary">+${liabilityCoverPricePerDay}/day</p>
            </div>

            <div className="space-y-1.5 border-t border-default pt-4 text-sm">
                <div className="flex justify-between text-muted">
                    <span>Rental ({days} {days === 1 ? "Day" : "Days"})</span>
                    <span>${rentalTotal}</span>
                </div>
                <div className="flex justify-between text-muted">
                    <span>Insurance Add-on</span>
                    <span>${insuranceTotal}</span>
                </div>
                <div className="flex justify-between text-muted">
                    <span>Concierge Service Fee</span>
                    <span>${concierServiceFee}</span>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-default pt-4">
                <span className="text-sm font-semibold text-default">Total Price</span>
                <span className="text-lg font-bold text-default">${totalPrice}</span>
            </div>

            <button
                type="button"
                onClick={onReserve}
                disabled={!canReserve}
                className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
                Reserve Now
            </button>
        </div>
    )
}