import { useState, type FormEvent } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { KeyRound, Zap, Loader2 } from "lucide-react"
import { AuthLayout } from "../components/auth/AuthLayout"
import { FormField } from "../components/auth/FormField"
import { apiFetch } from "../lib/Api"

interface SignUpState {
    fullName: string
    email: string
    phone: string
    password: string
}

export default function VerifyOtp() {
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as SignUpState | null

    console.log({...state})

    const [otp, setOtp] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!state) {
        return (
            <AuthLayout
                imageUrl="https://picsum.photos/seed/signupcar/900/1100"
                quote="The adrenaline is yours to lease."
                subtitle="Unlock priority keys to the world's most meticulous high-performance vehicles."
            >
                <p className="text-sm text-muted">
                    We couldn't find an in-progress sign up.{" "}
                    <Link to="/signup" className="font-medium text-primary hover:underline">
                        Start again
                    </Link>
                    .
                </p>
            </AuthLayout>
        )
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!otp) {
            setError("Enter the code we sent to your email.")
            return
        }

        setIsSubmitting(true)
        try {
            await apiFetch("/verifyOTP", {
                method: "POST",
                body: JSON.stringify({ ...state, otp }),
            })

            navigate("/login")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthLayout
            imageUrl="https://picsum.photos/seed/signupcar/900/1100"
            quote="Almost there."
            subtitle="Enter the code we just sent to confirm it's really you."
        >
            <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
                    <Zap className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                </span>
                <span className="text-sm font-bold tracking-tight text-default">
                    DRIVE<span className="text-primary">luxury</span>
                </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold text-default">Verify Your Email</h1>
            <p className="mt-2 text-sm text-muted">
                We sent a 6-digit code to <span className="font-medium text-default">{state.email}</span>.
                It expires in 15 minutes.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <FormField
                    icon={KeyRound}
                    label="Verification Code"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                />

                {error && <p className="text-xs font-medium text-error">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Verifying..." : "Verify & Create Account"}
                </button>
            </form>
        </AuthLayout>
    )
}