import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "Domestic Animal Disease Diagnostic & NDLM Portal"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ndlm-dev-secret-key-32-character-minimum-for-security")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for rural mobile persistence
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/livestock_portal.db")
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    
    # NDLM mock settings
    NDLM_MOCK_ENABLED: bool = True
    NDLM_API_BASE_URL: str = os.getenv("NDLM_API_BASE_URL", "http://localhost:8000/api/v1/ndlm/mock")
    NDLM_API_KEY: str = os.getenv("NDLM_API_KEY", "mock-ndlm-api-key-2026")
    
    # Notification settings (mock / dev mode by default)
    SMS_GATEWAY_MOCK: bool = True
    FCM_MOCK: bool = True

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
