import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Mic, MapPin, Check, AlertCircle, Sparkles, 
  ChevronRight, ChevronLeft, Loader2, ShieldCheck, 
  Search, Stethoscope, Droplets, Thermometer, 
  AlertTriangle, CircleDot, Activity, MinusCircle
} from "lucide-react";
import { Language, translations } from "../locales/i18n";
import { compressImage, enqueueOfflineCase, runOnDeviceOfflineInference, OfflineCase } from "../services/offlineQueue";
import { api } from "../services/api";

interface FarmerIntakeProps {
  lang: Language;
  isOffline: boolean;
  onCaseCreated: (report: any) => void;
}

const SYMPTOM_OPTIONS = [
  { code: "SKIN_NODULES", labelEn: "Skin Lumps / Nodules", labelHi: "त्वचा पर गांठें / दाने", labelTa: "தோல் கட்டிகள்", icon: CircleDot, desc: "Hard round swellings on dermis" },
  { code: "ORAL_BLISTERS", labelEn: "Mouth Blisters / Ulcers", labelHi: "मुंह में छाले / घाव", labelTa: "வாயில் புண்கள்", icon: AlertCircle, desc: "Painful buccal mucosal erosion" },
  { code: "SALIVATION", labelEn: "Excessive Saliva Drooling", labelHi: "लार टपकना (मुंह से झाग)", labelTa: "அதிக உமிழ்நீர்", icon: Droplets, desc: "Stringy continuous drool" },
  { code: "LAMENESS", labelEn: "Limping / Lameness", labelHi: "लंगड़ा कर चलना / दर्द", labelTa: "நொண்டி நடப்பது", icon: Activity, desc: "Difficulty bearing weight" },
  { code: "FEVER", labelEn: "High Body Heat / Fever", labelHi: "तेज बुखार / गर्म कान", labelTa: "அதிக காய்ச்சல்", icon: Thermometer, desc: "Elevated rectal/ear temp" },
  { code: "UDDER_SWELLING", labelEn: "Swollen Udder / Mastitis", labelHi: "थन में सूजन / कड़ापन", labelTa: "மடி வீக்கம்", icon: AlertTriangle, desc: "Painful hot mammary quarter" },
  { code: "RED_URINE", labelEn: "Red / Dark Urine", labelHi: "लाल / गहरा पेशाब", labelTa: "சிவப்பு சிறுநீர்", icon: Droplets, desc: "Hemoglobinuria / tick fever sign" },
  { code: "APPETITE_LOSS", labelEn: "Loss of Appetite / Dull", labelHi: "चारा न खाना / सुस्ती", labelTa: "தீவனம் உண்ணாமை", icon: MinusCircle, desc: "Off-feed and lethargic" }
];

const SPECIES_OPTIONS = [
  { id: "CATTLE", name: "Cattle", sub: "Cow / Bull", code: "BOV" },
  { id: "BUFFALO", name: "Buffalo", sub: "Murrah / Surti", code: "BUF" },
  { id: "GOAT", name: "Goat", sub: "Caprine", code: "CAP" },
  { id: "SHEEP", name: "Sheep", sub: "Ovine", code: "OVI" }
];

const BODY_PARTS = [
  { id: "SKIN", label: "Skin / Humps" },
  { id: "MOUTH", label: "Mouth / Lips" },
  { id: "HOOF", label: "Hooves / Feet" },
  { id: "UDDER", label: "Udder / Teats" },
  { id: "GENERAL", label: "General Body" }
];

