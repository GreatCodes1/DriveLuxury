interface RevenueBarChartProps {
    data: { label: string; value: number }[]
    height?: number
}

export function RevenueBarChart({ data, height = 140 }: RevenueBarChartProps) {
    const max = Math.max(...data.map((d) => d.value))
    const barWidth = 100 / data.length

    return (
        <div>
            <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-36 w-full overflow-visible">
                {data.map((d, i) => {
                    const barHeight = (d.value / max) * (height - 10)
                    const x = i * barWidth + barWidth * 0.2
                    const width = barWidth * 0.6
                    const y = height - barHeight

                    return (
                        <rect
                            key={d.label}
                            x={x}
                            y={y}
                            width={width}
                            height={barHeight}
                            rx={1.5}
                            className="fill-primary"
                        />
                    )
                })}
            </svg>
            <div className="mt-2 flex justify-between text-[10px] text-muted">
                {data.map((d) => (
                    <span key={d.label}>{d.label}</span>
                ))}
            </div>
        </div>
    )
}