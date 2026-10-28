import { CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

interface ConfirmationStepProps {
    bookingId: string | number
}

export function ConfirmationStep({ bookingId }: ConfirmationStepProps) {
    return (
        <div className="mx-auto max-w-md rounded-xl border border-default bg-card p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-xl font-bold text-default">Booking Confirmed!</h1>
            <p className="mt-2 text-sm text-muted">
                Your reservation #{bookingId} is locked in. A confirmation and pickup instructions
                have been sent to your email.
            </p>

            <Link
                to="/"
                className="mt-6 inline-block w-full rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
                Back to Home
            </Link>
        </div>
    )
}