import { MapPin, Calendar, Car, SlidersHorizontal } from "lucide-react"

interface SearchSummaryBarProps {
    location: string
    dateRange: string
    category: string
    onModify?: () => void
}

export function SearchSummaryBar({ location, dateRange, category, onModify }: SearchSummaryBarProps) {
    return (
        <div className="border-b border-default bg-surface-alt">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <span className="flex items-center gap-1.5 text-default">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {location}
                    </span>
                    <span className="flex items-center gap-1.5 text-default">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {dateRange}
                    </span>
                    <span className="flex items-center gap-1.5 text-default">
                        <Car className="h-3.5 w-3.5 text-primary" />
                        {category}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onModify}
                    className="flex items-center justify-center gap-2 self-start rounded-md border border-default bg-card px-4 py-2 text-xs font-semibold text-default transition-colors hover:border-primary sm:self-auto"
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Modify Search
                </button>
            </div>
        </div>
    )
}