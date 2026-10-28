import { useCallback, useEffect, useRef, useState } from "react"
import { apiFetch } from "../lib/api"

export interface Category {
    id: number
    name: string
}

// Accepts the fixed response ([{id, name}, ...]) and, for safety, the
// older shape where the whole pg result was sent as { categories: { rows } }.
type CategoriesResponse =
    | Category[]
    | { categories: Category[] | { rows: Category[] } }

function normalizeCategories(data: CategoriesResponse): Category[] {
    if (Array.isArray(data)) return data

    const inner = data?.categories

    if (Array.isArray(inner)) return inner
    if (inner && Array.isArray(inner.rows)) return inner.rows

    return []
}

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const mounted = useRef(true)

    // Also exposed as `reload` so pages can refresh after adding a category
    const load = useCallback(async () => {
        try {
            const data = await apiFetch<CategoriesResponse>("/categories")

            if (!mounted.current) return

            setCategories(normalizeCategories(data))
            setError(null)
        } catch (err) {
            if (!mounted.current) return

            setError(
                err instanceof Error
                    ? err.message
                    : "Couldn't load categories."
            )
        } finally {
            if (mounted.current) setLoading(false)
        }
    }, [])

    useEffect(() => {
        mounted.current = true
        load()

        return () => {
            mounted.current = false
        }
    }, [load])

    return { categories, loading, error, reload: load }
}