import { ShieldCheck, Award, Users, Sparkles } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

const VALUES = [
    {
        icon: ShieldCheck,
        title: "White-Glove Service",
        description: "Every vehicle is delivered detailed, fueled, and inspected — no exceptions.",
    },
    {
        icon: Award,
        title: "Curated Fleet",
        description: "We hand-select every make and model, from daily drivers to track-ready exotics.",
    },
    {
        icon: Users,
        title: "Concierge Support",
        description: "A dedicated team is available for the full length of every reservation.",
    },
    {
        icon: Sparkles,
        title: "Transparent Pricing",
        description: "No hidden dealer surcharges — the rate you see is the rate you pay.",
    },
]

export default function About() {
    return (
        <div className="min-h-screen bg-surface text-default pt-15">
            <Navbar />

            <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary">
                    About DRIVEluxury
                </p>
                <h1 className="mt-2 text-center text-3xl font-bold text-default">
                    Premium Vehicles, Delivered Right
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-muted">
                    DRIVEluxury is a luxury automotive concierge system built for people who expect
                    more from a rental than a counter and a clipboard. We lease high-performance
                    sports cars, luxury sedans, and exotic vehicles on-demand, with private delivery
                    to wherever you need it.
                </p>

                <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {VALUES.map((value) => (
                        <div key={value.title} className="rounded-xl border border-default bg-card p-6">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <value.icon className="h-5 w-5" />
                            </span>
                            <h3 className="mt-4 text-sm font-semibold text-default">{value.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">{value.description}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 rounded-xl border border-default bg-card p-8 text-center">
                    <h2 className="text-lg font-semibold text-default">Ready to drive?</h2>
                    <p className="mt-2 text-sm text-muted">Browse the fleet and book in minutes.</p>
                    <a
                        href="/fleet"
                        className="mt-4 inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                        Explore the Fleet
                    </a>
                </div>
            </main>
<div className="hidden md:block">
                <Footer />
            </div>
        </div>
    )
}