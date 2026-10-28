// import { useEffect, useState, type FormEvent } from "react"
// import { Send, Plus, X } from "lucide-react"
// import { DashboardLayout } from "../../components/dashboard/DashboardLayout"
// import { apiFetch } from "../../lib/api"

// interface ThreadSummary {
//     id: number
//     subject: string
//     updatedat: string
//     last_message: string | null
//     unread_count: string
// }

// interface ThreadMessage {
//     id: number
//     sender_role: "customer" | "admin"
//     body: string
//     createdat: string
// }
// // 
// interface ThreadDetail {
//     id: number
//     subject: string
//     messages: ThreadMessage[]
// }

// export default function Messages() {
//     const [threads, setThreads] = useState<ThreadSummary[]>([])
//     const [activeThread, setActiveThread] = useState<ThreadDetail | null>(null)
//     const [loading, setLoading] = useState(true)
//     const [error, setError] = useState<string | null>(null)

//     const [draft, setDraft] = useState("")
//     const [showNewThread, setShowNewThread] = useState(false)
//     const [newSubject, setNewSubject] = useState("")
//     const [newBody, setNewBody] = useState("")

//     const loadThreads = () => {
//         apiFetch("/messages")
//             .then((data) => setThreads(data))
//             .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load messages."))
//             .finally(() => setLoading(false))
//     }

//     useEffect(() => {
//         loadThreads()
//     }, [])

//     const openThread = async (id: number) => {
//         try {
//             const data = await apiFetch(`/messages/${id}`)
//             setActiveThread(data)
//             loadThreads() // refresh unread counts
//         } catch (err) {
//             setError(err instanceof Error ? err.message : "Couldn't load this thread.")
//         }
//     }

//     // Auto-open the first thread once loaded.
//     useEffect(() => {
//         if (!loading && threads.length > 0 && !activeThread) {
//             openThread(threads[0].id)
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [loading, threads])

//     const handleSend = async (e: FormEvent) => {
//         e.preventDefault()
//         if (!activeThread || !draft.trim()) return

//         const body = draft
//         setDraft("")
//         try {
//             await apiFetch(`/messages/${activeThread.id}`, { method: "POST", body: JSON.stringify({ body }) })
//             openThread(activeThread.id)
//         } catch (err) {
//             setError(err instanceof Error ? err.message : "Couldn't send your message.")
//         }
//     }

//     const handleNewThread = async (e: FormEvent) => {
//         e.preventDefault()
//         if (!newSubject.trim() || !newBody.trim()) return

//         try {
//             const result = await apiFetch("/messages", {
//                 method: "POST",
//                 body: JSON.stringify({ subject: newSubject, body: newBody }),
//             })
//             setNewSubject("")
//             setNewBody("")
//             setShowNewThread(false)
//             loadThreads()
//             openThread(result.threadId)
//         } catch (err) {
//             setError(err instanceof Error ? err.message : "Couldn't start a new conversation.")
//         }
//     }

//     return (
//         <DashboardLayout>
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-2xl font-bold text-default">Messages</h1>
//                     <p className="mt-1 text-sm text-muted">Chat directly with your concierge team.</p>
//                 </div>
//                 <button
//                     type="button"
//                     onClick={() => setShowNewThread((prev) => !prev)}
//                     className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
//                 >
//                     {showNewThread ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
//                     {showNewThread ? "Cancel" : "New Message"}
//                 </button>
//             </div>

//             {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

