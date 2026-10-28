import { CheckCircle2 } from "lucide-react"

interface FeatureListProps {
    features: string[]
}

export function FeatureList({ features }: FeatureListProps) {
    return (
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-default">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    {feature}
                </div>
            ))}
        </div>
    )
}