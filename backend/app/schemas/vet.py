from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class VetTriageRequest(BaseModel):
    triage_action: str = Field(..., json_schema_extra={"example": "ACKNOWLEDGED"})
    confirmed_disease_code: Optional[str] = Field(None, json_schema_extra={"example": "LUMPY_SKIN_DISEASE"})
    clinical_notes: Optional[str] = Field(None, json_schema_extra={"example": "Patient displays stage 2 dermal nodules. Isolation confirmed."})
    official_prescription: Optional[str] = Field(None, json_schema_extra={"example": "Administer antiseptic wash on lesions, maintain hydration, keep isolated."})
    is_quarantine_advised: bool = Field(default=True)
    report_to_ndlm_epidemic_cell: bool = Field(default=False)

class VetReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    vet_id: str
    triage_action: str
    confirmed_disease_code: Optional[str] = None
    clinical_notes: Optional[str] = None
    official_prescription: Optional[str] = None
    is_quarantine_advised: bool
    report_to_ndlm_epidemic_cell: bool
    reviewed_at: datetime
