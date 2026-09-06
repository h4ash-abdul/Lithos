import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

security = HTTPBearer()

# In-memory OTP storage for dev/prototype (phone -> {otp, expires_at, session_id, role})
_otp_store: Dict[str, dict] = {}

def request_otp(phone_number: str, role: str = "FARMER") -> dict:
    session_id = str(uuid.uuid4())
    # Fixed dev OTP "123456" for test predictability, real system would use random digits
    otp_code = "123456"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    _otp_store[phone_number] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "session_id": session_id,
        "role": role
    }
    
    return {
        "success": True,
        "message": f"OTP sent to {phone_number}",
        "session_id": session_id,
        "dev_otp": otp_code
    }

def verify_otp_and_login(db: Session, phone_number: str, otp_code: str, session_id: str) -> dict:
    record = _otp_store.get(phone_number)
    
    # Allow testing override if dev_otp matches or store record matches
    if not record or record.get("session_id") != session_id or record.get("otp") != otp_code:
        # Fallback for dev convenience: if otp_code is "123456", allow login
        if otp_code != "123456":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP or expired session"
            )
        requested_role = record.get("role", "FARMER") if record else "FARMER"
    else:
        if datetime.now(timezone.utc) > record["expires_at"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Please request a new one."
            )
        requested_role = record["role"]

    # Retrieve or create user
    user = db.query(User).filter(User.phone_number == phone_number).first()
    if not user:
        user = User(
            phone_number=phone_number,
            role=requested_role,
            full_name=f"{requested_role.capitalize()} User",
            preferred_language="hi",
            district="Anand",
            state="Gujarat"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generate JWT
    payload = {
        "sub": user.id,
        "phone_number": user.phone_number,
        "role": user.role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles {allowed_roles}"
            )
        return current_user
    return role_checker
