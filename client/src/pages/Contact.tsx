import { useState, type FormEvent } from "react"
import { Mail, Phone, MapPin } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { apiFetch } from "../lib/api"
import Popup from "../components/Popup"

interface PopupState {
    message: string
    error: boolean
}

export default function Contact() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [popup, setPopup] = useState<PopupState | null>(
        null
    )

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setSent(false)
        setIsSubmitting(true)

        try {
            await apiFetch("/contact", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    subject,
                    message,
                }),
            })

            setSent(true)

            setPopup({
                message: "Message sent — we'll be in touch.",
                error: false,
            })

            setName("")
            setEmail("")
            setPhone("")
            setSubject("")
            setMessage("")
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Couldn't send your message."

            setError(errorMessage)

            setPopup({
                message: errorMessage,
                error: true,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface text-default pt-15">
            {popup && (
                <Popup
                    message={popup.message}
                    error={popup.error}
                    onClose={() => setPopup(null)}
                />
            )}

            <Navbar />

            <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Get In Touch
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-default">
                        Contact DRIVEluxury
                    </h1>

                    <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
                        Questions about a reservation, a vehicle, or becoming a partner? Send us a message and our concierge team will follow up.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-xl border border-default bg-card p-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Phone className="h-4 w-4" />
                            </span>

                            <div>
                                <p className="text-sm font-semibold text-default">
                                    Phone
                                </p>

                                <p className="text-xs text-muted">
                                    +1 (800) 555-0199
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-default bg-card p-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Mail className="h-4 w-4" />
                            </span>

                            <div>
                                <p className="text-sm font-semibold text-default">
                                    Email
                                </p>

                                <p className="text-xs text-muted">
                                    concierge@driveluxury.com
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-default bg-card p-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <MapPin className="h-4 w-4" />
                            </span>

                            <div>
                                <p className="text-sm font-semibold text-default">
                                    Locations
                                </p>

                                <p className="text-xs text-muted">
                                    Serving major metros nationwide
                                </p>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4 rounded-xl border border-default bg-card p-6"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                    Name
                                </label>

                                <input
                                    required
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                    Email
                                </label>

                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                    Phone (optional)
                                </label>

                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(e.target.value)
                                    }
                                    className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                    Subject
                                </label>

                                <input
                                    value={subject}
                                    onChange={(e) =>
                                        setSubject(e.target.value)
                                    }
                                    className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                Message
                            </label>

                            <textarea
                                required
                                rows={5}
                                value={message}
                                onChange={(e) =>
                                    setMessage(e.target.value)
                                }
                                className="mt-1.5 w-full resize-none rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:border-primary focus:outline-none"
                            />
                        </div>

                        {error && (
                            <p className="text-sm font-medium text-error">
                                {error}
                            </p>
                        )}

                        {sent && (
                            <p className="text-sm font-medium text-success">
                                Message sent — we'll be in touch.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting
                                ? "Sending..."
                                : "Send Message"}
                        </button>
                    </form>
                </div>
            </main>
            <div className="hidden md:block">
                <Footer />
            </div>
        </div>
    )
}