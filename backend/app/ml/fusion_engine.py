import time
from typing import List, Optional
from app.schemas.ai import SymptomInput, RankedDiagnosis, InterimCareStep, AiReportResponse
from app.ml.knowledge_base import DISEASE_KNOWLEDGE_BASE, LEGAL_DISCLAIMER_TEXT
from app.ml.symptom_engine import symptom_engine
from app.ml.vision_classifier import vision_classifier

class DiseaseFusionEngine:
    """
    Fuses multimodal signals (image vision analysis + structured symptom checklists)
    into a calibrated, ranked suspicion report.
    """

    def diagnose(
        self,
        species: str,
        symptoms: List[SymptomInput],
        image_paths: Optional[List[str]] = None,
        lesion_site: str = "GENERAL",
        inference_mode: str = "CLOUD_FUSED"
    ) -> AiReportResponse:
        start_time = time.time()

        # 1. Symptom scoring
        symptom_rankings = symptom_engine.score(species=species, symptoms=symptoms)

        # 2. Vision analysis
        vision_result = None
        if image_paths and len(image_paths) > 0:
            vision_result = vision_classifier.analyze_image(image_paths[0], lesion_body_part=lesion_site)

        # 3. Multimodal fusion
        fused_rankings: List[RankedDiagnosis] = []

        for rank in symptom_rankings:
            d_code = rank["disease_code"]
            symp_score = rank["score"]
            rationale_parts = [rank["rationale"]]
            fused_score = symp_score

            if vision_result and vision_result.get("lesion_detected"):
                pred_class = vision_result.get("predicted_class")
                vis_conf = vision_result.get("confidence", 0.0)

                if pred_class == d_code:
                    # Positive vision reinforcement (60% symptom, 40% vision)
                    fused_score = (0.60 * symp_score) + (0.40 * vis_conf)
                    rationale_parts.append(
                        f"Image analysis strongly corroborates diagnosis ({', '.join(vision_result.get('features', []))})."
                    )
                else:
                    # Cross-penalty if vision strongly indicates another disease
                    fused_score = (0.75 * symp_score)

            fused_rankings.append(
                RankedDiagnosis(
                    disease_code=d_code,
                    disease_name=rank["disease_name"],
                    score=round(min(0.99, max(0.05, fused_score)), 3),
                    urgency_level=rank["urgency_level"],
                    rationale=" ".join(rationale_parts),
                    key_indicators_matched=rank["key_indicators_matched"]
                )
            )

        # Sort again by fused score
        fused_rankings.sort(key=lambda x: x.score, reverse=True)

        # Primary disease determination
        if fused_rankings:
            top_hit = fused_rankings[0]
            primary_code = top_hit.disease_code
            primary_name = top_hit.disease_name
            primary_conf = top_hit.score
            top_urgency = top_hit.urgency_level
        else:
            primary_code = "UNSPECIFIED_INFECTION"
            primary_name = "General Undetermined Illness"
            primary_conf = 0.30
            top_urgency = "MEDIUM"

        # Lookup interim care steps
        care_steps = []
        if primary_code in DISEASE_KNOWLEDGE_BASE:
            raw_steps = DISEASE_KNOWLEDGE_BASE[primary_code]["care_guidance"]
            care_steps = [InterimCareStep(**s) for s in raw_steps]
        else:
            care_steps = [
                InterimCareStep(
                    step=1,
                    title="General Rest & Isolation",
                    instructions="Keep the animal in dry, quiet shade with clean water.",
                    precautions="Do not administer unprescribed antibiotics."
                )
            ]

        latency_ms = round((time.time() - start_time) * 1000, 2)

        return AiReportResponse(
            inference_mode=inference_mode,
            primary_disease_code=primary_code,
            primary_disease_name=primary_name,
            primary_confidence=primary_conf,
            urgency_level=top_urgency,
            ranked_diagnoses=fused_rankings[:4],  # Top 4 differential diagnoses
            interim_care_guidance=care_steps,
            legal_disclaimer=LEGAL_DISCLAIMER_TEXT,
            inference_latency_ms=latency_ms,
            model_version="v1.0-mvp"
        )

fusion_engine = DiseaseFusionEngine()
