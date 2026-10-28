import type { ReactNode } from "react"
import { Zap } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"

interface AuthLayoutProps {
    imageUrl: string
    quote: string
    subtitle: string
    children: ReactNode
}


export function AuthLayout({ imageUrl, quote, subtitle, children }: AuthLayoutProps) {
    const { theme } = useTheme()
    return (
        <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
            <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-default bg-card shadow-2xl md:grid-cols-2">
                <div className="relative hidden min-h-[420px] md:block">
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

                    {theme === 'Light' ?
                        <div>
                            <span className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-lg">
                                <Zap className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                            </span>

                            <div className="absolute inset-x-6 bottom-8 text-white">
                                <p className="text-3xl font-bold leading-snug">"{quote}"</p>
                                <p className="mt-2 text-sm text-white/70">{subtitle}</p>
                            </div>
                        </div> :
                        <div>
                            <div className="absolute left-6 top-6  text-white">
                                <p className="text-3xl font-bold leading-snug">"{quote}"</p>
                                <p className="mt-2 text-sm text-white/70">{subtitle}</p>
                            </div>
                        </div>
                    }
                </div>

                {/* Form panel */}
                <div className="p-8 sm:p-10">{children}</div>
            </div>
        </div>
    )
}