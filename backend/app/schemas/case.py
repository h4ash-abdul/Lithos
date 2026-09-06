from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.ai import SymptomInput, AiReportResponse

class AnimalCreateOrLink(BaseModel):
    ndlm_animal_tag_id: Optional[str] = Field(None, json_schema_extra={"example": "123456789012"})
    species: str = Field(..., json_schema_extra={"example": "CATTLE"})
    breed: Optional[str] = Field(None, json_schema_extra={"example": "Gir"})
    age_months: Optional[int] = Field(None, json_schema_extra={"example": 36})
    sex: Optional[str] = Field(None, json_schema_extra={"example": "FEMALE"})

class AnimalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ndlm_animal_tag_id: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    sex: Optional[str] = None

class GpsCoordinates(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class CaseCreate(BaseModel):
    client_case_uuid: str = Field(..., json_schema_extra={"example": "c8b6b2a4-5678-4321-abcd-ef0123456789"})
    animal: AnimalCreateOrLink
    symptoms: List[SymptomInput]
    gps_location: Optional[GpsCoordinates] = None
    recorded_at_offline: Optional[datetime] = None

class CaseMediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    media_type: str
    storage_path: str
    thumbnail_path: Optional[str] = None
    lesion_body_part: str
    file_size_bytes: int
    created_at: datetime

class CaseDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    client_case_uuid: str
    farmer_id: str
    farmer_phone: Optional[str] = None
    animal: Optional[AnimalResponse] = None
    status: str
    urgency_level: str
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    recorded_at_offline: Optional[datetime] = None
    synced_at: datetime
    created_at: datetime
    media: List[CaseMediaResponse] = []
    symptoms: List[SymptomInput] = []
    ai_report: Optional[AiReportResponse] = None

class CaseSyncItem(CaseCreate):
    pass

class CaseSyncRequest(BaseModel):
    cases: List[CaseSyncItem]

class CaseSyncResult(BaseModel):
    client_case_uuid: str
    server_case_id: str
    status: str
    ai_report: Optional[AiReportResponse] = None

class CaseSyncResponse(BaseModel):
    synced_count: int
    results: List[CaseSyncResult]
