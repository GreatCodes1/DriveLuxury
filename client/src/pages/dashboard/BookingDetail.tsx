import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    MapPin,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
} from "lucide-react"
import { DashboardLayout } from "../../components/dashboard/DashboardLayout"
import { apiFetch } from "../../lib/api"
import { formatDateOnly } from "../../lib/dates"
import Popup from "../../components/Popup"

type RefundStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "completed"
    | "failed"

interface RefundRequest {
    id: number
    amount: number
    reason: string | null
    status: RefundStatus
    refund_method: string | null
    provider_reference: string | null
    admin_note: string | null
    requested_at: string
    reviewed_at: string | null
    completed_at: string | null
    account_name: string | null
    bank_name: string | null
    account_number_last4: string | null
    details_submitted_at: string | null
}

interface BookingDetail {
    id: number
    vehicleid: number
    vehiclename: string
    vehiclecategory: string
    img_url: string
    brand: string | null
    model: string | null
    year: number | null
    colour: string | null
    dailyprice: number
    startdate: string
    enddate: string
    totalprice: number
    status:
        | "pending"
        | "confirmed"
        | "rented"
        | "completed"
        | "cancelled"
    refund: RefundRequest | null
}

interface CancellationSettings {
    hours: number
}

interface CancelResponse {
    message: string
    refundRequested: boolean
    refundRequestId: number | null
    refundStatus: RefundStatus | null
    refundAmount: number
}

interface PopupState {
    message: string
    error: boolean
}

const STATUS_STYLES: Record<
    BookingDetail["status"],
    string
> = {
    pending: "bg-warning/10 text-warning",
    confirmed: "bg-success/10 text-success",
    rented: "bg-success/10 text-success",
    completed: "bg-[var(--border)] text-muted",
    cancelled: "bg-error/10 text-error",
}

const REFUND_STATUS_STYLES: Record<
    RefundStatus,
    string
> = {
    pending: "bg-warning/10 text-warning",
    approved: "bg-primary/10 text-primary",
    processing: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    rejected: "bg-error/10 text-error",
    failed: "bg-error/10 text-error",
}

