import React from "react";
import { motion } from "framer-motion";
import { Globe, Wifi, WifiOff, ShieldCheck, Stethoscope, UserCheck, Activity } from "lucide-react";
import { Language, translations } from "../locales/i18n";

interface HeaderProps {
  lang: Language;
  onLanguageChange: (l: Language) => void;
  role: "FARMER" | "VET" | "ADMIN";
  onRoleChange: (r: "FARMER" | "VET" | "ADMIN") => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  pendingCount: number;
  onBackToHero?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  role,
  onRoleChange,
  isOffline,
  onToggleOffline,
  pendingCount,
  onBackToHero
}) => {
  const t = translations[lang];

  return (
    <header className="bg-[#060a08]/85 backdrop-blur-md border-b border-[#1c2b21] text-[#e8e6df] sticky top-0 z-40 transition-colors">
      <div className="w-full px-4 sm:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Brand & Technical Metadata */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div 
              onClick={onBackToHero}
              className={`flex items-center gap-2.5 ${onBackToHero ? "cursor-pointer group" : ""}`}
              title={onBackToHero ? "Return to Overview" : undefined}
            >
              <div className="w-8 h-8 rounded-[2px] bg-[#0c1410] border border-[#233529] group-hover:border-[#5a8f66] flex items-center justify-center text-[#84ba90] shadow-sm transition-colors">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-playfair italic text-white group-hover:text-[#84ba90] transition-colors leading-none">
                    Lithos
                  </span>
                  <span className="text-xs text-[#6e7e74] font-mono">/</span>
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight text-[#e8e6df] uppercase font-mono">
                    NDLM <span className="text-[#84ba90]">CONSOLE</span>
                  </h1>
                  {onBackToHero && (
                    <span className="hidden sm:inline-block font-mono text-[9px] text-[#84ba90] bg-[#0d1c13] border border-[#2d523a] px-1.5 py-0.5 rounded-[2px] group-hover:bg-[#5a8f66] group-hover:text-white transition">
                      {t.returnToOverview || "← OVERVIEW"}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-[#8a9990] hidden sm:block tracking-wide uppercase">
                  {t.gatewaySubtitle || "Domestic Livestock Disease Diagnostic & Reporting Gateway"}
                </p>
              </div>
            </div>

            {/* Mobile Offline Status Badge */}
            <button
              onClick={onToggleOffline}
              className={`lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-[10px] font-mono font-semibold transition ${
                isOffline
                  ? "bg-[#180f08] border-[#c17a35]/60 text-[#c17a35]"
                  : "bg-[#0d1a12] border-[#2d523a] text-[#84ba90]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-[#c17a35]" : "bg-[#5a8f66] shadow-[0_0_6px_rgba(90,143,102,0.5)]"}`} />
              <span>{isOffline ? (t.offlineStatus || "OFFLINE") : (t.liveStatus || "LIVE")}</span>
            </button>
          </div>

          {/* Center: Global Telemetry Strip */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1 bg-[#0a120e]/80 border border-[#1e2e24] rounded-[2px] text-[10px] font-mono text-[#8a9990] backdrop-blur-sm">
            <span className="font-bold text-[#e8e6df] uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={12} className="text-[#84ba90]" />
              <span>{t.sysTelemetry || "SYS TELEMETRY"}</span>
            </span>
            <div className="w-[1px] h-3 bg-[#1e2e24]" />
            <span>{t.sector || "SECTOR"}: <strong className="text-[#c5d2ca]">ANAND DIST</strong></span>
            <div className="w-[1px] h-3 bg-[#1e2e24]" />
            <span>{t.latency || "LATENCY"}: <strong className="text-[#c5d2ca]">14MS</strong></span>
            <div className="w-[1px] h-3 bg-[#1e2e24]" />
            <span>{t.outbox || "OUTBOX"}: <strong className={pendingCount > 0 ? "text-[#c17a35]" : "text-[#8a9990]"}>{pendingCount} {t.pending || "PENDING"}</strong></span>
          </div>

          {/* Controls Group */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
            
            {/* Status Badge (Desktop) */}
            <div 
              onClick={onToggleOffline}
              className={`cursor-pointer hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[3px] border text-[10px] font-mono font-semibold transition ${
                isOffline
                  ? "bg-[#180f08] border-[#c17a35]/60 text-[#c17a35]"
                  : "bg-[#0d1a12] border-[#2d523a] text-[#84ba90]"
              }`}
              title="Click to toggle simulated offline state"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-[#c17a35]" : "bg-[#5a8f66] shadow-[0_0_6px_rgba(90,143,102,0.5)]"}`} />
              <span>{isOffline ? (t.localCache || "OFFLINE · LOCAL CACHE") : (t.federatedNdlm || "SECURE · FEDERATED NDLM")}</span>
              {pendingCount > 0 && (
                <span className="bg-[#b5555f] text-white text-[9px] px-1 py-0.2 rounded-[2px] font-bold">
                  {pendingCount}
                </span>
              )}
            </div>

            {/* Role Switcher */}
            <div className="flex items-center bg-[#09100c] border border-[#1c2b21] rounded-[2px] p-0.5 text-[11px] font-mono">
              <button
                onClick={() => onRoleChange("FARMER")}
                className={`px-2.5 py-1 rounded-[2px] transition font-semibold ${
                  role === "FARMER"
                    ? "bg-[#132319] text-[#84ba90] border border-[#2d523a] font-bold shadow-[0_0_8px_rgba(90,143,102,0.2)]"
                    : "text-[#8a9990] hover:text-[#e8e6df]"
                }`}
              >
                {t.roleFarmer ? t.roleFarmer.split(" ")[0].toUpperCase() : "FARMER"}
              </button>
              <button
                onClick={() => onRoleChange("VET")}
                className={`px-2.5 py-1 rounded-[2px] transition font-semibold ${
                  role === "VET"
                    ? "bg-[#132319] text-[#84ba90] border border-[#2d523a] font-bold shadow-[0_0_8px_rgba(90,143,102,0.2)]"
                    : "text-[#8a9990] hover:text-[#e8e6df]"
                }`}
              >
                {t.roleVet ? t.roleVet.split(" ")[0].toUpperCase() : "VET"}
              </button>
              <button
                onClick={() => onRoleChange("ADMIN")}
                className={`px-2.5 py-1 rounded-[2px] transition font-semibold ${
                  role === "ADMIN"
                    ? "bg-[#132319] text-[#84ba90] border border-[#2d523a] font-bold shadow-[0_0_8px_rgba(90,143,102,0.2)]"
                    : "text-[#8a9990] hover:text-[#e8e6df]"
                }`}
              >
                {t.roleAdmin ? t.roleAdmin.split(" ")[0].toUpperCase() : "ADMIN"}
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-[#09100c] border border-[#1c2b21] rounded-[2px] px-2 py-1 text-[10px] font-mono text-[#8a9990]">
              <Globe size={11} className="text-[#8a9990]" />
              {(["en", "hi", "ta"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => onLanguageChange(l)}
                  className={`px-1 rounded uppercase font-bold transition ${
                    lang === l
                      ? "text-[#84ba90] bg-[#132319] border border-[#2d523a]"
                      : "hover:text-[#e8e6df]"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};