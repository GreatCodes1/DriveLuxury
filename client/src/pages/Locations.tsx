import { MapPin, ArrowRight } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

import newyork from '../assets/newyork.webp'
import chicago from '../assets/chicago.webp'
import los_angeles from '../assets/los-angeles.webp'
import miami from '../assets/miami.webp'
import los_vegas from '../assets/las-vegas.webp'
import san_francisco from '../assets/san-fransico.webp'

const LOCATIONS = [
    { city: "New York", count: "120+ Cars Available", image: newyork },
    { city: "Los Angeles", count: "85+ Cars Available", image: los_angeles },
    { city: "Miami", count: "95+ Cars Available", image: miami},
    { city: "Chicago", count: "60+ Cars Available", image: chicago },
    { city: "Las Vegas", count: "75+ Cars Available", image: los_vegas },
    { city: "San Francisco", count: "50+ Cars Available", image: san_francisco },
]


export default function Locations() {
    return (s
        <div className="min-h-screen bg-surface text-default pt-15">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Metropolitan Coverage
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-default">Elite Fleet Depot Locations</h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
                        DRIVEluxury operates concierge delivery and pickup across major metros. Browse
                        the full fleet to see exactly what's available near you.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {LOCATIONS.map((loc) => (
                        <a
                            key={loc.city}
                            href="/fleet"
                            className="group relative block h-48 overflow-hidden rounded-xl"
                        >
                            <img
                                src={loc.image}
                                alt={loc.city}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                                <MapPin className="h-4 w-4" />
                                <div>
                                    <p className="text-base font-semibold">{loc.city}</p>
                                    <p className="flex items-center gap-1 text-xs text-white/80">
                                        Browse Fleet <ArrowRight className="h-3 w-3" />
                                    </p>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                <p className="mt-8 text-center text-xs text-muted">
                    Vehicle availability shown on the Fleet page reflects the full inventory —
                    per-city filtering isn't available yet since pickup location isn't tracked
                    per vehicle in the system.
                </p>
            </main>

          <div className="hidden md:block">
              <Footer />
          </div>
        </div>
    )
}