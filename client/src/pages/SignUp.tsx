import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Mail, Phone, Lock, Zap, Loader2 } from "lucide-react"
import { AuthLayout } from "../components/auth/AuthLayout"
import { FormField } from "../components/auth/FormField"
import { SocialButtons } from "../components/auth/SocialButtons"
import { apiFetch } from "../lib/api"
import signup_dark from '../assets/signup-dark.webp'
import signup_light from '../assets/signup-light.webp'
import { useTheme } from "../context/ThemeContext"
import { House } from "lucide-react";


export default function SignUp() {
    const {theme} = useTheme()
    const navigate = useNavigate()
    const backg = theme === 'Dark' ? signup_dark : signup_light;

    const [name, setname] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!name || !email || !phone || !password) {
            setError("Please fill in every field.")
            return
        }

        setIsSubmitting(true)
        try {
            // Backend only needs the email to send the OTP — the rest of the
            // form data travels with us to the verification step and gets
            // submitted together with the OTP via /verifyOTP.
            await apiFetch("/register", {
                method: "POST",
                body: JSON.stringify({ email }),
            })

            navigate("/verify-otp", {
                state: { name, email, phone, password },
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
      <div>
          <Link to="/"><House className="w-5 h-5 lg:w-7 lg:h-7 absolute top-2 left-2 lg:top-5 lg:left-15 cursor-pointer text-primary"/></Link>
        <AuthLayout
            imageUrl = {backg}
            quote="The adrenaline is yours to lease."
            subtitle="Unlock priority keys to the world's most meticulous high-performance vehicles."
        >
            <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
                    <Zap className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                </span>
                <span className="text-sm font-bold tracking-tight text-default">
                    DRIVE<span className="text-primary">luxury</span>
                </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold text-default">Create Your Account</h1>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <FormField
                    icon={User}
                    label="Full Name"
                    type="text"
                    placeholder="Alex Sterling"
                    value={name}
                    onChange={(e) => setname(e.target.value)}
                    autoComplete="name"
                />
                <FormField
                    icon={Mail}
                    label="Email Address"
                    type="email"
                    placeholder="alex@sterling.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                />
                <FormField
                    icon={Phone}
                    label="Phone Number"
                    type="tel"
                    placeholder="+1 (555) 019-2831"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                />
                <FormField
                    icon={Lock}
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                />

                {error && <p className="text-xs font-medium text-error">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
            </form>

            <SocialButtons label="Or" />

            <p className="mt-6 text-center text-xs text-muted">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                    Sign In
                </Link>
            </p>
        </AuthLayout>
      </div>
    )
}