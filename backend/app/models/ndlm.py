import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class NdlmSyncLog(Base):
    __tablename__ = "ndlm_sync_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    ndlm_transaction_ref = Column(String(64), unique=True, index=True, nullable=False)
    sync_status = Column(String(20), default="PENDING")  # PENDING, SUCCESS, FAILED, REJECTED
    request_payload = Column(JSON, nullable=True)
    response_payload = Column(JSON, nullable=True)
    retry_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    last_attempt_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="ndlm_logs")
