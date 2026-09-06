import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Animal(Base):
    __tablename__ = "animals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farmer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    ndlm_animal_tag_id = Column(String(20), index=True, nullable=True)  # 12-digit ear tag
    species = Column(String(50), nullable=False)  # CATTLE, BUFFALO, SHEEP, GOAT, PIG, POULTRY
    breed = Column(String(100), nullable=True)
    age_months = Column(Integer, nullable=True)
    sex = Column(String(10), nullable=True)  # MALE, FEMALE
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    farmer = relationship("User", back_populates="animals")
    cases = relationship("Case", back_populates="animal")
