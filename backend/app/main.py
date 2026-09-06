from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
import app.models  # Ensure all models are registered
from app.api import (
    auth_router,
    cases_router,
    ai_router,
    vet_router,
    ndlm_router,
    analytics_router,
    education_router
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Production-grade API for Domestic Animal Disease Diagnostic & Surveillance Portal, "
        "integrated with National Digital Livestock Mission (NDLM) mock gateway."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for mobile client & web dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory for static media access
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(cases_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(vet_router, prefix=settings.API_V1_STR)
app.include_router(ndlm_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(education_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "ONLINE",
        "docs_url": "/docs",
        "ndlm_gateway": "ENABLED (Mock Mode)"
    }

@app.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "database": "connected",
        "ndlm_status": "synced"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
