from typing import List, Dict, Any, Tuple
from app.schemas.ai import SymptomInput
from app.ml.knowledge_base import DISEASE_KNOWLEDGE_BASE

SEVERITY_MULTIPLIERS = {
    "MILD": 0.75,
    "MODERATE": 1.0,
    "SEVERE": 1.35
}

class SymptomScoringEngine:
    """
    Computes disease probabilities based on species eligibility and symptom manifestation.
    """

    def score(self, species: str, symptoms: List[SymptomInput]) -> List[Dict[str, Any]]:
        species_norm = species.upper().strip()
        symptom_dict = {s.code.upper().strip(): s for s in symptoms}
        
        ranked_results = []

        for disease_code, d_info in DISEASE_KNOWLEDGE_BASE.items():
            # Filter by species compatibility
            if species_norm not in d_info["species"] and "GENERAL" not in d_info["species"]:
                continue

            disease_symptoms = d_info["symptoms"]
            matched_indicators = []
            raw_score = 0.0
            max_possible_score = sum(disease_symptoms.values())

            for s_code, weight in disease_symptoms.items():
                if s_code in symptom_dict:
                    s_input = symptom_dict[s_code]
                    mult = SEVERITY_MULTIPLIERS.get(s_input.severity.upper(), 1.0)
                    # Duration factor (early vs prolonged)
                    duration_factor = min(1.2, 1.0 + (s_input.duration_days * 0.03))
                    
                    term_score = weight * mult * duration_factor
                    raw_score += term_score
                    matched_indicators.append(f"{s_code} ({s_input.severity})")

            # Normalization to [0.0, 0.98] range
            normalized_prob = min(0.98, raw_score / (max_possible_score * 1.3)) if max_possible_score > 0 else 0.0

            # Generate rationale explanation
            if matched_indicators:
                rationale = (
                    f"Strong correlation with {len(matched_indicators)} characteristic symptoms: "
                    + ", ".join(matched_indicators)
                )
            else:
                rationale = "Low baseline correlation with entered symptoms."

            # Urgency escalation: if disease is critical or severe symptom is present
            urgency = d_info["urgency"]
            if any(s.severity.upper() == "SEVERE" for s in symptoms) and urgency == "HIGH":
                urgency = "CRITICAL"

            ranked_results.append({
                "disease_code": disease_code,
                "disease_name": d_info["name"],
                "score": round(normalized_prob, 3),
                "urgency_level": urgency,
                "rationale": rationale,
                "key_indicators_matched": matched_indicators
            })

        # Sort descending by score
        ranked_results.sort(key=lambda x: x["score"], reverse=True)
        return ranked_results

symptom_engine = SymptomScoringEngine()
