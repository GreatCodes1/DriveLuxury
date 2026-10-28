import { ShieldCheck, Lock, CreditCard, Check } from "lucide-react"

export interface SavedCard {
    id: number
    card_type: string | null
    last4: string | null
    exp_month: string | null
    exp_year: string | null
    bank: string | null
    is_default: boolean
}

interface PaymentStepProps {
    savedCards: SavedCard[]
    loadingSavedCards: boolean
    selectedCardId: number | "new"
    onSelectCard: (id: number | "new") => void
    saveNewCard: boolean
    onToggleSaveNewCard: (checked: boolean) => void
}

export function PaymentStep({
    savedCards,
    loadingSavedCards,
    selectedCardId,
    onSelectCard,
    saveNewCard,
    onToggleSaveNewCard,
}: PaymentStepProps) {
    return (
        <div className="rounded-xl border border-default bg-card p-6">
            <h2 className="text-lg font-semibold text-default">Payment Options</h2>
            <p className="mt-1 text-sm text-muted">
                Your card details are never seen or stored by DRIVEluxury 
            </p>

            {loadingSavedCards && <p className="mt-4 text-sm text-muted">Loading saved cards...</p>}

            {!loadingSavedCards && savedCards.length > 0 && (
                <div className="mt-6 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Saved Cards</p>
                    {savedCards.map((card) => (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => onSelectCard(card.id)}
                            className={[
                                "flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors",
                                selectedCardId === card.id ? "border-primary bg-primary/5" : "border-default bg-surface",
                            ].join(" ")}
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <CreditCard className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold capitalize text-default">
                                        {card.card_type ?? "Card"} •••• {card.last4}
                                    </p>
                                    <p className="text-xs text-muted">Expires {card.exp_month}/{card.exp_year}</p>
                                </div>
                            </div>
                            {selectedCardId === card.id && <Check className="h-4 w-4 text-primary" />}
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-6">
                {savedCards.length > 0 && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Or Pay With</p>
                )}
                <button
                    type="button"
                    onClick={() => onSelectCard("new")}
                    className={[
                        "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                        selectedCardId === "new" ? "border-primary bg-primary/5" : "border-default bg-surface",
                    ].join(" ")}
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Lock className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-default">Pay with a New Card</p>
                        <p className="text-xs text-muted">Visa, Mastercard, and Verve accepted.</p>
                    </div>
                    {selectedCardId === "new" && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>

                {selectedCardId === "new" && (
                    <label className="mt-3 flex items-center gap-2 pl-1 text-sm text-default">
                        <input
                            type="checkbox"
                            checked={saveNewCard}
                            onChange={(e) => onToggleSaveNewCard(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-default accent-primary"
                        />
                        Save this card for faster checkout next time
                    </label>
                )}
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <p>
                    Payments are processed over an encrypted connection. Click "Pay Now" in the
                    summary panel to continue.
                </p>
            </div>
        </div>
    )
}