import { Link } from "react-router-dom"

export interface FleetUnit {
    id: string | number
    name: string
    image: string
    dailyRate: number
    utilization: number
    badge?: string
}

interface FleetUnitCardProps {
    unit: FleetUnit
}

export function FleetUnitCard({ unit }: FleetUnitCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-default bg-card">
            <div className="relative">
                <img src={unit.image} alt={unit.name} className="h-32 w-full object-cover" />
                {unit.badge && (
                    <span className="absolute left-3 top-3 rounded-md bg-success px-2 py-1 text-[10px] font-semibold uppercase text-white">
                        {unit.badge}
                    </span>
                )}
            </div>
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-default">{unit.name}</h3>
                    <span className="text-xs font-semibold text-primary">{unit.utilization}%</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted">
                    <span>${unit.dailyRate}/day</span>
                    <span>Utilization</span>
                </div>
                <Link
                    to={`/admin/vehicles/${unit.id}`}
                    className="mt-3 block w-full rounded-md border border-default py-2 text-center text-xs font-semibold text-default transition-colors hover:border-primary hover:text-primary"
                >
                    Manage Unit
                </Link>
            </div>
        </div>
    )
}