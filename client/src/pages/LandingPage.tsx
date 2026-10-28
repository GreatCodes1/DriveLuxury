import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
    type ReactNode,
} from "react"
import {
    MapPin,
    Calendar,
    Car,
    CarFront,
    Zap,
    Truck,
    Search,
    Sun as SunIcon,
    Gem,
    ChevronRight,
    ArrowRight,
    ShieldCheck,
    Tag,
    Headphones,
    CalendarCheck,
    CheckCircle2,
    Star,
    Mail,
    Circle,
    Diamond,
    CircleX,
    FileType,
    type LucideIcon,
} from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { apiFetch } from "../lib/api"
import { useTheme } from "../context/ThemeContext"
import { useCategories, type Category } from "../lib/useCAtegores"
import { useNavigate } from "react-router-dom"

import hero_dark from "../assets/home_black.webp"
import hero_light from "../assets/home_light.webp"
import newyork from "../assets/newyork.webp"
import chicago from "../assets/chicago.webp"
import los_angeles from "../assets/los-angeles.webp"
import miami from "../assets/miami.webp"
import los_vegas from "../assets/las-vegas.webp"
import san_francisco from "../assets/san-fransico.webp"

interface ApiVehicle {
    id: number
    name: string
    category: string
    brand: string | null
    model: string | null
    year: number | null
    colour: string | null
    dailyprice: number
    isavailable: boolean
    img_url: string
}

interface ApiFeaturedReview {
    rating: number
    comment: string
    username: string
    vehiclename: string
}

interface SearchCardProps {
    mobile?: boolean
    /** Suggestions for the pick-up location (users can still type their own) */
    locations?: string[]
    /** Category names, exactly as stored on vehicles (e.g. "Sports Cars") */
    categories?: string[]
}

interface BrandItem {
    brand: string
    icon: LucideIcon
}

// Optional icons per category name. Any category not listed gets the generic car icon.
const CATEGORY_ICONS: Record<string, typeof Car> = {
    "Sports Cars": Car,
    "Luxury Sedans": CarFront,
    "Electric Vehicles": Zap,
    "SUVs & Crossovers": Truck,
    Convertibles: SunIcon,
    "Exotic Cars": Gem,
}

const BRANDS: BrandItem[] = [
    { brand: "BMW", icon: Circle },
    { brand: "Mercedes-Benz", icon: Diamond },
    { brand: "Porsche", icon: CircleX },
    { brand: "Audi", icon: CircleX },
    { brand: "Tesla", icon: CircleX },
    { brand: "Range Rover", icon: FileType },
]

const FEATURES = [
    {
        title: "Premium Fleet",
        icon: ShieldCheck,
        description:
            "500+ meticulously maintained luxury and performance vehicles prepared to showroom standard for every journey.",
    },
    {
        title: "Best Price Guarantee",
        icon: Tag,
        description:
            "Unmatched pricing transparently structured with zero hidden dealer surcharges.",
    },
    {
        title: "24/7 Roadside Assist",
        icon: Headphones,
        description:
            "A dedicated concierge response team on permanent call anywhere, anytime across the country.",
    },
    {
        title: "Free Cancellation",
        icon: CalendarCheck,
        description:
            "Flexible reservation modifications up to 24 hours prior to dispatch with instant refunds.",
    },
]

const STEPS = [
    {
        number: "01",
        title: "Choose Your Car",
        description:
            "Select your dream car from our curated fleet of top-tier brands.",
    },
    {
        number: "02",
        title: "Pick Up & Inspect",
        description:
            "Meet your concierge at your chosen location or have it delivered directly.",
    },
    {
        number: "03",
        title: "Enjoy the Ride",
        description:
            "Hit the open road with complete peace of mind and luxury at your fingertips.",
    },
]

const LOCATIONS = [
    {
        city: "New York",
        count: "120+ Cars Available",
        image: newyork,
    },
    {
        city: "Los Angeles",
        count: "85+ Cars Available",
        image: los_angeles,
    },
    {
        city: "Miami",
        count: "95+ Cars Available",
        image: miami,
    },
    {
        city: "Chicago",
        count: "60+ Cars Available",
        image: chicago,
    },
    {
        city: "Las Vegas",
        count: "75+ Cars Available",
        image: los_vegas,
    },
    {
        city: "San Francisco",
        count: "50+ Cars Available",
        image: san_francisco,
    },
]

