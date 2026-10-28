export interface WishlistPreviewItem {
    id: string | number
    name: string
    image: string
    price: number
}

interface WishlistPreviewCardProps {
    item: WishlistPreviewItem
    onBook?: (id: WishlistPreviewItem["id"]) => void
}

export function WishlistPreviewCard({ item, onBook }: WishlistPreviewCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-default bg-card">
            <img src={item.image} alt={item.name} className="h-28 w-full object-cover" />
            <div className="flex items-center justify-between p-3">
                <div>
                    <p className="text-sm font-semibold text-default">{item.name}</p>
                    <p className="text-xs text-muted">
                        ${item.price}
                        <span className="text-[10px]"> /day</span>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onBook?.(item.id)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                    Book
                </button>
            </div>
        </div>
    )
}