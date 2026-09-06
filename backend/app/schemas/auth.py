from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class OtpRequest(BaseModel):
    phone_number: str = Field(..., json_schema_extra={"example": "+919876543210"})
    role: str = Field(default="FARMER", json_schema_extra={"example": "FARMER"})  # FARMER, VET, ADMIN

class OtpRequestResponse(BaseModel):
    success: bool
    message: str
    session_id: str
    dev_otp: Optional[str] = None

class OtpVerify(BaseModel):
    phone_number: str
    otp_code: str
    session_id: str

class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    phone_number: str
    full_name: Optional[str] = None
    role: str
    preferred_language: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
