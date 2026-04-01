"use client";

import { useState } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { useLanguage } from "@/lib/language-context";
import { Camera as CameraIcon, Wallet as WalletIcon, BarChart3 as BarChart3Icon, ChevronRight as ChevronRightIcon } from "lucide-react";

const slideIcons = [CameraIcon, WalletIcon, BarChart3Icon];

export function Onboarding() {
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!showOnboarding) return null;

  const slides = [
    { icon: slideIcons[0], title: t.onboarding.slide1Title, description: t.onboarding.slide1Desc },
    { icon: slideIcons[1], title: t.onboarding.slide2Title, description: t.onboarding.slide2Desc },
    { icon: slideIcons[2], title: t.onboarding.slide3Title, description: t.onboarding.slide3Desc },
  ];

  const isLast = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950">
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-2xl font-black text-gray-950">
          L
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Lockey
        </h1>
      </div>

      {/* Slide */}
      <div className="flex flex-col items-center px-8 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
          <SlideIcon className="h-10 w-10 text-amber-400" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">{slide.title}</h2>
        <p className="max-w-xs text-gray-400">{slide.description}</p>
      </div>

      {/* Dots */}
      <div className="mt-12 flex gap-2">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === currentSlide
                ? "w-8 bg-amber-400"
                : "w-2 bg-gray-700"
            }`}
          />
        ))}
      </div>

      {/* Action button */}
      <button
        type="button"
        onClick={() => {
          if (isLast) {
            completeOnboarding();
          } else {
            setCurrentSlide((p) => p + 1);
          }
        }}
        className="mt-8 flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3 font-semibold text-gray-950 transition-all hover:bg-amber-400 active:scale-95"
      >
        {isLast ? t.onboarding.getStarted : t.common.next}
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      {/* Skip */}
      {!isLast && (
        <button
          type="button"
          onClick={completeOnboarding}
          className="mt-4 text-sm text-gray-500 hover:text-gray-300"
        >
          {t.common.skip}
        </button>
      )}
    </div>
  );
}
