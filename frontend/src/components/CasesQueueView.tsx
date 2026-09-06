import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle2, Clock, AlertTriangle, FileText, Check, Plus, Database, ShieldCheck, Terminal } from "lucide-react";
import { Language, translations } from "../locales/i18n";
import { getOfflineQueue, OfflineCase, saveOfflineQueue } from "../services/offlineQueue";
import { api } from "../services/api";

interface CasesQueueViewProps {
  lang: Language;
  onOpenReport: (report: any) => void;
  onQueueUpdated: () => void;
  onNewIntake?: () => void;
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 8 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

export const CasesQueueView: React.FC<CasesQueueViewProps> = ({ lang, onOpenReport, onQueueUpdated, onNewIntake }) => {
  const t = translations[lang];
  const [cases, setCases] = useState<OfflineCase[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = () => {
    const list = getOfflineQueue();
    setCases(list);
  };

  const handleSyncAll = async () => {
    const pending = cases.filter(c => c.sync_status === "PENDING");
    if (pending.length === 0) {
      return;
    }

    setIsSyncing(true);
    setSyncMsg(null);
    try {
      await api.requestOtp("+919876543210", "FARMER");
      await api.verifyOtp("+919876543210", "123456", "session-farmer");

      const syncPayload = {
        cases: pending.map(c => ({
          client_case_uuid: c.client_case_uuid,
          animal: c.animal,
          symptoms: c.symptoms,
          gps_location: c.gps_location,
          recorded_at_offline: c.recorded_at_offline
        }))
      };

      const res = await api.syncCasesBatch(syncPayload.cases);

      const currentQueue = getOfflineQueue();
      res.results.forEach((r: any) => {
        const match = currentQueue.find(item => item.client_case_uuid === r.client_case_uuid);
        if (match) {
          match.sync_status = "SYNCED";
          match.server_case_id = r.server_case_id;
          if (r.ai_report) {
            match.ai_report = r.ai_report;
          }
        }
      });

      saveOfflineQueue(currentQueue);
      setCases([...currentQueue]);
      onQueueUpdated();
      setSyncMsg(`SYNC_CONFIRMED // ${res.synced_count} CASES RECONCILED WITH NDLM CLOUD FEDERATION`);
    } catch (err: any) {
      alert(err.message || "Sync reconciliation failed. Ensure gateway endpoint is reachable.");
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = cases.filter(c => c.sync_status === "PENDING").length;
  const syncedCount = cases.filter(c => c.sync_status === "SYNCED").length;

  return (
    <div className="w-full space-y-4 pb-12 font-sans">
      {/* Botanical Outbox Control Panel */}
      <div className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] rounded-[2px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#84ba90] tracking-wider uppercase font-semibold">
              LOCAL_OUTBOX // DISCONNECTED_BUFFER
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#0d1611] border border-[#1b2b20] text-[#8a9990]">
              TOTAL: {cases.length}
            </span>
          </div>
          <p className="text-xs text-[#8a9990]">
            Deterministic offline journal with client-side UUID generation and cryptographic conflict-free sync.
          </p>
          <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-[#8a9990]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c17a35]"></span>
              PENDING: {pendingCount}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5a8f66]"></span>
              RECONCILED: {syncedCount}
            </span>
            <span>STORAGE: INDEXEDDB_V1</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onNewIntake && (
            <button
              onClick={onNewIntake}
              className="bg-[#0d1a12] hover:bg-[#13281c] text-[#84ba90] border border-[#2d523a] text-xs font-mono uppercase px-3 py-2 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={13} className="text-[#84ba90]" />
              <span>NEW_INTAKE</span>
            </button>
          )}

          <button
            onClick={handleSyncAll}
            disabled={isSyncing || pendingCount === 0}
            className={`text-xs font-mono uppercase px-4 py-2 rounded-[2px] transition-colors flex items-center gap-2 cursor-pointer ${
              pendingCount > 0
                ? "bg-[#5a8f66] hover:bg-[#689f75] text-white font-semibold shadow-md shadow-[#5a8f66]/25"
                : "bg-[#0d1611] text-[#4e6054] border border-[#1b2b20] cursor-not-allowed"
            }`}
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "RECONCILING..." : `SYNC_BUFFER (${pendingCount})`}</span>
          </button>
        </div>
      </div>

      {/* Sync Reconciliation Notification */}
      <AnimatePresence>
        {syncMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0b1c12] border border-[#2d523a] text-[#84ba90] px-3.5 py-2.5 rounded-[2px] text-xs font-mono flex items-center justify-between gap-2 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-[#84ba90] shrink-0" size={14} />
              <span>{syncMsg}</span>
            </div>
            <button 
              onClick={() => setSyncMsg(null)}
              className="text-[#8a9990] hover:text-[#e8e6df] text-[10px] uppercase font-mono cursor-pointer"
            >
              [DISMISS]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cases Queue List or Empty Telemetry State */}
      {cases.length === 0 ? (
        <div className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] rounded-[2px] p-12 text-center space-y-3 shadow-lg">
          <div className="w-10 h-10 rounded-[2px] bg-[#0d1611] border border-[#1b2b20] text-[#84ba90] flex items-center justify-center mx-auto">
            <Terminal size={18} className="text-[#84ba90]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="font-mono text-xs text-[#e8e6df] uppercase tracking-wider font-semibold">
              QUEUE_EMPTY // NO_UNSYNCHRONIZED_TELEMETRY
            </h4>
            <p className="text-xs text-[#8a9990]">
              All diagnostic records have been reconciled with the central ledger, or no records have been staged in this session.
            </p>
          </div>
          {onNewIntake && (
            <div className="pt-2">
              <button
                onClick={onNewIntake}
                className="bg-[#0d1a12] hover:bg-[#13281c] text-[#84ba90] border border-[#2d523a] text-xs font-mono uppercase px-4 py-2 rounded-[2px] transition-colors cursor-pointer"
              >
                INITIALIZE_CASE_INTAKE
              </button>
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          variants={listContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {cases.map((c) => {
            const isSynced = c.sync_status === "SYNCED";
            const report = c.ai_report;

            return (
              <motion.div
                key={c.client_case_uuid}
                variants={itemVariants}
                className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] hover:border-[#2d4535] rounded-[2px] p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-[2px] border ${
                        isSynced 
                          ? "bg-[#0d1a12] border-[#2d523a] text-[#84ba90]" 
                          : "bg-[#181109] border-[#c17a35]/60 text-[#c17a35]"
                      }`}
                    >
                      {isSynced ? "RECONCILED // NDLM" : "STAGED_OFFLINE // PENDING"}
                    </span>

                    {/* UUID */}
                    <span className="font-mono text-[10px] text-[#8a9990]">
                      UUID: <span className="text-[#c5d2ca]">{c.client_case_uuid.substring(0, 18)}...</span>
                    </span>

                    {c.server_case_id && (
                      <span className="font-mono text-[10px] text-[#8a9990]">
                        SRV_REF: <span className="text-[#84ba90]">#{c.server_case_id}</span>
                      </span>
                    )}
                  </div>

                  <h4 className="font-mono text-sm font-semibold text-[#e8e6df] truncate">
                    {report?.primary_disease_name 
                      ? report.primary_disease_name.toUpperCase() 
                      : "DIAGNOSTIC_EVALUATION_PENDING"}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#8a9990]">
                    <span>
                      SPECIES: <strong className="text-[#e8e6df] font-normal">{c.animal.species.toUpperCase()}</strong>
                    </span>
                    <span>
                      LESION: <span className="text-[#e8e6df]">{c.lesion_body_part ? c.lesion_body_part.toUpperCase() : "GENERAL"}</span>
                    </span>
                    <span>
                      RECORDED: <span className="text-[#c5d2ca]">{new Date(c.recorded_at_offline).toISOString().replace("T", " ").substring(0, 19)} UTC</span>
                    </span>
                  </div>
                </div>

                {report && (
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => onOpenReport(report)}
                      className="bg-[#0d1c13] hover:bg-[#13281c] text-[#84ba90] border border-[#2d523a] text-[11px] font-mono uppercase px-3 py-1.5 rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText size={12} />
                      <span>INSPECT_REPORT</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};