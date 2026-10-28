interface PriceRangeFilterProps {
    min: number
    max: number
    value: number
    onChange: (value: number) => void
}

export function PriceRangeFilter({ min, max, value, onChange }: PriceRangeFilterProps) {
    return (
        <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted">Price Range</h4>
            <input
                type="range"
                min={min}
                max={max}
                step={10}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mt-3 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted">
                <span>${min}</span>
                <span className="font-medium text-default">${value}/day</span>
                <span>${max}+</span>
            </div>
        </div>
    )
}