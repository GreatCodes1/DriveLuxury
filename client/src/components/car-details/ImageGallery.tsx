import { useState } from "react"

interface ImageGalleryProps {
    images: string[]
    alt: string
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0)

    return (
        <div>
            <div className="overflow-hidden rounded-xl">
                <img
                    src={images[activeIndex]}
                    alt={alt}
                    className="h-[280px] w-full object-cover sm:h-[360px]"
                />
            </div>

            <div className="mt-3 grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                    <button
                        key={image}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={[
                            "overflow-hidden rounded-lg border-2 transition-colors",
                            index === activeIndex ? "border-primary" : "border-transparent",
                        ].join(" ")}
                    >
                        <img src={image} alt="" className="h-16 w-full object-cover sm:h-20" />
                    </button>
                ))}
            </div>
        </div>
    )
}