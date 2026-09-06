import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_case_uuid = Column(String(64), unique=True, index=True, nullable=False)  # For offline idempotency
    farmer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    animal_id = Column(String(36), ForeignKey("animals.id"), nullable=True, index=True)
    assigned_vet_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    # Status: DRAFT, SYNCED, UNDER_REVIEW, VERIFIED, ESCALATED, CLOSED
    status = Column(String(30), default="SYNCED", index=True)
    # Urgency: LOW, MEDIUM, HIGH, CRITICAL
    urgency_level = Column(String(20), default="MEDIUM", index=True)
    
    gps_latitude = Column(Float, nullable=True)
    gps_longitude = Column(Float, nullable=True)
    village = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True)
    
    recorded_at_offline = Column(DateTime, nullable=True)
    synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    farmer = relationship("User", foreign_keys=[farmer_id], back_populates="cases")
    assigned_vet = relationship("User", foreign_keys=[assigned_vet_id])
    animal = relationship("Animal", back_populates="cases")
    media = relationship("CaseMedia", back_populates="case", cascade="all, delete-orphan")
    symptoms = relationship("CaseSymptom", back_populates="case", cascade="all, delete-orphan")
    ai_report = relationship("AiReport", back_populates="case", uselist=False, cascade="all, delete-orphan")
    vet_reviews = relationship("VetReview", back_populates="case", cascade="all, delete-orphan")
    ndlm_logs = relationship("NdlmSyncLog", back_populates="case", cascade="all, delete-orphan")

class CaseMedia(Base):
    __tablename__ = "case_media"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    media_type = Column(String(20), default="IMAGE")  # IMAGE, AUDIO_NOTE
    storage_path = Column(String(255), nullable=False)
    thumbnail_path = Column(String(255), nullable=True)
    lesion_body_part = Column(String(50), default="GENERAL")  # SKIN, EYE, MOUTH, HOOF, GENERAL
    file_size_bytes = Column(Integer, default=0)
    checksum_sha256 = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="media")

class CaseSymptom(Base):
    __tablename__ = "case_symptoms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    symptom_code = Column(String(50), nullable=False)  # FEVER, SKIN_NODULES, etc.
    severity = Column(String(20), default="MODERATE")  # MILD, MODERATE, SEVERE
    duration_days = Column(Integer, default=1)
    notes = Column(Text, nullable=True)

    case = relationship("Case", back_populates="symptoms")

class AiReport(Base):
    __tablename__ = "ai_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id"), unique=True, nullable=False)
    inference_mode = Column(String(20), default="CLOUD_FUSED")  # OFFLINE_LOCAL, CLOUD_FUSED
    primary_disease_code = Column(String(50), nullable=False)
    primary_confidence = Column(Float, nullable=False)
    ranked_differential_diagnoses = Column(JSON, nullable=False)  # List of {disease_code, disease_name, score, rationale}
    interim_care_guidance = Column(JSON, nullable=False)  # List of {step, title, instructions, precautions}
    legal_disclaimer = Column(Text, nullable=False)
    inference_latency_ms = Column(Float, default=0.0)
    model_version = Column(String(50), default="v1.0-mvp")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="ai_report")

class VetReview(Base):
    __tablename__ = "vet_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    vet_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    triage_action = Column(String(50), nullable=False)  # ACKNOWLEDGED, SCHEDULED_VISIT, TELECONSULT_ADVICE, ESCALATED, DISMISSED
    confirmed_disease_code = Column(String(50), nullable=True)
    clinical_notes = Column(Text, nullable=True)
    official_prescription = Column(Text, nullable=True)
    is_quarantine_advised = Column(Boolean, default=False)
    report_to_ndlm_epidemic_cell = Column(Boolean, default=False)
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="vet_reviews")
    vet = relationship("User")
