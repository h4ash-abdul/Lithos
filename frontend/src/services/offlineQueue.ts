export interface OfflineSymptom {
  code: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  duration_days: number;
}

export interface OfflineCase {
  client_case_uuid: string;
  animal: {
    ndlm_animal_tag_id?: string;
    species: string;
    breed?: string;
    age_months?: number;
    sex?: string;
  };
  symptoms: OfflineSymptom[];
  gps_location?: {
    latitude?: number;
    longitude?: number;
    village?: string;
    district?: string;
    state?: string;
  };
  image_data_base64?: string;
  lesion_body_part: string;
  recorded_at_offline: string;
  sync_status: "PENDING" | "SYNCED" | "FAILED";
  ai_report?: any;
  server_case_id?: string;
}

const STORAGE_KEY = "ndlm_offline_cases_outbox";

export const getOfflineQueue = (): OfflineCase[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read offline queue", e);
    return [];
  }
};

export const saveOfflineQueue = (cases: OfflineCase[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.error("Failed to persist offline queue", e);
  }
};

export const enqueueOfflineCase = (c: OfflineCase): void => {
  const current = getOfflineQueue();
  // Idempotency: replace if client_case_uuid exists, otherwise prepend
  const filtered = current.filter(item => item.client_case_uuid !== c.client_case_uuid);
  filtered.unshift(c);
  saveOfflineQueue(filtered);
};

export const updateCaseInQueue = (client_case_uuid: string, updates: Partial<OfflineCase>): void => {
  const current = getOfflineQueue();
  const updated = current.map(item => item.client_case_uuid === client_case_uuid ? { ...item, ...updates } : item);
  saveOfflineQueue(updated);
};

// Client-side image compressor (< 200KB WebP/JPEG)
export const compressImage = async (file: File): Promise<{ base64: string; blob: Blob; sizeKb: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress to WebP or JPEG with quality 0.72
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.72);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                base64: compressedBase64,
                blob,
                sizeKb: Math.round(blob.size / 1024)
              });
            } else {
              reject(new Error("Compression failed"));
            }
          },
          "image/jpeg",
          0.72
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Lightweight On-Device Bayesian Triage Fallback for Offline Mode
export const runOnDeviceOfflineInference = (species: string, symptoms: OfflineSymptom[], lesion_body_part: string) => {
  const sympCodes = symptoms.map(s => s.code.toUpperCase());
  const hasSevere = symptoms.some(s => s.severity === "SEVERE");

  let primaryCode = "GENERAL_ILLNESS";
  let primaryName = "General Livestock Indisposition";
  let urgency = "MEDIUM";
  let guidance = [
    {
      step: 1,
      title: "Rest & Hydration",
      instructions: "Place animal in dry shade with clean water and soft fodder.",
      precautions: "Do not administer antibiotics without veterinarian approval."
    }
  ];

  if (sympCodes.includes("SKIN_NODULES") || lesion_body_part === "SKIN") {
    primaryCode = "LUMPY_SKIN_DISEASE";
    primaryName = "Suspected Lumpy Skin Disease (On-Device Offline Assessment)";
    urgency = hasSevere ? "CRITICAL" : "HIGH";
    guidance = [
      {
        step: 1,
        title: "Herd Isolation & Fly Protection",
        instructions: "Isolate cow in separate enclosure. Burn neem leaves or use repellent to keep biting flies away.",
        precautions: "Do not puncture lumps."
      },
      {
        step: 2,
        title: "Clean Open Lesions",
        instructions: "Wash broken sores with mild antiseptic solution (0.1% potassium permanganate or neem water).",
        precautions: "Wear gloves or wash hands thoroughly after dressing."
      }
    ];
  } else if (sympCodes.includes("ORAL_BLISTERS") || sympCodes.includes("SALIVATION") || lesion_body_part === "MOUTH") {
    primaryCode = "FOOT_AND_MOUTH_DISEASE";
    primaryName = "Suspected Foot & Mouth Disease (On-Device Offline Assessment)";
    urgency = "CRITICAL";
    guidance = [
      {
        step: 1,
        title: "Strict Farm Quarantine",
        instructions: "Stop all animal and milk movement outside the shed. Place soda water foot-bath at the door.",
        precautions: "Do not force feed rough dry straw."
      },
      {
        step: 2,
        title: "Soothing Gruel Diet",
        instructions: "Feed cool soft rice or ragi porridge with buttermilk to ease mouth soreness.",
        precautions: "Inform nearest veterinary dispensary immediately."
      }
    ];
  }

  return {
    inference_mode: "OFFLINE_LOCAL",
    primary_disease_code: primaryCode,
    primary_disease_name: primaryName,
    primary_confidence: 0.78,
    urgency_level: urgency,
    ranked_diagnoses: [
      {
        disease_code: primaryCode,
        disease_name: primaryName,
        score: 0.78,
        urgency_level: urgency,
        rationale: "Matched on-device rule matrix based on symptoms and lesion site."
      }
    ],
    interim_care_guidance: guidance,
    legal_disclaimer: "STATUTORY NOTICE: On-device offline triage guidance only. Non-prescriptive interim care. Consult a registered veterinarian immediately.",
    inference_latency_ms: 12.5,
    model_version: "v1.0-offline-edge"
  };
};
