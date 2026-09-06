import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle2, XCircle, Volume2, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { Language } from "../locales/i18n";
import { api } from "../services/api";

interface EducationLibraryProps {
  lang: Language;
}

export const EducationLibrary: React.FC<EducationLibraryProps> = ({ lang }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingCode, setPlayingCode] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>("LUMPY_SKIN_DISEASE");

  useEffect(() => {
    loadLibrary();
  }, [lang]);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const res = await api.fetchEducationLibrary(lang);
      setArticles(res.articles || []);
    } catch (e) {
      console.error("Failed to load education library", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = (art: any) => {
    if (!("speechSynthesis" in window)) {
      alert("Text to speech not supported in this browser.");
      return;
    }

    if (playingCode === art.disease_code) {
      window.speechSynthesis.cancel();
      setPlayingCode(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(art.audio_script);
    if (lang === "hi") utterance.lang = "hi-IN";
    else if (lang === "ta") utterance.lang = "ta-IN";
    else utterance.lang = "en-US";

    utterance.onend = () => setPlayingCode(null);
    utterance.onerror = () => setPlayingCode(null);

    window.speechSynthesis.speak(utterance);
    setPlayingCode(art.disease_code);
  };

  return (
    <div className="w-full space-y-4 pb-12 font-sans">
      {/* Botanical Dossier Header */}
      <div className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] rounded-[2px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[2px] bg-[#0d1a12] border border-[#2d523a] text-[#84ba90] flex items-center justify-center font-bold">
              <BookOpen size={13} />
            </div>
            <h2 className="font-mono text-xs font-semibold text-[#84ba90] uppercase tracking-wider">
              {lang === "hi" 
                ? "EPIDEMIOLOGICAL_KNOWLEDGE_BASE // पशु स्वास्थ्य मार्गदर्शिका" 
                : "EPIDEMIOLOGICAL_KNOWLEDGE_BASE // ICAR_NDLM_FIELD_GUIDES"}
            </h2>
          </div>
          <p className="text-xs text-[#8a9990]">
            Statutory veterinary clinical protocols, vector transmission topologies, and verified field bio-security SOPs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2 py-1 rounded-[2px] bg-[#0d1611] border border-[#1b2b20] text-[#8a9990]">
            PROTOCOLS: {articles.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="bg-[#09110d]/85 border border-[#1b2b20] rounded-[2px] p-5 animate-pulse space-y-2.5">
              <div className="h-3 bg-[#0d1611] rounded-[2px] w-1/4" />
              <div className="h-4 bg-[#111f16] rounded-[2px] w-1/2" />
              <div className="h-10 bg-[#050a07] rounded-[2px]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((art) => {
            const isPlaying = playingCode === art.disease_code;
            const isExpanded = expandedCode === art.disease_code;

            return (
              <div
                key={art.disease_code}
                className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] hover:border-[#2d4535] rounded-[2px] overflow-hidden transition-colors shadow-md"
              >
                {/* Title Card Header */}
                <div className="p-4 border-b border-[#1b2b20] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#84ba90] bg-[#0d1a12] px-2 py-0.5 rounded-[2px] border border-[#2d523a]">
                        ICAR // NDLM PROTOCOL
                      </span>
                      <span className="text-[10px] text-[#8a9990] font-mono">CODE: {art.disease_code}</span>
                    </div>
                    <h3 className="font-mono text-sm font-semibold text-[#e8e6df] uppercase mt-1">
                      {art.title}
                    </h3>
                    <p className="text-xs text-[#8a9990] leading-relaxed max-w-2xl font-sans">
                      {art.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <button
                      onClick={() => handlePlayAudio(art)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs uppercase transition-colors cursor-pointer ${
                        isPlaying
                          ? "bg-[#18080a] text-[#b5555f] border border-[#b5555f]/60"
                          : "bg-[#0d1c13] hover:bg-[#13281c] text-[#84ba90] border border-[#2d523a]"
                      }`}
                    >
                      {isPlaying ? (
                        <div className="flex items-center gap-1 h-3">
                          <span className="soundwave-bar" />
                          <span className="soundwave-bar" />
                          <span className="soundwave-bar" />
                          <span className="soundwave-bar" />
                        </div>
                      ) : (
                        <Volume2 size={12} />
                      )}
                      <span>{isPlaying ? "STOP_AUDIO" : "LISTEN"}</span>
                    </button>

                    <button
                      onClick={() => setExpandedCode(isExpanded ? null : art.disease_code)}
                      className="p-1.5 rounded-[2px] text-[#8a9990] hover:text-[#e8e6df] hover:bg-[#111c15] transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 space-y-4 bg-[#050a07] border-t border-[#1b2b20]"
                    >
                      {/* Transmission */}
                      <div className="bg-[#08100c] p-3 rounded-[2px] border border-[#1b2b20] text-xs font-mono flex items-start gap-2.5">
                        <AlertTriangle className="text-[#c17a35] mt-0.5 shrink-0" size={14} />
                        <div>
                          <strong className="text-[#c17a35] uppercase tracking-wider block text-[11px]">
                            VECTOR_TRANSMISSION_TOPOLOGY:
                          </strong>
                          <span className="text-[#c5d2ca] mt-0.5 block font-sans">{art.transmission}</span>
                        </div>
                      </div>

                      {/* Visual Signs */}
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-mono font-semibold text-[#84ba90] uppercase tracking-wider">
                          PATHOLOGICAL_SYMPTOM_SIGNALS:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {art.visual_cues?.map((cue: string, idx: number) => (
                            <div key={idx} className="bg-[#08100c] border border-[#1b2b20] p-2.5 rounded-[2px] text-xs text-[#e8e6df] font-mono flex items-start gap-2">
                              <span className="text-[#c17a35] text-[10px] shrink-0 mt-0.5">·</span>
                              <span>{cue}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dos & Donts */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#0a140e] border border-[#2d523a]/50 rounded-[2px] p-3.5 space-y-2">
                          <h5 className="text-[11px] font-mono font-semibold text-[#84ba90] flex items-center gap-1.5 uppercase tracking-wider">
                            <CheckCircle2 size={13} className="text-[#84ba90]" />
                            <span>STATUTORY_DIRECTIVES (DOS)</span>
                          </h5>
                          <ul className="space-y-1.5 text-xs text-[#c5d2ca] font-sans">
                            {art.dos?.map((item: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-[#84ba90] font-mono">[+]</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-[#14080a] border border-[#b5555f]/50 rounded-[2px] p-3.5 space-y-2">
                          <h5 className="text-[11px] font-mono font-semibold text-[#b5555f] flex items-center gap-1.5 uppercase tracking-wider">
                            <XCircle size={13} className="text-[#b5555f]" />
                            <span>PROHIBITED_ACTIONS (DONTS)</span>
                          </h5>
                          <ul className="space-y-1.5 text-xs text-[#c5d2ca] font-sans">
                            {art.donts?.map((item: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-[#b5555f] font-mono">[-]</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};