import type { LucideIcon } from "lucide-react"

interface StatCardProps {
    icon: LucideIcon
    value: string
    label: string
    trend?: string
}

export function StatCard({ icon: Icon, value, label, trend }: StatCardProps) {
    return (
        <div className="rounded-xl border border-default bg-card p-4">
            <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                </span>
                {trend && <span className="text-xs font-medium text-success">{trend}</span>}
            </div>
            <p className="mt-3 text-2xl font-bold text-default">{value}</p>
            <p className="text-xs text-muted">{label}</p>
        </div>
    )
}