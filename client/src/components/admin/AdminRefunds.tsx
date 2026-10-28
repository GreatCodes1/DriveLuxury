import { useEffect, useState } from "react"
import {
    Check,
    Eye,
    Loader2,
    RefreshCcw,
    X,
} from "lucide-react"
import { AdminLayout } from "../../components/admin/AdminLayout"
import { apiFetch } from "../../lib/api"
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
    bookingid: number
    userid: number
    transactionid: number | null
    amount: number
    reason: string | null
    status: RefundStatus
    refund_method: string | null
    payment_provider_reference: string | null
    refund_provider_reference: string | null
    admin_note: string | null
    failure_reason: string | null
    requested_at: string
    reviewed_at: string | null
    completed_at: string | null
    account_name: string | null
    bank_name: string | null
    account_number: string | null
    account_number_last4: string | null
    details_submitted_at: string | null
    customer_name: string
    customer_email: string
    customer_phone: string | null
    vehicle_name: string
    booking_status: string
    startdate: string
    enddate: string
}

interface PopupState {
    message: string
    error: boolean
}

type ModalMode =
    | "details"
    | "reject"
    | "complete"
    | null

const STATUS_STYLES: Record<
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

const formatDate = (value: string | null) => {
    if (!value) return "—"

    return new Date(value).toLocaleString()
}

