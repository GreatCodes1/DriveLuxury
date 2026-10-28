import { Heart, Star } from "lucide-react"

export interface Vehicle {
    id: string | number
    name: string
    category: string
    image: string
    rating: number
    specs: string[]
    price: number
    badge?: { label: string; tone?: "primary" | "neutral" }
    ctaLabel?: string
}

interface VehicleCardProps {
    vehicle: Vehicle
    isWishlisted?: boolean
    onToggleWishlist?: (id: Vehicle["id"]) => void
    onBook?: (id: Vehicle["id"]) => void
}

export function VehicleCard({
    vehicle,
    isWishlisted = false,
    onToggleWishlist,
    onBook,
}: VehicleCardProps) {
    const { id, name, category, image, rating, specs, price, badge, ctaLabel = "Book Now" } = vehicle

    return (
        <div className="group overflow-hidden rounded-xl border border-default bg-card transition-shadow hover:shadow-lg">
            <div className="relative">
                <img src={image} alt={name} className="h-36 w-full object-cover" />

                {badge && (
                    <span
                        className={[
                            "absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-semibold uppercase",
                            badge.tone === "neutral"
                                ? "bg-black/60 text-white backdrop-blur"
                                : "bg-primary text-white",
                        ].join(" ")}
                    >
                        {badge.label}
                    </span>
                )}

                <button
                    type="button"
                    onClick={() => onToggleWishlist?.(id)}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    aria-pressed={isWishlisted}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-primary"
                >
                    <Heart className="h-3.5 w-3.5" fill={isWishlisted ? "currentColor" : "none"} />
                </button>
            </div>

            <div className="p-3.5">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{category}</p>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-default">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        {rating.toFixed(1)}
                    </span>
                </div>

                <h3 className="mt-1 truncate text-sm font-semibold text-default">{name}</h3>

                <p className="mt-2 truncate text-[11px] text-muted">{specs.join(" · ")}</p>

                <div className="mt-3 flex items-center justify-between border-t border-default pt-3">
                    <div>
                        <p className="text-[9px] uppercase tracking-wide text-muted">Daily Rate</p>
                        <p className="text-base font-bold text-default">
                            ${price}
                            <span className="text-xs font-normal text-muted">/day</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onBook?.(id)}
                        className="whitespace-nowrap rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                        {ctaLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}