from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class NdlmAnimalProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tag_id: str
    is_valid_format: bool
    species: str
    breed: str
    age_months: int
    sex: str
    owner_name: str
    owner_phone_masked: str
    village_lgd_code: str
    district: str
    state: str
    vaccination_records: List[dict] = []

class NdlmIncidencePushRequest(BaseModel):
    village_lgd_code: str = Field(..., json_schema_extra={"example": "567890"})
    district: str = Field(..., json_schema_extra={"example": "Anand"})
    state: str = Field(..., json_schema_extra={"example": "Gujarat"})
    disease_code: str = Field(..., json_schema_extra={"example": "LUMPY_SKIN_DISEASE"})
    animal_species: str = Field(..., json_schema_extra={"example": "CATTLE"})
    suspected_cases_count: int = Field(default=1, ge=1)
    reporting_source: str = Field(default="FARMER_AI_PORTAL")
    case_reference_id: str
    incident_date: Optional[date] = None

class NdlmIncidencePushResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    transaction_ref: str
    status: str
    ndlm_surveillance_ticket: str
    message: str
    recorded_at: datetime