//             {showNewThread && (
//                 <form onSubmit={handleNewThread} className="mt-4 space-y-3 rounded-xl border border-default bg-card p-4">
//                     <input
//                         required
//                         placeholder="Subject"
//                         value={newSubject}
//                         onChange={(e) => setNewSubject(e.target.value)}
//                         className="w-full rounded-md border border-default bg-surface px-3 py-2 text-sm text-default placeholder:text-muted focus:outline-none focus:border-primary"
//                     />
//                     <textarea
//                         required
//                         rows={3}
//                         placeholder="How can we help?"
//                         value={newBody}
//                         onChange={(e) => setNewBody(e.target.value)}
//                         className="w-full resize-none rounded-md border border-default bg-surface px-3 py-2 text-sm text-default placeholder:text-muted focus:outline-none focus:border-primary"
//                     />
//                     <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
//                         Send
//                     </button>
//                 </form>
//             )}

//             <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-xl border border-default md:grid-cols-[280px_1fr]">
//                 {/* Thread list */}
//                 <div className="divide-y divide-[var(--border)] border-b border-default bg-card md:border-b-0 md:border-r">
//                     {loading && <p className="p-4 text-sm text-muted">Loading...</p>}
//                     {!loading && threads.length === 0 && (
//                         <p className="p-4 text-sm text-muted">No conversations yet.</p>
//                     )}
//                     {threads.map((thread) => (
//                         <button
//                             key={thread.id}
//                             type="button"
//                             onClick={() => openThread(thread.id)}
//                             className={[
//                                 "flex w-full items-start gap-3 p-4 text-left transition-colors",
//                                 activeThread?.id === thread.id ? "bg-primary/5" : "hover:bg-surface-alt",
//                             ].join(" ")}
//                         >
//                             <div className="min-w-0 flex-1">
//                                 <div className="flex items-center justify-between gap-2">
//                                     <p className="truncate text-sm font-semibold text-default">{thread.subject}</p>
//                                     {Number(thread.unread_count) > 0 && (
//                                         <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
//                                     )}
//                                 </div>
//                                 <p className="mt-0.5 truncate text-xs text-muted">{thread.last_message}</p>
//                                 <p className="mt-0.5 text-[10px] text-muted">
//                                     {new Date(thread.updatedat).toLocaleString()}
//                                 </p>
//                             </div>
//                         </button>
//                     ))}
//                 </div>

//                 {/* Conversation */}
//                 <div className="flex min-h-[400px] flex-col bg-surface">
//                     {activeThread ? (
//                         <>
//                             <div className="border-b border-default p-4">
//                                 <p className="text-sm font-semibold text-default">{activeThread.subject}</p>
//                             </div>

//                             <div className="flex-1 space-y-3 p-4">
//                                 {activeThread.messages.map((message) => (
//                                     <div
//                                         key={message.id}
//                                         className={[
//                                             "max-w-xs rounded-lg px-3 py-2 text-sm",
//                                             message.sender_role === "customer"
//                                                 ? "ml-auto bg-primary text-white"
//                                                 : "bg-card text-default",
//                                         ].join(" ")}
//                                     >
//                                         <p>{message.body}</p>
//                                         <p
//                                             className={[
//                                                 "mt-1 text-[10px]",
//                                                 message.sender_role === "customer" ? "text-white/70" : "text-muted",
//                                             ].join(" ")}
//                                         >
//                                             {new Date(message.createdat).toLocaleTimeString()}
//                                         </p>
//                                     </div>
//                                 ))}
//                             </div>

//                             <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-default p-4">
//                                 <input
//                                     type="text"
//                                     value={draft}
//                                     onChange={(e) => setDraft(e.target.value)}
//                                     placeholder="Type a message..."
//                                     className="flex-1 rounded-md border border-default bg-card px-3 py-2.5 text-sm text-default placeholder:text-muted focus:outline-none focus:border-primary"
//                                 />
//                                 <button
//                                     type="submit"
//                                     aria-label="Send message"
//                                     className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-dark"
//                                 >
//                                     <Send className="h-4 w-4" />
//                                 </button>
//                             </form>
//                         </>
//                     ) : (
//                         <p className="p-4 text-sm text-muted">Select a conversation, or start a new one.</p>
//                     )}
//                 </div>
//             </div>
//         </DashboardLayout>
//     )
// }