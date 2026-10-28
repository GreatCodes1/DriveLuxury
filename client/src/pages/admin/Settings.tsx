import { useEffect, useState, type FormEvent } from "react"
import { Trash2, Plus, X } from "lucide-react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { useAuth } from "../../context/Authcontext"
import { apiFetch } from "../../lib/api"

interface LoyaltyTier {
    id: number
    name: string
    threshold: number
    perk: string
}

interface AdminUser {
    id: number
    name: string
    email: string
    role: string
}

interface AdminSettingsResponse {
    business_name: string
    support_email: string
    cancellation_window_hours: number | string
}

interface CreateAdminResponse {
    id: number
}

export default function AdminSettings() {
    const { user } = useAuth()

    // Business info
    const [businessName, setBusinessName] = useState("")
    const [supportEmail, setSupportEmail] = useState("")
    const [cancellationWindow, setCancellationWindow] = useState(24)
    const [settingsLoading, setSettingsLoading] = useState(true)
    const [savedSettings, setSavedSettings] = useState(false)

    // Loyalty tiers
    const [tiers, setTiers] = useState<LoyaltyTier[]>([])
    const [tiersLoading, setTiersLoading] = useState(true)
    const [savedTiers, setSavedTiers] = useState(false)

    // Admin accounts
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [showAddAdmin, setShowAddAdmin] = useState(false)
    const [newAdminName, setNewAdminName] = useState("")
    const [newAdminEmail, setNewAdminEmail] = useState("")
    const [newAdminPassword, setNewAdminPassword] = useState("")

    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
    apiFetch<AdminSettingsResponse>("/admin/settings")
        .then((data) => {
            setBusinessName(data.business_name)
            setSupportEmail(data.support_email)

            setCancellationWindow(
                Number(data.cancellation_window_hours)
            )
        })
        .catch((err: unknown) => {
            setError(
                err instanceof Error
                    ? err.message
                    : "Couldn't load settings."
            )
        })
        .finally(() => {
            setSettingsLoading(false)
        })

    apiFetch<LoyaltyTier[]>("/admin/loyalty-tiers")
        .then((data) => {
            setTiers(data)
        })
        .catch(() => {})
        .finally(() => {
            setTiersLoading(false)
        })

    apiFetch<AdminUser[]>("/admin/users")
        .then((data) => {
            setAdmins(
                data.filter((admin) => admin.role === "admin")
            )
        })
        .catch(() => {})
}, [])

    const handleSaveSettings = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            await apiFetch("/admin/settings", {
                method: "PATCH",
                body: JSON.stringify({
                    business_name: businessName,
                    support_email: supportEmail,
                    cancellation_window_hours: cancellationWindow,
                }),
            })
            setSavedSettings(true)
            setTimeout(() => setSavedSettings(false), 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't save settings.")
        }
    }

    const updateTier = (id: number, field: keyof LoyaltyTier, value: string | number) => {
        setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
    }

    const handleSaveTiers = async () => {
        setError(null)
        try {
            await apiFetch("/admin/loyalty-tiers", {
                method: "PATCH",
                body: JSON.stringify({ tiers }),
            })
            setSavedTiers(true)
            setTimeout(() => setSavedTiers(false), 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't save loyalty tiers.")
        }
    }

   const handleAddAdmin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
        const result = await apiFetch<CreateAdminResponse>(
            "/admin/admins",
            {
                method: "POST",
                body: JSON.stringify({
                    name: newAdminName,
                    email: newAdminEmail,
                    password: newAdminPassword,
                }),
            }
        )

        setAdmins((prev) => [
            ...prev,
            {
                id: result.id,
                name: newAdminName,
                email: newAdminEmail,
                role: "admin",
            },
        ])

        setNewAdminName("")
        setNewAdminEmail("")
        setNewAdminPassword("")
        setShowAddAdmin(false)
    } catch (err: unknown) {
        setError(
            err instanceof Error
                ? err.message
                : "Couldn't create admin account."
        )
    }
}
    const handleRemoveAdmin = async (id: number) => {
        setError(null)
        const previous = admins
        setAdmins((prev) => prev.filter((a) => a.id !== id))
        try {
            await apiFetch(`/admin/users/${id}`, { method: "DELETE" })
        } catch (err) {
            setAdmins(previous)
            setError(err instanceof Error ? err.message : "Couldn't remove this admin.")
        }
    }

    return (
        <AdminLayout>
            <AdminTopBar
                title="Settings"
                subtitle="Platform-wide configuration."
                dateRangeLabel="Jun 01 - Jun 30, 2026"
                adminName={user?.name ?? "Admin"}
                adminAvatar="https://i.pravatar.cc/100?img=47"
            />

            <div className="p-6 max-w-3xl space-y-6">
                {error && <p className="text-sm font-medium text-error">{error}</p>}

                <form onSubmit={handleSaveSettings} className="rounded-xl border border-default bg-card p-5">
                    <h3 className="text-sm font-semibold text-default">Business Information</h3>
                    {settingsLoading ? (
                        <p className="mt-4 text-sm text-muted">Loading...</p>
                    ) : (
                        <>
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                        Business Name
                                    </label>
                                    <input
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                        Support Email
                                    </label>
                                    <input
                                        type="email"
                                        value={supportEmail}
                                        onChange={(e) => setSupportEmail(e.target.value)}
                                        className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                        Free Cancellation Window (hours)
                                    </label>
                                    <input
                                        type="number"
                                        value={cancellationWindow}
                                        onChange={(e) => setCancellationWindow(Number(e.target.value))}
                                        className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-4">
                                <button
                                    type="submit"
                                    className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                                >
                                    Save Changes
                                </button>
                                {savedSettings && <p className="text-sm font-medium text-success">Saved.</p>}
                            </div>
                        </>
                    )}
                </form>

                <div className="rounded-xl border border-default bg-card p-5">
                    <h3 className="text-sm font-semibold text-default">Loyalty Tiers</h3>
                    {tiersLoading ? (
                        <p className="mt-4 text-sm text-muted">Loading...</p>
                    ) : (
                        <>
                            <div className="mt-4 space-y-3">
                                {tiers.map((tier) => (
                                    <div key={tier.id} className="grid grid-cols-1 gap-3 rounded-lg border border-default p-3 sm:grid-cols-[120px_140px_1fr]">
                                        <input
                                            value={tier.name}
                                            onChange={(e) => updateTier(tier.id, "name", e.target.value)}
                                            className="rounded-md border border-default bg-surface px-3 py-2 text-sm font-semibold text-default focus:outline-none focus:border-primary"
                                        />
                                        <div className="flex items-center gap-1 rounded-md border border-default bg-surface px-3 py-2">
                                            <span className="text-xs text-muted">$</span>
                                            <input
                                                type="number"
                                                value={tier.threshold}
                                                onChange={(e) => updateTier(tier.id, "threshold", Number(e.target.value))}
                                                className="w-full bg-transparent text-sm text-default focus:outline-none"
                                            />
                                            <span className="text-xs text-muted">spent</span>
                                        </div>
                                        <input
                                            value={tier.perk}
                                            onChange={(e) => updateTier(tier.id, "perk", e.target.value)}
                                            className="rounded-md border border-default bg-surface px-3 py-2 text-sm text-default focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleSaveTiers}
                                    className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                                >
                                    Save Tiers
                                </button>
                                {savedTiers && <p className="text-sm font-medium text-success">Saved.</p>}
                            </div>
                            <p className="mt-3 text-[10px] text-muted">
                                Note: nothing currently assigns a customer to one of these tiers based
                                on their loyalty points — that mapping is a small follow-up.
                            </p>
                        </>
                    )}
                </div>

                <div className="rounded-xl border border-default bg-card p-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-default">Admin Accounts</h3>
                        <button
                            type="button"
                            onClick={() => setShowAddAdmin((prev) => !prev)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                            {showAddAdmin ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {showAddAdmin ? "Cancel" : "Add Admin"}
                        </button>
                    </div>

                    {showAddAdmin && (
                        <form onSubmit={handleAddAdmin} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-default p-3 sm:grid-cols-3">
                            <input
                                required
                                placeholder="Full name"
                                value={newAdminName}
                                onChange={(e) => setNewAdminName(e.target.value)}
                                className="rounded-md border border-default bg-surface px-3 py-2 text-sm text-default placeholder:text-muted focus:outline-none focus:border-primary"
                            />
                            <input
                                required
                                type="email"
                                placeholder="Email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                className="rounded-md border border-default bg-surface px-3 py-2 text-sm text-default placeholder:text-muted focus:outline-none focus:border-primary"
                            />
                            <input
                                required
                                type="password"
                                placeholder="Temporary password (8+ chars)"
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                className="rounded-md border border-default bg-surface px-3 py-2 text-sm text-default placeholder:text-muted focus:outline-none focus:border-primary"
                            />
                            <button
                                type="submit"
                                className="sm:col-span-3 rounded-md bg-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                            >
                                Create Admin Account
                            </button>
                        </form>
                    )}

                    <div className="mt-3 space-y-2">
                        {admins.map((admin) => (
                            <div key={admin.id} className="flex items-center justify-between rounded-lg border border-default px-3 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-default">{admin.name}</p>
                                    <p className="text-xs text-muted">{admin.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAdmin(admin.id)}
                                    disabled={admin.id === user?.id}
                                    aria-label="Remove admin"
                                    className="text-muted transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {admins.length === 0 && <p className="text-sm text-muted">No admin accounts found.</p>}
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}