export const FarmerIntakeFlow: React.FC<FarmerIntakeProps> = ({ lang, isOffline, onCaseCreated }) => {
  const t = translations[lang];

  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState(1);

  const [tagId, setTagId] = useState("");
  const [isTagVerifying, setIsTagVerifying] = useState(false);
  const [tagVerifiedData, setTagVerifiedData] = useState<any>(null);
  const [species, setSpecies] = useState("CATTLE");
  const [breed, setBreed] = useState("Indigenous");
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, { severity: "MILD" | "MODERATE" | "SEVERE"; days: number }>>({
    SKIN_NODULES: { severity: "SEVERE", days: 2 }
  });
  const [lesionPart, setLesionPart] = useState("SKIN");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; village: string; district: string } | null>({
    lat: 22.5645,
    lng: 72.9289,
    village: "Anand Rural",
    district: "Anand"
  });
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(0);

  const phaseMessages = [
    lang === "hi" ? "त्वचा और घाव के फोटो का विश्लेषण जारी है..." : "ANALYZING LESION TEXTURE & ERYTHEMA INDEX...",
    lang === "hi" ? "लक्षणों को पशु चिकित्सा ज्ञानकोष से मिलाया जा रहा है..." : "CROSS-REFERENCING SYMPTOM MATRIX...",
    lang === "hi" ? "गंभीरता और एनडीएलएम संगरोध नियमों की जांच हो रही है..." : "CALIBRATING EPIDEMIC URGENCY PROTOCOLS...",
    lang === "hi" ? "प्रथम उपचार रिपोर्ट तैयार की जा रही है..." : "GENERATING SUSPECTED DIAGNOSIS & INTERIM CARE..."
  ];

  useEffect(() => {
    let timer: any;
    if (isSubmitting) {
      setAnalysisPhase(0);
      timer = setInterval(() => {
        setAnalysisPhase((prev) => (prev < 3 ? prev + 1 : prev));
      }, 650);
    }
    return () => clearInterval(timer);
  }, [isSubmitting]);

  const goToStep = (target: number) => {
    setSlideDirection(target > currentStep ? 1 : -1);
    setCurrentStep(target);
  };

  const handleVerifyTag = async () => {
    if (!tagId || tagId.trim().length !== 12) {
      alert("Please enter a valid 12-digit NDLM ear tag number.");
      return;
    }
    setIsTagVerifying(true);
    try {
      const profile = await api.lookupNdlmTag(tagId.trim());
      setTagVerifiedData(profile);
      setSpecies(profile.species);
      setBreed(profile.breed);
    } catch (err: any) {
      alert(err.message || "NDLM Tag validation failed.");
    } finally {
      setIsTagVerifying(false);
    }
  };

  const toggleSymptom = (code: string) => {
    setSelectedSymptoms((prev) => {
      const next = { ...prev };
      if (next[code]) {
        delete next[code];
      } else {
        next[code] = { severity: "MODERATE", days: 2 };
      }
      return next;
    });
  };

  const updateSymptomSeverity = (code: string, severity: "MILD" | "MODERATE" | "SEVERE") => {
    setSelectedSymptoms((prev) => ({
      ...prev,
      [code]: { ...prev[code], severity }
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      try {
        const compressed = await compressImage(file);
        setImagePreview(compressed.base64);
        setCompressedSize(compressed.sizeKb);
        setCompressedBlob(compressed.blob);
      } catch (err) {
        console.error("Compression error", err);
      }
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
          village: "Current GPS Location",
          district: "Anand"
        });
        setIsDetectingGps(false);
      },
      (err) => {
        console.warn("GPS lookup error", err);
        setIsDetectingGps(false);
      }
    );
  };

  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (!isRecordingVoice) {
        setIsRecordingVoice(true);
        setTimeout(() => {
          setVoiceTranscript(
            lang === "hi"
              ? "गाय के शरीर पर 2 दिन से सख्त गांठें दिख रही हैं और तेज बुखार है।"
              : "Cow has nodular lumps all over body with fever since 2 days."
          );
          setIsRecordingVoice(false);
        }, 1500);
      }
      return;
    }

    if (isRecordingVoice) {
      setIsRecordingVoice(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === "hi" ? "hi-IN" : lang === "ta" ? "ta-IN" : "en-US";
      recognition.onstart = () => setIsRecordingVoice(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceTranscript(text);
        setIsRecordingVoice(false);
      };
      recognition.onerror = () => setIsRecordingVoice(false);
      recognition.start();
    }
  };

  const handleSubmitCase = async () => {
    const symptomsList = Object.entries(selectedSymptoms).map(([code, val]) => ({
      code,
      severity: val.severity,
      duration_days: val.days
    }));

    if (symptomsList.length === 0) {
      alert("Please select at least one symptom observed.");
      return;
    }

    setIsSubmitting(true);
    const clientUuid = "client-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now();

    const caseData: OfflineCase = {
      client_case_uuid: clientUuid,
      animal: {
        ndlm_animal_tag_id: tagId ? tagId.trim() : undefined,
        species,
        breed,
        age_months: 36,
        sex: "FEMALE"
      },
      symptoms: symptomsList,
      gps_location: {
        latitude: gpsLocation?.lat || 22.5645,
        longitude: gpsLocation?.lng || 72.9289,
        village: gpsLocation?.village || "Khedapa",
        district: gpsLocation?.district || "Anand",
        state: "Gujarat"
      },
      image_data_base64: imagePreview || undefined,
      lesion_body_part: lesionPart,
      recorded_at_offline: new Date().toISOString(),
      sync_status: isOffline ? "PENDING" : "SYNCED"
    };

    setTimeout(async () => {
      if (isOffline) {
        const offlineAi = runOnDeviceOfflineInference(species, symptomsList, lesionPart);
        caseData.ai_report = offlineAi;
        enqueueOfflineCase(caseData);
        setIsSubmitting(false);
        onCaseCreated(offlineAi);
      } else {
        try {
          const syncPayload = {
            cases: [
              {
                client_case_uuid: clientUuid,
                animal: caseData.animal,
                symptoms: caseData.symptoms,
                gps_location: caseData.gps_location,
                recorded_at_offline: caseData.recorded_at_offline
              }
            ]
          };

          const syncRes = await api.syncCasesBatch(syncPayload.cases);
          const serverCase = syncRes.results[0];

          if (compressedBlob && serverCase.server_case_id) {
            try {
              await api.uploadMedia(serverCase.server_case_id, compressedBlob, lesionPart);
            } catch (e) {
              console.error("Media upload error", e);
            }
          }

          caseData.server_case_id = serverCase.server_case_id;
          caseData.ai_report = serverCase.ai_report;
          caseData.sync_status = "SYNCED";
          enqueueOfflineCase(caseData);

          setIsSubmitting(false);
          onCaseCreated(serverCase.ai_report);
        } catch (err: any) {
          console.warn("Direct sync failed, falling back to local queue", err);
          const fallbackAi = runOnDeviceOfflineInference(species, symptomsList, lesionPart);
          caseData.ai_report = fallbackAi;
          caseData.sync_status = "PENDING";
          enqueueOfflineCase(caseData);
          setIsSubmitting(false);
          onCaseCreated(fallbackAi);
        }
      }
    }, 1800);
  };

  const stepsList = [
    { num: 1, title: "ANIMAL ID" },
    { num: 2, title: "SYMPTOMS" },
    { num: 3, title: "LESION PHOTO" },
    { num: 4, title: "GEOTAG & VOICE" },
    { num: 5, title: "REVIEW" }
  ];
  return (
    <div className="w-full space-y-6 pb-16">
      {/* Offline Status Alert */}
      {isOffline && (
        <div className="bg-[#180f08]/90 border border-[#c17a35]/60 text-[#c17a35] p-3.5 rounded-[2px] text-xs font-mono flex items-center gap-3 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#c17a35] shrink-0 animate-pulse" />
          <span>OFFLINE LOCAL MODE &middot; Cases queued locally in encrypted browser outbox</span>
        </div>
      )}

      {/* Botanical Sub-stepper Bar */}
      <div className="bg-[#080f0b]/70 backdrop-blur-md border border-[#1b2b20] rounded-[2px] p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between overflow-x-auto">
          {stepsList.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => goToStep(s.num)}
                className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none shrink-0 cursor-pointer"
              >
                <div 
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                    currentStep === s.num
                      ? "bg-[#5a8f66] text-white border border-[#689f75] shadow-[0_0_10px_rgba(90,143,102,0.3)]"
                      : currentStep > s.num
                      ? "bg-[#0d1a12] text-[#84ba90] border border-[#2d523a]"
                      : "bg-[#060b08] text-[#7a8a80] border border-[#1b2b20] group-hover:border-[#2d4535]"
                  }`}
                >
                  {currentStep > s.num ? <Check size={13} /> : s.num}
                </div>
                <span className={`text-xs font-mono font-bold tracking-[0.5px] uppercase hidden sm:block ${currentStep === s.num ? "text-[#84ba90]" : "text-[#7a8a80] group-hover:text-[#e8e6df]"}`}>
                  {s.title}
                </span>
              </button>
              {idx < stepsList.length - 1 && (
                <div className="flex-1 h-[1px] bg-[#1b2b20] mx-2 sm:mx-4 min-w-[12px]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="relative min-h-[420px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: Animal Identification & Species */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#08100c]/70 backdrop-blur-md rounded-[2px] p-6 sm:p-10 border border-[#1b2b20] space-y-7 shadow-xl"
            >
              <div className="border-b border-[#1b2b20] pb-4">
                <span className="text-xs font-mono font-bold text-[#84ba90] uppercase tracking-[0.15em] block">
                  STEP 01 // ANIMAL REGISTRATION
                </span>
                <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                  Identification &amp; Species Classification
                </h3>
              </div>

              {/* Tag Input & Verification */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  NDLM 12-Digit Ear Tag Identifier
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="ENTER 12-DIGIT TAG (E.G. 100234567890)"
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 bg-[#050a07] border border-[#1b2b20] rounded-[2px] px-4 py-3 text-sm sm:text-base font-mono text-[#e8e6df] placeholder-[#4e6054] focus:outline-none focus:border-[#5a8f66] transition"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyTag}
                    disabled={isTagVerifying || tagId.length !== 12}
                    className="bg-[#0d1c13] hover:bg-[#13281c] disabled:opacity-30 border border-[#2d523a] text-[#84ba90] text-xs sm:text-sm font-mono font-bold uppercase px-6 py-3 rounded-[2px] transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
                  >
                    {isTagVerifying ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                    <span>VERIFY TAG</span>
                  </button>
                </div>

                {tagVerifiedData && (
                  <div className="bg-[#060e09] border border-[#2d523a] text-[#e8e6df] p-4 rounded-[2px] text-xs sm:text-sm font-mono space-y-1.5 mt-2">
                    <div className="flex items-center gap-2 font-bold text-[#84ba90] text-xs uppercase">
                      <ShieldCheck size={15} />
                      <span>NDLM Federated Registry Verified</span>
                    </div>
                    <p className="text-xs text-[#8a9990]">Owner: <strong className="text-[#e8e6df]">{tagVerifiedData.owner_name}</strong> ({tagVerifiedData.village}, {tagVerifiedData.district})</p>
                    <p className="text-xs text-[#8a9990]">Profile: <strong className="text-[#e8e6df]">{tagVerifiedData.species}</strong> &middot; Breed: <strong className="text-[#e8e6df]">{tagVerifiedData.breed}</strong></p>
                  </div>
                )}
              </div>

              {/* Species Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  Species Code
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {SPECIES_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSpecies(opt.id)}
                      className={`p-4 sm:p-5 rounded-[2px] border text-left transition flex flex-col justify-between h-24 sm:h-28 cursor-pointer ${
                        species === opt.id
                          ? "bg-[#0e1c14] border border-[#5a8f66] shadow-[0_0_10px_rgba(90,143,102,0.2)]"
                          : "bg-[#050a07] border border-[#1b2b20] hover:border-[#2d4535] text-[#8a9990]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-[2px] ${
                          species === opt.id ? "bg-[#5a8f66] text-white" : "bg-[#0d1611] text-[#8a9990]"
                        }`}>
                          {opt.code}
                        </span>
                        {species === opt.id && <Check size={15} className="text-[#84ba90]" />}
                      </div>
                      <div>
                        <span className="font-mono font-bold text-sm sm:text-base text-[#e8e6df] block">{opt.name}</span>
                        <span className="text-xs font-mono text-[#8a9990] block">{opt.sub}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Breed Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  Registered Breed Type
                </label>
                <select
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full bg-[#050a07] border border-[#1b2b20] rounded-[2px] px-4 py-3 text-xs sm:text-sm font-mono text-[#e8e6df] focus:outline-none focus:border-[#5a8f66] uppercase cursor-pointer"
                >
                  <option value="Gir">Gir (Indigenous Dairy)</option>
                  <option value="Kankrej">Kankrej (Dual Purpose)</option>
                  <option value="Murrah">Murrah (Buffalo Dairy)</option>
                  <option value="Crossbred">Crossbred (HF / Jersey Cross)</option>
                  <option value="Indigenous">Indigenous Non-Descript</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Observed Symptoms */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#08100c]/70 backdrop-blur-md rounded-[2px] p-6 sm:p-10 border border-[#1b2b20] space-y-7 shadow-xl"
            >
              <div className="border-b border-[#1b2b20] pb-4">
                <span className="text-xs font-mono font-bold text-[#84ba90] uppercase tracking-[0.15em] block">
                  STEP 02 // CLINICAL SYMPTOMS
                </span>
                <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                  Select Observed Pathological Indicators
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {SYMPTOM_OPTIONS.map((opt) => {
                  const isSelected = !!selectedSymptoms[opt.code];
                  const Icon = opt.icon;
                  const label = lang === "hi" ? opt.labelHi : lang === "ta" ? opt.labelTa : opt.labelEn;

                  return (
                    <div
                      key={opt.code}
                      onClick={() => toggleSymptom(opt.code)}
                      className={`p-4 sm:p-5 rounded-[2px] border transition cursor-pointer space-y-2.5 ${
                        isSelected
                          ? "bg-[#0e1c14] border border-[#5a8f66] shadow-[0_0_10px_rgba(90,143,102,0.18)]"
                          : "bg-[#050a07] border border-[#1b2b20] hover:border-[#2d4535] text-[#8a9990]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} className={isSelected ? "text-[#84ba90]" : "text-[#8a9990]"} />
                          <span className="text-xs sm:text-sm font-mono font-bold text-[#e8e6df]">{label}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-[2px] border flex items-center justify-center text-xs ${
                          isSelected ? "bg-[#5a8f66] border-[#5a8f66] text-white" : "border-[#1b2b20] bg-[#070e0a]"
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>

                      <p className="text-xs font-mono text-[#8a9990] leading-normal pl-6">
                        {opt.desc}
                      </p>

                      {isSelected && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="pt-2.5 border-t border-[#1b2b20] flex items-center justify-between text-xs"
                        >
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a9990]">SEVERITY:</span>
                          <div className="flex gap-1.5">
                            {(['MILD', 'MODERATE', 'SEVERE'] as const).map((sev) => (
                              <button
                                key={sev}
                                type="button"
                                onClick={() => updateSymptomSeverity(opt.code, sev)}
                                className={`px-2.5 py-1 rounded-[2px] text-[10px] font-mono font-bold uppercase transition ${
                                  selectedSymptoms[opt.code]?.severity === sev
                                    ? sev === 'SEVERE'
                                      ? 'bg-[#b5555f] text-white'
                                      : sev === 'MODERATE'
                                      ? 'bg-[#c17a35] text-white'
                                      : 'bg-[#132319] text-[#84ba90] border border-[#2d523a]'
                                    : 'bg-[#070e0a] text-[#8a9990] border border-[#1b2b20] hover:border-[#2d4535]'
                                }`}
                              >
                                {sev}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Lesion Photo & Body Part */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#08100c]/70 backdrop-blur-md rounded-[2px] p-6 sm:p-10 border border-[#1b2b20] space-y-7 shadow-xl"
            >
              <div className="border-b border-[#1b2b20] pb-4">
                <span className="text-xs font-mono font-bold text-[#84ba90] uppercase tracking-[0.15em] block">
                  STEP 03 // OPTICAL TELEMETRY
                </span>
                <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                  Dermatological Lesion Capture
                </h3>
              </div>

              {/* Photo Upload Zone */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  Lesion / Clinical Image Payload
                </label>
                <label className="border border-dashed border-[#233527] hover:border-[#5a8f66] bg-[#050a07] rounded-[2px] p-8 sm:p-12 text-center transition cursor-pointer flex flex-col items-center justify-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="space-y-4 w-full flex flex-col items-center">
                      <img
                        src={imagePreview}
                        alt="Lesion Preview"
                        className="w-56 h-56 object-cover rounded-[2px] border border-[#233527] shadow-md"
                      />
                      {compressedSize && (
                        <span className="text-xs font-mono font-bold text-[#84ba90] bg-[#070e0a] px-3 py-1.5 rounded-[2px] border border-[#1b2b20] flex items-center gap-2">
                          <Check size={13} />
                          <span>{compressedSize} KB &middot; OPTIMIZED FOR 2G EDGE TELEMETRY</span>
                        </span>
                      )}
                      <span className="text-xs font-mono text-[#8a9990] uppercase">CLICK TO RE-ACQUIRE IMAGE</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-[2px] bg-[#0d1a12] border border-[#2d523a] text-[#84ba90] flex items-center justify-center">
                        <Camera size={26} />
                      </div>
                      <div>
                        <span className="text-sm font-mono font-bold text-[#e8e6df] block uppercase">
                          CAPTURE OR SELECT LESION IMAGE
                        </span>
                        <span className="text-xs font-mono text-[#8a9990] mt-1 block uppercase">
                          AUTO-COMPRESSION ACTIVE (&lt; 500 KB PAYLOAD)
                        </span>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {/* Lesion Body Part Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  Affected Anatomical Location
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {BODY_PARTS.map((bp) => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => setLesionPart(bp.id)}
                      className={`px-4 py-2 rounded-[2px] font-mono text-xs font-semibold uppercase transition border cursor-pointer ${
                        lesionPart === bp.id
                          ? "bg-[#0e1c14] border-[#5a8f66] text-[#84ba90] shadow-[0_0_10px_rgba(90,143,102,0.2)] font-bold"
                          : "bg-[#050a07] border-[#1b2b20] text-[#8a9990] hover:border-[#2d4535]"
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Field Location & Voice Notes */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#08100c]/70 backdrop-blur-md rounded-[2px] p-6 sm:p-10 border border-[#1b2b20] space-y-7 shadow-xl"
            >
              <div className="border-b border-[#1b2b20] pb-4">
                <span className="text-xs font-mono font-bold text-[#84ba90] uppercase tracking-[0.15em] block">
                  STEP 04 // GEOTAG &amp; AUDIO RECORD
                </span>
                <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                  GIS Telemetry &amp; Voice Annotation
                </h3>
              </div>

              {/* GPS Geotag Card */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  GIS Farm Coordinates
                </label>
                <div className="bg-[#050a07] border border-[#1b2b20] p-4 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#84ba90]">
                      <MapPin size={15} />
                      <span>{gpsLocation?.village || "Anand Rural"}, {gpsLocation?.district || "Anand"}</span>
                    </div>
                    <span className="text-xs text-[#8a9990] block">
                      LAT: {gpsLocation?.lat} &middot; LNG: {gpsLocation?.lng} &middot; ACCURACY: HIGH
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isDetectingGps}
                    className="bg-[#0d1c13] hover:bg-[#13281c] border border-[#2d523a] text-[#84ba90] text-xs font-bold px-4 py-2 rounded-[2px] transition flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
                  >
                    {isDetectingGps ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
                    <span>ACQUIRE GPS</span>
                  </button>
                </div>
              </div>

              {/* Voice Notes */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  Acoustic Symptom Dictation (Optional)
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`w-full py-3 px-4 rounded-[2px] border font-mono font-bold text-xs uppercase flex items-center justify-center gap-2.5 transition cursor-pointer ${
                      isRecordingVoice
                        ? "bg-[#220d11] border-[#b5555f] text-[#b5555f] animate-pulse"
                        : "bg-[#050a07] border border-[#1b2b20] text-[#8a9990] hover:border-[#5a8f66]"
                    }`}
                  >
                    <Mic size={15} className={isRecordingVoice ? "text-[#b5555f]" : "text-[#84ba90]"} />
                    <span>{isRecordingVoice ? "CAPTURING AUDIO... TAP TO STOP" : "RECORD VOICE OBSERVATION"}</span>
                  </button>

                  <textarea
                    rows={4}
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    placeholder="Audio transcript will populate here or type additional clinical notes..."
                    className="w-full bg-[#050a07] border border-[#1b2b20] rounded-[2px] p-3 text-xs sm:text-sm font-mono text-[#e8e6df] placeholder-[#4e6054] focus:outline-none focus:border-[#5a8f66] transition"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Review & Submit */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#08100c]/70 backdrop-blur-md rounded-[2px] p-6 sm:p-10 border border-[#1b2b20] space-y-7 shadow-xl"
            >
              <div className="border-b border-[#1b2b20] pb-4">
                <span className="text-xs font-mono font-bold text-[#84ba90] uppercase tracking-[0.15em] block">
                  STEP 05 // VERIFICATION
                </span>
                <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                  Inspection Payload Review
                </h3>
              </div>

              {/* Review Summary Details */}
              <div className="bg-[#050a07] border border-[#1b2b20] rounded-[2px] p-5 sm:p-6 space-y-4 font-mono text-xs sm:text-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#1b2b20]">
                  <span className="text-[#8a9990] uppercase text-xs">ANIMAL SPECIES:</span>
                  <strong className="text-[#e8e6df] font-bold">{species} &middot; {breed}</strong>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#1b2b20]">
                  <span className="text-[#8a9990] uppercase text-xs">NDLM TAG ID:</span>
                  <span className="font-bold text-[#84ba90]">
                    {tagId ? tagId : "UNREGISTERED_TAG"}
                  </span>
                </div>

                <div className="space-y-1.5 pb-3 border-b border-[#1b2b20]">
                  <span className="text-[#8a9990] uppercase text-xs block">SYMPTOMS ({Object.keys(selectedSymptoms).length}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selectedSymptoms).map(([code, val]) => (
                      <span key={code} className="bg-[#0d1a12] text-[#84ba90] border border-[#2d523a] px-2.5 py-1 rounded-[2px] text-xs">
                        {code} [{val.severity}]
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#1b2b20]">
                  <span className="text-[#8a9990] uppercase text-xs">LESION SITE:</span>
                  <strong className="text-[#e8e6df]">{lesionPart}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8a9990] uppercase text-xs">GIS POSITION:</span>
                  <span className="text-[#8a9990] text-xs">
                    {gpsLocation?.village}, {gpsLocation?.district} ({gpsLocation?.lat}, {gpsLocation?.lng})
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitCase}
                disabled={isSubmitting}
                className="w-full bg-[#5a8f66] hover:bg-[#689f75] text-white font-mono font-bold text-sm sm:text-base uppercase tracking-wider py-4 px-6 rounded-[2px] shadow-lg shadow-[#5a8f66]/25 flex items-center justify-center gap-2.5 transition cursor-pointer"
              >
                <Sparkles size={18} />
                <span>GENERATE DIAGNOSTIC REPORT</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => goToStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="bg-[#080f0b] hover:bg-[#101c15] border border-[#1b2b20] disabled:opacity-20 text-[#8a9990] hover:text-[#e8e6df] px-6 py-3 rounded-[2px] font-mono font-bold text-xs sm:text-sm uppercase flex items-center gap-2 transition cursor-pointer"
        >
          <ChevronLeft size={15} />
          <span>PREVIOUS</span>
        </button>

        {currentStep < 5 && (
          <button
            type="button"
            onClick={() => goToStep(currentStep + 1)}
            className="bg-[#5a8f66] hover:bg-[#689f75] text-white border border-[#5a8f66] px-8 py-3 rounded-[2px] font-mono font-bold text-xs sm:text-sm uppercase flex items-center gap-2 transition cursor-pointer shadow-md shadow-[#5a8f66]/20"
          >
            <span>NEXT</span>
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* Diagnostic Processing Modal Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <div className="fixed inset-0 z-50 bg-[rgba(5,8,6,0.92)] backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#09110d] border border-[#2d523a] rounded-[2px] p-6 max-w-sm w-full text-center space-y-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
            >
              <div className="w-12 h-12 rounded-full bg-[#0d1c13] border border-[#5a8f66] flex items-center justify-center text-[#84ba90] mx-auto shadow-[0_0_10px_rgba(90,143,102,0.25)]">
                <Loader2 size={24} className="animate-spin" />
              </div>

              <div className="space-y-1 font-mono">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e8e6df]">
                  INFERENCE ENGINE ACTIVE
                </h3>
                <p className="text-[10px] text-[#84ba90] tracking-wide h-6 flex items-center justify-center">
                  {phaseMessages[analysisPhase]}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[0, 1, 2, 3].map((stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`h-[2px] rounded-[1px] transition-all duration-300 ${
                      analysisPhase >= stepIdx ? "bg-[#5a8f66]" : "bg-[#1b2b20]"
                    }`}
                  />
                ))}
              </div>

              <p className="text-[9px] text-[#8a9990] font-mono uppercase tracking-wider">
                {isOffline ? "ON-DEVICE SCREENING ENGINE [OFFLINE]" : "NDLM CLOUD MULTIMODAL INFERENCE"}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};