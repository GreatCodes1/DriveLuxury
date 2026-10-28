export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export async function apiFetch<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const isFormData = options.body instanceof FormData

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(isFormData
                ? {}
                : {
                      "Content-Type": "application/json",
                  }),
            ...(options.headers || {}),
        },
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(
            data?.message || "Request failed."
        )
    }

    return data as T
}

export async function apiFetchFormData(path: string, formData: FormData, method: string = "POST") {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        credentials: "include",
        body: formData,
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        throw new Error(data.message || "Something went wrong. Please try again.")
    }

    return data
}