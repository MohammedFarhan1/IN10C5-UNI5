"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Weekend deal drop",
    subtitle: "Up to 40% off selected premium gadgets",
    description:
      "Sample banner image for homepage offers. Replace this with your promotional creative any time.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80",
    accent: "from-black/70 via-black/30 to-transparent"
  },
  {
    title: "Fresh arrivals for your store",
    subtitle: "New launches with unit-level traceability",
    description:
      "Highlight new inventory, launch campaigns, or seasonal promotions here with your own uploaded banner.",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
    accent: "from-emerald-950/70 via-emerald-900/30 to-transparent"
  },
  {
    title: "Seller spotlight offers",
    subtitle: "Feature limited-stock products in one swipe",
    description:
      "Use this slider area for sample images now, then swap in real offer artwork later.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    accent: "from-slate-950/75 via-slate-900/35 to-transparent"
  }
];

export function OffersBanner() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = slides[activeIndex];

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/60 bg-white/70 shadow-soft sm:rounded-[36px]">
      <div className="relative h-[320px] sm:h-[420px] lg:h-[460px]">
        {slides.map((slide, index) => (
          <div
            className={cn(
              "absolute inset-0 overflow-hidden transition-opacity duration-700",
              index === activeIndex
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            )}
            key={slide.title}
          >
            <img
              alt={slide.title}
              className="absolute inset-0 h-full w-full object-cover object-center"
              src={slide.image}
            />
            <div className={cn("absolute inset-0 bg-gradient-to-r", slide.accent)} />
          </div>
        ))}

        <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white sm:p-6 md:p-10">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-gold sm:text-xs sm:tracking-[0.34em]">
              Offers banner
            </p>
            <h1 className="mt-3 max-w-[16rem] text-2xl font-semibold leading-tight sm:mt-4 sm:max-w-2xl sm:text-4xl md:text-6xl">
              {activeSlide.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-100 sm:mt-3 sm:text-lg">
              {activeSlide.subtitle}
            </p>
            <p className="mt-3 max-w-[18rem] text-xs leading-5 text-slate-200 sm:mt-4 sm:max-w-xl sm:text-sm sm:leading-7 md:text-base">
              {activeSlide.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
              <Link className="w-full sm:w-auto" href="/signup">
                <Button className="w-full bg-brand-gold text-brand-ink hover:bg-[#e0b55d] sm:w-auto">
                  Start selling
                </Button>
              </Link>
              <Link className="w-full sm:w-auto" href="/login">
                <Button
                  className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
                  variant="ghost"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-6 sm:pt-8">
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  aria-label={`Show slide ${index + 1}`}
                  className={cn(
                    "h-2.5 rounded-full transition",
                    index === activeIndex ? "w-10 bg-white" : "w-2.5 bg-white/45"
                  )}
                  key={slide.title}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                />
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-200 sm:text-xs sm:tracking-[0.24em]">
              Sample images
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
