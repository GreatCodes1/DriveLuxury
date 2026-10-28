export interface Spec {
    label: string
    value: string
}

interface SpecGridProps {
    specs: Spec[]
}

export function SpecGrid({ specs }: SpecGridProps) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specs.map((spec) => (
                <div key={spec.label} className="rounded-lg border border-default bg-card p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted">{spec.label}</p>
                    <p className="mt-1 text-sm font-semibold text-default">{spec.value}</p>
                </div>
            ))}
        </div>
    )
}