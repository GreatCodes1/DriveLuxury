import { useEffect, useState, type FormEvent } from "react"
import { Send } from "lucide-react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { useAuth } from "../../context/Authcontext"
import { apiFetch } from "../../lib/api"

interface ThreadSummary {
    id: number
    subject: string
    customer_name: string
    updatedat: string
    last_message: string | null
    unread_count: string
}

interface ThreadMessage {
    id: number
    sender_role: "customer" | "admin"
    body: string
    createdat: string
}

interface ThreadDetail {
    id: number
    subject: string
    customer_name: string
    messages: ThreadMessage[]
}

export default function AdminMessages() {
    const { user } = useAuth()

    const [threads, setThreads] = useState<ThreadSummary[]>([])
    const [activeThread, setActiveThread] = useState<ThreadDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [draft, setDraft] = useState("")

    const loadThreads = () => {
        apiFetch<ThreadSummary[]>("/admin/messages")
            .then((data) => setThreads(data))
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load messages."))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadThreads()
    }, [])

    const openThread = async (id: number) => {
        try {
            const data = await apiFetch<ThreadDetail>(`/admin/messages/${id}`)
            setActiveThread(data)
            loadThreads()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't load this thread.")
        }
    }

    const handleSend = async (e: FormEvent) => {
        e.preventDefault()
        if (!activeThread || !draft.trim()) return

        const body = draft
        setDraft("")
        try {
            await apiFetch(`/admin/messages/${activeThread.id}`, { method: "POST", body: JSON.stringify({ body }) })
            openThread(activeThread.id)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't send your reply.")
        }
    }

    return (
        <AdminLayout>
            <AdminTopBar
                title="Messages"
                subtitle="Concierge conversations across all customers."
                dateRangeLabel="Jun 01 - Jun 30, 2026"
                adminName={user?.name ?? "Admin"}
                adminAvatar="https://i.pravatar.cc/100?img=47"
            />

            <div className="p-6">
                {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}

                <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-default md:grid-cols-[300px_1fr]">
                    <div className="divide-y divide-[var(--border)] border-b border-default bg-card md:border-b-0 md:border-r">
                        {loading && <p className="p-4 text-sm text-muted">Loading...</p>}
                        {!loading && threads.length === 0 && (
                            <p className="p-4 text-sm text-muted">No conversations yet.</p>
                        )}
                        {threads.map((thread) => (
                            <button
                                key={thread.id}
                                type="button"
                                onClick={() => openThread(thread.id)}
                                className={[
                                    "flex w-full items-start gap-3 p-4 text-left transition-colors",
                                    activeThread?.id === thread.id ? "bg-primary/5" : "hover:bg-surface-alt",
                                ].join(" ")}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-sm font-semibold text-default">
                                            {thread.customer_name}
                                        </p>
                                        {Number(thread.unread_count) > 0 && (
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <p className="truncate text-xs font-medium text-muted">{thread.subject}</p>
                                    <p className="mt-0.5 truncate text-xs text-muted">{thread.last_message}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex min-h-[420px] flex-col bg-surface">
                        {activeThread ? (
                            <>
                                <div className="border-b border-default p-4">
                                    <p className="text-sm font-semibold text-default">{activeThread.customer_name}</p>
                                    <p className="text-xs text-muted">{activeThread.subject}</p>
                                </div>

                                <div className="flex-1 space-y-3 p-4">
                                    {activeThread.messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={[
                                                "max-w-xs rounded-lg px-3 py-2 text-sm",
                                                message.sender_role === "admin"
                                                    ? "ml-auto bg-primary text-white"
                                                    : "bg-card text-default",
                                            ].join(" ")}
                                        >
                                            <p>{message.body}</p>
                                            <p
                                                className={[
                                                    "mt-1 text-[10px]",
                                                    message.sender_role === "admin" ? "text-white/70" : "text-muted",
                                                ].join(" ")}
                                            >
                                                {new Date(message.createdat).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-default p-4">
                                    <input
                                        type="text"
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        placeholder="Reply to customer..."
                                        className="flex-1 rounded-md border border-default bg-card px-3 py-2.5 text-sm text-default placeholder:text-muted focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        type="submit"
                                        aria-label="Send reply"
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-dark"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <p className="p-4 text-sm text-muted">Select a conversation to reply.</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}