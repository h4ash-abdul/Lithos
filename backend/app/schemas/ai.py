from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class SymptomInput(BaseModel):
    code: str = Field(..., json_schema_extra={"example": "SKIN_NODULES"})
    severity: str = Field(default="MODERATE", json_schema_extra={"example": "SEVERE"})
    duration_days: int = Field(default=2, json_schema_extra={"example": 3})
    notes: Optional[str] = None

class ImageClassificationResult(BaseModel):
    lesion_detected: bool
    predicted_class: str
    confidence: float
    features: List[str] = []

class RankedDiagnosis(BaseModel):
    disease_code: str
    disease_name: str
    score: float = Field(..., ge=0.0, le=1.0)
    urgency_level: str
    rationale: str
    key_indicators_matched: List[str] = []

class InterimCareStep(BaseModel):
    step: int
    title: str
    instructions: str
    precautions: str

class AiReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    case_id: Optional[str] = None
    inference_mode: str = "CLOUD_FUSED"
    primary_disease_code: str
    primary_disease_name: str
    primary_confidence: float
    urgency_level: str
    ranked_diagnoses: List[RankedDiagnosis]
    interim_care_guidance: List[InterimCareStep]
    legal_disclaimer: str
    inference_latency_ms: float = 0.0
    model_version: str = "v1.0-mvp"

class DiagnoseRequest(BaseModel):
    species: str = Field(..., json_schema_extra={"example": "CATTLE"})
    breed: Optional[str] = None
    age_months: Optional[int] = None
    symptoms: List[SymptomInput]
    image_paths: Optional[List[str]] = []
