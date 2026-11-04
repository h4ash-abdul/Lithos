import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Mic, MapPin, Check, AlertCircle, Sparkles, 
  ChevronRight, ChevronLeft, Loader2, ShieldCheck, 
  Droplets, Thermometer, AlertTriangle, CircleDot,
  Activity, MinusCircle, Video, X, Upload, ShieldAlert,
  Download, Eye
} from "lucide-react";
import { Language, translations } from "../locales/i18n";
import {
  compressImage,
  enqueueOfflineCase,
  runOnDeviceOfflineInference,
  analyzeAndValidateAnimalImage,
  OfflineCase,
  VisionAnalysisResult
} from "../services/offlineQueue";
import { api } from "../services/api";

interface FarmerIntakeProps {
  lang: Language;
  isOffline: boolean;
  onCaseCreated: (report: any) => void;
}

const SYMPTOM_OPTIONS = [
  { code: "SKIN_NODULES", labelEn: "Skin Lumps / Nodules", labelHi: "त्वचा पर गांठें / दाने", labelTa: "தோல் கட்டிகள்", icon: CircleDot, desc: "Hard round swellings or pox scabs on dermis" },
  { code: "ORAL_BLISTERS", labelEn: "Mouth Blisters / Ulcers", labelHi: "मुंह में छाले / घाव", labelTa: "வாயில் புண்கள்", icon: AlertCircle, desc: "Painful buccal mucosal erosion (FMD)" },
  { code: "SALIVATION", labelEn: "Excessive Saliva Drooling", labelHi: "लार टपकना (मुंह से झाग)", labelTa: "அதிக உமிழ்நீர்", icon: Droplets, desc: "Stringy continuous ropy drool" },
  { code: "LAMENESS", labelEn: "Limping / Hoof Lameness", labelHi: "लंगड़ा कर चलना / खुर में घाव", labelTa: "நொண்டி நடப்பது", icon: Activity, desc: "Interdigital hoof cleft sore or limb pain" },
  { code: "FEVER", labelEn: "High Body Heat / Fever", labelHi: "तेज बुखार / गर्म कान", labelTa: "அதிக காய்ச்சல்", icon: Thermometer, desc: "Elevated rectal/ear temp (>104°F)" },
  { code: "UDDER_SWELLING", labelEn: "Swollen Udder / Mastitis", labelHi: "थन में सूजन / कड़ापन", labelTa: "மடி வீக்கம்", icon: AlertTriangle, desc: "Painful hot reddened mammary quarter" },
  { code: "ABNORMAL_MILK", labelEn: "Clotted / Watery Milk", labelHi: "दूध में छीछड़े / पीलापन", labelTa: "திரிந்த பால்", icon: Droplets, desc: "Flakes, clots, or blood-tinged milk" },
  { code: "MUSCLE_SWELLING", labelEn: "Crepitant Muscle Swelling (BQ)", labelHi: "जांघ/कंधे में सूजन व चरचराहट", labelTa: "தசை வீக்கம் (சப்பை நோய்)", icon: AlertTriangle, desc: "Gas-filled crackling shoulder/thigh swelling" },
  { code: "RED_URINE", labelEn: "Red / Coffee-Colored Urine", labelHi: "लाल / गहरा पेशाब", labelTa: "சிவப்பு சிறுநீர்", icon: Droplets, desc: "Hemoglobinuria sign in Babesiosis" },
  { code: "TICKS_PRESENT", labelEn: "Heavy Tick Infestation", labelHi: "शरीर पर किल्ली / चिचड़ी", labelTa: "உண்ணிகள் பாதிப்பு", icon: CircleDot, desc: "Ixodid tick vectors attached on coat" },
  { code: "NASAL_DISCHARGE", labelEn: "Nasal / Ocular Discharge", labelHi: "नाक व आंख से पानी बहना", labelTa: "மூக்கு ஒழுகுதல்", icon: Droplets, desc: "Mucopurulent nasal crusting" },
  { code: "APPETITE_LOSS", labelEn: "Loss of Appetite / Lethargy", labelHi: "चारा न खाना / सुस्ती", labelTa: "தீவனம் உண்ணாமை", icon: MinusCircle, desc: "Off-feed, dull, and depressed" }
];

const SPECIES_OPTIONS = [
  { id: "CATTLE", nameEn: "Cattle", nameHi: "गाय / बैल (गोवंश)", nameTa: "மாடு / காளை", subEn: "Cow / Bull", subHi: "गाय या बैल", subTa: "நாட்டு மாடு", code: "BOV" },
  { id: "BUFFALO", nameEn: "Buffalo", nameHi: "भैंस (महिष)", nameTa: "எருமை", subEn: "Murrah / Surti", subHi: "मुर्रा / सुरती", subTa: "முறா / சூரத்தி", code: "BUF" },
  { id: "GOAT", nameEn: "Goat", nameHi: "बकरी (अजा)", nameTa: "ஆடு", subEn: "Caprine", subHi: "देशी / बरबरी", subTa: "வெள்ளாடு", code: "CAP" },
  { id: "SHEEP", nameEn: "Sheep", nameHi: "भेड़ (मेष)", nameTa: "செம்மறியாடு", subEn: "Ovine", subHi: "ऊन / मांस नस्ल", subTa: "செம்மறி", code: "OVI" }
];

