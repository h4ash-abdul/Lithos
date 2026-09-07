import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, Volume2, CheckCircle2, X, ChevronDown, ChevronUp, Stethoscope, Clock, AlertOctagon, Terminal } from "lucide-react";
import { Language, translations } from "../locales/i18n";

interface CaseReportModalProps {
  report: any;
  lang: Language;
  onClose: () => void;
}

export const CaseReportModal: React.FC<CaseReportModalProps> = ({ report, lang, onClose }) => {
  const t = translations[lang];
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  if (!report) return null;

  const urgencyStyles: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    LOW: {
      bg: "bg-[#0a0f0c]",
      text: "text-[#7a8090]",
      border: "border-[#1a1a1a]",
      badge: "bg-[#0f1a14] border border-[#1e4a30] text-[#84ba90]"
    },
    MEDIUM: {
      bg: "bg-[#121410]",
      text: "text-[#c2b280]",
      border: "border-[#c2b280]/40",
      badge: "bg-[#181a14] border border-[#c2b280]/50 text-[#c2b280]"
    },
    HIGH: {
      bg: "bg-[#181007]",
      text: "text-[#c17a35]",
      border: "border-[#c17a35]/50",
      badge: "bg-[#221408] border border-[#c17a35]/60 text-[#c17a35]"
    },
    CRITICAL: {
      bg: "bg-[#1a0c0e]",
      text: "text-[#b5555f]",
      border: "border-[#b5555f]/60",
      badge: "bg-[#260f12] border border-[#b5555f] text-[#b5555f] shadow-[0_0_8px_rgba(181,85,95,0.3)]"
    }
  };

  const currentUrgency = urgencyStyles[report.urgency_level] || urgencyStyles.MEDIUM;

  const handleSpeakGuidance = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech not supported on this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const careTexts = (report.interim_care_guidance || [])
      .map((g: any) => `${g.title}. ${g.instructions}`)
      .join(". ");

    const fullSpeech = `${report.primary_disease_name}. ${careTexts}. ${report.legal_disclaimer}`;

    const utterance = new SpeechSynthesisUtterance(fullSpeech);
    if (lang === "hi") utterance.lang = "hi-IN";
    else if (lang === "ta") utterance.lang = "ta-IN";
    else utterance.lang = "en-US";

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  return (
    <AnimatePresence>
      <div className="portal-workspace fixed inset-0 z-50 bg-[rgba(5,8,6,0.92)] backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-[#09110d] border border-[#2d523a] rounded-[2px] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-0"
        >
          {/* Header */}
          <div className="bg-[#0d1a12] p-4 rounded-t-[2px] border-b border-[#1b2b20] flex items-center justify-between sticky top-0 z-10 font-mono">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-[2px] bg-[#132319] border border-[#2d523a] flex items-center justify-center text-[#84ba90]">
                <Stethoscope size={13} />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#84ba90] block">
                  {report.inference_mode === "OFFLINE_LOCAL" ? "EDGE_MODEL // ON_DEVICE_INFERENCE" : "CLOUD_GATEWAY // MULTIMODAL_AI_FUSION"}
                </span>
                <h2 className="text-xs font-semibold text-[#e8e6df] uppercase tracking-wider">DIAGNOSTIC_VERIFICATION_DOSSIER</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#8a9990] hover:text-[#e8e6df] p-1 font-mono text-xs uppercase cursor-pointer"
            >
              [ESC]
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Statutory Medical Notice Banner */}
            <div className="bg-[#141007] border-l-2 border-[#c17a35] p-3 rounded-[2px] font-mono text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="text-[#c17a35] shrink-0 mt-0.5" size={15} />
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-[#c17a35] uppercase tracking-wider">
                    {t.statutoryAdvisory}
                  </h4>
                  <p className="text-[11px] text-[#e8e6df] font-sans leading-relaxed">
                    {report.legal_disclaimer || t.legalDisclaimer}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Diagnosis Card */}
            <div className={`p-4 rounded-[2px] border ${currentUrgency.bg} ${currentUrgency.border} space-y-3 font-mono`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] text-[#8a9990] uppercase tracking-wider">
                    {t.primarySuspectedPathology}
                  </span>
                  <h3 className={`text-base font-bold ${currentUrgency.text} mt-0.5 truncate`}>
                    {report.primary_disease_name.toUpperCase()}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="font-mono text-[10px] bg-[#050a07] px-2 py-0.5 rounded-[2px] border border-[#1b2b20] text-[#c5d2ca]">
                      CODE: {report.primary_disease_code}
                    </span>
                    <span className="text-[#8a9990]">·</span>
                    <span className="text-[#8a9990] text-xs">
                      CONFIDENCE: <strong className="text-[#e8e6df]">{Math.round((report.primary_confidence || 0.8) * 100)}%</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${currentUrgency.badge}`}>
                    {t.severityLabel} {report.urgency_level}
                  </span>
                </div>
              </div>

              {/* Audio Narration Bar */}
              <div className="pt-2.5 border-t border-[#1b2b20] flex items-center justify-between text-xs">
                <button
                  onClick={handleSpeakGuidance}
                  className="bg-[#0d1c13] hover:bg-[#13281c] text-[#84ba90] border border-[#2d523a] px-3 py-1.5 rounded-[2px] font-mono text-[11px] uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 size={13} />
                  <span>{isPlayingAudio ? t.haltSynthesis : t.playNarration}</span>
                </button>
                <span className="text-[10px] text-[#8a9990] font-mono">
                  {t.latency}: {report.inference_latency_ms || 15}MS
                </span>
              </div>
            </div>

            {/* Interim Guidance Steps */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono font-semibold text-[#84ba90] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>{t.interimFieldCareProtocols}</span>
              </h4>

              <div className="space-y-1.5">
                {(report.interim_care_guidance || []).map((step: any, idx: number) => {
                  const isExpanded = expandedStep === idx;

                  return (
                    <div
                      key={idx}
                      className="border border-[#1b2b20] rounded-[2px] overflow-hidden bg-[#060b08]"
                    >
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : idx)}
                        className="w-full p-2.5 text-left flex items-center justify-between hover:bg-[#0c1410] transition-colors font-mono text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-[2px] bg-[#0d1a12] text-[#84ba90] border border-[#2d523a] text-[10px] flex items-center justify-center font-bold">
                            {step.step || idx + 1}
                          </span>
                          <span className="text-[#e8e6df] uppercase font-medium">{step.title}</span>
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-[#8a9990]" /> : <ChevronDown size={14} className="text-[#8a9990]" />}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 space-y-2 text-xs border-t border-[#1b2b20] font-sans">
                          <p className="text-[#c5d2ca] leading-relaxed">
                            {step.instructions}
                          </p>
                          {step.precautions && (
                            <div className="bg-[#141007] p-2 rounded-[2px] border border-[#c17a35]/40 text-[11px] font-mono text-[#c17a35]">
                              <strong>PRECAUTION:</strong> {step.precautions}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Differential Diagnoses */}
            {report.ranked_diagnoses && report.ranked_diagnoses.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono font-semibold text-[#8a9990] uppercase tracking-wider">
                  {t.differentialDiagnosesTitle}
                </h4>
                <div className="space-y-1">
                  {report.ranked_diagnoses.slice(1).map((diag: any, idx: number) => (
                    <div key={idx} className="bg-[#060b08] p-2.5 rounded-[2px] border border-[#1b2b20] flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-semibold text-[#e8e6df]">{diag.disease_name.toUpperCase()}</span>
                        <p className="text-[10px] text-[#8a9990] font-sans mt-0.5">{diag.rationale}</p>
                      </div>
                      <span className="font-mono text-[11px] text-[#84ba90] bg-[#0d1611] px-2 py-0.5 rounded-[2px] border border-[#2d523a] shrink-0">
                        {Math.round(diag.score * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Close */}
            <div className="pt-3 border-t border-[#1b2b20] flex justify-end font-mono">
              <button
                onClick={onClose}
                className="bg-[#0d1c13] hover:bg-[#13281c] text-[#84ba90] border border-[#2d523a] text-xs uppercase px-4 py-2 rounded-[2px] transition-colors cursor-pointer"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};