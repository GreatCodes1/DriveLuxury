import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react"
import { apiFetch } from "../lib/api"

export interface SessionUser {
    id: number
    name: string
    email: string
    role: "customer" | "admin"
    image_url?: string | null
}

interface LoginCredentials {
    email: string
    password: string
}

interface AuthContextValue {
    user: SessionUser | null
    loading: boolean
    refetch: () => Promise<void>
    login: (
        credentials: LoginCredentials
    ) => Promise<SessionUser>
    logout: () => Promise<void>
}

const AuthContext = createContext<
    AuthContextValue | undefined
>(undefined)

export function AuthProvider({
    children,
}: {
    children: ReactNode
}) {
    const [user, setUser] = useState<SessionUser | null>(
        null
    )

    const [loading, setLoading] = useState(true)

    const fetchSession = async () => {
        try {
            setLoading(true)

            const data =
                await apiFetch<SessionUser>("/session")

            setUser(data)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSession()
    }, [])

    const login = async (
        credentials: LoginCredentials
    ) => {
        await apiFetch("/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        })

        const sessionUser =
            await apiFetch<SessionUser>("/session")

        setUser(sessionUser)

        return sessionUser
    }

    const logout = async () => {
        try {
            await apiFetch("/logout", {
                method: "POST",
            })
        } finally {
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                refetch: fetchSession,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error(
            "useAuth must be used within AuthProvider"
        )
    }

    return context
}