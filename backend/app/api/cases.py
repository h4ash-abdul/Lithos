from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.case import Case
from app.schemas.case import CaseCreate, CaseSyncRequest, CaseSyncResponse, CaseDetailResponse, CaseMediaResponse
from app.services.auth_service import get_current_user
from app.services.case_service import case_service

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.post("/sync", response_model=CaseSyncResponse)
def sync_offline_cases(
    sync_req: CaseSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Idempotent batch upload for offline cases recorded on the mobile device.
    Uses client_case_uuid to safely handle retries and prevent duplicates.
    """
    return case_service.sync_cases(db, current_user, sync_req)

@router.get("", response_model=List[CaseDetailResponse])
def list_cases(
    status: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Case)
    if current_user.role == "FARMER":
        query = query.filter(Case.farmer_id == current_user.id)
    if status:
        query = query.filter(Case.status == status)
    if urgency:
        query = query.filter(Case.urgency_level == urgency)
    if district:
        query = query.filter(Case.district == district)

    cases = query.order_by(Case.created_at.desc()).all()
    return [case_service.get_case_detail(db, c.id) for c in cases]

@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return case_service.get_case_detail(db, case_id)

@router.post("/{case_id}/media", response_model=CaseMediaResponse)
def upload_case_media(
    case_id: str,
    file: UploadFile = File(...),
    lesion_body_part: str = Form("GENERAL"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads compressed lesion image. Automatically triggers cloud multimodal AI re-scoring.
    """
    return case_service.add_media(db, case_id, file, lesion_body_part)
