import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { CheckoutStepper } from "../components/checkout/CheckoutStepper"
import { VehicleStep } from "../components/checkout/VehicleStep"
import {
    DriverDetailsStep,
    type DriverDetails,
    type AddOn,
} from "../components/checkout/DriverDetailsStep"
import { PaymentStep } from "../components/checkout/PaymentStep"
import { ConfirmationStep } from "../components/checkout/ConfirmationStep"
import { type SavedCard } from "./dashboard/PaymentMethods"
import {
    BookingSummary,
    type LineItem,
} from "../components/checkout/BookingSummary"
import { apiFetch } from "../lib/api"
import Popup from "../components/Popup"

const STEPS = [
    "Vehicle",
    "Driver Details",
    "Payment Options",
    "Confirmation",
]

interface CheckoutState {
    vehicleId: string | number
    name: string
    category: string
    image: string
    dailyRate: number
    liabilityCover: boolean
    pickupLocation: string
    pickupDateTime: string
    returnDateTime: string
    days: number
}

interface PopupState {
    message: string
    error: boolean
}

const FALLBACK_STATE: CheckoutState = {
    vehicleId: 1,
    name: "Porsche 911 Carrera S",
    category: "Sports Car",
    image: "https://picsum.photos/seed/porsche911main/900/600",
    dailyRate: 380,
    liabilityCover: true,
    pickupLocation: "Los Angeles, CA (LAX)",
    pickupDateTime: new Date()
        .toISOString()
        .slice(0, 10),
    returnDateTime: new Date(
        Date.now() + 4 * 24 * 60 * 60 * 1000
    )
        .toISOString()
        .slice(0, 10),
    days: 4,
}

