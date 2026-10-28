import { MapPin, Calendar } from "lucide-react"

interface VehicleStepProps {
    vehicleName: string
    vehicleCategory: string
    vehicleImage: string
    pickupLocation: string
    pickupDateTime: string
    returnDateTime: string
    days: number
}

export function VehicleStep({
    vehicleName,
    vehicleCategory,
    vehicleImage,
    pickupLocation,
    pickupDateTime,
    returnDateTime,
    days,
}: VehicleStepProps) {
    return (
        <div className="rounded-xl border border-default bg-card p-6">
            <h2 className="text-lg font-semibold text-default">Confirm Your Vehicle</h2>
            <p className="mt-1 text-sm text-muted">
                Review your selected vehicle and trip details before continuing.
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <img
                    src={vehicleImage}
                    alt={vehicleName}
                    className="h-40 w-full rounded-lg object-cover sm:w-56"
                />
                <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        {vehicleCategory}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-default">{vehicleName}</h3>

                    <div className="mt-4 space-y-3 text-sm">
                        <p className="flex items-center gap-2 text-default">
                            <MapPin className="h-4 w-4 shrink-0 text-primary" />
                            {pickupLocation}
                        </p>
                        <p className="flex items-center gap-2 text-default">
                            <Calendar className="h-4 w-4 shrink-0 text-primary" />
                            {pickupDateTime} → {returnDateTime}
                        </p>
                        <p className="text-muted">{days} day rental</p>
                    </div>
                </div>
            </div>
        </div>
    )
}