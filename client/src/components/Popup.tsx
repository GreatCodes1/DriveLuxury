import { useEffect } from "react"
import { X, CheckCircle, AlertCircle } from "lucide-react"

interface PopupProps {
    message: string
    onClose: () => void
    error?: boolean
}

export default function Popup({
    message,
    onClose,
    error = false,
}: PopupProps) {
    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            onClose()
        }, 5000)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [onClose])

    return (
        <div
            role={error ? "alert" : "status"}
            aria-live="polite"
            className={[
                "fixed right-5 top-5 z-150 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-lg border px-4 py-3 shadow-lg",
                error
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700",
            ].join(" ")}
        >
            {error ? (
                <AlertCircle
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                />
            ) : (
                <CheckCircle
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                />
            )}

            <p className="flex-1 text-sm font-medium">
                {message}
            </p>

            <button
                type="button"
                onClick={onClose}
                aria-label="Close notification"
                className="rounded p-1 text-current transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current"
            >
                <X
                    className="h-4 w-4"
                    aria-hidden="true"
                />
            </button>
        </div>
    )
}