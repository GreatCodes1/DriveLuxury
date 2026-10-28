import { useEffect, useState } from "react"
import { CreditCard, Trash2, Star } from "lucide-react"
import { DashboardLayout } from "../../components/dashboard/DashboardLayout"
import { apiFetch } from "../../lib/api"

export interface SavedCard {
    id: number
    card_type: string | null
    last4: string | null
    exp_month: string | null
    exp_year: string | null
    bank: string | null
    is_default: boolean
}

export default function PaymentMethods() {
    const [cards, setCards] = useState<SavedCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        apiFetch("/payment-methods")
            .then((data) => setCards(data))
            .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your cards."))
            .finally(() => setLoading(false))
    }, [])

    const setDefault = async (id: number) => {
        const previous = cards
        setCards((prev) => prev.map((c) => ({ ...c, is_default: c.id === id })))
        try {
            await apiFetch(`/payment-methods/${id}/default`, { method: "PATCH" })
        } catch (err) {
            setCards(previous)
            setError(err instanceof Error ? err.message : "Couldn't update your default card.")
        }
    }

    const removeCard = async (id: number) => {
        const previous = cards
        setCards((prev) => prev.filter((c) => c.id !== id))
        try {
            await apiFetch(`/payment-methods/${id}`, { method: "DELETE" })
        } catch (err) {
            setCards(previous)
            setError(err instanceof Error ? err.message : "Couldn't remove this card.")
        }
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-default">Payment Methods</h1>
            <p className="mt-1 text-sm text-muted">Cards you've chosen to save during checkout.</p>

            {loading && <p className="mt-6 text-sm text-muted">Loading...</p>}
            {error && <p className="mt-6 text-sm font-medium text-error">{error}</p>}

            {!loading && (
                <div className="mt-6 max-w-md space-y-3">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className="flex items-center justify-between rounded-xl border border-default bg-card p-4"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <CreditCard className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold capitalize text-default">
                                        {card.card_type ?? "Card"} •••• {card.last4}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {card.bank ? `${card.bank} · ` : ""}Expires {card.exp_month}/{card.exp_year}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {card.is_default ? (
                                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                                        <Star className="h-3.5 w-3.5 fill-current" />
                                        Default
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setDefault(card.id)}
                                        className="text-xs font-medium text-muted hover:text-default"
                                    >
                                        Make Default
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeCard(card.id)}
                                    aria-label="Remove card"
                                    className="text-muted transition-colors hover:text-error"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {cards.length === 0 && (
                        <div className="rounded-xl border border-dashed border-default p-8 text-center">
                            <p className="text-sm text-muted">
                                No saved cards yet. During checkout, choose "Save this card" and it'll
                                show up here automatically next time.
                            </p>
                        </div>
                    )}

                    <p className="text-[11px] text-muted">
                        Cards can't be added manually here — for security, card numbers only ever
                        go through Paystack's own checkout page, never through this app's servers.
                    </p>
                </div>
            )}
        </DashboardLayout>
    )
}