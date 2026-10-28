import { useEffect, useState, type FormEvent } from "react"
import { Plus, Pencil, Trash2, X } from "lucide-react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { useAuth } from "../../context/Authcontext"
import { apiFetch, apiFetchFormData } from "../../lib/api"

interface Vehicle {
    id: number
    name: string
    category: string
    description: string | null
    brand: string | null
    model: string | null
    year: number | null
    colour: string | null
    dailyprice: number
    isavailable: boolean
    img_url: string
}

const CATEGORIES = ["Sports Cars", "Luxury Sedans", "Electric Vehicles", "SUVs & Crossovers", "Convertibles", "Exotic Cars"]

const emptyForm = {
    name: "",
    category: CATEGORIES[0],
    description: "",
    brand: "",
    model: "",
    year: "",
    colour: "",
    dailyprice: "",
    isavailable: true,
}

export default function AdminVehicles() {
    const { user } = useAuth()

    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [mode, setMode] = useState<"none" | "add" | "edit">("none")
    const [editingId, setEditingId] = useState<number | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadVehicles = () => {
        setLoading(true)
        apiFetch<Vehicle[]>("/vehicles")
            .then((data) => setVehicles(data))
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load vehicles."))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadVehicles()
    }, [])

    const startAdd = () => {
        setForm(emptyForm)
        setEditingId(null)
        setMode("add")
    }

    const startEdit = (v: Vehicle) => {
        setForm({
            name: v.name,
            category: v.category,
            description: v.description ?? "",
            brand: v.brand ?? "",
            model: v.model ?? "",
            year: v.year ? String(v.year) : "",
            colour: v.colour ?? "",
            dailyprice: String(v.dailyprice),
            isavailable: v.isavailable,
        })
        setEditingId(v.id)
        setMode("edit")
    }

    const closeForm = () => {
        setMode("none")
        setEditingId(null)
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)

            if (mode === "add") {
                await apiFetchFormData("/addVehicle", formData)
            } else if (mode === "edit" && editingId) {
                await apiFetchFormData(`/admin/vehicle/${editingId}`, formData, "PATCH")
            }

            closeForm()
            loadVehicles()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't save this vehicle.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        setError(null)
        const previous = vehicles
        setVehicles((prev) => prev.filter((v) => v.id !== id))
        try {
            await apiFetch(`/admin/vehicle/${id}`, { method: "DELETE" })
        } catch (err) {
            setVehicles(previous)
            setError(err instanceof Error ? err.message : "Couldn't remove this vehicle.")
        }
    }

    return (
        <AdminLayout>
            <AdminTopBar
                title="Vehicles"
                subtitle="Manage the fleet available for booking."
                dateRangeLabel="Jun 01 - Jun 30, 2026"
                adminName={user?.name ?? "Admin"}
                adminAvatar="https://i.pravatar.cc/100?img=47"
            />

            <div className="p-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted">{vehicles.length} vehicles in the fleet</p>
                    <button
                        type="button"
                        onClick={() => (mode === "none" ? startAdd() : closeForm())}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                        {mode === "none" ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        {mode === "none" ? "Add Vehicle" : "Cancel"}
                    </button>
                </div>

                {mode !== "none" && (
                    <form
                        onSubmit={handleSubmit}
                        encType="multipart/form-data"
                        className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-default bg-card p-5 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <h3 className="sm:col-span-2 lg:col-span-3 text-sm font-semibold text-default">
                            {mode === "add" ? "Add a New Vehicle" : "Edit Vehicle"}
                        </h3>

                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Name</label>
                            <input
                                name="name"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Category</label>
                            <select
                                name="category"
                                required
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Brand</label>
                            <input
                                name="brand"
                                value={form.brand}
                                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Model</label>
                            <input
                                name="model"
                                value={form.model}
                                onChange={(e) => setForm({ ...form, model: e.target.value })}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Year</label>
                            <input
                                name="year"
                                type="number"
                                value={form.year}
                                onChange={(e) => setForm({ ...form, year: e.target.value })}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Colour</label>
                            <input
                                name="colour"
                                value={form.colour}
                                onChange={(e) => setForm({ ...form, colour: e.target.value })}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Daily Price ($)</label>
                            <input
                                name="dailyprice"
                                type="number"
                                step="0.01"
                                required
                                value={form.dailyprice}
                                onChange={(e) => setForm({ ...form, dailyprice: e.target.value })}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                {mode === "add" ? "Cover Image" : "Replace Cover Image (optional)"}
                            </label>
                            <input
                                name="img1"
                                type="file"
                                accept="image/png,image/jpeg"
                                required={mode === "add"}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2 text-xs text-default focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                Gallery Photos (up to 4, optional)
                            </label>
                            <input
                                name="images"
                                type="file"
                                accept="image/png,image/jpeg"
                                multiple
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2 text-xs text-default focus:outline-none focus:border-primary"
                            />
                            {mode === "edit" && (
                                <p className="mt-1 text-[10px] text-muted">
                                    Uploading here replaces the entire gallery, including the cover.
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 self-end pb-2.5">
                            <input
                                id="isavailable"
                                name="isavailable"
                                type="checkbox"
                                checked={form.isavailable}
                                onChange={(e) => setForm({ ...form, isavailable: e.target.checked })}
                                className="h-3.5 w-3.5 rounded border-default accent-primary"
                            />
                            <label htmlFor="isavailable" className="text-sm text-default">Available for booking</label>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Description</label>
                            <textarea
                                name="description"
                                rows={3}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="mt-1.5 w-full resize-none rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            />
                        </div>

                        {error && <p className="sm:col-span-2 lg:col-span-3 text-sm font-medium text-error">{error}</p>}

                        <div className="sm:col-span-2 lg:col-span-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting ? "Saving..." : mode === "add" ? "Add Vehicle" : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}

                {loading && <p className="mt-4 text-sm text-muted">Loading vehicles...</p>}
                {error && mode === "none" && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

                {!loading && (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-default bg-card">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                                    <th className="px-4 py-3 font-medium">Vehicle</th>
                                    <th className="px-4 py-3 font-medium">Category</th>
                                    <th className="px-4 py-3 font-medium">Daily Rate</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicles.map((v) => (
                                    <tr key={v.id} className="border-b border-default last:border-0">
                                        <td className="flex items-center gap-3 px-4 py-3">
                                            <img src={v.img_url} alt={v.name} className="h-9 w-12 rounded-md object-cover" />
                                            <span className="font-medium text-default">{v.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-muted">{v.category}</td>
                                        <td className="px-4 py-3 font-semibold text-default">${v.dailyprice}/day</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={[
                                                    "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                                                    v.isavailable ? "bg-success/10 text-success" : "bg-error/10 text-error",
                                                ].join(" ")}
                                            >
                                                {v.isavailable ? "Available" : "Unavailable"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(v)}
                                                    aria-label="Edit vehicle"
                                                    className="text-muted hover:text-primary"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(v.id)}
                                                    aria-label="Delete vehicle"
                                                    className="text-muted hover:text-error"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {vehicles.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted">
                                            No vehicles yet.
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