export default function BookingDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [booking, setBooking] =
        useState<BookingDetail | null>(null)

    const [
        cancellationWindowHours,
        setCancellationWindowHours,
    ] = useState(24)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [popup, setPopup] = useState<PopupState | null>(
        null
    )

    const [isCancelling, setIsCancelling] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const [showRefundDetails, setShowRefundDetails] =
        useState(false)

    const [accountName, setAccountName] = useState("")
    const [bankName, setBankName] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [
        isSavingRefundDetails,
        setIsSavingRefundDetails,
    ] = useState(false)

    const loadBooking = async () => {
        if (!id) {
            throw new Error("Booking ID is missing.")
        }

        const [
            bookingData,
            settingsData,
        ] = await Promise.all([
            apiFetch<BookingDetail>(`/booking/${id}`),
            apiFetch<CancellationSettings>(
                "/settings/cancellation-window"
            ),
        ])

        setBooking(bookingData)
        setCancellationWindowHours(
            Number(settingsData.hours) || 24
        )
    }

    useEffect(() => {
        let mounted = true

        const initialise = async () => {
            try {
                setLoading(true)
                setError(null)

                await loadBooking()
            } catch (err) {
                if (!mounted) return

                const message =
                    err instanceof Error
                        ? err.message
                        : "Couldn't load this booking."

                setError(message)
                setPopup({
                    message,
                    error: true,
                })
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        initialise()

        return () => {
            mounted = false
        }
    }, [id])

    const handleCancel = async () => {
        if (!booking) return

        setIsCancelling(true)
        setError(null)

        try {
            const response =
                await apiFetch<CancelResponse>(
                    `/booking/${booking.id}/cancel`,
                    {
                        method: "POST",
                    }
                )

            await loadBooking()
            setShowConfirm(false)

            setPopup({
                message:
                    response.message ||
                    "Booking cancelled successfully.",
                error: false,
            })
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Couldn't cancel this booking."

            setError(message)
            setShowConfirm(false)

            setPopup({
                message,
                error: true,
            })
        } finally {
            setIsCancelling(false)
        }
    }

    const handleRefundDetailsSubmit = async () => {
        if (!booking) return

        const trimmedAccountName =
            accountName.trim()
        const trimmedBankName = bankName.trim()
        const trimmedAccountNumber =
            accountNumber.trim()

        if (!trimmedAccountName) {
            setPopup({
                message: "Enter the account holder name.",
                error: true,
            })
            return
        }

        if (!trimmedBankName) {
            setPopup({
                message: "Enter the bank name.",
                error: true,
            })
            return
        }

        if (!/^\d{10}$/.test(trimmedAccountNumber)) {
            setPopup({
                message:
                    "Enter a valid 10-digit bank account number.",
                error: true,
            })
            return
        }

        setIsSavingRefundDetails(true)

        try {
            await apiFetch(
                `/booking/${booking.id}/refund-details`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        accountName:
                            trimmedAccountName,
                        bankName: trimmedBankName,
                        accountNumber:
                            trimmedAccountNumber,
                    }),
                }
            )

            await loadBooking()

            setAccountName("")
            setBankName("")
            setAccountNumber("")
            setShowRefundDetails(false)

            setPopup({
                message:
                    "Refund account details submitted successfully.",
                error: false,
            })
        } catch (err) {
            setPopup({
                message:
                    err instanceof Error
                        ? err.message
                        : "Unable to submit refund details.",
                error: true,
            })
        } finally {
            setIsSavingRefundDetails(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                {popup && (
                    <Popup
                        message={popup.message}
                        error={popup.error}
                        onClose={() => setPopup(null)}
                    />
                )}

                <p className="text-sm text-muted">
                    Loading booking...
                </p>
            </DashboardLayout>
        )
    }

    if (!booking) {
        return (
            <DashboardLayout>
                {popup && (
                    <Popup
                        message={popup.message}
                        error={popup.error}
                        onClose={() => setPopup(null)}
                    />
                )}

                <p className="text-sm font-medium text-error">
                    {error ?? "Booking not found."}
                </p>
            </DashboardLayout>
        )
    }

    const hoursUntilStart =
        (new Date(booking.startdate).getTime() -
            Date.now()) /
        (1000 * 60 * 60)

    const isCancellable =
        booking.status !== "cancelled" &&
        booking.status !== "completed" &&
        booking.status !== "rented"

    const withinCancelWindow =
        hoursUntilStart >= cancellationWindowHours

    const canCancel =
        isCancellable && withinCancelWindow

    const canSubmitRefundDetails =
        booking.status === "cancelled" &&
        booking.refund?.status === "pending" &&
        !booking.refund.details_submitted_at

    const specs = [
        booking.brand,
        booking.model,
        booking.year
            ? String(booking.year)
            : null,
        booking.colour,
    ].filter(Boolean)

    return (
        <DashboardLayout>
            {popup && (
                <Popup
                    message={popup.message}
                    error={popup.error}
                    onClose={() => setPopup(null)}
                />
            )}

            <button
                type="button"
                onClick={() =>
                    navigate("/dashboard/bookings")
                }
                className="text-sm font-medium text-muted hover:text-default"
            >
                ← Back to My Bookings
            </button>

            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl border border-default bg-card">
                        <img
                            src={booking.img_url}
                            alt={booking.vehiclename}
                            className="h-56 w-full object-cover"
                        />

                        <div className="p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                    {booking.vehiclecategory}
                                </p>

                                <span
                                    className={[
                                        "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                                        STATUS_STYLES[
                                            booking.status
                                        ],
                                    ].join(" ")}
                                >
                                    {booking.status}
                                </span>
                            </div>

                            <h1 className="mt-1 text-2xl font-bold text-default">
                                {booking.vehiclename}
                            </h1>

                            {specs.length > 0 && (
                                <p className="mt-1 text-sm text-muted">
                                    {specs.join(" · ")}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-default bg-card p-5">
                        <h2 className="text-sm font-semibold text-default">
                            Rental Details
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <p className="flex items-center gap-2 text-default">
                                <Calendar className="h-4 w-4 shrink-0 text-primary" />

                                {formatDateOnly(
                                    booking.startdate,
                                    "long"
                                )}{" "}
                                →{" "}
                                {formatDateOnly(
                                    booking.enddate,
                                    "long"
                                )}
                            </p>

                            <p className="flex items-center gap-2 text-muted">
                                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                                Pickup location not recorded for this booking
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p className="flex items-center gap-2 text-sm font-medium text-error">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            {error}
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-default bg-card p-5">
                        <p className="text-[10px] uppercase tracking-wide text-muted">
                            Booking Reference
                        </p>

                        <p className="mt-1 text-lg font-bold text-default">
                            #{booking.id}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-default pt-4">
                            <span className="text-sm font-semibold text-default">
                                Total Price
                            </span>

                            <span className="text-lg font-bold text-default">
                                $
                                {Number(
                                    booking.totalprice
                                ).toFixed(2)}
                            </span>
                        </div>

                        {booking.refund && (
                            <div className="mt-4 border-t border-default pt-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-semibold text-default">
                                        Refund Status
                                    </span>

                                    <span
                                        className={[
                                            "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                                            REFUND_STATUS_STYLES[
                                                booking.refund
                                                    .status
                                            ],
                                        ].join(" ")}
                                    >
                                        {booking.refund.status}
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-muted">
                                    Refund amount: $
                                    {Number(
                                        booking.refund.amount
                                    ).toFixed(2)}
                                </p>

                                {booking.refund.status ===
                                    "pending" && (
                                    <p className="mt-2 text-xs text-warning">
                                        Your refund request is awaiting review.
                                    </p>
                                )}

                                {booking.refund.status ===
                                    "approved" && (
                                    <p className="mt-2 text-xs text-primary">
                                        Your refund was approved and is awaiting manual processing.
                                    </p>
                                )}

                                {booking.refund.status ===
                                    "processing" && (
                                    <p className="mt-2 text-xs text-primary">
                                        Your refund is being processed.
                                    </p>
                                )}

                                {booking.refund.status ===
                                    "completed" && (
                                    <p className="mt-2 text-xs text-success">
                                        Your refund has been completed.
                                    </p>
                                )}

                                {(booking.refund.status ===
                                    "rejected" ||
                                    booking.refund.status ===
                                        "failed") && (
                                    <p className="mt-2 text-xs text-error">
                                        Your refund could not be completed. Please contact support.
                                    </p>
                                )}

                                {booking.refund.admin_note && (
                                    <p className="mt-2 text-xs text-muted">
                                        Note:{" "}
                                        {
                                            booking.refund
                                                .admin_note
                                        }
                                    </p>
                                )}

                                {booking.refund
                                    .details_submitted_at &&
                                    booking.refund
                                        .bank_name &&
                                    booking.refund
                                        .account_number_last4 && (
                                        <p className="mt-2 text-xs text-muted">
                                            Refund account:{" "}
                                            {
                                                booking.refund
                                                    .bank_name
                                            }{" "}
                                            ending in{" "}
                                            {
                                                booking.refund
                                                    .account_number_last4
                                            }
                                        </p>
                                    )}
                            </div>
                        )}
                    </div>

                    {canSubmitRefundDetails && (
                        <div className="rounded-xl border border-default bg-card p-5">
                            <p className="text-sm font-semibold text-default">
                                Refund Account Details
                            </p>

                            <p className="mt-1 text-xs text-muted">
                                Provide the bank account where you want to receive the manual refund.
                            </p>

                            {!showRefundDetails ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowRefundDetails(
                                            true
                                        )
                                    }
                                    className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                                >
                                    Add Refund Account
                                </button>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    <input
                                        value={accountName}
                                        onChange={(event) =>
                                            setAccountName(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Account holder name"
                                        autoComplete="name"
                                        className="w-full rounded-md border border-default bg-transparent px-3 py-2.5 text-sm text-default outline-none focus:border-primary"
                                    />

                                    <input
                                        value={bankName}
                                        onChange={(event) =>
                                            setBankName(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Bank name"
                                        autoComplete="organization"
                                        className="w-full rounded-md border border-default bg-transparent px-3 py-2.5 text-sm text-default outline-none focus:border-primary"
                                    />

                                    <input
                                        value={accountNumber}
                                        onChange={(event) =>
                                            setAccountNumber(
                                                event.target.value.replace(
                                                    /\D/g,
                                                    ""
                                                )
                                            )
                                        }
                                        maxLength={10}
                                        inputMode="numeric"
                                        autoComplete="off"
                                        placeholder="10-digit account number"
                                        className="w-full rounded-md border border-default bg-transparent px-3 py-2.5 text-sm text-default outline-none focus:border-primary"
                                    />

                                    <p className="text-[11px] text-muted">
                                        We will use these details only to process your approved manual refund.
                                    </p>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={
                                                handleRefundDetailsSubmit
                                            }
                                            disabled={
                                                isSavingRefundDetails
                                            }
                                            className="flex-1 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isSavingRefundDetails
                                                ? "Saving..."
                                                : "Submit Details"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowRefundDetails(
                                                    false
                                                )
                                            }
                                            disabled={
                                                isSavingRefundDetails
                                            }
                                            className="flex-1 rounded-md border border-default px-3 py-2.5 text-sm font-semibold text-default hover:bg-surface-alt"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="rounded-xl border border-default bg-card p-5">
                        {booking.status === "cancelled" && (
                            <div className="space-y-2">
                                <p className="flex items-center gap-2 text-sm font-medium text-error">
                                    <XCircle className="h-4 w-4 shrink-0" />
                                    This booking has been cancelled.
                                </p>

                                {booking.refund ? (
                                    <p className="text-xs text-muted">
                                        Refund request status:{" "}
                                        <span className="font-semibold capitalize">
                                            {
                                                booking.refund
                                                    .status
                                            }
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted">
                                        No paid transaction was found for this booking.
                                    </p>
                                )}
                            </div>
                        )}

                        {booking.status === "completed" && (
                            <p className="flex items-center gap-2 text-sm font-medium text-muted">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                This rental is complete.
                            </p>
                        )}

                        {booking.status === "rented" && (
                            <p className="flex items-center gap-2 text-sm font-medium text-warning">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                This rental is currently active and cannot be cancelled online.
                            </p>
                        )}

                        {isCancellable && (
                            <>
                                <p
                                    className={[
                                        "flex items-start gap-2 text-xs",
                                        withinCancelWindow
                                            ? "text-muted"
                                            : "text-warning",
                                    ].join(" ")}
                                >
                                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                                    {withinCancelWindow
                                        ? `Free cancellation is available up until ${cancellationWindowHours} hours before pickup.`
                                        : `This booking starts in less than ${cancellationWindowHours} hours, so it can no longer be cancelled here.`}
                                </p>

                                {!showConfirm ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirm(true)
                                        }
                                        disabled={!canCancel}
                                        className="mt-4 w-full rounded-md border border-error px-4 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-error"
                                    >
                                        Cancel Booking
                                    </button>
                                ) : (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm font-medium text-default">
                                            Cancel this booking? If payment was completed, a refund request will be sent for review.
                                        </p>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={
                                                    handleCancel
                                                }
                                                disabled={
                                                    isCancelling
                                                }
                                                className="flex-1 rounded-md bg-error px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isCancelling
                                                    ? "Cancelling..."
                                                    : "Yes, Cancel"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirm(
                                                        false
                                                    )
                                                }
                                                disabled={
                                                    isCancelling
                                                }
                                                className="flex-1 rounded-md border border-default px-4 py-2 text-sm font-semibold text-default hover:bg-surface-alt"
                                            >
                                                Keep Booking
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}