// City names used as suggestions in the search card
const SEARCH_LOCATIONS = LOCATIONS.map((location) => location.city)

// Formats a Date for <input type="datetime-local"> in the user's local time
function toLocalInput(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0")

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    )
}

function defaultPickup() {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    date.setHours(10, 0, 0, 0)
    return toLocalInput(date)
}

function defaultReturn() {
    const date = new Date()
    date.setDate(date.getDate() + 4)
    date.setHours(10, 0, 0, 0)
    return toLocalInput(date)
}

function SearchCard({
    mobile = false,
    locations = [],
    categories = [],
}: SearchCardProps) {
    const navigate = useNavigate()

    const [location, setLocation] = useState("")
    const [pickup, setPickup] = useState(defaultPickup)
    const [returnDate, setReturnDate] = useState(defaultReturn)
    const [category, setCategory] = useState("")
    const [error, setError] = useState<string | null>(null)

    // The card renders twice (desktop + mobile), so IDs need a suffix
    const idSuffix = mobile ? "m" : "d"

    // Earliest selectable pick-up = now
    const minPickup = useMemo(() => toLocalInput(new Date()), [])

    const handlePickupChange = (value: string) => {
        setPickup(value)
        setError(null)

        // Keep the return date after the new pick-up date
        if (value && returnDate && returnDate <= value) {
            const next = new Date(value)
            next.setDate(next.getDate() + 1)
            setReturnDate(toLocalInput(next))
        }
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()

        if (!location.trim()) {
            setError("Please enter a pick-up location.")
            return
        }

        if (!pickup || !returnDate) {
            setError("Please choose your pick-up and return dates.")
            return
        }

        if (new Date(pickup).getTime() < Date.now() - 60_000) {
            setError("Pick-up time can't be in the past.")
            return
        }

        if (new Date(returnDate).getTime() <= new Date(pickup).getTime()) {
            setError("Return time must be after pick-up time.")
            return
        }

        setError(null)

        const params = new URLSearchParams({
            location: location.trim(),
            pickup,
            return: returnDate,
        })

        if (category) {
            params.set("category", category)
        }

        navigate(`/fleet?${params.toString()}`)
    }

    const inputClass =
        "w-full min-w-0 bg-transparent text-sm font-semibold text-default outline-none placeholder:font-normal placeholder:text-muted"

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div
                className={
                    mobile
                        ? "rounded-2xl bg-card p-4 shadow-2xl"
                        : "rounded-xl bg-card p-4 shadow-xl sm:flex sm:items-center sm:gap-0 sm:divide-x sm:divide-default sm:p-2"
                }
            >
                <div
                    className={
                        mobile
                            ? "flex flex-col divide-y divide-default"
                            : "contents"
                    }
                >
                    <SearchField
                        icon={MapPin}
                        label="Pick-up Location"
                        htmlFor={`search-location-${idSuffix}`}
                    >
                        <input
                            id={`search-location-${idSuffix}`}
                            type="text"
                            list={`search-locations-${idSuffix}`}
                            value={location}
                            onChange={(event) => {
                                setLocation(event.target.value)
                                setError(null)
                            }}
                            placeholder="City or airport"
                            autoComplete="off"
                            className={inputClass}
                        />
                        <datalist id={`search-locations-${idSuffix}`}>
                            {locations.map((place) => (
                                <option key={place} value={place} />
                            ))}
                        </datalist>
                    </SearchField>

                    <SearchField
                        icon={Calendar}
                        label="Pick-up Date"
                        htmlFor={`search-pickup-${idSuffix}`}
                    >
                        <input
                            id={`search-pickup-${idSuffix}`}
                            type="datetime-local"
                            value={pickup}
                            min={minPickup}
                            onChange={(event) =>
                                handlePickupChange(event.target.value)
                            }
                            className={inputClass}
                        />
                    </SearchField>

                    <SearchField
                        icon={Calendar}
                        label="Return Date"
                        htmlFor={`search-return-${idSuffix}`}
                    >
                        <input
                            id={`search-return-${idSuffix}`}
                            type="datetime-local"
                            value={returnDate}
                            min={pickup || minPickup}
                            onChange={(event) => {
                                setReturnDate(event.target.value)
                                setError(null)
                            }}
                            className={inputClass}
                        />
                    </SearchField>

                    <SearchField
                        icon={Car}
                        label="Car Category"
                        htmlFor={`search-category-${idSuffix}`}
                    >
                        <select
                            id={`search-category-${idSuffix}`}
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                            className={`${inputClass} cursor-pointer`}
                        >
                            <option value="">Any category</option>
                            {categories.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </SearchField>
                </div>

                <div className={mobile ? "mt-4" : "p-2 sm:pl-4"}>
                    <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:w-auto"
                    >
                        <Search className="h-4 w-4" />
                        Search Available Cars
                    </button>
                </div>
            </div>

            {error && (
                <p
                    role="alert"
                    className="mt-3 rounded-lg bg-card px-4 py-2 text-sm font-medium text-error shadow-md"
                >
                    {error}
                </p>
            )}
        </form>
    )
}

