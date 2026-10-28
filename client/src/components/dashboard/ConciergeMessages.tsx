export interface ConciergeMessage {
    id: string | number
    sender: string
    avatar: string
    preview: string
    timeAgo: string
    unread?: boolean
}

interface ConciergeMessagesProps {
    messages: ConciergeMessage[]
}

export function ConciergeMessages({ messages }: ConciergeMessagesProps) {
    const unreadCount = messages.filter((m) => m.unread).length

    return (
        <div className="rounded-xl border border-default bg-card p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-default">Concierge Messages</h3>
                {unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                        {unreadCount} NEW
                    </span>
                )}
            </div>

            <div className="mt-3 space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                        <img
                            src={message.avatar}
                            alt={message.sender}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="truncate text-xs font-semibold text-default">{message.sender}</p>
                                {message.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                            </div>
                            <p className="text-[10px] text-muted">{message.timeAgo}</p>
                            <p className="mt-0.5 truncate text-xs text-muted">{message.preview}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}