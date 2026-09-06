from app.api.auth import router as auth_router
from app.api.cases import router as cases_router
from app.api.ai import router as ai_router
from app.api.vet import router as vet_router
from app.api.ndlm_mock import router as ndlm_router
from app.api.analytics import router as analytics_router
from app.api.education import router as education_router

__all__ = [
    "auth_router", "cases_router", "ai_router",
    "vet_router", "ndlm_router", "analytics_router", "education_router"
]
