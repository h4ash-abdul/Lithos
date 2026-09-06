import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Stethoscope, CheckCircle2, AlertTriangle, Send, Eye, 
  ShieldCheck, Clock, MapPin, Filter, Check, RefreshCw,
  AlertOctagon, FileText, ChevronRight, X, Activity, Radio
} from "lucide-react";
import { Language, translations } from "../locales/i18n";
import { api } from "../services/api";

interface VetDashboardProps {
  lang: Language;
}

const caseFeedVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const caseCardVariants: any = {
  hidden: { opacity: 0, y: 8 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  exit: { opacity: 0, scale: 0.98 }
};

export const VetDashboard: React.FC<VetDashboardProps> = ({ lang }) => {
  const t = translations[lang];
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);

  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Triage form state
  const [action, setAction] = useState("SCHEDULED_VISIT");
  const [confirmedDisease, setConfirmedDisease] = useState("LUMPY_SKIN_DISEASE");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [quarantineAdvised, setQuarantineAdvised] = useState(true);
  const [pushToNdlm, setPushToNdlm] = useState(true);
  const [submittingTriage, setSubmittingTriage] = useState(false);
  const [triageSuccessMsg, setTriageSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadVetCases();
  }, []);

  const loadVetCases = async () => {
    setLoading(true);
    try {
      await api.requestOtp("+919988776655", "VET");
      await api.verifyOtp("+919988776655", "123456", "session-vet");
      const list = await api.fetchVetCases();
      setCases(list || []);
    } catch (e) {
      console.error("Failed to load vet cases", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTriage = (c: any) => {
    setSelectedCase(c);
    setConfirmedDisease(c.ai_report?.primary_disease_code || "LUMPY_SKIN_DISEASE");
    setClinicalNotes(`Field symptoms and AI suspicion validated: ${c.ai_report?.primary_disease_name || "Lumpy Skin Disease"}.`);
    setPrescription("Isolate animal immediately. Apply 0.1% potassium permanganate antiseptic wash. Soft mash diet.");
    setTriageSuccessMsg(null);
  };

  const handleSubmitTriage = async () => {
    if (!selectedCase) return;
    setSubmittingTriage(true);
    try {
      await api.triageCase(selectedCase.id, {
        triage_action: action,
        confirmed_disease_code: confirmedDisease,
        clinical_notes: clinicalNotes,
        official_prescription: prescription,
        is_quarantine_advised: quarantineAdvised,
        report_to_ndlm_epidemic_cell: pushToNdlm
      });

      setTriageSuccessMsg(`TRIAGE_RECORDED // SMS DISPATCHED TO LIVESTOCK OWNER (${selectedCase.farmer_phone || "+919876543210"})`);
      loadVetCases();
      setTimeout(() => {
        setSelectedCase(null);
        setTriageSuccessMsg(null);
      }, 1600);
    } catch (e: any) {
      alert(e.message || "Triage submission failed.");
    } finally {
      setSubmittingTriage(false);
    }
  };

  // Filter cases
  const filteredCases = cases.filter(c => {
    if (urgencyFilter !== "ALL" && c.urgency_level !== urgencyFilter) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    return true;
  });

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-[#18080a] text-[#b5555f] border-[#b5555f]/50 font-bold shadow-[0_0_8px_rgba(181,85,95,0.25)]";
      case "HIGH":
        return "bg-[#181007] text-[#c17a35] border-[#c17a35]/50 font-bold";
      case "MEDIUM":
        return "bg-[#121410] text-[#c2b280] border-[#c2b280]/50 font-semibold";
      default:
        return "bg-[#0b140e] text-[#7a8090] border-[#1a1a1a] font-normal";
    }
  };

  const criticalCount = cases.filter(c => c.urgency_level === "CRITICAL").length;
  const highCount = cases.filter(c => c.urgency_level === "HIGH").length;

  return (
    <div className="space-y-4 w-full pb-12 font-sans">
      {/* Top Clinical Ops Banner */}
      <div className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] rounded-[2px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[2px] bg-[#0d1a12] border border-[#2d523a] text-[#84ba90] flex items-center justify-center">
              <Stethoscope size={13} />
            </div>
            <h2 className="font-mono text-xs font-semibold tracking-wider text-[#84ba90] uppercase">
              VETERINARY_EPIDEMIOLOGICAL_FEED // SURVEILLANCE_DISPATCH
            </h2>
          </div>
          <p className="text-xs text-[#8a9990]">
            District Anand surveillance grid. Direct telemetry ingestion from NDLM client apps with AI differential verification.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono text-[#8a9990]">
            <span>TOTAL_RECORDS: {cases.length}</span>
            <span className="text-[#b5555f] font-semibold">CRITICAL_OUTBREAKS: {criticalCount}</span>
            <span className="text-[#c17a35]">HIGH_SEVERITY: {highCount}</span>
            <span>CELL: NADRS_ZONE_04</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono px-2 py-1 rounded-[2px] bg-[#0d1611] border border-[#1b2b20] text-[#c5d2ca]">
            FILTERED: {filteredCases.length}
          </span>
          <button
            onClick={loadVetCases}
            className="text-xs font-mono uppercase bg-[#0d1a12] hover:bg-[#13281c] text-[#84ba90] border border-[#2d523a] px-3 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>POLL_QUEUE</span>
          </button>
        </div>
      </div>

      {/* Control Bar / Filters */}
      <div className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] rounded-[2px] p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[#8a9990] mr-1 flex items-center gap-1">
            <Filter size={12} />
            <span>URGENCY:</span>
          </span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setUrgencyFilter(lvl)}
              className={`px-2 py-0.5 text-[11px] rounded-[2px] uppercase transition-colors cursor-pointer ${
                urgencyFilter === lvl
                  ? "bg-[#132319] border border-[#5a8f66] text-[#84ba90] font-semibold shadow-[0_0_8px_rgba(90,143,102,0.2)]"
                  : "bg-[#050a07] border border-[#1b2b20] text-[#8a9990] hover:text-[#e8e6df]"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[#8a9990] mr-1">STATUS:</span>
          {["ALL", "SYNCED", "UNDER_REVIEW", "VERIFIED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-0.5 text-[11px] rounded-[2px] uppercase transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-[#132319] border border-[#5a8f66] text-[#84ba90] font-semibold shadow-[0_0_8px_rgba(90,143,102,0.2)]"
                  : "bg-[#050a07] border border-[#1b2b20] text-[#8a9990] hover:text-[#e8e6df]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Case Feed Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-[#09110d]/85 border border-[#1b2b20] rounded-[2px] p-4 animate-pulse space-y-2.5">
              <div className="h-3 bg-[#0d1611] rounded-[2px] w-1/4" />
              <div className="h-4 bg-[#111f16] rounded-[2px] w-3/5" />
              <div className="h-10 bg-[#050a07] rounded-[2px]" />
            </div>
          ))}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] rounded-[2px] p-12 text-center space-y-2 shadow-lg">
          <div className="w-10 h-10 rounded-[2px] bg-[#0d1611] border border-[#1b2b20] text-[#84ba90] flex items-center justify-center mx-auto">
            <CheckCircle2 size={18} />
          </div>
          <h4 className="font-mono text-xs font-semibold text-[#e8e6df] uppercase tracking-wider">
            NO_CASES_MATCH_FILTER_PARAMETERS
          </h4>
          <p className="text-xs text-[#8a9990]">
            All incidents corresponding to selected urgency and lifecycle filters are resolved or triaged.
          </p>
        </div>
      ) : (
        <motion.div 
          variants={caseFeedVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {filteredCases.map((c) => (
            <motion.div
              key={c.id}
              variants={caseCardVariants}
              className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] hover:border-[#2d4535] rounded-[2px] p-4 transition-colors space-y-3 font-mono shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8a9990]">
                      CASE // #{c.id.substring(0, 8)}
                    </span>
                    {c.animal?.ndlm_animal_tag_id && (
                      <span className="bg-[#0d1611] border border-[#2d523a] text-[#84ba90] text-[9px] px-1.5 py-0.2 rounded-[2px]">
                        NDLM: {c.animal.ndlm_animal_tag_id}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-[#e8e6df] mt-1 truncate">
                    {c.ai_report?.primary_disease_name 
                      ? c.ai_report.primary_disease_name.toUpperCase() 
                      : "SUSPECTED_INFECTION"}
                  </h4>
                  <p className="text-xs text-[#8a9990] font-sans">
                    Species: <strong className="text-[#e8e6df] font-mono">{c.animal?.species || "CATTLE"}</strong> ({c.animal?.breed || "Indigenous"})
                  </p>
                </div>

                <span className={`px-2 py-0.5 rounded-[2px] text-[10px] uppercase border shrink-0 ${getUrgencyBadge(c.urgency_level)}`}>
                  {c.urgency_level}
                </span>
              </div>

              {/* Location & Time info telemetry strip */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8a9990] bg-[#050a07] p-2 rounded-[2px] border border-[#1b2b20]">
                <div className="flex items-center gap-1">
                  <MapPin size={11} className="text-[#b5555f]" />
                  <span>{c.village || "ANAND_RURAL"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-[#8a9990]" />
                  <span>{new Date(c.created_at).toISOString().substring(0, 10)}</span>
                </div>
                <span className="ml-auto text-[10px] text-[#84ba90]">
                  {c.status}
                </span>
              </div>

              {/* Action bar */}
              <div className="pt-2 border-t border-[#1b2b20] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#8a9990]">
                  AI_CONF: <strong className="text-[#e8e6df] font-mono">{Math.round((c.ai_report?.primary_confidence || 0.8) * 100)}%</strong>
                </span>
                <button
                  onClick={() => handleOpenTriage(c)}
                  className="bg-[#0d1c13] hover:bg-[#13281c] text-[#84ba90] border border-[#2d523a] text-[11px] font-mono uppercase px-3 py-1.5 rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Stethoscope size={12} />
                  <span>REVIEW_TRIAGE</span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Clinical Review & Triage Modal */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-50 bg-[rgba(5,8,6,0.92)] backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#09110d] border border-[#2d523a] rounded-[2px] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1b2b20]">
                <div>
                  <span className="text-[10px] font-mono text-[#8a9990] uppercase">
                    EPIDEMIOLOGICAL_TRIAGE // CASE #{selectedCase.id.substring(0, 8)}
                  </span>
                  <h3 className="text-sm font-mono font-bold text-[#e8e6df] uppercase">
                    CLINICAL_VALIDATION_&_NDLM_DISPATCH
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-[#8a9990] hover:text-[#e8e6df] p-1 font-mono text-xs uppercase cursor-pointer"
                >
                  [ESC]
                </button>
              </div>

              {triageSuccessMsg ? (
                <div className="bg-[#0b1c12] text-[#84ba90] p-4 rounded-[2px] border border-[#2d523a] text-xs font-mono flex items-center gap-2.5">
                  <CheckCircle2 className="text-[#84ba90] shrink-0" size={16} />
                  <span>{triageSuccessMsg}</span>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs font-sans">
                  {/* AI Suspicion & Reported Symptoms summary */}
                  <div className="bg-[#050a07] p-3 rounded-[2px] border border-[#1b2b20] font-mono text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#8a9990]">AI_SUSPICION:</span>
                      <span className="text-[#e8e6df] font-semibold">
                        {selectedCase.ai_report?.primary_disease_name} ({Math.round((selectedCase.ai_report?.primary_confidence || 0.8) * 100)}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8a9990]">REPORTED_SYMPTOMS: </span>
                      <span className="text-[#c5d2ca]">
                        {selectedCase.symptoms?.map((s: any) => `${s.code} (${s.severity})`).join(", ") || "Visual lesion report only"}
                      </span>
                    </div>
                  </div>

                  {/* Triage action selector */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#8a9990] mb-1">
                      TRIAGE_PROTOCOL_ACTION
                    </label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full text-xs font-mono border border-[#1b2b20] rounded-[2px] px-3 py-2 text-[#e8e6df] focus:outline-none focus:border-[#5a8f66] bg-[#050a07] cursor-pointer"
                    >
                      <option value="SCHEDULED_VISIT">Schedule On-Site Veterinary Dispatch</option>
                      <option value="TELECONSULT_ADVICE">Issue Teleconsult Advice & Prescription</option>
                      <option value="ESCALATED">Escalate to State Disease Investigation Lab</option>
                      <option value="DISMISSED">Dismiss as Non-Infectious / Minor</option>
                    </select>
                  </div>

                  {/* Confirmed Disease Code */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#8a9990] mb-1">
                      CONFIRMED_CLINICAL_DIAGNOSIS
                    </label>
                    <select
                      value={confirmedDisease}
                      onChange={(e) => setConfirmedDisease(e.target.value)}
                      className="w-full text-xs font-mono border border-[#1b2b20] rounded-[2px] px-3 py-2 text-[#e8e6df] focus:outline-none focus:border-[#5a8f66] bg-[#050a07] cursor-pointer"
                    >
                      <option value="LUMPY_SKIN_DISEASE">Lumpy Skin Disease (LSD)</option>
                      <option value="FOOT_AND_MOUTH_DISEASE">Foot & Mouth Disease (FMD)</option>
                      <option value="BLACKLEG">Blackleg (Clostridial)</option>
                      <option value="BOVINE_BABESIOSIS">Bovine Babesiosis (Tick Fever)</option>
                      <option value="BOVINE_MASTITIS">Clinical Mastitis</option>
                    </select>
                  </div>

                  {/* Clinical Notes & Prescription */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#8a9990] mb-1">
                      OFFICIAL_PRESCRIPTION_&_CARE_DIRECTIVE
                    </label>
                    <textarea
                      rows={3}
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      placeholder="Enter clinical observations and statutory pharmaceutical directive..."
                      className="w-full text-xs font-mono border border-[#1b2b20] rounded-[2px] p-3 text-[#e8e6df] placeholder-[#4e6054] focus:outline-none focus:border-[#5a8f66] bg-[#050a07]"
                    />
                  </div>

                  {/* Quarantine & NDLM check */}
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <label className="flex items-center gap-2.5 text-[#e8e6df] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quarantineAdvised}
                        onChange={(e) => setQuarantineAdvised(e.target.checked)}
                        className="rounded-[2px] border-[#1b2b20] bg-[#050a07] text-[#5a8f66] focus:ring-0"
                      />
                      <span className="text-[#c5d2ca]">Advise strict farm boundary quarantine to livestock owner</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-[#c17a35] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushToNdlm}
                        onChange={(e) => setPushToNdlm(e.target.checked)}
                        className="rounded-[2px] border-[#1b2b20] bg-[#050a07] text-[#c17a35] focus:ring-0"
                      />
                      <span className="font-semibold">TRANSMIT INCIDENCE TO NDLM / NADRS CENTRAL EPIDEMIC CELL</span>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-[#1b2b20] flex justify-end gap-2 font-mono">
                    <button
                      onClick={() => setSelectedCase(null)}
                      className="px-3 py-2 text-xs uppercase text-[#8a9990] hover:text-[#e8e6df] transition-colors cursor-pointer"
                    >
                      [CANCEL]
                    </button>
                    <button
                      onClick={handleSubmitTriage}
                      disabled={submittingTriage}
                      className="bg-[#5a8f66] hover:bg-[#689f75] text-white text-xs font-semibold font-mono uppercase px-5 py-2 rounded-[2px] transition-colors flex items-center gap-1.5 shadow-md shadow-[#5a8f66]/25 cursor-pointer"
                    >
                      <Send size={12} />
                      <span>{submittingTriage ? "DISPATCHING..." : "COMMIT_TRIAGE"}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};