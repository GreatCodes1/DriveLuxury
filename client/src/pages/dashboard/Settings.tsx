import { useEffect, useState, type FormEvent } from "react"
import { Sun, Moon } from "lucide-react"
import { DashboardLayout } from "../../components/dashboard/DashboardLayout"
import { Toggle } from "../../components/common/Toggle"
import { useTheme } from "../../context/ThemeContext"
import { apiFetch } from "../../lib/api"

interface ProfileNotificationPreferences {
    email_notifications: boolean
    sms_notifications: boolean
    promo_notifications: boolean
}

export default function Settings() {
    const { theme, toggleTheme } = useTheme()

    const [emailNotifs, setEmailNotifs] = useState(true)
    const [smsNotifs, setSmsNotifs] = useState(false)
    const [promoNotifs, setPromoNotifs] = useState(true)
    const [notifsLoading, setNotifsLoading] = useState(true)
    const [notifsSaved, setNotifsSaved] = useState(false)

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [passwordStatus, setPasswordStatus] = useState<string | null>(null)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        apiFetch<ProfileNotificationPreferences>("/profile")
            .then((data) => {
                setEmailNotifs(data.email_notifications)
                setSmsNotifs(data.sms_notifications)
                setPromoNotifs(data.promo_notifications)
            })
            .catch(() => { })
            .finally(() => {
                setNotifsLoading(false)
            })
    }, [])

    const saveNotificationPrefs = async (next: { email?: boolean; sms?: boolean; promo?: boolean }) => {
        const email = next.email ?? emailNotifs
        const sms = next.sms ?? smsNotifs
        const promo = next.promo ?? promoNotifs

        try {
            await apiFetch("/notification-preferences", {
                method: "PATCH",
                body: JSON.stringify({
                    emailNotifications: email,
                    smsNotifications: sms,
                    promoNotifications: promo,
                }),
            })
            setNotifsSaved(true)
            setTimeout(() => setNotifsSaved(false), 1500)
        } catch {
            // Non-critical — the toggle still reflects locally either way.
        }
    }

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setPasswordError(null)
        setIsSubmitting(true)

        try {
            await apiFetch("/account/password", {
                method: "PATCH",
                body: JSON.stringify({ currentPassword, newPassword }),
            })
            setPasswordStatus("Password updated.")
            setCurrentPassword("")
            setNewPassword("")
            setTimeout(() => setPasswordStatus(null), 2500)
        } catch (err) {
            setPasswordError(err instanceof Error ? err.message : "Couldn't update your password.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-default">Settings</h1>
            <p className="mt-1 text-sm text-muted">Manage notifications, appearance, and account security.</p>

            <div className="mt-6 max-w-2xl space-y-6">
                {/* Appearance */}
                <div className="rounded-xl border border-default bg-card p-5">
                    <h2 className="text-sm font-semibold text-default">Appearance</h2>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                                {theme === "Dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                            </span>
                            <div>
                                <p className="text-sm font-medium text-default">Dark Mode</p>
                                <p className="text-xs text-muted">Switch between light and dark themes.</p>
                            </div>
                        </div>
                        <Toggle checked={theme === "Dark"} onChange={toggleTheme} label="Dark mode" />
                    </div>
                </div>

                {/* Notifications */}
                <div className="rounded-xl border border-default bg-card p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-default">Notifications</h2>
                        {notifsSaved && <span className="text-xs font-medium text-success">Saved</span>}
                    </div>
                    {notifsLoading ? (
                        <p className="mt-4 text-sm text-muted">Loading...</p>
                    ) : (
                        <div className="mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-default">Email Notifications</p>
                                    <p className="text-xs text-muted">Booking confirmations and receipts.</p>
                                </div>
                                <Toggle
                                    checked={emailNotifs}
                                    onChange={(checked) => {
                                        setEmailNotifs(checked)
                                        saveNotificationPrefs({ email: checked })
                                    }}
                                    label="Email notifications"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-default">SMS Notifications</p>
                                    <p className="text-xs text-muted">Pickup and delivery reminders.</p>
                                </div>
                                <Toggle
                                    checked={smsNotifs}
                                    onChange={(checked) => {
                                        setSmsNotifs(checked)
                                        saveNotificationPrefs({ sms: checked })
                                    }}
                                    label="SMS notifications"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-default">Promotions &amp; Offers</p>
                                    <p className="text-xs text-muted">Weekend specials and loyalty perks.</p>
                                </div>
                                <Toggle
                                    checked={promoNotifs}
                                    onChange={(checked) => {
                                        setPromoNotifs(checked)
                                        saveNotificationPrefs({ promo: checked })
                                    }}
                                    label="Promotional notifications"
                                />
                            </div>
                            <p className="text-[11px] text-muted">
                                Note: these preferences are saved, but nothing in the backend checks
                                them yet before sending an email/SMS — that check would need adding
                                to each place a notification actually goes out (OTPs, booking
                                confirmations, etc.).
                            </p>
                        </div>
                    )}
                </div>

                {/* Security */}
                <form onSubmit={handlePasswordSubmit} className="rounded-xl border border-default bg-card p-5">
                    <h2 className="text-sm font-semibold text-default">Change Password</h2>
                    <div className="mt-4 space-y-3">
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                Current Password
                            </label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1.5 w-full rounded-md border border-default bg-surface px-3 py-2.5 text-sm text-default focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>
                    {passwordError && <p className="mt-3 text-sm font-medium text-error">{passwordError}</p>}
                    <div className="mt-4 flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            Update Password
                        </button>
                        {isSubmitting && <p className="text-sm text-muted">Updating...</p>}
                        {passwordStatus && (
                            <p className="text-sm font-medium text-success">{passwordStatus}</p>
                        )}
                    </div>
                </form>

                {/* Danger zone */}
                <div className="rounded-xl border border-error/30 bg-error/5 p-5">
                    <h2 className="text-sm font-semibold text-error">Danger Zone</h2>
                    <p className="mt-1 text-xs text-muted">
                        Permanently delete your account and all associated booking history. This
                        cannot be undone.
                    </p>
                    <button
                        type="button"
                        disabled
                        title="No self-service delete-account route exists on the backend yet"
                        className="mt-4 cursor-not-allowed rounded-md border border-error/40 px-5 py-2 text-sm font-semibold text-error opacity-50"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </DashboardLayout>
    )
}