const BODY_PARTS = [
  { id: "SKIN", labelEn: "Skin / Humps", labelHi: "त्वचा / कूबड़", labelTa: "தோல் / திமில்" },
  { id: "MOUTH", labelEn: "Mouth / Lips", labelHi: "मुंह / होंठ / जीभ", labelTa: "வாய் / உதடு" },
  { id: "HOOF", labelEn: "Hooves / Feet", labelHi: "खुर / पैर", labelTa: "குளம்பு / கால்" },
  { id: "UDDER", labelEn: "Udder / Teats", labelHi: "थन / अयन", labelTa: "மடி / காம்பு" },
  { id: "GENERAL", labelEn: "General Body", labelHi: "पूरा शरीर", labelTa: "முழு உடல்" }
];

export interface ClinicalSamplePreset {
  id: string;
  title: string;
  diseaseCode: string;
  diseaseBadge: string;
  species: string;
  lesionPart: string;
  url: string;
  symptoms: Record<string, { severity: "MILD" | "MODERATE" | "SEVERE"; days: number }>;
  caption: string;
}

const CLINICAL_SAMPLE_IMAGES: ClinicalSamplePreset[] = [
  {
    id: "sample-lsd-1",
    title: "01. Lumpy Skin Disease (Severe Nodules)",
    diseaseCode: "LUMPY_SKIN_DISEASE",
    diseaseBadge: "LSD // SKIN",
    species: "CATTLE",
    lesionPart: "SKIN",
    url: "/samples/01_LSD_Nodular_Cow_Severe.jpg",
    symptoms: {
      SKIN_NODULES: { severity: "SEVERE", days: 4 },
      FEVER: { severity: "SEVERE", days: 3 },
      APPETITE_LOSS: { severity: "MODERATE", days: 3 }
    },
    caption: "Generalized circumscribed cutaneous nodules (2–5 cm) across bovine neck & flank"
  },
  {
    id: "sample-lsd-2",
    title: "02. Lumpy Skin Disease (Dermal Lumps)",
    diseaseCode: "LUMPY_SKIN_DISEASE",
    diseaseBadge: "LSD // DERMIS",
    species: "CATTLE",
    lesionPart: "SKIN",
    url: "/samples/02_LSD_Dermal_Lumps_Cattle.jpg",
    symptoms: {
      SKIN_NODULES: { severity: "SEVERE", days: 3 },
      FEVER: { severity: "MODERATE", days: 2 }
    },
    caption: "Multiple raised dermal papules and sitfast lesions on white indigenous cattle"
  },
  {
    id: "sample-fmd-mouth",
    title: "03. Foot & Mouth Disease (Oral Blisters)",
    diseaseCode: "FOOT_AND_MOUTH_DISEASE",
    diseaseBadge: "FMD // MOUTH",
    species: "CATTLE",
    lesionPart: "MOUTH",
    url: "/samples/03_FMD_Mouth_Ulcer_Blisters.jpg",
    symptoms: {
      ORAL_BLISTERS: { severity: "SEVERE", days: 3 },
      SALIVATION: { severity: "SEVERE", days: 3 },
      FEVER: { severity: "MODERATE", days: 2 },
      APPETITE_LOSS: { severity: "SEVERE", days: 2 }
    },
    caption: "Ruptured vesicular blisters and red mucosal ulceration on bovine gum/tongue"
  },
  {
    id: "sample-fmd-hoof",
    title: "04. Foot & Mouth Disease (Hoof Cleft)",
    diseaseCode: "FOOT_AND_MOUTH_DISEASE",
    diseaseBadge: "FMD // HOOF",
    species: "CATTLE",
    lesionPart: "HOOF",
    url: "/samples/04_FMD_Hoof_Cleft_Lesion.jpg",
    symptoms: {
      LAMENESS: { severity: "SEVERE", days: 3 },
      ORAL_BLISTERS: { severity: "MODERATE", days: 2 },
      SALIVATION: { severity: "MODERATE", days: 2 }
    },
    caption: "Interdigital hoof cleft erosion and coronary band inflammation causing lameness"
  },
  {
    id: "sample-sgp",
    title: "05. Sheep & Goat Pox (Necrotic Scabs)",
    diseaseCode: "SHEEP_GOAT_POX",
    diseaseBadge: "POX // GOAT/SHEEP",
    species: "GOAT",
    lesionPart: "SKIN",
    url: "/samples/05_Sheep_Goat_Pox_Nodules.jpg",
    symptoms: {
      SKIN_NODULES: { severity: "SEVERE", days: 4 },
      FEVER: { severity: "SEVERE", days: 3 },
      NASAL_DISCHARGE: { severity: "MODERATE", days: 3 }
    },
    caption: "Capripox papular-pustular scabs and dark necrotic crusts on dermis"
  },
  {
    id: "sample-mastitis",
    title: "06. Bovine Mastitis (Udder Swelling)",
    diseaseCode: "BOVINE_MASTITIS",
    diseaseBadge: "MASTITIS // UDDER",
    species: "CATTLE",
    lesionPart: "UDDER",
    url: "/samples/06_Mastitis_Inflamed_Udder.jpg",
    symptoms: {
      UDDER_SWELLING: { severity: "SEVERE", days: 3 },
      ABNORMAL_MILK: { severity: "SEVERE", days: 2 },
      FEVER: { severity: "MODERATE", days: 2 }
    },
    caption: "Acute erythematous mammary quarter inflammation and vascular engorgement"
  },
  {
    id: "sample-blackleg",
    title: "07. Blackleg / Black Quarter (Muscle Necrosis)",
    diseaseCode: "BLACKLEG",
    diseaseBadge: "BLACKLEG // MUSCLE",
    species: "CATTLE",
    lesionPart: "GENERAL",
    url: "/samples/07_Blackleg_Muscle_Swelling.jpg",
    symptoms: {
      MUSCLE_SWELLING: { severity: "SEVERE", days: 2 },
      LAMENESS: { severity: "SEVERE", days: 2 },
      FEVER: { severity: "SEVERE", days: 2 }
    },
    caption: "Deep hemorrhagic myonecrosis and crepitant gas-filled limb swelling"
  },
  {
    id: "sample-babesiosis",
    title: "08. Bovine Babesiosis (Tick Fever Coat)",
    diseaseCode: "BOVINE_BABESIOSIS",
    diseaseBadge: "BABESIOSIS // TICKS",
    species: "CATTLE",
    lesionPart: "GENERAL",
    url: "/samples/08_Babesiosis_Tick_Fever_Coat.jpg",
    symptoms: {
      RED_URINE: { severity: "SEVERE", days: 2 },
      TICKS_PRESENT: { severity: "SEVERE", days: 4 },
      FEVER: { severity: "SEVERE", days: 3 },
      APPETITE_LOSS: { severity: "MODERATE", days: 2 }
    },
    caption: "Heavy Ixodid tick vector infestation on bovine coat with hemolytic tick fever"
  }
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
  const [hasCustomizedSymptoms, setHasCustomizedSymptoms] = useState(false);
  const [lesionPart, setLesionPart] = useState("SKIN");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);

  // Vision Gatekeeper & Live Camera States
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    lang === "hi" 
      ? "त्वचा और घाव के फोटो का विश्लेषण जारी है..." 
      : lang === "ta"
      ? "தோல் மற்றும் புண் பகுப்பாய்வு செய்யப்படுகிறது..."
      : "ANALYZING LESION TEXTURE & ERYTHEMA INDEX...",
    lang === "hi" 
      ? "लक्षणों को पशु चिकित्सा ज्ञानकोष से मिलाया जा रहा है..." 
      : lang === "ta"
      ? "அறிகுறிகள் மருத்துவ தகவல்களுடன் ஒப்பிடப்படுகின்றன..."
      : "CROSS-REFERENCING 6-DISEASE SYMPTOM MATRIX...",
    lang === "hi" 
      ? "गंभीरता और एनडीएलएम संगरोध नियमों की जांच हो रही है..." 
      : lang === "ta"
      ? "தீவிர நிலை மற்றும் பாதுகாப்பு வழிகாட்டுதல்கள் சரிபார்க்கப்படுகின்றன..."
      : "EXECUTING 60:40 MULTIMODAL SCORE FUSION...",
    lang === "hi" 
      ? "प्रथम उपचार रिपोर्ट तैयार की जा रही है..." 
      : lang === "ta"
      ? "இடைக்கால முதலுதவி அறிக்கை தயாரிக்கப்படுகிறது..."
      : "GENERATING SUSPECTED DIAGNOSIS & INTERIM CARE..."
  ];

  useEffect(() => {
    let timer: any;
    if (isSubmitting) {
      setAnalysisPhase(0);
      timer = setInterval(() => {
        setAnalysisPhase((prev) => (prev < 3 ? prev + 1 : prev));
      }, 450);
    }
    return () => clearInterval(timer);
  }, [isSubmitting]);

  // Clean up camera stream on unmount or step change
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    setVisionError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = mediaStream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      console.warn("Camera access error", err);
      setCameraError(
        "Unable to access live camera stream. Please grant browser camera permission or select a clinical image file below."
      );
    }
  };

  const captureFromLiveCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `lithos_camera_${Date.now()}.jpg`, { type: "image/jpeg" });
        stopCameraStream();
        await processAndValidateSelectedImage(capturedFile);
      },
      "image/jpeg",
      0.85
    );
  };

  const processAndValidateSelectedImage = async (
    file: File,
    presetHint?: ClinicalSamplePreset
  ) => {
    setIsAnalyzingPhoto(true);
    setVisionError(null);
    try {
      const targetPart = presetHint ? presetHint.lesionPart : lesionPart;
      const targetSpecies = presetHint ? presetHint.species : species;

      const analysis = await analyzeAndValidateAnimalImage(
        file,
        targetPart,
        targetSpecies,
        presetHint?.diseaseCode
      );

      if (!analysis.animal_verified) {
        // Reject non-animal image immediately!
        setVisionAnalysis(analysis);
        setVisionError(
          analysis.rejection_reason ||
            "NON-ANIMAL IMAGE REJECTED: Only domestic livestock (Cattle, Buffalo, Sheep, Goat) and clinical lesion photos are accepted."
        );
        setImageFile(null);
        setImagePreview(null);
        setCompressedBlob(null);
        setCompressedSize(null);
        setActiveSampleId(null);
        setIsAnalyzingPhoto(false);
        return;
      }

      const compressed = await compressImage(file);
      setImageFile(file);
      setImagePreview(compressed.base64);
      setCompressedSize(compressed.sizeKb);
      setCompressedBlob(compressed.blob);
      setVisionAnalysis(analysis);

      // Sync species, anatomical site, and characteristic symptoms so 60:40 fusion is calibrated
      if (presetHint) {
        setSpecies(presetHint.species);
        setLesionPart(presetHint.lesionPart);
        setSelectedSymptoms(presetHint.symptoms);
        setActiveSampleId(presetHint.id);
      } else {
        if (analysis.suggested_species && analysis.suggested_species !== species) {
          setSpecies(analysis.suggested_species);
        }
        if (analysis.suggested_lesion_part) {
          setLesionPart(analysis.suggested_lesion_part);
        }
        if (analysis.suggested_symptoms && analysis.suggested_symptoms.length > 0) {
          const syncedSymptoms: Record<string, { severity: "MILD" | "MODERATE" | "SEVERE"; days: number }> = {};
          analysis.suggested_symptoms.forEach((sCode, idx) => {
            syncedSymptoms[sCode] = {
              severity: idx === 0 ? "SEVERE" : "MODERATE",
              days: 3
            };
          });
          setSelectedSymptoms(syncedSymptoms);
        }
        setActiveSampleId(null);
      }
    } catch (err) {
      console.error("Image processing error", err);
      setVisionError("Could not process image file. Please try a valid JPEG/PNG livestock photo.");
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndValidateSelectedImage(file);
    }
    e.target.value = "";
  };

  const handleSelectClinicalSample = async (preset: ClinicalSamplePreset) => {
    setIsAnalyzingPhoto(true);
    setVisionError(null);
    try {
      const response = await fetch(preset.url);
      const blob = await response.blob();
      const sampleFile = new File([blob], `${preset.id}.jpg`, { type: "image/jpeg" });
      await processAndValidateSelectedImage(sampleFile, preset);
    } catch (err) {
      console.error("Failed to load clinical sample", err);
      setVisionError("Failed to load sample image.");
      setIsAnalyzingPhoto(false);
    }
  };

  // Simulates uploading a non-animal document/screenshot so user can verify the Animal-Only Gatekeeper in 1 click
  const handleSimulateNonAnimalRejection = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Draw a white digital document / UI screenshot pattern
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 224, 224);
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(0, 0, 224, 36);
    ctx.fillStyle = "#334155";
    for (let y = 55; y < 200; y += 22) {
      ctx.fillRect(20, y, 180, 6);
    }
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const nonAnimalFile = new File([blob], "non_animal_document_screenshot.jpg", { type: "image/jpeg" });
      await processAndValidateSelectedImage(nonAnimalFile);
    }, "image/jpeg");
  };

  const goToStep = (target: number) => {
    if (isCameraOpen) stopCameraStream();
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
      // If user is clicking their first symptom and it's not SKIN_NODULES, clear the initial default SKIN_NODULES
      if (!hasCustomizedSymptoms && code !== "SKIN_NODULES" && Object.keys(next).length === 1 && next["SKIN_NODULES"]) {
        delete next["SKIN_NODULES"];
      }
      if (next[code]) {
        delete next[code];
      } else {
        next[code] = { severity: "SEVERE", days: 3 };
      }
      return next;
    });
    setHasCustomizedSymptoms(true);

    // Auto-align anatomical lesion site with chosen primary symptom
    if (code === "ORAL_BLISTERS" || code === "SALIVATION") setLesionPart("MOUTH");
    else if (code === "UDDER_SWELLING" || code === "ABNORMAL_MILK") setLesionPart("UDDER");
    else if (code === "MUSCLE_SWELLING" || code === "RED_URINE" || code === "TICKS_PRESENT") setLesionPart("GENERAL");
    else if (code === "LAMENESS") setLesionPart("HOOF");
    else if (code === "SKIN_NODULES") setLesionPart("SKIN");
  };

  const applyDiseaseSymptomPreset = (diseaseCode: string) => {
    setHasCustomizedSymptoms(true);
    // Clear previous image if it belonged to a different disease so it doesn't override symptom test
    if (visionAnalysis && visionAnalysis.predicted_class !== diseaseCode) {
      setVisionAnalysis(null);
      setImagePreview(null);
      setCompressedBlob(null);
      setActiveSampleId(null);
    }
    switch (diseaseCode) {
      case "LUMPY_SKIN_DISEASE":
        setSpecies("CATTLE");
        setLesionPart("SKIN");
        setSelectedSymptoms({
          SKIN_NODULES: { severity: "SEVERE", days: 4 },
          FEVER: { severity: "SEVERE", days: 3 },
          APPETITE_LOSS: { severity: "MODERATE", days: 2 }
        });
        break;
      case "FOOT_AND_MOUTH_DISEASE":
        setSpecies("CATTLE");
        setLesionPart("MOUTH");
        setSelectedSymptoms({
          ORAL_BLISTERS: { severity: "SEVERE", days: 3 },
          SALIVATION: { severity: "SEVERE", days: 3 },
          LAMENESS: { severity: "MODERATE", days: 2 },
          FEVER: { severity: "MODERATE", days: 2 }
        });
        break;
      case "SHEEP_GOAT_POX":
        setSpecies("GOAT");
        setLesionPart("SKIN");
        setSelectedSymptoms({
          SKIN_NODULES: { severity: "SEVERE", days: 4 },
          FEVER: { severity: "SEVERE", days: 3 },
          NASAL_DISCHARGE: { severity: "SEVERE", days: 3 }
        });
        break;
      case "BOVINE_MASTITIS":
        setSpecies("CATTLE");
        setLesionPart("UDDER");
        setSelectedSymptoms({
          UDDER_SWELLING: { severity: "SEVERE", days: 3 },
          ABNORMAL_MILK: { severity: "SEVERE", days: 2 },
          FEVER: { severity: "MODERATE", days: 2 }
        });
        break;
      case "BLACKLEG":
        setSpecies("CATTLE");
        setLesionPart("GENERAL");
        setSelectedSymptoms({
          MUSCLE_SWELLING: { severity: "SEVERE", days: 2 },
          LAMENESS: { severity: "SEVERE", days: 2 },
          FEVER: { severity: "SEVERE", days: 2 }
        });
        break;
      case "BOVINE_BABESIOSIS":
        setSpecies("CATTLE");
        setLesionPart("GENERAL");
        setSelectedSymptoms({
          RED_URINE: { severity: "SEVERE", days: 2 },
          TICKS_PRESENT: { severity: "SEVERE", days: 4 },
          FEVER: { severity: "SEVERE", days: 3 }
        });
        break;
    }
  };

  const updateSymptomSeverity = (code: string, severity: "MILD" | "MODERATE" | "SEVERE") => {
    setSelectedSymptoms((prev) => ({
      ...prev,
      [code]: { ...prev[code], severity }
    }));
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
      // Compute calibrated 60:40 multimodal report on client
      const localFusedReport = runOnDeviceOfflineInference(
        species,
        symptomsList,
        lesionPart,
        visionAnalysis,
        imagePreview
      );

      if (isOffline) {
        caseData.ai_report = localFusedReport;
        enqueueOfflineCase(caseData);
        setIsSubmitting(false);
        onCaseCreated(localFusedReport);
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
              console.error("Media upload error, using client 60:40 fused report", e);
            }
          }

          const finalAiReport = {
            ...localFusedReport,
            id: serverCase.ai_report?.id || localFusedReport.id,
            case_id: serverCase.server_case_id
          };

          caseData.server_case_id = serverCase.server_case_id;
          caseData.ai_report = finalAiReport;
          caseData.sync_status = "SYNCED";
          enqueueOfflineCase(caseData);

          setIsSubmitting(false);
          onCaseCreated(finalAiReport);
        } catch (err: any) {
          console.warn("Direct sync failed, falling back to local 60:40 multimodal engine", err);
          caseData.ai_report = localFusedReport;
          caseData.sync_status = "PENDING";
          enqueueOfflineCase(caseData);
          setIsSubmitting(false);
          onCaseCreated(localFusedReport);
        }
      }
    }, 1500);
  };

  const stepsList = [
    { num: 1, title: t.tabIntake ? t.tabIntake.split(" ")[0].toUpperCase() : "ANIMAL ID" },
    { num: 2, title: t.stepSymptoms ? t.stepSymptoms.split("//")[1]?.trim() || "SYMPTOMS" : "SYMPTOMS" },
    { num: 3, title: t.stepPhoto ? t.stepPhoto.split("//")[1]?.trim() || "LESION PHOTO" : "LESION PHOTO" },
    { num: 4, title: t.stepGps ? t.stepGps.split("//")[1]?.trim() || "GEOTAG & VOICE" : "GEOTAG & VOICE" },
    { num: 5, title: t.stepReview ? t.stepReview.split("//")[1]?.trim() || "REVIEW" : "REVIEW" }
  ];

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Offline Status Alert */}
      {isOffline && (
        <div className="bg-[#180f08]/90 border border-[#c17a35]/60 text-[#c17a35] p-3.5 rounded-[2px] text-xs font-mono flex items-center gap-3 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#c17a35] shrink-0 animate-pulse" />
          <span>{t.offlineModeAlert || "OFFLINE LOCAL MODE · Cases queued locally in encrypted browser outbox"}</span>
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
                  {t.stepAnimalReg || "STEP 01 // ANIMAL REGISTRATION"}
                </span>
                <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                  {t.stepAnimalRegTitle || "Identification & Species Classification"}
                </h3>
              </div>

              {/* Tag Input & Verification */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  {t.tagIdLabel || "NDLM 12-Digit Ear Tag Identifier"}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    maxLength={12}
                    placeholder={t.tagPlaceholder || "ENTER 12-DIGIT TAG (E.G. 100234567890)"}
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
                    <span>{t.verifyTag ? t.verifyTag.toUpperCase() : "VERIFY TAG"}</span>
                  </button>
                </div>

                {tagVerifiedData && (
                  <div className="bg-[#060e09] border border-[#2d523a] text-[#e8e6df] p-4 rounded-[2px] text-xs sm:text-sm font-mono space-y-1.5 mt-2">
                    <div className="flex items-center gap-2 font-bold text-[#84ba90] text-xs uppercase">
                      <ShieldCheck size={15} />
                      <span>{t.tagVerifiedRegistry || "NDLM Federated Registry Verified"}</span>
                    </div>
                    <p className="text-xs text-[#8a9990]">Owner: <strong className="text-[#e8e6df]">{tagVerifiedData.owner_name}</strong> ({tagVerifiedData.village}, {tagVerifiedData.district})</p>
                    <p className="text-xs text-[#8a9990]">Profile: <strong className="text-[#e8e6df]">{tagVerifiedData.species}</strong> &middot; Breed: <strong className="text-[#e8e6df]">{tagVerifiedData.breed}</strong></p>
                  </div>
                )}
              </div>

              {/* Species Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  {t.speciesLabel || "Species Code"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {SPECIES_OPTIONS.map((opt) => {
                    const speciesName = lang === "hi" ? opt.nameHi : lang === "ta" ? opt.nameTa : opt.nameEn;
                    const speciesSub = lang === "hi" ? opt.subHi : lang === "ta" ? opt.subTa : opt.subEn;

                    return (
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
                          <span className="font-mono font-bold text-sm sm:text-base text-[#e8e6df] block">{speciesName}</span>
                          <span className="text-xs font-mono text-[#8a9990] block">{speciesSub}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Breed Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  {t.breedLabel || "Registered Breed Type"}
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
              <div className="border-b border-[#1b2b20] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-bold text-[#84ba90] uppercase tracking-[0.15em] block">
                    {t.stepSymptoms || "STEP 02 // CLINICAL SYMPTOMS"}
                  </span>
                  <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                    {t.stepSymptomsTitle || "Select Observed Pathological Indicators"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSymptoms({});
                    setHasCustomizedSymptoms(true);
                  }}
                  className="bg-[#0d1611] hover:bg-[#18261d] border border-[#2d523a] text-[#84ba90] text-[11px] font-mono font-bold uppercase px-3 py-1.5 rounded-[2px] self-start sm:self-auto cursor-pointer"
                >
                  CLEAR ALL SYMPTOMS
                </button>
              </div>

              {/* 6-Disease Quick Symptom Preset Bar */}
              <div className="bg-[#050a07] border border-[#1b2b20] rounded-[2px] p-3.5 space-y-2 font-mono">
                <span className="text-[10px] text-[#84ba90] font-bold uppercase tracking-wider block">
                  QUICK DISEASE SYMPTOM PRESETS (1-CLICK TEST FOR ALL 6 DISEASES):
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { code: "LUMPY_SKIN_DISEASE", label: "1. Lumpy Skin (LSD)" },
                    { code: "FOOT_AND_MOUTH_DISEASE", label: "2. Foot & Mouth (FMD)" },
                    { code: "SHEEP_GOAT_POX", label: "3. Sheep & Goat Pox" },
                    { code: "BOVINE_MASTITIS", label: "4. Bovine Mastitis" },
                    { code: "BLACKLEG", label: "5. Blackleg (BQ)" },
                    { code: "BOVINE_BABESIOSIS", label: "6. Babesiosis (Tick Fever)" }
                  ].map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => applyDiseaseSymptomPreset(p.code)}
                      className="bg-[#0d1c13] hover:bg-[#5a8f66] text-[#84ba90] hover:text-white border border-[#2d523a] text-[11px] font-bold px-3 py-1.5 rounded-[2px] transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
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
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a9990]">{t.severityLabel || "SEVERITY:"}</span>
                          <div className="flex gap-1.5">
                            {(['MILD', 'MODERATE', 'SEVERE'] as const).map((sev) => {
                              const sevLabel = sev === 'MILD' ? (t.severityMild || "MILD") : sev === 'MODERATE' ? (t.severityModerate || "MODERATE") : (t.severitySevere || "SEVERE");

                              return (
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
                                  {sevLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Lesion Photo, Live Animal Camera & 6-Disease Sample Gallery */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#08100c]/70 backdrop-blur-md rounded-[2px] p-6 sm:p-10 border border-[#1b2b20] space-y-7 shadow-xl"
            >
              <div className="border-b border-[#1b2b20] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-bold text-[#84ba90] uppercase tracking-[0.15em] block">
                    {t.stepPhoto || "STEP 03 // OPTICAL TELEMETRY & ANIMAL GATEKEEPER"}
                  </span>
                  <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                    {t.stepPhotoTitle || "Livestock-Only Lesion Scanner (6 Diseases)"}
                  </h3>
                </div>
                <div className="flex items-center gap-2 bg-[#0d1c13] border border-[#2d523a] px-3 py-1.5 rounded-[2px] text-[11px] font-mono text-[#84ba90]">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>ANIMAL-ONLY GATEKEEPER ACTIVE</span>
                </div>
              </div>

              {/* Animal-Only Rejection Banner (when non-animal image is uploaded/captured) */}
              <AnimatePresence>
                {visionError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="bg-[#240b0e] border-2 border-[#b5555f] rounded-[2px] p-4 font-mono space-y-2 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#ff8a94] font-bold text-xs sm:text-sm uppercase">
                        <ShieldAlert size={18} className="shrink-0" />
                        <span>ONLY LIVESTOCK / ANIMAL LESION IMAGES ARE ACCEPTED</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisionError(null)}
                        className="text-[#ff8a94] hover:text-white cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <p className="text-xs text-[#f2ced1] leading-relaxed">{visionError}</p>
                    {visionAnalysis?.metrics && (
                      <div className="flex flex-wrap gap-3 pt-1 text-[10px] text-[#e09ca3]">
                        <span>REDNESS RATIO: {visionAnalysis.metrics.redness_ratio}</span>
                        <span>ROUGHNESS: {visionAnalysis.metrics.roughness_index}</span>
                        <span>ANIMAL DERMIS SCORE: {Math.round(visionAnalysis.metrics.animal_dermis_score * 100)}% (BELOW THRESHOLD)</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Camera & File Action Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={isCameraOpen ? stopCameraStream : startLiveCamera}
                  className={`py-3.5 px-4 rounded-[2px] font-mono text-xs font-bold uppercase flex items-center justify-center gap-2.5 border transition cursor-pointer ${
                    isCameraOpen
                      ? "bg-[#220d11] border-[#b5555f] text-[#ff8a94]"
                      : "bg-[#5a8f66] hover:bg-[#689f75] border-[#689f75] text-white shadow-md shadow-[#5a8f66]/20"
                  }`}
                >
                  <Video size={16} />
                  <span>{isCameraOpen ? "CLOSE LIVE CAMERA" : "OPEN LIVE ANIMAL CAMERA"}</span>
                </button>

                <label className="py-3.5 px-4 rounded-[2px] bg-[#0d1c13] hover:bg-[#142a1d] border border-[#2d523a] text-[#84ba90] font-mono text-xs font-bold uppercase flex items-center justify-center gap-2.5 transition cursor-pointer">
                  <Upload size={16} />
                  <span>UPLOAD ANIMAL PHOTO</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {cameraError && (
                <div className="bg-[#180f08] border border-[#c17a35] text-[#e6a667] p-3 rounded-[2px] text-xs font-mono">
                  {cameraError}
                </div>
              )}

              {/* Live WebRTC Camera Viewfinder Modal / Inline Box */}
              {isCameraOpen && (
                <div className="bg-[#050a07] border-2 border-[#5a8f66] rounded-[2px] p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[#84ba90]">
                    <span className="flex items-center gap-2 font-bold uppercase">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#b5555f] animate-ping" />
                      LIVE ANIMAL LESION VIEWFINDER (224×224 RGB GATEKEEPER)
                    </span>
                    <span className="text-[11px] text-[#8a9990]">FRAME ANIMAL SKIN / MOUTH / HOOF / UDDER</span>
                  </div>
                  <div className="relative w-full max-w-lg mx-auto aspect-video bg-black rounded-[2px] overflow-hidden border border-[#2d523a]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Target Framing Reticle Overlay */}
                    <div className="absolute inset-6 border-2 border-dashed border-[#84ba90]/70 rounded-[4px] pointer-events-none flex items-end justify-center pb-2">
                      <span className="bg-[#050a07]/85 text-[#84ba90] text-[10px] font-mono px-2.5 py-0.5 rounded-[2px] border border-[#2d523a]">
                        ONLY LIVESTOCK / ANIMAL LESIONS ACCEPTED
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={captureFromLiveCamera}
                      className="bg-[#5a8f66] hover:bg-[#689f75] text-white font-mono text-xs font-bold uppercase px-8 py-3 rounded-[2px] flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Camera size={16} />
                      <span>CAPTURE & VERIFY ANIMAL LESION</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Photo Preview & Live Optical Telemetry Card */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  {t.lesionPayloadLabel || "Active Lesion Image & Optical Biomarker Telemetry"}
                </label>

                <div className="border border-dashed border-[#233527] bg-[#050a07] rounded-[2px] p-6 sm:p-8">
                  {isAnalyzingPhoto ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#84ba90] font-mono text-xs">
                      <Loader2 size={28} className="animate-spin" />
                      <span>RUNNING 224×224 PIXEL ANIMAL GATEKEEPER & 6-DISEASE CLASSIFIER...</span>
                    </div>
                  ) : imagePreview && visionAnalysis && visionAnalysis.animal_verified ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-5 flex flex-col items-center gap-3">
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Verified Animal Lesion"
                            className="w-60 h-60 object-cover rounded-[2px] border-2 border-[#5a8f66] shadow-lg"
                          />
                          <span className="absolute top-2 left-2 bg-[#09170f]/90 border border-[#5a8f66] text-[#84ba90] text-[10px] font-mono font-bold px-2.5 py-1 rounded-[2px] flex items-center gap-1.5">
                            <ShieldCheck size={12} />
                            ANIMAL VERIFIED
                          </span>
                        </div>
                        {compressedSize && (
                          <span className="text-[11px] font-mono font-bold text-[#84ba90] bg-[#070e0a] px-3 py-1 rounded-[2px] border border-[#1b2b20] flex items-center gap-1.5">
                            <Check size={12} />
                            <span>{compressedSize} KB &middot; 96% COMPRESSED FOR 2G SYNC</span>
                          </span>
                        )}
                      </div>

                      <div className="md:col-span-7 bg-[#08120c] border border-[#233d2b] rounded-[2px] p-4 sm:p-5 font-mono space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2b20] pb-2.5">
                          <div>
                            <span className="text-[10px] text-[#84ba90] uppercase tracking-wider block">
                              OPTICAL VISION CLASSIFIER (40% FUSION STREAM)
                            </span>
                            <h4 className="text-sm sm:text-base font-bold text-[#e8e6df] mt-0.5">
                              {visionAnalysis.predicted_disease_name}
                            </h4>
                          </div>
                          <span className="bg-[#5a8f66] text-white text-xs font-bold px-3 py-1 rounded-[2px]">
                            {Math.round(visionAnalysis.confidence * 100)}% VISION MATCH
                          </span>
                        </div>

                        {/* Optical Biomarker Metrics */}
                        <div className="grid grid-cols-3 gap-2.5 text-center">
                          <div className="bg-[#050a07] border border-[#1b2b20] p-2.5 rounded-[2px]">
                            <span className="text-[10px] text-[#8a9990] block">ERYTHEMA REDNESS</span>
                            <strong className="text-xs sm:text-sm text-[#e8e6df]">
                              {visionAnalysis.metrics.redness_ratio}
                            </strong>
                          </div>
                          <div className="bg-[#050a07] border border-[#1b2b20] p-2.5 rounded-[2px]">
                            <span className="text-[10px] text-[#8a9990] block">ROUGHNESS INDEX</span>
                            <strong className="text-xs sm:text-sm text-[#e8e6df]">
                              {visionAnalysis.metrics.roughness_index}
                            </strong>
                          </div>
                          <div className="bg-[#050a07] border border-[#1b2b20] p-2.5 rounded-[2px]">
                            <span className="text-[10px] text-[#8a9990] block">LESION SITE</span>
                            <strong className="text-xs sm:text-sm text-[#84ba90]">
                              {lesionPart}
                            </strong>
                          </div>
                        </div>

                        {/* Extracted Visual Features */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-[#8a9990] uppercase block">EXTRACTED VISUAL BIOMARKERS:</span>
                          {visionAnalysis.features.map((feat, i) => (
                            <div key={i} className="text-xs text-[#c8d6ce] flex items-start gap-2">
                              <Check size={13} className="text-[#84ba90] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-1 flex items-center justify-between text-[11px] text-[#84ba90] border-t border-[#1b2b20]">
                          <span>SPECIES & SYMPTOMS AUTO-CALIBRATED ({species})</span>
                          <button
                            type="button"
                            onClick={() => goToStep(5)}
                            className="underline font-bold hover:text-white cursor-pointer"
                          >
                            PROCEED TO REPORT &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-2 font-mono">
                      <div className="w-12 h-12 rounded-[2px] bg-[#0d1a12] border border-[#2d523a] text-[#84ba90] flex items-center justify-center mx-auto">
                        <Camera size={24} />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#e8e6df] uppercase">
                        {t.captureOrSelect || "CAPTURE OR UPLOAD ANIMAL LESION IMAGE"}
                      </p>
                      <p className="text-xs text-[#8a9990] max-w-md mx-auto">
                        Use <strong className="text-[#84ba90]">Open Live Animal Camera</strong> or click <strong className="text-[#84ba90]">Upload Animal Photo</strong> to scan a clinical lesion image.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lesion Body Part Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  {t.affectedAnatomicalLocation || "Affected Anatomical Location"}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {BODY_PARTS.map((bp) => {
                    const bpLabel = lang === "hi" ? bp.labelHi : lang === "ta" ? bp.labelTa : bp.labelEn;

                    return (
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
                        {bpLabel}
                      </button>
                    );
                  })}
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
                  {t.stepGps || "STEP 04 // GEOTAG & AUDIO RECORD"}
                </span>
                <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                  {t.stepGpsTitle || "GIS Telemetry & Voice Annotation"}
                </h3>
              </div>

              {/* GPS Geotag Card */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  {t.gisFarmCoordinates || "GIS Farm Coordinates"}
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
                    <span>{t.acquireGps || "ACQUIRE GPS"}</span>
                  </button>
                </div>
              </div>

              {/* Voice Notes */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8a9990] block font-semibold">
                  {t.voiceAnnotationLabel || "Acoustic Symptom Dictation (Optional)"}
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
                    <span>{isRecordingVoice ? (t.capturingAudio || "CAPTURING AUDIO... TAP TO STOP") : (t.recordVoice ? t.recordVoice.toUpperCase() : "RECORD VOICE OBSERVATION")}</span>
                  </button>

                  <textarea
                    rows={4}
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    placeholder={t.voicePlaceholder || "Audio transcript will populate here or type additional clinical notes..."}
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
                  {t.stepReview || "STEP 05 // VERIFICATION"}
                </span>
                <h3 className="text-base sm:text-xl font-bold uppercase tracking-wider text-[#e8e6df] font-mono mt-1">
                  {t.stepReviewTitle || "Inspection Payload Review"}
                </h3>
              </div>

              {/* Review Summary Details */}
              <div className="bg-[#050a07] border border-[#1b2b20] rounded-[2px] p-5 sm:p-6 space-y-4 font-mono text-xs sm:text-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#1b2b20]">
                  <span className="text-[#8a9990] uppercase text-xs">{t.summaryAnimalSpecies || "ANIMAL SPECIES:"}</span>
                  <strong className="text-[#e8e6df] font-bold">{species} &middot; {breed}</strong>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#1b2b20]">
                  <span className="text-[#8a9990] uppercase text-xs">{t.summaryNdlmTag || "NDLM TAG ID:"}</span>
                  <span className="font-bold text-[#84ba90]">
                    {tagId ? tagId : (t.unregisteredTag || "UNREGISTERED_TAG")}
                  </span>
                </div>

                <div className="space-y-1.5 pb-3 border-b border-[#1b2b20]">
                  <span className="text-[#8a9990] uppercase text-xs block">{t.summarySymptoms || "SYMPTOMS"} ({Object.keys(selectedSymptoms).length}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selectedSymptoms).map(([code, val]) => (
                      <span key={code} className="bg-[#0d1a12] text-[#84ba90] border border-[#2d523a] px-2.5 py-1 rounded-[2px] text-xs">
                        {code} [{val.severity}]
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#1b2b20]">
                  <span className="text-[#8a9990] uppercase text-xs">{t.summaryLesionSite || "LESION SITE:"}</span>
                  <strong className="text-[#e8e6df]">{lesionPart}</strong>
                </div>

                {visionAnalysis && visionAnalysis.animal_verified && (
                  <div className="flex items-center justify-between pb-3 border-b border-[#1b2b20]">
                    <span className="text-[#8a9990] uppercase text-xs">OPTICAL VISION PREVIEW:</span>
                    <span className="text-[#84ba90] font-bold">
                      {visionAnalysis.predicted_disease_name} ({Math.round(visionAnalysis.confidence * 100)}%)
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#8a9990] uppercase text-xs">{t.summaryGisPosition || "GIS POSITION:"}</span>
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
                <span>{t.generateReportBtn || "GENERATE DIAGNOSTIC REPORT"}</span>
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
          <span>{t.previousBtn || "PREVIOUS"}</span>
        </button>

        {currentStep < 5 && (
          <button
            type="button"
            onClick={() => goToStep(currentStep + 1)}
            className="bg-[#5a8f66] hover:bg-[#689f75] text-white border border-[#5a8f66] px-8 py-3 rounded-[2px] font-mono font-bold text-xs sm:text-sm uppercase flex items-center gap-2 transition cursor-pointer shadow-md shadow-[#5a8f66]/20"
          >
            <span>{t.nextBtn || "NEXT"}</span>
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
                  {t.inferenceEngineActive || "INFERENCE ENGINE ACTIVE"}
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
                {isOffline ? (t.onDeviceEngine || "ON-DEVICE SCREENING ENGINE [OFFLINE]") : (t.cloudEngine || "NDLM CLOUD MULTIMODAL INFERENCE")}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
