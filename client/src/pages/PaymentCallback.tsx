import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Loader2, XCircle } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { ConfirmationStep } from "../components/checkout/ConfirmationStep"
import { apiFetch } from "../lib/Api"

type Status = "verifying" | "success" | "error"

export default function PaymentCallback() {
    const [searchParams] = useSearchParams()
    const reference = searchParams.get("reference") ?? searchParams.get("trxref")

    const [status, setStatus] = useState<Status>("verifying")
    const [bookingId, setBookingId] = useState<string | number | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!reference) {
            setStatus("error")
            setError("No payment reference was found in the URL.")
            return
        }

        apiFetch(`/paystack/verify/${reference}`)
            .then((data) => {
                setBookingId(data.bookingId)
                setStatus("success")
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "We couldn't verify this payment.")
                setStatus("error")
            })
    }, [reference])

    return (
        <div className="min-h-screen bg-surface text-default">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                {status === "verifying" && (
                    <div className="mx-auto max-w-md rounded-xl border border-default bg-card p-10 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm text-muted">Verifying your payment...</p>
                    </div>
                )}

                {status === "success" && bookingId !== null && <ConfirmationStep bookingId={bookingId} />}

                {status === "error" && (
                    <div className="mx-auto max-w-md rounded-xl border border-default bg-card p-10 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
                            <XCircle className="h-8 w-8" />
                        </span>
                        <h1 className="mt-5 text-xl font-bold text-default">Payment Verification Failed</h1>
                        <p className="mt-2 text-sm text-muted">{error}</p>
                        <Link
                            to="/fleet"
                            className="mt-6 inline-block w-full rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                        >
                            Back to Fleet
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}