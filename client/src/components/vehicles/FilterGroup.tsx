interface FilterOption {
    label: string
    count?: number
}

interface FilterGroupProps {
    title: string
    options: FilterOption[]
    selected: string[]
    onChange: (label: string) => void
}

export function FilterGroup({ title, options, selected, onChange }: FilterGroupProps) {
    return (
        <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted">{title}</h4>
            <div className="mt-3 space-y-2.5">
                {options.map((option) => (
                    <label
                        key={option.label}
                        className="flex cursor-pointer items-center justify-between gap-2 text-sm"
                    >
                        <span className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={selected.includes(option.label)}
                                onChange={() => onChange(option.label)}
                                className="h-3.5 w-3.5 rounded border-default accent-primary"
                            />
                            <span className="text-default">{option.label}</span>
                        </span>
                        {option.count !== undefined && (
                            <span className="text-xs text-muted">{option.count}</span>
                        )}
                    </label>
                ))}
            </div>
        </div>
    )
}