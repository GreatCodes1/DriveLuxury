import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, KeyRound, Lock, Zap, Loader2 } from "lucide-react"
import { AuthLayout } from "../components/auth/AuthLayout"
import { FormField } from "../components/auth/FormField"
import { apiFetch } from "../lib/api"

type Step = "email" | "otp" | "password"

interface VerifyResetOtpResponse {
    resetToken: string
}

export default function ForgotPassword() {
    const navigate = useNavigate()

    const [step, setStep] = useState<Step>("email")
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [resetToken, setResetToken] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const requestOtp = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)
        try {
            await apiFetch("/forgot-password", { method: "POST", body: JSON.stringify({ email }) })
            setStep("otp")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const verifyOtp = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            const data = await apiFetch<VerifyResetOtpResponse>(
                "/verify-reset-otp",
                {
                    method: "POST",
                    body: JSON.stringify({ email, otp }),
                }
            )

            setResetToken(data.resetToken)
            setStep("password")
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetPassword = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError("Passwords don't match.")
            return
        }

        setIsSubmitting(true)
        try {
            await apiFetch("/reset-password", {
                method: "POST",
                body: JSON.stringify({ resetToken, password }),
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
            imageUrl="https://picsum.photos/seed/forgotpassword/900/1100"
            quote="Every key finds its way back."
            subtitle="Verify your email and set a new password to regain access."
        >
            <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
                    <Zap className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                </span>
                <span className="text-sm font-bold tracking-tight text-default">
                    DRIVE<span className="text-primary">luxury</span>
                </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold text-default">Reset Your Password</h1>

            {step === "email" && (
                <form onSubmit={requestOtp} className="mt-6 space-y-4">
                    <p className="text-sm text-muted">
                        Enter the email on your account and we'll send you a verification code.
                    </p>
                    <FormField
                        icon={Mail}
                        label="Email Address"
                        type="email"
                        placeholder="alex@sterling.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                    {error && <p className="text-xs font-medium text-error">{error}</p>}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Sending..." : "Send Reset Code"}
                    </button>
                </form>
            )}

            {step === "otp" && (
                <form onSubmit={verifyOtp} className="mt-6 space-y-4">
                    <p className="text-sm text-muted">
                        Enter the 6-digit code sent to <span className="font-medium text-default">{email}</span>.
                    </p>
                    <FormField
                        icon={KeyRound}
                        label="Verification Code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    {error && <p className="text-xs font-medium text-error">{error}</p>}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Verifying..." : "Verify Code"}
                    </button>
                </form>
            )}

            {step === "password" && (
                <form onSubmit={resetPassword} className="mt-6 space-y-4">
                    <FormField
                        icon={Lock}
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <FormField
                        icon={Lock}
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    {error && <p className="text-xs font-medium text-error">{error}</p>}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Saving..." : "Reset Password"}
                    </button>
                </form>
            )}

            <p className="mt-6 text-center text-xs text-muted">
                Remembered it?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                    Sign In
                </Link>
            </p>
        </AuthLayout>
    )
}