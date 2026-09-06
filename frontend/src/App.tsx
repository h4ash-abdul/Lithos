import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "./components/Header";
import { LithosHero } from "./components/LithosHero";
import { FarmerIntakeFlow } from "./components/FarmerIntakeFlow";
import { CasesQueueView } from "./components/CasesQueueView";
import { VetDashboard } from "./components/VetDashboard";
import { OutbreakMap } from "./components/OutbreakMap";
import { EducationLibrary } from "./components/EducationLibrary";
import { CaseReportModal } from "./components/CaseReportModal";
import { Language, translations } from "./locales/i18n";
import { getOfflineQueue } from "./services/offlineQueue";

const ColorBends = React.lazy(() => import("./components/ColorBends"));

const BOTANICAL_HERO_BG = "/images/bg-rock-reveal.webp";

export function App() {
  const [lang, setLang] = useState<Language>("en");
  const [role, setRole] = useState<"FARMER" | "VET" | "ADMIN">("FARMER");
  const [isOffline, setIsOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "intake" | "cases" | "vet" | "education">("overview");
  const [pendingCount, setPendingCount] = useState(0);
  const [activeReportModal, setActiveReportModal] = useState<any | null>(null);

  const [dashboardMouse, setDashboardMouse] = useState({ x: -999, y: -999 });

  useEffect(() => {
    if (activeTab === "overview") return;
    const handleMouseMove = (e: MouseEvent) => {
      setDashboardMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [activeTab]);

  const t = translations[lang];

  useEffect(() => {
    updatePendingCount();
  }, []);

  const updatePendingCount = () => {
    const queue = getOfflineQueue();
    const count = queue.filter(c => c.sync_status === "PENDING").length;
    setPendingCount(count);
  };

  const handleCaseCreated = (report: any) => {
    updatePendingCount();
    setActiveReportModal(report);
  };

  const handleRoleChange = (newRole: "FARMER" | "VET" | "ADMIN") => {
    setRole(newRole);
    if (newRole === "VET" || newRole === "ADMIN") {
      setActiveTab("vet");
    } else {
      setActiveTab("intake");
    }
  };

  interface StepItem {
    id: "overview" | "intake" | "cases" | "vet" | "education";
    num: string;
    label: string;
    badge?: number;
  }

  const steps: StepItem[] = [
    { id: "overview", num: "0", label: "OVERVIEW" },
    { id: "intake", num: "1", label: "ANIMAL INTAKE" },
    { id: "cases", num: "2", label: "OUTBOX QUEUE", badge: pendingCount },
    { id: "vet", num: "3", label: "VET SURVEILLANCE" },
    { id: "education", num: "4", label: "KNOWLEDGE BASE" }
  ];

  return (
    <div className="bg-[#000000] text-[#e8e6df] min-h-screen relative selection:bg-[#5a8f66]/30 selection:text-[#84ba90]">
      <AnimatePresence mode="wait">
        {activeTab === "overview" ? (
          <motion.div
            key="hero-experience"
            initial={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{
              opacity: 0,
              scale: 1.05,
              filter: "blur(12px)",
              transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
            }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen w-full"
          >
            <LithosHero
              onStartIntake={() => setActiveTab("intake")}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="portal-experience"
            initial={{ opacity: 0, scale: 0.985, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{
              opacity: 0,
              scale: 0.98,
              y: 14,
              filter: "blur(8px)",
              transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="portal-workspace min-h-screen bg-[#050806] text-[#e8e6df] flex flex-col antialiased relative overflow-x-hidden"
          >
            {/* Botanical Wildflower & Moss Background Layer - Vivid and Prominently Visible */}
            <div 
              className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-80 scale-100"
              style={{ backgroundImage: `url(${BOTANICAL_HERO_BG})` }}
            />

            {/* React Bits ColorBends Dynamic WebGL Shader Layer - Blended over Botanical BG */}
            <React.Suspense fallback={null}>
              <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60 mix-blend-screen">
                <ColorBends
                  colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
                  rotation={90}
                  speed={0.25}
                  scale={1.1}
                  frequency={1}
                  warpStrength={1}
                  mouseInfluence={1}
                  noise={0.15}
                  parallax={0.5}
                  iterations={1}
                  intensity={1.8}
                  bandWidth={6}
                  transparent={true}
                />
              </div>
            </React.Suspense>

            {/* Soft Vignette Overlay to maintain crisp contrast for dashboard telemetry & glass cards */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#050806]/40 via-[#070b09]/30 to-[#040605]/60 backdrop-blur-[0.5px]" />
            
            {/* Dynamic Cursor Spotlight illuminating natural moss & wildflower hues */}
            {dashboardMouse.x > -100 && (
              <div
                className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 opacity-70"
                style={{
                  background: `radial-gradient(750px circle at ${dashboardMouse.x}px ${dashboardMouse.y}px, rgba(74, 222, 128, 0.08), rgba(182, 161, 114, 0.05), transparent 75%)`
                }}
              />
            )}

            {/* Topbar Header */}
            <div className="relative z-40">
              <Header
                lang={lang}
                onLanguageChange={setLang}
                role={role}
                onRoleChange={handleRoleChange}
                isOffline={isOffline}
                onToggleOffline={() => setIsOffline(!isOffline)}
                pendingCount={pendingCount}
                onBackToHero={() => setActiveTab("overview")}
              />
            </div>

            {/* Botanical Stepper Navigation Bar */}
            <nav className="bg-[#070c09]/80 backdrop-blur-md border-b border-[#1c2b21] sticky top-[53px] z-30 shadow-lg relative">
              <div className="w-full px-4 sm:px-8 py-3.5">
                <div className="flex items-center justify-between overflow-x-auto">
                  {steps.map((step, idx) => {
                    const isActive = activeTab === step.id;

                    return (
                      <React.Fragment key={step.id}>
                        <button
                          onClick={() => setActiveTab(step.id as any)}
                          className="flex items-center gap-3 group focus:outline-none whitespace-nowrap shrink-0 transition cursor-pointer"
                        >
                          <span 
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                              isActive
                                ? "bg-[#5a8f66] text-white border border-[#689f75] shadow-[0_0_10px_rgba(90,143,102,0.3)]"
                                : "bg-[#09120d] text-[#7a8a80] border border-[#1c2b21] group-hover:border-[#2d4535]"
                            }`}
                          >
                            {step.num}
                          </span>
                          <span 
                            className={`text-xs font-mono font-bold tracking-wider uppercase transition ${
                              isActive 
                                ? "text-[#84ba90]" 
                                : "text-[#8a9990] group-hover:text-[#e8e6df]"
                            }`}
                          >
                            {step.label}
                          </span>
                          {step.badge && step.badge > 0 ? (
                            <span className="bg-[#b5555f] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px]">
                              {step.badge}
                            </span>
                          ) : null}
                        </button>

                        {idx < steps.length - 1 && (
                          <div className="flex-1 h-[1px] bg-[#1c2b21] mx-3 sm:mx-6 min-w-[20px]" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </nav>

            {/* Main Content Body */}
            <main className="flex-1 w-full px-4 sm:px-8 py-6 sm:py-8 relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeTab === "intake" && (
                    <FarmerIntakeFlow
                      lang={lang}
                      isOffline={isOffline}
                      onCaseCreated={handleCaseCreated}
                    />
                  )}

                  {activeTab === "cases" && (
                    <CasesQueueView
                      lang={lang}
                      onOpenReport={(rep) => setActiveReportModal(rep)}
                      onQueueUpdated={updatePendingCount}
                      onNewIntake={() => setActiveTab("intake")}
                    />
                  )}

                  {activeTab === "vet" && (
                    <div className="space-y-8">
                      <VetDashboard lang={lang} />
                      <OutbreakMap />
                    </div>
                  )}

                  {activeTab === "education" && (
                    <EducationLibrary lang={lang} />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="bg-[#050806]/90 border-t border-[#1c2b21] text-[#7a8a80] text-[10px] font-mono py-4 text-center mt-auto relative z-10 backdrop-blur-sm">
              <div className="w-full px-4 sm:px-8 space-y-1">
                <p className="tracking-wider uppercase">
                  NATIONAL DIGITAL LIVESTOCK MISSION (NDLM) &middot; NADRS INTEGRATION PROTOCOL
                </p>
                <p className="text-[#4e6054] text-[9px] uppercase tracking-wider">
                  EDGE INFERENCE CLIENT &middot; SHA-256 HASH VERIFIED EPIDEMIOLOGICAL DATASET
                </p>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Active Report Modal */}
      {activeReportModal && (
        <CaseReportModal
          report={activeReportModal}
          lang={lang}
          onClose={() => setActiveReportModal(null)}
        />
      )}
    </div>
  );
}

export default App;