function formatDisplayDate(iso: string) {
    const date = new Date(iso)

    if (Number.isNaN(date.getTime())) {
        return iso
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export default function Checkout() {
    const location = useLocation()

    const vehicle =
        (location.state as CheckoutState | null) ??
        FALLBACK_STATE

    const [step, setStep] = useState(0)
    const [promoCode, setPromoCode] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [confirmedBookingId, setConfirmedBookingId] =
        useState<number | null>(null)

    const [popup, setPopup] = useState<PopupState | null>(
        null
    )

    const [savedCards, setSavedCards] = useState<SavedCard[]>(
        []
    )

    const [loadingSavedCards, setLoadingSavedCards] =
        useState(true)

    const [selectedCardId, setSelectedCardId] = useState<
        number | "new"
    >("new")

    const [saveNewCard, setSaveNewCard] = useState(false)

    useEffect(() => {
        apiFetch("/payment-methods")
            .then((cards: SavedCard[]) => {
                setSavedCards(cards)

                const defaultCard = cards.find(
                    (card) => card.is_default
                )

                if (defaultCard) {
                    setSelectedCardId(defaultCard.id)
                }
            })
            .catch((err) => {
                setPopup({
                    message:
                        err instanceof Error
                            ? err.message
                            : "Couldn't load saved payment methods.",
                    error: true,
                })
            })
            .finally(() => setLoadingSavedCards(false))
    }, [])

    const [driverDetails, setDriverDetails] =
        useState<DriverDetails>({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            licenseNumber: "",
            dateOfBirth: "",
            address: "",
        })

    const [addOns, setAddOns] = useState<AddOn[]>([
        {
            id: "gps",
            label: "GPS Navigation Terminal",
            description:
                "Highly precise real-time route optimization.",
            pricePerDay: 15,
            enabled: true,
        },
        {
            id: "child-seat",
            label: "Child Safety Suite",
            description:
                "Premium ISOFIX child seat set up upon delivery.",
            pricePerDay: 10,
            enabled: false,
        },
        {
            id: "extra-driver",
            label: "Additional Registered Operator",
            description:
                "Authorized coverage for secondary drivers.",
            pricePerDay: 25,
            enabled: false,
        },
    ])

    const handleDriverFieldChange = (
        field: keyof DriverDetails,
        value: string
    ) => {
        setDriverDetails((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const toggleAddOn = (id: string) => {
        setAddOns((prev) =>
            prev.map((addOn) =>
                addOn.id === id
                    ? {
                          ...addOn,
                          enabled: !addOn.enabled,
                      }
                    : addOn
            )
        )
    }

    const lineItems: LineItem[] = useMemo(() => {
        const items: LineItem[] = [
            {
                label: `${vehicle.name.split(" ")[0]} (${vehicle.days} Days)`,
                amount: vehicle.dailyRate * vehicle.days,
            },
        ]

        if (vehicle.liabilityCover) {
            items.push({
                label: "Luxury Cover Protection",
                amount: 45 * vehicle.days,
            })
        }

        addOns
            .filter((addOn) => addOn.enabled)
            .forEach((addOn) => {
                items.push({
                    label: addOn.label,
                    amount:
                        addOn.pricePerDay * vehicle.days,
                })
            })

        items.push({
            label: "Concierge Delivery Fee",
            amount: 65,
        })

        return items
    }, [vehicle, addOns])

    const total = lineItems.reduce(
        (sum, item) => sum + item.amount,
        0
    )

    const goToNextStep = async () => {
        setError(null)

        if (step === 1) {
            const {
                firstName,
                lastName,
                email,
                phone,
                licenseNumber,
                dateOfBirth,
                address,
            } = driverDetails

            if (
                !firstName ||
                !lastName ||
                !email ||
                !phone ||
                !licenseNumber ||
                !dateOfBirth ||
                !address
            ) {
                const message =
                    "Please fill in every driver detail field."

                setError(message)

                setPopup({
                    message,
                    error: true,
                })

                return
            }
        }

        if (step < 2) {
            setStep((prev) => prev + 1)
            return
        }

        setIsSubmitting(true)

        try {
            const booking = await apiFetch("/addBooking", {
                method: "POST",
                body: JSON.stringify({
                    vehicleId: vehicle.vehicleId,
                    startdate: vehicle.pickupDateTime,
                    enddate: vehicle.returnDateTime,
                    totalprice: total,
                    status: "pending",
                }),
            })

            if (typeof selectedCardId === "number") {
                await apiFetch("/paystack/charge-saved", {
                    method: "POST",
                    body: JSON.stringify({
                        bookingId: booking.id,
                        savedCardId: selectedCardId,
                    }),
                })

                setConfirmedBookingId(booking.id)
                setStep(3)

                setPopup({
                    message:
                        "Payment completed successfully.",
                    error: false,
                })
            } else {
                const payment = await apiFetch(
                    "/paystack/initialize",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            bookingId: booking.id,
                            saveCard: saveNewCard,
                        }),
                    }
                )

                window.location.href =
                    payment.authorization_url
            }
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."

            setError(message)

            setPopup({
                message,
                error: true,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const ctaLabel =
        step === 0
            ? "Continue"
            : step === 1
              ? "Continue to Payment"
              : "Pay Now"

    if (confirmedBookingId !== null) {
        return (
            <div className="min-h-screen bg-surface text-default">
                {popup && (
                    <Popup
                        message={popup.message}
                        error={popup.error}
                        onClose={() => setPopup(null)}
                    />
                )}

                <Navbar />

                <CheckoutStepper
                    steps={STEPS}
                    currentStep={3}
                />

                <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <ConfirmationStep
                        bookingId={confirmedBookingId}
                    />
                </main>

                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface text-default">
            {popup && (
                <Popup
                    message={popup.message}
                    error={popup.error}
                    onClose={() => setPopup(null)}
                />
            )}

            <Navbar />

            <CheckoutStepper
                steps={STEPS}
                currentStep={step}
            />

            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
                    <div>
                        {step === 0 && (
                            <VehicleStep
                                vehicleName={vehicle.name}
                                vehicleCategory={
                                    vehicle.category
                                }
                                vehicleImage={vehicle.image}
                                pickupLocation={
                                    vehicle.pickupLocation
                                }
                                pickupDateTime={formatDisplayDate(
                                    vehicle.pickupDateTime
                                )}
                                returnDateTime={formatDisplayDate(
                                    vehicle.returnDateTime
                                )}
                                days={vehicle.days}
                            />
                        )}

                        {step === 1 && (
                            <DriverDetailsStep
                                details={driverDetails}
                                onChange={
                                    handleDriverFieldChange
                                }
                                addOns={addOns}
                                onToggleAddOn={toggleAddOn}
                            />
                        )}

                        {step === 2 && (
                            <PaymentStep
                                savedCards={savedCards}
                                loadingSavedCards={
                                    loadingSavedCards
                                }
                                selectedCardId={
                                    selectedCardId
                                }
                                onSelectCard={
                                    setSelectedCardId
                                }
                                saveNewCard={saveNewCard}
                                onToggleSaveNewCard={
                                    setSaveNewCard
                                }
                            />
                        )}

                        {error && (
                            <p className="mt-4 text-sm font-medium text-error">
                                {error}
                            </p>
                        )}
                    </div>

                    <div>
                        <BookingSummary
                            vehicleName={vehicle.name}
                            vehicleCategory={vehicle.category}
                            vehicleImage={vehicle.image}
                            pickupLocation={
                                vehicle.pickupLocation
                            }
                            pickupDateTime={formatDisplayDate(
                                vehicle.pickupDateTime
                            )}
                            returnDateTime={formatDisplayDate(
                                vehicle.returnDateTime
                            )}
                            lineItems={lineItems}
                            promoCode={promoCode}
                            onPromoCodeChange={setPromoCode}
                            onApplyPromo={() => {}}
                            total={total}
                            ctaLabel={ctaLabel}
                            onCtaClick={goToNextStep}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}