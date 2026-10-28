import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react"
import { Camera, UserRound } from "lucide-react"
import { DashboardLayout } from "../../components/dashboard/DashboardLayout"
import { useAuth } from "../../context/Authcontext"
import { apiFetch } from "../../lib/api"

interface ProfileResponse {
    id: number
    name: string
    email: string
    phone: string | null
    license_number: string | null
    address: string | null
    image_url: string | null
    role: string
    email_notifications?: boolean
    sms_notifications?: boolean
    promo_notifications?: boolean
}

export default function Profile() {
    const { user, refetch } = useAuth()

    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")
    const [licenseNumber, setLicenseNumber] = useState("")
    const [address, setAddress] = useState("")
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)

    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const loadProfile = async () => {
            try {
                setLoading(true)
                setError(null)

                const data: ProfileResponse = await apiFetch("/profile")

                if (!mounted) return

                setFullName(data.name ?? "")
                setPhone(data.phone ?? "")
                setLicenseNumber(data.license_number ?? "")
                setAddress(data.address ?? "")
                setProfileImage(data.image_url ?? null)
            } catch (err) {
                if (mounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Couldn't load your profile."
                    )
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        loadProfile()

        return () => {
            mounted = false
        }
    }, [])

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]

        if (!file) return

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Profile image must not be larger than 5MB.")
            return
        }

        setError(null)
        setSelectedImage(file)

        const previewUrl = URL.createObjectURL(file)
        setProfileImage(previewUrl)
    }

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()

        setError(null)
        setStatus(null)

        const trimmedName = fullName.trim()

        if (!trimmedName) {
            setError("Full name is required.")
            return
        }

        try {
            setIsSubmitting(true)

            const formData = new FormData()

            formData.append("name", trimmedName)
            formData.append("phone", phone.trim())
            formData.append(
                "licenseNumber",
                licenseNumber.trim()
            )
            formData.append("address", address.trim())

            if (selectedImage) {
                formData.append("profileImage", selectedImage)
            }

            const updatedProfile: ProfileResponse = await apiFetch(
                "/profile",
                {
                    method: "PATCH",
                    body: formData,
                }
            )

            setProfileImage(updatedProfile.image_url ?? null)
            setSelectedImage(null)

            await refetch()

            setStatus("Profile saved successfully.")

            window.setTimeout(() => {
                setStatus(null)
            }, 2500)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Couldn't save your profile."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const displayName = user?.name || fullName || "User"
    const displayEmail = user?.email || "—"

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-default">
                Profile
            </h1>

            <p className="mt-1 text-sm text-muted">
                Manage your personal and license details.
            </p>

            <form
                onSubmit={handleSubmit}
                className="mt-6 max-w-2xl space-y-6"
            >
                <div className="flex items-center gap-4 rounded-xl border border-default bg-card p-5">
                    <div className="relative">
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt={displayName}
                                className="h-16 w-16 rounded-full object-cover"
                            />
                        ) : (
                            <div
                                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
                                aria-label="Default user profile icon"
                            >
                                <UserRound className="h-8 w-8" />
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            aria-label="Change profile photo"
                            title="Change profile photo"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-dark"
                        >
                            <Camera className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-default">
                            {displayName}
                        </p>

                        <p className="text-xs text-muted">
                            {displayEmail}
                        </p>

                        <p className="mt-1 text-[10px] text-muted">
                            JPG, PNG, or WEBP. Maximum size: 5MB.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-xl border border-default bg-card p-5 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="fullName"
                            className="text-[10px] font-semibold uppercase tracking-wide text-muted"
                        >
                            Full Name
                        </label>

                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(event) =>
                                setFullName(event.target.value)
                            }
                            required
                            autoComplete="name"
                            className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="text-[10px] font-semibold uppercase tracking-wide text-muted"
                        >
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={displayEmail}
                            disabled
                            readOnly
                            title="Email changes aren't supported yet"
                            className="mt-1.5 w-full cursor-not-allowed rounded-md border border-default bg-[var(--border)] px-3 py-2.5 text-sm text-muted"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className="text-[10px] font-semibold uppercase tracking-wide text-muted"
                        >
                            Phone Number
                        </label>

                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(event) =>
                                setPhone(event.target.value)
                            }
                            autoComplete="tel"
                            className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="licenseNumber"
                            className="text-[10px] font-semibold uppercase tracking-wide text-muted"
                        >
                            Driver&apos;s License Number
                        </label>

                        <input
                            id="licenseNumber"
                            type="text"
                            value={licenseNumber}
                            onChange={(event) =>
                                setLicenseNumber(event.target.value)
                            }
                            autoComplete="off"
                            className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="address"
                            className="text-[10px] font-semibold uppercase tracking-wide text-muted"
                        >
                            Residential Address
                        </label>

                        <input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(event) =>
                                setAddress(event.target.value)
                            }
                            autoComplete="street-address"
                            className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:border-primary focus:outline-none"
                        />
                    </div>
                </div>

                {loading && (
                    <p className="text-sm text-muted">
                        Loading your profile...
                    </p>
                )}

                {error && (
                    <p className="text-sm font-medium text-error">
                        {error}
                    </p>
                )}

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={loading || isSubmitting}
                        className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>

                    {status && (
                        <p className="text-sm font-medium text-success">
                            {status}
                        </p>
                    )}
                </div>
            </form>
        </DashboardLayout>
    )
}