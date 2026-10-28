import { FcGoogle } from "react-icons/fc"

interface SocialButtonsProps {
    label: string
}

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000"

export function SocialButtons({
    label,
}: SocialButtonsProps) {
    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google`
    }

    return (
        <div className="w-full">
            <div className="my-6 flex w-full items-center gap-3">
                <div className="h-px flex-1 border-t border-default" />

                <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-muted">
                    {label}
                </span>

                <div className="h-px flex-1 border-t border-default" />
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-default bg-surface px-4 py-2.5 text-sm font-medium text-default transition-colors hover:border-primary"
            >
                <FcGoogle className="h-4 w-4 shrink-0" />

                <span>Sign in with Google</span>
            </button>
        </div>
    )
}