function SearchField({
    icon: Icon,
    label,
    htmlFor,
    children,
}: {
    icon: typeof MapPin
    label: string
    htmlFor: string
    children: ReactNode
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-4 py-3 sm:py-2"
        >
            <Icon className="h-4 w-4 shrink-0 text-primary" />

            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    {label}
                </span>

                {children}
            </span>
        </label>
    )
}

function Hero({ categoryNames }: { categoryNames: string[] }) {
    const { theme } = useTheme()

    const heroBackground = theme === "Dark" ? hero_dark : hero_light

    return (
        <section className="bg-surface">
            {/* Background image area */}
            <div
                className="relative min-h-[640px] overflow-hidden bg-cover bg-center sm:min-h-[700px] md:[background-position:initial]"
                style={{
                    backgroundImage: `url("${heroBackground}")`,
                }}
            >
                {/* Background overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

                {/* Hero content */}
                <div className="relative z-10 mx-auto max-w-7xl px-4 pb-36 pt-24 sm:px-6 sm:pb-48 sm:pt-32 lg:px-8 lg:pb-52 lg:pt-40">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary-light">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Introducing the 2026 Fleet
                    </span>

                    <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
                        Find Your Next{" "}
                        <span className="text-primary">Exceptional</span> Ride
                    </h1>

                    <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
                        Premium vehicles for every journey. Book in minutes,
                        drive in absolute style with our white-glove delivery
                        concierge.
                    </p>

                    {/* Desktop search card */}
                    <div className="mt-10 hidden sm:block">
                        <SearchCard
                            locations={SEARCH_LOCATIONS}
                            categories={categoryNames}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile search card */}
            <div className="relative z-20 -mt-8 px-4 sm:hidden">
                <SearchCard
                    mobile
                    locations={SEARCH_LOCATIONS}
                    categories={categoryNames}
                />
            </div>
        </section>
    )
}

