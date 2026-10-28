import type { InputHTMLAttributes } from "react"
import type { LucideIcon } from "lucide-react"

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    icon: LucideIcon
    label: string
}

export function FormField({ icon: Icon, label, id, ...inputProps }: FormFieldProps) {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-")

    return (
        <div>
            <label
                htmlFor={inputId}
                className="text-[10px] font-semibold uppercase tracking-wide text-muted"
            >
                {label}
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-md border border-default bg-surface px-3 py-2.5 transition-colors focus-within:border-primary">
                <Icon className="h-4 w-4 shrink-0 text-muted" />
                <input
                    id={inputId}
                    className="w-full bg-transparent text-sm text-default placeholder:text-muted focus:outline-none"
                    {...inputProps}
                />
            </div>
        </div>
    )
}