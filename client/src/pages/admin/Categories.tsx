import { useEffect, useRef, useState, type FormEvent } from "react"
import { Plus, Search, X } from "lucide-react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import Popup from "../../components/Popup"
import { useAuth } from "../../context/Authcontext"
import { useCategories } from "../../lib/useCAtegores"
import { apiFetch } from "../../lib/api"

const MAX_NAME_LENGTH = 50

interface PopupState {
    message: string
    error: boolean
}

export default function AdminCategories() {
    const { user } = useAuth()
    const { categories, loading, error, reload } = useCategories()

    const [query, setQuery] = useState("")
    const [popup, setPopup] = useState<PopupState | null>(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [name, setName] = useState("")
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(query.trim().toLowerCase())
    )

    const closeModal = () => {
        if (submitting) return

        setModalOpen(false)
        setName("")
        setFormError(null)
    }

    // Focus the input when the modal opens, close on Escape
    useEffect(() => {
        if (!modalOpen) return

        inputRef.current?.focus()

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !submitting) {
                setModalOpen(false)
                setName("")
                setFormError(null)
            }
        }

        document.addEventListener("keydown", handleEscape)

        return () => document.removeEventListener("keydown", handleEscape)
    }, [modalOpen, submitting])

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()

        const trimmed = name.trim()

        if (!trimmed) {
            setFormError("Category name is required.")
            return
        }

        if (trimmed.length > MAX_NAME_LENGTH) {
            setFormError(`Category name must be ${MAX_NAME_LENGTH} characters or fewer.`)
            return
        }

        const exists = categories.some(
            (category) =>
                category.name.trim().toLowerCase() === trimmed.toLowerCase()
        )

        if (exists) {
            setFormError("That category already exists.")
            return
        }

        setSubmitting(true)
        setFormError(null)

        try {
            await apiFetch("/addCategory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: trimmed }),
            })

            await reload()

            setModalOpen(false)
            setName("")
            setPopup({
                message: `"${trimmed}" was added successfully.`,
                error: false,
            })
        } catch (err) {
            setFormError(
                err instanceof Error
                    ? err.message
                    : "Couldn't add this category."
            )
        } finally {
            setSubmitting(false)
        }
    }

    // e.g. "Oct 01 - Oct 31, 2026"
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const dateRangeLabel = `${monthStart.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
    })} - ${monthEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    })}`

    return (
        <AdminLayout>
            {popup && (
                <Popup
                    message={popup.message}
                    error={popup.error}
                    onClose={() => setPopup(null)}
                />
            )}

            <AdminTopBar
                title="Categories"
                subtitle="Vehicle categories available across the fleet."
                dateRangeLabel={dateRangeLabel}
                adminName={user?.name ?? "Admin"}
                adminAvatar="https://i.pravatar.cc/100?img=47"
            />

            <div className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 rounded-md border border-default bg-card px-3 py-2.5 sm:w-80">
                        <Search className="h-4 w-4 text-muted" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full bg-transparent text-sm text-default placeholder:text-muted focus:outline-none"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                        <Plus className="h-4 w-4" />
                        Add Category
                    </button>
                </div>

                {loading && (
                    <p className="mt-4 text-sm text-muted">Loading categories...</p>
                )}
                {error && (
                    <p className="mt-4 text-sm font-medium text-error">{error}</p>
                )}

                {!loading && !error && (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-default bg-card">
                        <table className="w-full min-w-[320px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                                    <th className="w-20 px-4 py-3 font-medium">ID</th>
                                    <th className="px-4 py-3 font-medium">Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((category) => (
                                    <tr
                                        key={category.id}
                                        className="border-b border-default last:border-0 hover:bg-surface-alt"
                                    >
                                        <td className="px-4 py-3 text-muted">
                                            #{category.id}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-default">
                                            {category.name}
                                        </td>
                                    </tr>
                                ))}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="px-4 py-6 text-center text-sm text-muted"
                                        >
                                            {categories.length === 0
                                                ? "No categories yet. Add your first one."
                                                : `No categories match "${query}".`}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && categories.length > 0 && (
                    <p className="mt-3 text-xs text-muted">
                        {categories.length}{" "}
                        {categories.length === 1 ? "category" : "categories"} in total
                    </p>
                )}
            </div>

            {/* Add category popup */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <form
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        noValidate
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-category-title"
                        className="w-full max-w-md rounded-xl border border-default bg-card p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between">
                            <h2
                                id="add-category-title"
                                className="text-lg font-semibold text-default"
                            >
                                Add Category
                            </h2>

                            <button
                                type="button"
                                onClick={closeModal}
                                aria-label="Close"
                                className="rounded-md p-1 text-muted transition-colors hover:text-default"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="mt-1 text-xs text-muted">
                            New categories show up in the fleet filters and the
                            search form right away.
                        </p>

                        <div className="mt-5">
                            <label
                                htmlFor="category-name"
                                className="text-[10px] font-medium uppercase tracking-wide text-muted"
                            >
                                Category Name
                            </label>

                            <input
                                ref={inputRef}
                                id="category-name"
                                type="text"
                                value={name}
                                maxLength={MAX_NAME_LENGTH + 20}
                                onChange={(e) => {
                                    setName(e.target.value)
                                    setFormError(null)
                                }}
                                placeholder="e.g. Luxury Vans"
                                autoComplete="off"
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default placeholder:text-muted focus:border-primary focus:outline-none"
                            />

                            {formError && (
                                <p
                                    role="alert"
                                    className="mt-2 text-xs font-medium text-error"
                                >
                                    {formError}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={submitting}
                                className="rounded-md border border-default px-4 py-2 text-sm font-semibold text-default transition-colors hover:bg-surface disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                            >
                                {submitting ? "Adding..." : "Add Category"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    )
}