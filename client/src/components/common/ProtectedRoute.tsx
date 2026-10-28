import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/Authcontext"

interface ProtectedRouteProps {
    children: ReactNode
    requireRole?: "admin" | "customer"
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted">
                Loading...
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (requireRole && user.role !== requireRole) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}