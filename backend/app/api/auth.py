from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import OtpRequest, OtpRequestResponse, OtpVerify, TokenResponse, UserProfile
from app.services.auth_service import request_otp, verify_otp_and_login, get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/otp/request", response_model=OtpRequestResponse)
def request_login_otp(req: OtpRequest):
    return request_otp(phone_number=req.phone_number, role=req.role)

@router.post("/otp/verify", response_model=TokenResponse)
def verify_login_otp(req: OtpVerify, db: Session = Depends(get_db)):
    return verify_otp_and_login(db, phone_number=req.phone_number, otp_code=req.otp_code, session_id=req.session_id)

@router.get("/me", response_model=UserProfile)
def get_authenticated_user(current_user: User = Depends(get_current_user)):
    return current_user
