import { useEffect, useState } from "react"
import { Search, X, Mail, Phone } from "lucide-react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { useAuth } from "../../context/Authcontext"
import { apiFetch } from "../../lib/api"

interface ContactRequest {
    id: number
    name: string
    email: string
    phone: string | null
    subject: string | null
    message: string
    createdat: string
}

export default function AdminContactRequests() {
    const { user } = useAuth()

    const [requests, setRequests] = useState<ContactRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [query, setQuery] = useState("")
    const [selected, setSelected] = useState<ContactRequest | null>(null)

    useEffect(() => {
        apiFetch<ContactRequest[]>("/admin/contact-requests")
            .then((data) => setRequests(data))
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load contact requests."))
            .finally(() => setLoading(false))
    }, [])

    const filtered = requests.filter((r) => {
        const haystack = `${r.name} ${r.email} ${r.subject ?? ""} ${r.message}`.toLowerCase()
        return haystack.includes(query.trim().toLowerCase())
    })

    return (
        <AdminLayout>
            <AdminTopBar
                title="Contact Requests"
                subtitle="Messages submitted through the contact forms."
                dateRangeLabel="All time"
                adminName={user?.name ?? "Admin"}
                adminAvatar="https://i.pravatar.cc/100?img=47"
            />

            <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 rounded-md border border-default bg-card px-3 py-2.5 sm:w-80">
                        <Search className="h-4 w-4 text-muted" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search name, email, subject, message..."
                            className="w-full bg-transparent text-sm text-default placeholder:text-muted focus:outline-none"
                        />
                    </div>
                    {!loading && !error && (
                        <p className="text-sm text-muted">
                            {filtered.length} of {requests.length} request{requests.length === 1 ? "" : "s"}
                        </p>
                    )}
                </div>

                {loading && <p className="mt-4 text-sm text-muted">Loading contact requests...</p>}
                {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

                {!loading && !error && (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-default bg-card">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                                    <th className="px-4 py-3 font-medium">From</th>
                                    <th className="px-4 py-3 font-medium">Subject</th>
                                    <th className="px-4 py-3 font-medium">Message</th>
                                    <th className="px-4 py-3 font-medium">Received</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr
                                        key={r.id}
                                        onClick={() => setSelected(r)}
                                        className="cursor-pointer border-b border-default last:border-0 hover:bg-surface-alt"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-default">{r.name}</p>
                                            <p className="text-xs text-muted">{r.email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-default">{r.subject || "—"}</td>
                                        <td className="max-w-xs px-4 py-3 text-muted">
                                            <p className="truncate">{r.message}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-muted">
                                            {new Date(r.createdat).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted">
                                            {requests.length === 0
                                                ? "No contact requests yet."
                                                : `No requests match "${query}".`}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail drawer */}
            {selected && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelected(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-default">Contact Request</h2>
                            <button type="button" onClick={() => setSelected(null)} aria-label="Close">
                                <X className="h-5 w-5 text-muted" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-default">{selected.name}</p>
                                <p className="mt-0.5 text-xs text-muted">
                                    {new Date(selected.createdat).toLocaleString()}
                                </p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2 text-default">
                                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                                    <a href={`mailto:${selected.email}`} className="hover:underline">
                                        {selected.email}
                                    </a>
                                </p>
                                {selected.phone && (
                                    <p className="flex items-center gap-2 text-default">
                                        <Phone className="h-4 w-4 shrink-0 text-primary" />
                                        <a href={`tel:${selected.phone}`} className="hover:underline">
                                            {selected.phone}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-default pt-4">
                                <p className="text-[10px] uppercase tracking-wide text-muted">Subject</p>
                                <p className="mt-1 text-sm font-medium text-default">{selected.subject || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-muted">Message</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-default">
                                    {selected.message}
                                </p>
                            </div>

                            <a
                                href={`mailto:${selected.email}${selected.subject ? `?subject=${encodeURIComponent(`Re: ${selected.subject}`)}` : ""}`}
                                className="block w-full rounded-md bg-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                            >
                                Reply by Email
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}