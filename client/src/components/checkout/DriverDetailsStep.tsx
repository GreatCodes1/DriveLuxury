import type { ChangeEvent } from "react"
import { Toggle } from "../common/Toggle"

export interface DriverDetails {
    firstName: string
    lastName: string
    email: string
    phone: string
    licenseNumber: string
    dateOfBirth: string
    address: string
}

export interface AddOn {
    id: string
    label: string
    description: string
    pricePerDay: number
    enabled: boolean
}

interface DriverDetailsStepProps {
    details: DriverDetails
    onChange: (field: keyof DriverDetails, value: string) => void
    addOns: AddOn[]
    onToggleAddOn: (id: string) => void
}

function Field({
    label,
    field,
    value,
    onChange,
    type = "text",
}: {
    label: string
    field: keyof DriverDetails
    value: string
    onChange: (field: keyof DriverDetails, value: string) => void
    type?: string
}) {
    return (
        <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value)}
                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default placeholder:text-muted focus:outline-none focus:border-primary"
            />
        </div>
    )
}

export function DriverDetailsStep({ details, onChange, addOns, onToggleAddOn }: DriverDetailsStepProps) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-default bg-card p-6">
                <h2 className="text-lg font-semibold text-default">Driver Details</h2>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="First Name" field="firstName" value={details.firstName} onChange={onChange} />
                    <Field label="Last Name" field="lastName" value={details.lastName} onChange={onChange} />
                    <Field
                        label="Email Address"
                        field="email"
                        value={details.email}
                        onChange={onChange}
                        type="email"
                    />
                    <Field
                        label="Phone Number"
                        field="phone"
                        value={details.phone}
                        onChange={onChange}
                        type="tel"
                    />
                    <Field
                        label="Driver's License Number"
                        field="licenseNumber"
                        value={details.licenseNumber}
                        onChange={onChange}
                    />
                    <Field
                        label="Date of Birth"
                        field="dateOfBirth"
                        value={details.dateOfBirth}
                        onChange={onChange}
                        type="date"
                    />
                    <div className="sm:col-span-2">
                        <Field
                            label="Residential Address"
                            field="address"
                            value={details.address}
                            onChange={onChange}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-default bg-card p-6">
                <h2 className="text-lg font-semibold text-default">Enhance Your Journey</h2>

                <div className="mt-5 space-y-3">
                    {addOns.map((addOn) => (
                        <div
                            key={addOn.id}
                            className={[
                                "flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors",
                                addOn.enabled ? "border-primary bg-primary/5" : "border-default bg-surface",
                            ].join(" ")}
                        >
                            <div>
                                <p className="text-sm font-semibold text-default">{addOn.label}</p>
                                <p className="mt-0.5 text-xs text-muted">{addOn.description}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="text-xs font-medium text-muted">
                                    +${addOn.pricePerDay}/day
                                </span>
                                <Toggle
                                    checked={addOn.enabled}
                                    onChange={() => onToggleAddOn(addOn.id)}
                                    label={addOn.label}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}