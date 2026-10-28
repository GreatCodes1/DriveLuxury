export interface HistoryRow {
    id: string | number
    image: string
    name: string
    location: string
    total: number
    status: "Completed" | "Cancelled"
}

interface BookingHistoryTableProps {
    rows: HistoryRow[]
}

export function BookingHistoryTable({ rows }: BookingHistoryTableProps) {
    return (
        <div className="overflow-x-auto rounded-xl border border-default bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                    <tr className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                        <th className="px-4 py-3 font-medium">Car</th>
                        <th className="px-4 py-3 font-medium">Location</th>
                        <th className="px-4 py-3 font-medium">Total</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-b border-default last:border-0">
                            <td className="flex items-center gap-3 px-4 py-3">
                                <img src={row.image} alt={row.name} className="h-9 w-12 rounded-md object-cover" />
                                <span className="font-medium text-default">{row.name}</span>
                            </td>
                            <td className="px-4 py-3 text-muted">{row.location}</td>
                            <td className="px-4 py-3 font-semibold text-default">${row.total}</td>
                            <td className="px-4 py-3">
                                <span
                                    className={[
                                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                                        row.status === "Completed"
                                            ? "bg-success/10 text-success"
                                            : "bg-error/10 text-error",
                                    ].join(" ")}
                                >
                                    {row.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}