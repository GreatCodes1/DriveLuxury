import { useState } from "react"

export interface LineItem {
    label: string
    amount: number
}

interface BookingSummaryProps {
    vehicleName: string
    vehicleCategory: string
    vehicleImage: string
    pickupLocation: string
    pickupDateTime: string
    returnDateTime: string
    lineItems: LineItem[]
    promoCode: string
    onPromoCodeChange: (value: string) => void
    onApplyPromo: () => void
    total: number
    ctaLabel: string
    onCtaClick: () => void
    isSubmitting?: boolean
}

export function BookingSummary({
    vehicleName,
    vehicleCategory,
    vehicleImage,
    pickupLocation,
    pickupDateTime,
    returnDateTime,
    lineItems,
    promoCode,
    onPromoCodeChange,
    onApplyPromo,
    total,
    ctaLabel,
    onCtaClick,
    isSubmitting = false,
}: BookingSummaryProps) {
    const [showApplied, setShowApplied] = useState(false)

    const handleApply = () => {
        onApplyPromo()
        setShowApplied(true)
    }

    return (
        <div className="sticky top-24 space-y-4 rounded-xl border border-default bg-card p-5">
            <h3 className="text-sm font-semibold text-default">Booking Summary</h3>

            <div className="flex items-center gap-3 border-b border-default pb-4">
                <img
                    src={vehicleImage}
                    alt={vehicleName}
                    className="h-12 w-16 shrink-0 rounded-md object-cover"
                />
                <div>
                    <p className="text-sm font-semibold text-default">{vehicleName}</p>
                    <p className="text-xs text-muted">{vehicleCategory}</p>
                </div>
            </div>

            <div className="space-y-2 border-b border-default pb-4 text-xs">
                <div>
                    <p className="uppercase tracking-wide text-muted">Pick-up</p>
                    <p className="mt-0.5 text-default">
                        {pickupLocation} · {pickupDateTime}
                    </p>
                </div>
                <div>
                    <p className="uppercase tracking-wide text-muted">Return</p>
                    <p className="mt-0.5 text-default">
                        {pickupLocation} · {returnDateTime}
                    </p>
                </div>
            </div>

            <div className="space-y-1.5 border-b border-default pb-4 text-sm">
                {lineItems.map((item) => (
                    <div key={item.label} className="flex justify-between text-muted">
                        <span>{item.label}</span>
                        <span className="text-default">${item.amount}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                        onPromoCodeChange(e.target.value)
                        setShowApplied(false)
                    }}
                    placeholder="PROMOCODE"
                    className="w-full rounded-md border border-default bg-surface px-3 py-2 text-xs uppercase text-default placeholder:text-muted focus:outline-none focus:border-primary"
                />
                <button
                    type="button"
                    onClick={handleApply}
                    className="shrink-0 rounded-md border border-primary px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                >
                    Apply
                </button>
            </div>
            {showApplied && <p className="text-xs text-success">Promo code applied.</p>}

            <div className="flex items-center justify-between border-t border-default pt-4">
                <span className="text-sm font-semibold text-default">Total Due</span>
                <span className="text-lg font-bold text-default">${total}</span>
            </div>

            <button
                type="button"
                onClick={onCtaClick}
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isSubmitting ? "Please wait..." : ctaLabel}
            </button>
        </div>
    )
}