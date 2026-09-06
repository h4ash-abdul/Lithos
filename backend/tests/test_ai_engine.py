from app.schemas.ai import SymptomInput
from app.ml.symptom_engine import symptom_engine
from app.ml.fusion_engine import fusion_engine
from app.ml.knowledge_base import LEGAL_DISCLAIMER_TEXT

def test_symptom_engine_lsd():
    symptoms = [
        SymptomInput(code="SKIN_NODULES", severity="SEVERE", duration_days=3),
        SymptomInput(code="FEVER", severity="MODERATE", duration_days=2)
    ]
    results = symptom_engine.score(species="CATTLE", symptoms=symptoms)
    assert len(results) > 0
    top_hit = results[0]
    assert top_hit["disease_code"] == "LUMPY_SKIN_DISEASE"
    assert top_hit["score"] > 0.50
    assert top_hit["urgency_level"] == "CRITICAL"  # Escalated due to SEVERE symptom

def test_symptom_engine_fmd():
    symptoms = [
        SymptomInput(code="ORAL_BLISTERS", severity="SEVERE", duration_days=2),
        SymptomInput(code="SALIVATION", severity="SEVERE", duration_days=2),
        SymptomInput(code="LAMENESS", severity="MODERATE", duration_days=1)
    ]
    results = symptom_engine.score(species="BUFFALO", symptoms=symptoms)
    assert len(results) > 0
    top_hit = results[0]
    assert top_hit["disease_code"] == "FOOT_AND_MOUTH_DISEASE"
    assert top_hit["urgency_level"] == "CRITICAL"

def test_fusion_engine_report_generation():
    symptoms = [
        SymptomInput(code="SKIN_NODULES", severity="MODERATE", duration_days=3),
        SymptomInput(code="FEVER", severity="MILD", duration_days=1)
    ]
    report = fusion_engine.diagnose(
        species="CATTLE",
        symptoms=symptoms,
        inference_mode="CLOUD_FUSED"
    )
    assert report.primary_disease_code == "LUMPY_SKIN_DISEASE"
    assert len(report.ranked_diagnoses) >= 1
    assert len(report.interim_care_guidance) >= 2
    # Statutory legal disclaimer verification
    assert report.legal_disclaimer == LEGAL_DISCLAIMER_TEXT
    assert "DOES NOT constitute a veterinary diagnosis" in report.legal_disclaimer
