"""
Epidemiological Knowledge Base for Domestic Livestock Diseases.
Combines Indian National Livestock surveillance definitions (NDLM/NADRS)
with public domain veterinary triage guidelines.

DATASET CITATION & BASELINE MODEL DISCLOSURE:
- Mendeley Data: "Lumpy Skin Disease Dataset" (doi:10.17632/57bvy537m4.1)
- Kaggle Cattle Lesion Detection Dataset (Bovine Dermatitis & Mucosal Lesions)
- LIMITATIONS: Prototype baseline model for screening and emergency triage triage only.
  Not a certified clinical diagnosis.
"""

LEGAL_DISCLAIMER_TEXT = (
    "STATUTORY NOTICE: This AI-generated assessment is an emergency screening triage aid "
    "and interim first-aid guide. It DOES NOT constitute a veterinary diagnosis or prescription. "
    "Immediate consultation with a registered veterinarian is mandatory under Animal Disease laws."
)

DISEASE_KNOWLEDGE_BASE = {
    "LUMPY_SKIN_DISEASE": {
        "name": "Lumpy Skin Disease (LSD)",
        "species": ["CATTLE", "BUFFALO"],
        "urgency": "HIGH",
        "primary_lesion_site": "SKIN",
        "symptoms": {
            "SKIN_NODULES": 0.40,
            "FEVER": 0.20,
            "EDEMA_LEGS": 0.15,
            "NASAL_DISCHARGE": 0.10,
            "MILK_DROP": 0.10,
            "APPETITE_LOSS": 0.05
        },
        "care_guidance": [
            {
                "step": 1,
                "title": "Strict Isolation & Vector Control",
                "instructions": "Quarantine the animal in a well-ventilated enclosure away from healthy herd. Use mosquito nets and neem smoke to repel vector flies/ticks.",
                "precautions": "Do not share feeding troughs, milking equipment, or grazing fields with other cattle."
            },
            {
                "step": 2,
                "title": "Lesion Dressing",
                "instructions": "Clean open nodules with mild antiseptic solution (0.1% potassium permanganate or neem decoction). Apply fly-repellent ointment.",
                "precautions": "Do not puncture or squeeze intact dermal lumps."
            },
            {
                "step": 3,
                "title": "Hydration & Nutrition",
                "instructions": "Provide lukewarm clean drinking water with electrolytes (jaggery + salt). Feed soft green succulent fodder.",
                "precautions": "Avoid hard, dry fodder if oral lesions are present."
            }
        ]
    },
    "FOOT_AND_MOUTH_DISEASE": {
        "name": "Foot and Mouth Disease (FMD)",
        "species": ["CATTLE", "BUFFALO", "SHEEP", "GOAT", "PIG"],
        "urgency": "CRITICAL",
        "primary_lesion_site": "MOUTH",
        "symptoms": {
            "ORAL_BLISTERS": 0.35,
            "SALIVATION": 0.25,
            "LAMENESS": 0.20,
            "FEVER": 0.10,
            "HOOF_LESIONS": 0.05,
            "APPETITE_LOSS": 0.05
        },
        "care_guidance": [
            {
                "step": 1,
                "title": "Immediate Quarantine & Notification",
                "instructions": "Highly contagious viral pathogen. Isolate animal immediately and alert the village livestock officer.",
                "precautions": "Completely halt movement of animals and milk tankers outside farm perimeter."
            },
            {
                "step": 2,
                "title": "Mouth & Foot Washes",
                "instructions": "Wash mouth ulcers gently with 1% sodium carbonate (baking soda) or mild alum solution. Apply boro-glycerine paste.",
                "precautions": "Prepare foot-dip with 2% sodium carbonate or 0.1% KMnO4 at the entrance of shed."
            },
            {
                "step": 3,
                "title": "Soft Gruel Diet",
                "instructions": "Offer soft cold rice gruel or boiled finger millet (ragi) mixed with buttermilk to soothe buccal cavity.",
                "precautions": "Animal will refuse coarse fodder due to intense oral pain; do not force."
            }
        ]
    },
    "BLACKLEG": {
        "name": "Blackleg (Black Quarter / BQ)",
        "species": ["CATTLE", "BUFFALO", "SHEEP"],
        "urgency": "CRITICAL",
        "primary_lesion_site": "GENERAL",
        "symptoms": {
            "MUSCLE_SWELLING": 0.35,
            "CREPITUS_GAS": 0.25,
            "LAMENESS": 0.20,
            "FEVER": 0.10,
            "LETHARGY": 0.10
        },
        "care_guidance": [
            {
                "step": 1,
                "title": "Emergency Veterinary Call",
                "instructions": "Clostridial bacterial infection with rapid fatal progression. A vet must administer high-dose crystalline penicillin within hours.",
                "precautions": "Do not delay professional intervention for domestic remedies."
            },
            {
                "step": 2,
                "title": "Supportive Immobilization",
                "instructions": "Keep the animal lying on soft, dry bedding in the shade. Minimize physical stress.",
                "precautions": "Never incise or massage the crepitating (crackling) gas-filled muscle swelling."
            }
        ]
    },
    "BOVINE_BABESIOSIS": {
        "name": "Bovine Babesiosis (Tick Fever / Redwater)",
        "species": ["CATTLE", "BUFFALO"],
        "urgency": "HIGH",
        "primary_lesion_site": "GENERAL",
        "symptoms": {
            "RED_URINE": 0.40,
            "FEVER": 0.25,
            "PALE_MUCOSA": 0.15,
            "TICKS_PRESENT": 0.10,
            "APPETITE_LOSS": 0.10
        },
        "care_guidance": [
            {
                "step": 1,
                "title": "Rest & Shade",
                "instructions": "Hemoparasite destroys red blood cells. Keep the animal in cool shade with zero exertion.",
                "precautions": "Prevent any driving, walking, or field work which could cause acute anoxia collapse."
            },
            {
                "step": 2,
                "title": "Hydration Support",
                "instructions": "Offer clean, cool water with oral electrolyte salts to flush kidneys and prevent hemoglobin precipitation.",
                "precautions": "Vet must administer specific antiprotozoal injections."
            }
        ]
    },
    "SHEEP_GOAT_POX": {
        "name": "Sheep and Goat Pox",
        "species": ["SHEEP", "GOAT"],
        "urgency": "HIGH",
        "primary_lesion_site": "SKIN",
        "symptoms": {
            "SKIN_NODULES": 0.35,
            "FEVER": 0.25,
            "NASAL_DISCHARGE": 0.20,
            "LETHARGY": 0.10,
            "APPETITE_LOSS": 0.10
        },
        "care_guidance": [
            {
                "step": 1,
                "title": "Flock Segregation",
                "instructions": "Separate diseased sheep/goats from the healthy herd immediately.",
                "precautions": "Clean pens with 2% caustic soda or bleaching powder."
            },
            {
                "step": 2,
                "title": "Pox Pustule Topical Care",
                "instructions": "Apply antiseptic gentian violet solution on erupting skin papules.",
                "precautions": "Keep eyes and nostrils clean with sterile warm saline wipes."
            }
        ]
    },
    "BOVINE_MASTITIS": {
        "name": "Bovine Mastitis (Clinical)",
        "species": ["CATTLE", "BUFFALO", "GOAT"],
        "urgency": "MEDIUM",
        "primary_lesion_site": "UDDER",
        "symptoms": {
            "UDDER_SWELLING": 0.45,
            "ABNORMAL_MILK": 0.35,
            "FEVER": 0.10,
            "APPETITE_LOSS": 0.10
        },
        "care_guidance": [
            {
                "step": 1,
                "title": "Frequent Stripping",
                "instructions": "Hand-strip milk from the affected quarter every 2 hours into a disinfectant container and dispose safely.",
                "precautions": "Never feed mastitic milk to calves or consume it."
            },
            {
                "step": 2,
                "title": "Compress & Udder Hygiene",
                "instructions": "Apply cold water compress during acute inflammation to relieve heat and pain. Disinfect teat with povidone iodine.",
                "precautions": "Ensure milking person washes hands and uses separate towels per quarter."
            }
        ]
    }
}
