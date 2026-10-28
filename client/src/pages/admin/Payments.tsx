import { useEffect, useState } from "react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { useAuth } from "../../context/Authcontext"
import { apiFetch } from "../../lib/api"

interface Transaction {
    id: number
    bookingid: number
    userid: number
    username: string
    vehiclename: string
    amount: number
    payment_method: string
    status: "paid" | "refunded" | "failed"
    transactiondate: string
}

const STATUS_STYLES: Record<Transaction["status"], string> = {
    paid: "bg-success/10 text-success",
    refunded: "bg-warning/10 text-warning",
    failed: "bg-error/10 text-error",
}

export default function AdminPayments() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        apiFetch<Transaction[]>("/admin/transactions")
            .then((data) => setTransactions(data))
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load transactions."))
            .finally(() => setLoading(false))
    }, [])

    const totalRevenue = transactions
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + Number(t.amount), 0)

    return (
        <AdminLayout>
            <AdminTopBar
                title="Payments"
                subtitle="All transactions processed through Paystack."
                dateRangeLabel="Jun 01 - Jun 30, 2026"
                adminName={user?.name ?? "Admin"}
                adminAvatar="https://i.pravatar.cc/100?img=47"
            />

            <div className="p-6">
                <div className="rounded-xl border border-default bg-card p-5">
                    <p className="text-[10px] uppercase tracking-wide text-muted">Total Processed</p>
                    <p className="mt-1 text-2xl font-bold text-default">${totalRevenue.toLocaleString()}</p>
                </div>

                {loading && <p className="mt-4 text-sm text-muted">Loading transactions...</p>}
                {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

                {!loading && !error && (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-default bg-card">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                                    <th className="px-4 py-3 font-medium">Booking</th>
                                    <th className="px-4 py-3 font-medium">Customer</th>
                                    <th className="px-4 py-3 font-medium">Amount</th>
                                    <th className="px-4 py-3 font-medium">Method</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t) => (
                                    <tr key={t.id} className="border-b border-default last:border-0">
                                        <td className="px-4 py-3 font-medium text-default">
                                            #{t.bookingid} · {t.vehiclename}
                                        </td>
                                        <td className="px-4 py-3 text-muted">{t.username}</td>
                                        <td className="px-4 py-3 font-semibold text-default">
                                            ${Number(t.amount).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-muted capitalize">{t.payment_method}</td>
                                        <td className="px-4 py-3 text-muted">
                                            {new Date(t.transactiondate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={[
                                                    "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                                                    STATUS_STYLES[t.status],
                                                ].join(" ")}
                                            >
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted">
                                            No transactions yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}