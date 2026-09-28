"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { getAssetUrl } from "@/lib/asset-url";

const slides = [
  {
    src: getAssetUrl("local1.webp", "portadas") ?? "/local1.webp",
    alt: "Imagen principal del local CRV4",
  },
  {
    src: getAssetUrl("local2.webp", "portadas") ?? "/local2.webp",
    alt: "Segunda imagen del local CRV4",
  },
  {
    src: getAssetUrl("local3.webp", "portadas") ?? "/local3.webp",
    alt: "Tercera imagen del local CRV4",
  },
];

export function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? slides.length - 1 : currentIndex - 1,
    );
  };

  const goToNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
  };

  return (
    <section aria-label="Imagenes destacadas" className="w-full">
      <div className="relative aspect-[2.5/1] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-500 ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <button
          type="button"
          aria-label="Imagen anterior"
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-zinc-900 shadow-sm transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <FaChevronLeft aria-hidden="true" className="size-4" />
        </button>

        <button
          type="button"
          aria-label="Imagen siguiente"
          onClick={goToNext}
          className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-zinc-900 shadow-sm transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <FaChevronRight aria-hidden="true" className="size-4" />
        </button>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Mostrar imagen ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? "w-7 bg-white" : "w-2 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
