import { Check } from "lucide-react"

interface CheckoutStepperProps {
    steps: string[]
    currentStep: number
}

export function CheckoutStepper({ steps, currentStep }: CheckoutStepperProps) {
    const progress = (currentStep / (steps.length - 1)) * 100

    return (
        <div className="border-b border-default bg-surface">
            <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
                <div className="relative flex justify-between">
                    {steps.map((label, index) => {
                        const isCompleted = index < currentStep
                        const isCurrent = index === currentStep

                        return (
                            <div key={label} className="flex items-center gap-2">
                                <span
                                    className={[
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                                        isCompleted || isCurrent
                                            ? "bg-primary text-white"
                                            : "bg-[var(--border)] text-muted",
                                    ].join(" ")}
                                >
                                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                                </span>
                                <span
                                    className={[
                                        "hidden text-sm font-medium sm:inline",
                                        isCurrent ? "text-default" : "text-muted",
                                    ].join(" ")}
                                >
                                    {label}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="relative mt-4 h-0.5 w-full bg-[var(--border)]">
                    <div
                        className="absolute left-0 top-0 h-0.5 bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    )
}