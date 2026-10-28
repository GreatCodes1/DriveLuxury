import { useState, type FormEvent } from "react"
import { ChevronDown, Mail, Phone } from "lucide-react"
import { DashboardLayout } from "../../components/dashboard/DashboardLayout"

const FAQS = [
    {
        question: "How do I cancel a booking?",
        answer:
            "Go to My Bookings, find the upcoming reservation, and select Cancel. Cancellations made at least 24 hours before pickup are fully refundable.",
    },
    {
        question: "What's included in Premium Liability Cover?",
        answer:
            "Zero-deductible protection against at-fault damage, theft, and third-party liability for the full duration of your rental.",
    },
    {
        question: "Can I extend my rental after pickup?",
        answer:
            "Yes — use the Extend Current Rental quick action on your dashboard, or message your concierge directly for same-day extensions.",
    },
    {
        question: "How is my loyalty tier calculated?",
        answer:
            "Tiers are based on total trips and spend over a rolling 12 months. Gold Tier unlocks priority delivery and exclusive weekend rates.",
    },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="border-b border-default py-4 last:border-0">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
            >
                <span className="text-sm font-medium text-default">{question}</span>
                <ChevronDown
                    className={["h-4 w-4 shrink-0 text-muted transition-transform", open ? "rotate-180" : ""].join(
                        " ",
                    )}
                />
            </button>
            {open && <p className="mt-2 text-sm text-muted">{answer}</p>}
        </div>
    )
}

export default function HelpSupport() {
    const [message, setMessage] = useState("")
    const [sent, setSent] = useState(false)

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        // Backend note: no POST /contact route exists yet to receive this.
        setSent(true)
        setMessage("")
        setTimeout(() => setSent(false), 2500)
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-default">Help &amp; Support</h1>
            <p className="mt-1 text-sm text-muted">Find answers or reach your concierge team directly.</p>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                <div className="rounded-xl border border-default bg-card p-5">
                    <h2 className="text-sm font-semibold text-default">Frequently Asked Questions</h2>
                    <div className="mt-2">
                        {FAQS.map((faq) => (
                            <FaqItem key={faq.question} {...faq} />
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-default bg-card p-5">
                        <h2 className="text-sm font-semibold text-default">Contact Concierge</h2>
                        <div className="mt-3 space-y-2 text-sm text-muted">
                            <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                +1 (800) 555-0199
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary" />
                                concierge@driveluxury.com
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                            <textarea
                                required
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe your issue or question..."
                                className="w-full resize-none rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default placeholder:text-muted focus:outline-none focus:border-primary"
                            />
                            <button
                                type="submit"
                                className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                            >
                                Send Message
                            </button>
                            {sent && <p className="text-sm font-medium text-success">Message sent.</p>}
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}