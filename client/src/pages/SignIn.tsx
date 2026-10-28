import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, Zap, Loader2 } from "lucide-react"
import { AuthLayout } from "../components/auth/AuthLayout"
import { FormField } from "../components/auth/FormField"
import { SocialButtons } from "../components/auth/SocialButtons"
import { useAuth } from "../context/Authcontext"
import signin_dark from "../assets/signin-dark.webp"
import signin_light from "../assets/signin-light.webp"
import { useTheme } from "../context/ThemeContext"
import { House } from "lucide-react";

export default function SignIn() {
    const { theme } = useTheme()
    const { login } = useAuth()
    const navigate = useNavigate()

    const background =
        theme === "Dark" ? signin_dark : signin_light

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()
        setError(null)

        if (!email || !password) {
            setError(
                "Please enter your email and password."
            )
            return
        }

        setIsSubmitting(true)

        try {
            const signedInUser = await login({
                email,
                password,
            })

            navigate(
                signedInUser.role === "admin"
                    ? "/admin"
                    : "/",
                {
                    replace: true,
                }
            )
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

    return (
        <div>
            <Link to="/"><House className="w-5 h-5 lg:w-7 lg:h-7 absolute top-2 left-2 lg:top-15 lg:left-15 cursor-pointer text-primary"/></Link>
             <AuthLayout
            imageUrl={background}
            quote="Welcome back to elite motoring."
            subtitle="Your preferred specs, saved locations, and bespoke keys await."
        >
            
            <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
                    <Zap
                        className="h-3.5 w-3.5"
                        fill="currentColor"
                        strokeWidth={0}
                    />
                </span>

                <span className="text-sm font-bold tracking-tight text-default">
                    DRIVE<span className="text-primary">
                        luxury
                    </span>
                </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold text-default">
                Welcome Back
            </h1>

            <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
            >
                <FormField
                    icon={Mail}
                    label="Email Address"
                    type="email"
                    placeholder="alex@sterling.com"
                    value={email}
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                    autoComplete="email"
                />

                <FormField
                    icon={Lock}
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                />

                <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-muted">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(event) =>
                                setRememberMe(
                                    event.target.checked
                                )
                            }
                            className="h-3.5 w-3.5 rounded border-default accent-primary"
                        />

                        Remember me
                    </label>

                    <Link
                        to="/forgot-password"
                        className="font-medium text-primary hover:underline"
                    >
                        Forgot Password?
                    </Link>
                </div>

                {error && (
                    <p className="text-xs font-medium text-error">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {isSubmitting
                        ? "Signing In..."
                        : "Sign In"}
                </button>
            </form>

            <SocialButtons label="Or" />

            <p className="mt-6 text-center text-xs text-muted">
                Don't have an account?{" "}
                <Link
                    to="/signup"
                    className="font-medium text-primary hover:underline"
                >
                    Sign Up
                </Link>
            </p>
        </AuthLayout>
        </div>
    )
}