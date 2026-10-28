import { useEffect, useState } from "react"
import { Search, X } from "lucide-react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { useAuth } from "../../context/Authcontext"
import { apiFetch } from "../../lib/api"

interface Customer {
    id: number
    name: string
    email: string
    phone: string | null
    role: string
    createdat: string
}

interface CustomerDetail extends Customer {
    totalSpent: number
    bookings: {
        id: number
        vehiclename: string
        img_url: string
        startdate: string
        enddate: string
        totalprice: number
        status: string
    }[]
}

export default function AdminCustomers() {
    const { user } = useAuth()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [query, setQuery] = useState("")

    const [selected, setSelected] = useState<CustomerDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    useEffect(() => {
        apiFetch<Customer[]>("/admin/users")
            .then((data) => setCustomers(data))
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load customers."))
            .finally(() => setLoading(false))
    }, [])

    const filtered = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase()),
    )

    const openCustomer = async (id: number) => {
        setDetailLoading(true)
        try {
            const data: CustomerDetail = await apiFetch(`/admin/customers/${id}`)
            setSelected(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't load this customer.")
        } finally {
            setDetailLoading(false)
        }
    }

    return (
        <AdminLayout>
            <AdminTopBar
                title="Customers"
                subtitle="Everyone with a DRIVEluxury account."
                dateRangeLabel="Jun 01 - Jun 30, 2026"
                adminName={user?.name ?? "Admin"}
                adminAvatar="https://i.pravatar.cc/100?img=47"
            />

            <div className="p-6">
                <div className="flex items-center gap-2 rounded-md border border-default bg-card px-3 py-2.5 sm:w-80">
                    <Search className="h-4 w-4 text-muted" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full bg-transparent text-sm text-default placeholder:text-muted focus:outline-none"
                    />
                </div>

                {loading && <p className="mt-4 text-sm text-muted">Loading customers...</p>}
                {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

                {!loading && (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-default bg-card">
                        <table className="w-full min-w-[560px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => openCustomer(c.id)}
                                        className="cursor-pointer border-b border-default last:border-0 hover:bg-surface-alt"
                                    >
                                        <td className="px-4 py-3 font-medium text-default">{c.name}</td>
                                        <td className="px-4 py-3 text-muted">{c.email}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={[
                                                    "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                                                    c.role === "admin"
                                                        ? "bg-primary/10 text-primary"
                                                        : "bg-[var(--border)] text-muted",
                                                ].join(" ")}
                                            >
                                                {c.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted">
                                            No customers match "{query}".
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Customer detail drawer */}
            {(selected || detailLoading) && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelected(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-default">Customer Details</h2>
                            <button type="button" onClick={() => setSelected(null)} aria-label="Close">
                                <X className="h-5 w-5 text-muted" />
                            </button>
                        </div>

                        {detailLoading && <p className="mt-4 text-sm text-muted">Loading...</p>}

                        {selected && !detailLoading && (
                            <div className="mt-4 space-y-6">
                                <div>
                                    <p className="text-sm font-semibold text-default">{selected.name}</p>
                                    <p className="text-xs text-muted">{selected.email}</p>
                                    <p className="text-xs text-muted">{selected.phone ?? "No phone on file"}</p>
                                    <p className="mt-2 text-xs text-muted">
                                        Joined {new Date(selected.createdat).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-default bg-surface p-4">
                                    <p className="text-[10px] uppercase tracking-wide text-muted">Total Spent</p>
                                    <p className="mt-1 text-xl font-bold text-default">
                                        ${selected.totalSpent.toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-default">Booking History</h3>
                                    <div className="mt-3 space-y-2">
                                        {selected.bookings.map((b) => (
                                            <div
                                                key={b.id}
                                                className="flex items-center gap-3 rounded-lg border border-default p-3"
                                            >
                                                <img
                                                    src={b.img_url}
                                                    alt={b.vehiclename}
                                                    className="h-10 w-14 rounded-md object-cover"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-default">
                                                        {b.vehiclename}
                                                    </p>
                                                    <p className="text-[10px] text-muted">
                                                        {b.startdate} → {b.enddate}
                                                    </p>
                                                </div>
                                                <p className="text-xs font-semibold text-default">${b.totalprice}</p>
                                            </div>
                                        ))}
                                        {selected.bookings.length === 0 && (
                                            <p className="text-xs text-muted">No bookings yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}