export default function AdminRefunds() {
    const [refunds, setRefunds] = useState<
        RefundRequest[]
    >([])

    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] =
        useState<number | null>(null)

    const [popup, setPopup] =
        useState<PopupState | null>(null)

    const [selectedRefund, setSelectedRefund] =
        useState<RefundRequest | null>(null)

    const [modalMode, setModalMode] =
        useState<ModalMode>(null)

    const [adminNote, setAdminNote] = useState("")
    const [
        providerReference,
        setProviderReference,
    ] = useState("")

    const loadRefunds = async () => {
        try {
            const data =
                await apiFetch<RefundRequest[]>(
                    "/admin/refunds"
                )

            setRefunds(data)
        } catch (err) {
            setPopup({
                message:
                    err instanceof Error
                        ? err.message
                        : "Unable to load refund requests.",
                error: true,
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRefunds()
    }, [])

    const openModal = (
        refund: RefundRequest,
        mode: Exclude<ModalMode, null>
    ) => {
        setSelectedRefund(refund)
        setModalMode(mode)
        setAdminNote("")
        setProviderReference("")
    }

    const closeModal = () => {
        setSelectedRefund(null)
        setModalMode(null)
        setAdminNote("")
        setProviderReference("")
    }

    const handleApprove = async (
        refund: RefundRequest
    ) => {
        setProcessingId(refund.id)

        try {
            const response =
                await apiFetch<{ message: string }>(
                    `/admin/refunds/${refund.id}/approve`,
                    {
                        method: "PATCH",
                    }
                )

            setPopup({
                message: response.message,
                error: false,
            })

            if (selectedRefund?.id === refund.id) {
                closeModal()
            }

            await loadRefunds()
        } catch (err) {
            setPopup({
                message:
                    err instanceof Error
                        ? err.message
                        : "Unable to approve refund.",
                error: true,
            })
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async () => {
        if (!selectedRefund) return

        if (!adminNote.trim()) {
            setPopup({
                message:
                    "A rejection reason is required.",
                error: true,
            })
            return
        }

        setProcessingId(selectedRefund.id)

        try {
            const response =
                await apiFetch<{ message: string }>(
                    `/admin/refunds/${selectedRefund.id}/reject`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            adminNote: adminNote.trim(),
                        }),
                    }
                )

            setPopup({
                message: response.message,
                error: false,
            })

            closeModal()
            await loadRefunds()
        } catch (err) {
            setPopup({
                message:
                    err instanceof Error
                        ? err.message
                        : "Unable to reject refund.",
                error: true,
            })
        } finally {
            setProcessingId(null)
        }
    }

    const handleComplete = async () => {
        if (!selectedRefund) return

        if (
            !selectedRefund.account_name ||
            !selectedRefund.bank_name ||
            !selectedRefund.account_number
        ) {
            setPopup({
                message:
                    "The customer's complete refund account details are missing.",
                error: true,
            })
            return
        }

        if (
            !selectedRefund.payment_provider_reference
        ) {
            setPopup({
                message:
                    "The original Paystack reference is missing.",
                error: true,
            })
            return
        }

        if (!providerReference.trim()) {
            setPopup({
                message:
                    "Enter the manual transfer reference.",
                error: true,
            })
            return
        }

        setProcessingId(selectedRefund.id)

        try {
            const response =
                await apiFetch<{ message: string }>(
                    `/admin/refunds/${selectedRefund.id}/complete`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            providerReference:
                                providerReference.trim(),
                            adminNote:
                                adminNote.trim() || null,
                        }),
                    }
                )

            setPopup({
                message: response.message,
                error: false,
            })

            closeModal()
            await loadRefunds()
        } catch (err) {
            setPopup({
                message:
                    err instanceof Error
                        ? err.message
                        : "Unable to complete refund.",
                error: true,
            })
        } finally {
            setProcessingId(null)
        }
    }

    const canComplete =
        selectedRefund?.status === "approved" &&
        Boolean(selectedRefund.account_name) &&
        Boolean(selectedRefund.bank_name) &&
        Boolean(selectedRefund.account_number) &&
        Boolean(
            selectedRefund.payment_provider_reference
        )

    return (
        <AdminLayout>
            {popup && (
                <Popup
                    message={popup.message}
                    error={popup.error}
                    onClose={() => setPopup(null)}
                />
            )}

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-default">
                            Refund Requests
                        </h1>

                        <p className="mt-1 text-sm text-muted">
                            Review refund requests and record manual transfers.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setLoading(true)
                            loadRefunds()
                        }}
                        className="flex items-center justify-center gap-2 rounded-md border border-default px-3 py-2 text-sm font-semibold text-default hover:bg-surface-alt"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-default bg-card p-8">
                        <p className="text-sm text-muted">
                            Loading refund requests...
                        </p>
                    </div>
                ) : refunds.length === 0 ? (
                    <div className="rounded-xl border border-default bg-card p-8 text-center">
                        <p className="text-sm text-muted">
                            No refund requests found.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-default bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                                    <tr>
                                        <th className="px-4 py-3">
                                            Request
                                        </th>

                                        <th className="px-4 py-3">
                                            Customer
                                        </th>

                                        <th className="px-4 py-3">
                                            Amount
                                        </th>

                                        <th className="px-4 py-3">
                                            Status
                                        </th>

                                        <th className="px-4 py-3">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {refunds.map(
                                        (refund) => (
                                            <tr
                                                key={
                                                    refund.id
                                                }
                                                className="border-b border-default last:border-0"
                                            >
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-default">
                                                        Refund #
                                                        {
                                                            refund.id
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-muted">
                                                        Booking #
                                                        {
                                                            refund.bookingid
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <p className="font-medium text-default">
                                                        {
                                                            refund.customer_name
                                                        }
                                                    </p>

                                                    <p className="text-xs text-muted">
                                                        {
                                                            refund.customer_email
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4 font-semibold text-default">
                                                    $
                                                    {Number(
                                                        refund.amount
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={[
                                                            "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                                                            STATUS_STYLES[
                                                                refund
                                                                    .status
                                                            ],
                                                        ].join(
                                                            " "
                                                        )}
                                                    >
                                                        {
                                                            refund.status
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openModal(
                                                                    refund,
                                                                    "details"
                                                                )
                                                            }
                                                            className="flex items-center gap-1 rounded-md border border-default px-3 py-2 text-xs font-semibold text-default hover:border-primary"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            View Details
                                                        </button>

                                                        {refund.status ===
                                                            "pending" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        refund
                                                                    )
                                                                }
                                                                disabled={
                                                                    processingId ===
                                                                    refund.id
                                                                }
                                                                className="flex items-center gap-1 rounded-md bg-success px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                                            >
                                                                {processingId ===
                                                                refund.id ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <Check className="h-3.5 w-3.5" />
                                                                )}
                                                                Approve
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {selectedRefund && modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-default bg-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-default">
                                    {modalMode ===
                                    "details"
                                        ? "Refund Details"
                                        : modalMode ===
                                            "reject"
                                            ? "Reject Refund"
                                            : "Complete Manual Refund"}
                                </h2>

                                <p className="mt-1 text-sm text-muted">
                                    Refund #
                                    {selectedRefund.id} · $
                                    {Number(
                                        selectedRefund.amount
                                    ).toFixed(2)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-muted hover:text-default"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {modalMode === "details" && (
                            <div className="mt-5 space-y-5">
                                <section>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                                        Refund
                                    </h3>

                                    <div className="mt-3 space-y-2">
                                        <InfoRow
                                            label="Refund ID"
                                            value={`#${selectedRefund.id}`}
                                        />

                                        <InfoRow
                                            label="Booking ID"
                                            value={`#${selectedRefund.bookingid}`}
                                        />

                                        <InfoRow
                                            label="Amount"
                                            value={`$${Number(
                                                selectedRefund.amount
                                            ).toFixed(2)}`}
                                        />

                                        <div className="flex justify-between gap-4 text-sm">
                                            <span className="text-muted">
                                                Status
                                            </span>

                                            <span
                                                className={[
                                                    "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                                                    STATUS_STYLES[
                                                        selectedRefund
                                                            .status
                                                    ],
                                                ].join(" ")}
                                            >
                                                {
                                                    selectedRefund.status
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </section>

                                <section className="border-t border-default pt-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                                        Customer
                                    </h3>

                                    <div className="mt-3 space-y-2">
                                        <InfoRow
                                            label="Name"
                                            value={
                                                selectedRefund.customer_name
                                            }
                                        />

                                        <InfoRow
                                            label="Email"
                                            value={
                                                selectedRefund.customer_email
                                            }
                                        />

                                        {selectedRefund.customer_phone && (
                                            <InfoRow
                                                label="Phone"
                                                value={
                                                    selectedRefund.customer_phone
                                                }
                                            />
                                        )}
                                    </div>
                                </section>

                                <section className="border-t border-default pt-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                                        Vehicle and Rental
                                    </h3>

                                    <div className="mt-3 space-y-2">
                                        <InfoRow
                                            label="Vehicle"
                                            value={
                                                selectedRefund.vehicle_name
                                            }
                                        />

                                        <InfoRow
                                            label="Rental dates"
                                            value={`${selectedRefund.startdate} → ${selectedRefund.enddate}`}
                                        />

                                        <InfoRow
                                            label="Booking status"
                                            value={
                                                selectedRefund.booking_status
                                            }
                                        />
                                    </div>
                                </section>

                                <section className="border-t border-default pt-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                                        Refund Account
                                    </h3>

                                    {selectedRefund.account_name &&
                                    selectedRefund.bank_name &&
                                    selectedRefund.account_number ? (
                                        <div className="mt-3 space-y-2">
                                            <InfoRow
                                                label="Account name"
                                                value={
                                                    selectedRefund.account_name
                                                }
                                            />

                                            <InfoRow
                                                label="Bank"
                                                value={
                                                    selectedRefund.bank_name
                                                }
                                            />

                                            <InfoRow
                                                label="Account number"
                                                value={
                                                    selectedRefund.account_number
                                                }
                                                mono
                                            />
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm text-warning">
                                            Customer refund account details have not been submitted.
                                        </p>
                                    )}
                                </section>

                                <section className="border-t border-default pt-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                                        Payment References
                                    </h3>

                                    <div className="mt-3 space-y-2">
                                        <InfoRow
                                            label="Paystack reference"
                                            value={
                                                selectedRefund.payment_provider_reference ??
                                                "Not recorded"
                                            }
                                            mono
                                        />

                                        <InfoRow
                                            label="Manual refund reference"
                                            value={
                                                selectedRefund.refund_provider_reference ??
                                                "Not recorded"
                                            }
                                            mono
                                        />
                                    </div>
                                </section>

                                <section className="border-t border-default pt-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                                        Notes
                                    </h3>

                                    <div className="mt-3 space-y-2 text-sm">
                                        <p className="text-default">
                                            <span className="font-medium">
                                                Customer reason:
                                            </span>{" "}
                                            {selectedRefund.reason ??
                                                "—"}
                                        </p>

                                        <p className="text-default">
                                            <span className="font-medium">
                                                Admin note:
                                            </span>{" "}
                                            {selectedRefund.admin_note ??
                                                "—"}
                                        </p>

                                        {selectedRefund.failure_reason && (
                                            <p className="text-error">
                                                <span className="font-medium">
                                                    Failure reason:
                                                </span>{" "}
                                                {
                                                    selectedRefund.failure_reason
                                                }
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <section className="border-t border-default pt-4 text-xs text-muted">
                                    <p>
                                        Requested:{" "}
                                        {formatDate(
                                            selectedRefund.requested_at
                                        )}
                                    </p>

                                    <p>
                                        Reviewed:{" "}
                                        {formatDate(
                                            selectedRefund.reviewed_at
                                        )}
                                    </p>

                                    <p>
                                        Completed:{" "}
                                        {formatDate(
                                            selectedRefund.completed_at
                                        )}
                                    </p>
                                </section>

                                <div className="flex flex-wrap gap-2 border-t border-default pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 rounded-md border border-default px-4 py-2.5 text-sm font-semibold text-default hover:bg-surface-alt"
                                    >
                                        Close
                                    </button>

                                    {selectedRefund.status ===
                                        "pending" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setModalMode(
                                                        "reject"
                                                    )
                                                }
                                                className="flex-1 rounded-md border border-error px-4 py-2.5 text-sm font-semibold text-error hover:bg-error hover:text-white"
                                            >
                                                Reject
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleApprove(
                                                        selectedRefund
                                                    )
                                                }
                                                disabled={
                                                    processingId ===
                                                    selectedRefund.id
                                                }
                                                className="flex-1 rounded-md bg-success px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                                            >
                                                Approve
                                            </button>
                                        </>
                                    )}

                                    {selectedRefund.status ===
                                        "approved" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setModalMode(
                                                    "complete"
                                                )
                                            }
                                            disabled={!canComplete}
                                            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Complete Manually
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {modalMode === "reject" && (
                            <>
                                <label className="mt-5 block">
                                    <span className="text-sm font-medium text-default">
                                        Rejection reason
                                    </span>

                                    <textarea
                                        value={adminNote}
                                        onChange={(event) =>
                                            setAdminNote(
                                                event.target.value
                                            )
                                        }
                                        rows={4}
                                        placeholder="Explain why this refund is being rejected."
                                        className="mt-2 w-full rounded-md border border-default bg-transparent px-3 py-2 text-sm text-default outline-none focus:border-primary"
                                    />
                                </label>

                                <div className="mt-6 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 rounded-md border border-default px-4 py-2.5 text-sm font-semibold text-default hover:bg-surface-alt"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleReject}
                                        disabled={
                                            processingId ===
                                            selectedRefund.id
                                        }
                                        className="flex-1 rounded-md bg-error px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        {processingId ===
                                        selectedRefund.id ? (
                                            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                        ) : (
                                            "Reject Refund"
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {modalMode === "complete" && (
                            <>
                                <div className="mt-5 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                                    Confirm that you have sent the refund to the account shown above before marking it as completed.
                                </div>

                                <div className="mt-4 rounded-md border border-default bg-surface p-3">
                                    <p className="text-xs uppercase tracking-wide text-muted">
                                        Send to
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-default">
                                        {selectedRefund.account_name ??
                                            "Account name unavailable"}
                                    </p>

                                    <p className="text-sm text-muted">
                                        {selectedRefund.bank_name ??
                                            "Bank unavailable"}
                                    </p>

                                    <p className="font-mono text-sm font-semibold text-default">
                                        {selectedRefund.account_number ??
                                            "Account number unavailable"}
                                    </p>
                                </div>

                                <label className="mt-5 block">
                                    <span className="text-sm font-medium text-default">
                                        Manual transfer reference
                                    </span>

                                    <input
                                        value={
                                            providerReference
                                        }
                                        onChange={(event) =>
                                            setProviderReference(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Bank transfer reference"
                                        className="mt-2 w-full rounded-md border border-default bg-transparent px-3 py-2 text-sm text-default outline-none focus:border-primary"
                                    />
                                </label>

                                <label className="mt-4 block">
                                    <span className="text-sm font-medium text-default">
                                        Admin note
                                    </span>

                                    <textarea
                                        value={adminNote}
                                        onChange={(event) =>
                                            setAdminNote(
                                                event.target.value
                                            )
                                        }
                                        rows={3}
                                        placeholder="Optional note"
                                        className="mt-2 w-full rounded-md border border-default bg-transparent px-3 py-2 text-sm text-default outline-none focus:border-primary"
                                    />
                                </label>

                                <div className="mt-6 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 rounded-md border border-default px-4 py-2.5 text-sm font-semibold text-default hover:bg-surface-alt"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleComplete}
                                        disabled={
                                            processingId ===
                                                selectedRefund.id ||
                                            !canComplete
                                        }
                                        className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processingId ===
                                        selectedRefund.id ? (
                                            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                        ) : (
                                            "Mark Refund Completed"
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}

interface InfoRowProps {
    label: string
    value: string
    mono?: boolean
}

function InfoRow({
    label,
    value,
    mono = false,
}: InfoRowProps) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="shrink-0 text-muted">
                {label}
            </span>

            <span
                className={[
                    "max-w-[65%] break-words text-right font-medium text-default",
                    mono ? "font-mono text-xs" : "",
                ].join(" ")}
            >
                {value}
            </span>
        </div>
    )
}