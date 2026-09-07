import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Globe } from "lucide-react";
import { Language, translations } from "../locales/i18n";

interface LithosHeroProps {
  onStartIntake?: () => void;
  onNavigateTab?: (tab: "intake" | "cases" | "vet" | "education") => void;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

const BG_IMAGE_1 = "/images/bg-rock-base.webp";
const BG_IMAGE_2 = "/images/bg-rock-reveal.webp";

const SPOTLIGHT_R = 260;

export const LithosHero: React.FC<LithosHeroProps> = ({ 
  onStartIntake, 
  onNavigateTab,
  lang = "en",
  onLanguageChange
}) => {
  const t = translations[lang];
  const revealDivRef = useRef<HTMLDivElement | null>(null);
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Initial center coordinates over the dramatic rocky ridge
    const centerX = window.innerWidth * 0.5;
    const centerY = window.innerHeight * 0.45;
    smooth.current = { x: centerX, y: centerY };
    mouse.current = { x: centerX, y: centerY };

    const updateSpotlight = (x: number, y: number) => {
      const el = revealDivRef.current;
      if (!el) return;

      const gradient = `radial-gradient(circle ${SPOTLIGHT_R}px at ${x}px ${y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.12) 90%, rgba(0,0,0,0) 100%)`;
      el.style.maskImage = gradient;
      (el.style as any).webkitMaskImage = gradient;
      el.style.opacity = "1";
    };

    // Apply spotlight immediately on frame 1 without delay
    updateSpotlight(centerX, centerY);
    isInitialized.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    const loop = () => {
      if (mouse.current.x !== -999) {
        smooth.current.x += (mouse.current.x - smooth.current.x) * 0.12;
        smooth.current.y += (mouse.current.y - smooth.current.y) * 0.12;
        updateSpotlight(smooth.current.x, smooth.current.y);
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black tracking-[-0.02em] select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Navigation (fixed, over hero) */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-6 pointer-events-auto">
        {/* Left: 28x28 SVG Logo + Lithos Wordmark */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <svg
            className="w-7 h-7 shrink-0"
            viewBox="0 0 256 256"
            fill="#ffffff"
          >
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <div className="flex items-center gap-2">
            <span className="text-white text-2xl sm:text-3xl font-playfair italic leading-none">
              Lithos
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-[#84ba90] bg-[#0d1a12] border border-[#2d523a] px-2 py-0.5 rounded-[2px] uppercase tracking-wider">
              NDLM LIVESTOCK
            </span>
          </div>
        </div>

        {/* Center Nav Pill */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-3 py-2 items-center gap-1.5 shadow-2xl">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-white bg-white/20 px-5 py-1.5 rounded-full text-sm font-semibold transition-colors"
          >
            {t.tabOverview || "Overview"}
          </button>
          <button
            onClick={() => onNavigateTab?.("intake")}
            className="text-white/80 hover:bg-white/10 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium"
          >
            {t.tabIntake || "Animal Intake"}
          </button>
          <button
            onClick={() => onNavigateTab?.("vet")}
            className="text-white/80 hover:bg-white/10 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium"
          >
            {t.tabVet || "Vet Surveillance"}
          </button>
          <button
            onClick={() => onNavigateTab?.("education")}
            className="text-white/80 hover:bg-white/10 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium"
          >
            {t.tabEducation || "Knowledge Base"}
          </button>
          <button
            onClick={() => onNavigateTab?.("cases")}
            className="text-white/80 hover:bg-white/10 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium"
          >
            {t.tabCases || "Outbox Queue"}
          </button>
        </div>

        {/* Right Desktop Button / Mobile Action + Language Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onLanguageChange && (
            <div className="flex items-center gap-1 bg-black/60 border border-white/20 rounded-full px-2.5 py-1 text-[10px] font-mono text-[#8a9990] backdrop-blur-md">
              <Globe size={11} className="text-[#8a9990]" />
              {(["en", "hi", "ta"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => onLanguageChange(l)}
                  className={`px-1 rounded uppercase font-bold transition cursor-pointer ${
                    lang === l
                      ? "text-[#84ba90] bg-[#132319] border border-[#2d523a]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onStartIntake}
            className="hidden md:flex items-center gap-2 bg-[#5a8f66] hover:bg-[#689f75] text-white text-sm sm:text-base font-semibold px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#5a8f66]/25 cursor-pointer"
          >
            <span>{t.launchPortal || "Launch Portal"}</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onStartIntake}
            className="md:hidden bg-[#5a8f66] text-white text-xs font-semibold px-4 py-2 rounded-full active:scale-95 shadow-md"
          >
            {t.tabIntake || "Intake"}
          </button>
        </div>
      </nav>

      {/* Full-Screen Section */}
      <section className="relative w-full overflow-hidden h-screen bg-black" style={{ height: "100dvh" }}>
        {/* Layer 1: Base Image (z-10) with hero-zoom */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />

        {/* Vignette Overlay (z-20) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/65 pointer-events-none z-20" />

        {/* Layer 2: Reveal Layer (z-30) - Hardware Accelerated GPU Radial Gradient Mask */}
        <div
          ref={revealDivRef}
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none hero-zoom"
          style={{
            backgroundImage: `url(${BG_IMAGE_2})`,
            opacity: 0,
            transition: "opacity 0.2s ease-out"
          }}
        />

        {/* Layer 3: Heading (z-50) */}
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <div className="hero-anim hero-fade mb-4" style={{ animationDelay: "0.15s" }}>
            <span className="font-mono text-xs sm:text-sm text-[#84ba90] tracking-[0.25em] uppercase px-4 py-1.5 bg-black/75 backdrop-blur-md border border-[#2d523a]/70 rounded-[2px] shadow-lg">
              NATIONAL DIGITAL LIVESTOCK MISSION &middot; RAPID AI TRIAGE &amp; EPIDEMIC SURVEILLANCE
            </span>
          </div>
          <h1 className="text-white leading-[0.95]">
            <span
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: "-0.05em", animationDelay: "0.25s" }}
            >
              Early signs
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: "-0.08em", animationDelay: "0.42s" }}
            >
              protect the herd
            </span>
          </h1>
        </div>

        {/* Layer 4: Bottom-Left Paragraph (z-50) */}
        <div
          className="hidden sm:block absolute bottom-14 left-10 md:left-16 max-w-[340px] hero-anim hero-fade z-50 pointer-events-none"
          style={{ animationDelay: "0.7s" }}
        >
          <p className="text-sm sm:text-base text-white/90 leading-relaxed font-sans drop-shadow-md">
            Every clinical symptom holds critical signals of herd health. From subtle early lesions to community contagion vectors, early detection preserves rural livelihoods across millions of livestock.
          </p>
        </div>

        {/* Layer 5: Bottom-Right Block (z-50) */}
        <div
          className="absolute bottom-10 sm:bottom-20 left-5 right-5 sm:left-auto sm:right-10 md:right-16 max-w-full sm:max-w-[340px] flex flex-col items-start gap-4 sm:gap-6 hero-anim hero-fade z-50"
          style={{ animationDelay: "0.85s" }}
        >
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans pointer-events-none drop-shadow-md">
            Gliding the spotlight reveals real-time veterinary telemetry and biometric scanning beneath surface symptoms, connecting farmers directly with NDLM veterinary response networks.
          </p>
          <button
            onClick={onStartIntake}
            className="bg-[#5a8f66] hover:bg-[#689f75] text-white text-base font-semibold px-8 sm:px-10 py-3.5 sm:py-4 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-2xl hover:shadow-[#5a8f66]/30 flex items-center gap-2.5 cursor-pointer pointer-events-auto"
          >
            <span>{t.startDiagnosis || "Start Diagnosis"}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default LithosHero;