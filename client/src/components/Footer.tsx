import { FaInstagram, FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa"
import { Zap } from "lucide-react"

const COMPANY_LINKS = ["About Us", "Depot Locations", "Our Fleet Model", "News & Journal"]
const FLEET_LINKS = ["Sports Coupes", "Luxury Sedans", "Electric Fleet", "Prestige SUVs"]
const SUPPORT_LINKS = ["Safety Policy", "Roadside Response", "Help & FAQs", "Contact Concierge"]
const LEGAL_LINKS = ["Privacy Policy", "Terms of Service", "Insurance Terms"]

function FooterColumn({ title, links }: { title: string; links: string[] }) {
    return (
        <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {title}
            </h4>

            <ul className="mt-4 space-y-3">
                {links.map((link) => (
                    <li key={link}>
                        <a
                            href="#"
                            className="text-sm text-muted transition-colors hover:text-default"
                        >
                            {link}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export function Footer() {
    return (
        <footer className="border-t border-default bg-surface">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

                <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
                                <Zap
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    strokeWidth={0}
                                />
                            </span>

                            <span className="text-lg font-bold tracking-tight text-default">
                                DRIVE<span className="text-primary">luxury</span>
                            </span>
                        </div>

                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                            DRIVEluxury is the premier luxury automotive concierge system. We
                            lease absolute high-performance sports and luxury automobiles
                            on-demand with private delivery.
                        </p>

                        <div className="mt-6 flex items-center gap-3">
                            {[FaInstagram, FaFacebookF, FaTwitter, FaLinkedinIn].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-default bg-card text-default transition-colors hover:border-primary hover:text-primary"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <FooterColumn
                        title="Company"
                        links={COMPANY_LINKS}
                    />

                    <FooterColumn
                        title="Fleet Categories"
                        links={FLEET_LINKS}
                    />

                    <FooterColumn
                        title="Support Concierge"
                        links={SUPPORT_LINKS}
                    />

                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-default pt-6 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-xs text-muted">
                        © 2026 DRIVEluxury Operations Inc. All luxury models subject to availability.
                    </p>

                    <div className="flex gap-6">
                        {LEGAL_LINKS.map((link) => (
                            <a
                                key={link}
                                href="#"
                                className="text-xs text-muted hover:text-default"
                            >
                                {link}
                            </a>
                        ))}
                    </div>

                </div>

            </div>
        </footer>
    )
}