function BrandStrip({ brands }: { brands: BrandItem[] }) {
    if (brands.length === 0) return null

    return (
        <section className="border-b border-default bg-surface py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <p className="text-center text-[11px] font-medium uppercase tracking-widest text-muted">
                    Members of our elite automotive portfolio
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
                    {brands.map(({ brand, icon: Icon }) => (
                        <div
                            key={brand}
                            className="flex items-center gap-2 text-muted"
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium">
                                {brand}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function SectionHeading({
    eyebrow,
    title,
    action,
}: {
    eyebrow: string
    title: string
    action?: {
        label: string
        href: string
    }
}) {
    return (
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {eyebrow}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-default sm:text-3xl">
                    {title}
                </h2>
            </div>

            {action && (
                <a
                    href={action.href}
                    className="flex items-center gap-1 text-sm font-medium text-default transition-colors hover:text-primary"
                >
                    {action.label}
                    <ArrowRight className="h-4 w-4" />
                </a>
            )}
        </div>
    )
}

function PopularRentals({
    vehicles,
    loading,
}: {
    vehicles: ApiVehicle[]
    loading: boolean
}) {
    const navigate = useNavigate()

    return (
        <section className="bg-surface py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="Elite Selection"
                    title="Our Most Popular Rentals"
                    action={{
                        label: "Explore Full Fleet",
                        href: "/fleet",
                    }}
                />

                {loading && (
                    <p className="mt-8 text-sm text-muted">
                        Loading the fleet...
                    </p>
                )}

                {!loading && vehicles.length === 0 && (
                    <p className="mt-8 text-sm text-muted">
                        No vehicles available right now.
                    </p>
                )}

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {vehicles.map((car) => {
                        const specs = [
                            car.brand,
                            car.model,
                            car.year ? String(car.year) : null,
                            car.colour,
                        ].filter(Boolean)

                        return (
                            <div
                                key={car.id}
                                className="cursor-pointer overflow-hidden rounded-xl border border-default bg-card transition-shadow hover:shadow-lg"
                                onClick={() => navigate(`/cars/${car.id}`)}
                            >
                                <div className="relative">
                                    <img
                                        src={car.img_url}
                                        alt={car.name}
                                        className="h-40 w-full object-cover"
                                    />

                                    {!car.isavailable && (
                                        <span className="absolute right-3 top-3 rounded-md bg-error px-2 py-1 text-[10px] font-semibold uppercase text-white">
                                            Unavailable
                                        </span>
                                    )}
                                </div>

                                <div className="p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                                        {car.category}
                                    </p>

                                    <h3 className="mt-1 text-base font-semibold text-default">
                                        {car.name}
                                    </h3>

                                    <p className="mt-2 text-xs text-muted">
                                        {specs.join(" · ")}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between border-t border-default pt-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-muted">
                                                Daily Rate
                                            </p>

                                            <p className="text-lg font-bold text-default">
                                                ${car.dailyprice}
                                                <span className="text-xs font-normal text-muted">
                                                    /day
                                                </span>
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                navigate(`/cars/${car.id}`)
                                            }}
                                            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

function Categories({
    vehicles,
    categories,
}: {
    vehicles: ApiVehicle[]
    categories: Category[]
}) {
    const navigate = useNavigate()

    const normalize = (value: string | null | undefined) =>
        (value ?? "").trim().toLowerCase()

    // Only show categories that actually have vehicles
    const counts = categories
        .map(({ name }) => ({
            name,
            count: vehicles.filter(
                (vehicle) => normalize(vehicle.category) === normalize(name)
            ).length,
            icon: CATEGORY_ICONS[name] ?? Car,
        }))
        .filter((category) => category.count > 0)

    if (counts.length === 0) return null

    return (
        <section className="bg-surface pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Classifications
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-default sm:text-3xl">
                        Browse Our Vehicles by Category
                    </h2>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {counts.map(({ name, count, icon: Icon }) => (
                        <button
                            key={name}
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/fleet?category=${encodeURIComponent(name)}`
                                )
                            }
                            className="flex items-center justify-between rounded-lg border border-default bg-card px-5 py-4 text-left transition-colors hover:border-primary"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </span>

                                <div>
                                    <p className="text-sm font-semibold text-default">
                                        {name}
                                    </p>

                                    <p className="text-xs text-muted">
                                        {count} Vehicles
                                    </p>
                                </div>
                            </div>

                            <ChevronRight className="h-4 w-4 text-muted" />
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}

function WhyUs() {
    return (
        <section className="bg-card py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        The DRIVEluxury Advantage
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-default sm:text-3xl">
                        Why Select Our Concierge Services
                    </h2>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {FEATURES.map(({ title, description, icon: Icon }) => (
                        <div
                            key={title}
                            className="rounded-xl border border-default bg-surface p-6"
                        >
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                            </span>

                            <h3 className="mt-4 text-sm font-semibold text-default">
                                {title}
                            </h3>

                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                {description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function HowItWorks() {
    return (
        <section className="bg-card pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Streamlined Execution
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-default sm:text-3xl">
                        How It Works
                    </h2>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
                    {STEPS.map((step, index) => (
                        <div
                            key={step.number}
                            className="relative text-center sm:text-left"
                        >
                            <div className="flex items-center justify-center gap-3 sm:justify-start">
                                <span className="text-3xl font-bold text-primary">
                                    {step.number}
                                </span>

                                {index < STEPS.length - 1 && (
                                    <span className="hidden flex-1 border-t border-dashed border-default sm:block" />
                                )}

                                <CheckCircle2 className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
                            </div>

                            <h3 className="mt-4 text-base font-semibold text-default">
                                {step.title}
                            </h3>

                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function PromoBanner() {
    return (
        <section className="bg-primary py-10">
            <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-white/80">
                        Limited Time Offer
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                        Weekend Special: 25% Off All Sports Cars
                    </h3>

                    <p className="mt-2 max-w-xl text-sm text-white/85">
                        Reserve any elite Porsche or Mercedes coupe this Friday
                        through Sunday and unlock exclusive dynamic rates.
                    </p>
                </div>

                <button
                    type="button"
                    className="whitespace-nowrap rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-dark transition-opacity hover:opacity-90"
                >
                    Claim Offer Now
                </button>
            </div>
        </section>
    )
}

function LocationsSection() {
    return (
        <section className="bg-surface py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Metropolitan Coverage
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-default sm:text-3xl">
                        Elite Fleet Depot Locations
                    </h2>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {LOCATIONS.map((location) => (
                        <a
                            key={location.city}
                            href="/fleet"
                            className="group relative block h-48 overflow-hidden rounded-xl"
                        >
                            <img
                                src={location.image}
                                alt={location.city}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="absolute bottom-4 left-4">
                                <p className="text-base font-semibold text-white">
                                    {location.city}
                                </p>

                                <p className="flex items-center gap-1 text-xs text-white/80">
                                    {location.count}
                                    <ArrowRight className="h-3 w-3" />
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    )
}

function Testimonials({ reviews }: { reviews: ApiFeaturedReview[] }) {
    if (reviews.length === 0) return null

    return (
        <section className="bg-surface pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Verified Journals
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-default sm:text-3xl">
                        Patron Experiences
                    </h2>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {reviews.map((review, index) => (
                        <div
                            key={`${review.username}-${index}`}
                            className="rounded-xl border border-default bg-card p-6"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm font-semibold text-default">
                                    {review.username}
                                </p>

                                <div className="flex gap-0.5 text-primary">
                                    {Array.from({ length: 5 }).map(
                                        (_, starIndex) => (
                                            <Star
                                                key={starIndex}
                                                className="h-3.5 w-3.5"
                                                fill={
                                                    starIndex < review.rating
                                                        ? "currentColor"
                                                        : "none"
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </div>

                            <p className="mt-4 text-sm leading-relaxed text-muted">
                                "{review.comment}"
                            </p>

                            <div className="mt-4 border-t border-default pt-3">
                                <p className="text-xs text-muted">
                                    Rented:{" "}
                                    <span className="font-medium text-default">
                                        {review.vehiclename}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function Newsletter() {
    const [email, setEmail] = useState("")

    return (
        <section className="bg-surface pb-20">
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    VIP Registry
                </p>

                <h2 className="mt-2 text-2xl font-bold text-default sm:text-3xl">
                    Stay in the Fast Lane
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
                    Subscribe to our weekly dispatch for priority access to
                    incoming fleets, limited seasonal models, and curated
                    concierge events.
                </p>

                <form
                    onSubmit={(event) => event.preventDefault()}
                    className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
                >
                    <div className="flex flex-1 items-center gap-2 rounded-md border border-default bg-card px-4 py-3">
                        <Mail className="h-4 w-4 text-muted" />

                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Enter your email address"
                            className="w-full bg-transparent text-sm text-default placeholder:text-muted focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="whitespace-nowrap rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                        Subscribe
                    </button>
                </form>
            </div>
        </section>
    )
}

export default function LandingPage() {
    // Categories are loaded once and shared by the search card and the category section
    const { categories } = useCategories()

    const categoryNames = useMemo(
        () => categories.map((category) => category.name),
        [categories]
    )

    const [vehicles, setVehicles] = useState<ApiVehicle[]>([])

    const [featuredReviews, setFeaturedReviews] = useState<
        ApiFeaturedReview[]
    >([])

    const [vehiclesLoading, setVehiclesLoading] = useState(true)

    useEffect(() => {
    apiFetch<ApiVehicle[]>("/vehicles")
        .then((data) => {
            setVehicles(data)
        })
        .catch(() => {
            setVehicles([])
        })
        .finally(() => {
            setVehiclesLoading(false)
        })

    apiFetch<ApiFeaturedReview[]>("/reviews/featured")
        .then((data) => {
            setFeaturedReviews(data)
        })
        .catch(() => {
            setFeaturedReviews([])
        })
}, [])
    const popularVehicles = [...vehicles]
        .sort((first, second) => second.dailyprice - first.dailyprice)
        .slice(0, 4)

    return (
        <div className="min-h-screen bg-surface text-default">
            <Navbar />

            <Hero categoryNames={categoryNames} />

            <BrandStrip brands={BRANDS} />

            <PopularRentals
                vehicles={popularVehicles}
                loading={vehiclesLoading}
            />

            <Categories vehicles={vehicles} categories={categories} />

            <WhyUs />

            <HowItWorks />

            <PromoBanner />

            <LocationsSection />

            <Testimonials reviews={featuredReviews} />

            <Newsletter />

            <Footer />
        </div>
    )
}