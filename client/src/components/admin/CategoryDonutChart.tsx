export interface DonutSegment {
    label: string
    value: number
    color: string
}

interface CategoryDonutChartProps {
    segments: DonutSegment[]
    centerLabel?: string
}

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CategoryDonutChart({ segments, centerLabel }: CategoryDonutChartProps) {
    const total = segments.reduce((sum, s) => sum + s.value, 0)
    let cumulativePercent = 0

    return (
        <div className="flex items-center gap-6">
            <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90">
                <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="14" />
                {segments.map((segment) => {
                    const percent = total > 0 ? (segment.value / total) * 100 : 0
                    const dashLength = (percent / 100) * CIRCUMFERENCE
                    const dashOffset = -(cumulativePercent / 100) * CIRCUMFERENCE
                    cumulativePercent += percent

                    return (
                        <circle
                            key={segment.label}
                            cx="50"
                            cy="50"
                            r={RADIUS}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="14"
                            strokeDasharray={`${dashLength} ${CIRCUMFERENCE - dashLength}`}
                            strokeDashoffset={dashOffset}
                        />
                    )
                })}
                {centerLabel && (
                    <text
                        x="50"
                        y="50"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="rotate-90 fill-[var(--text)] text-[14px] font-bold"
                        style={{ transformOrigin: "50px 50px" }}
                    >
                        {centerLabel}
                    </text>
                )}
            </svg>

            <div className="space-y-2">
                {segments.map((segment) => {
                    const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0
                    return (
                        <div key={segment.label} className="flex items-center gap-2 text-xs">
                            <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: segment.color }}
                            />
                            <span className="text-default">{segment.label}</span>
                            <span className="text-muted">{percent}%</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}