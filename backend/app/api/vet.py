from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.case import Case, VetReview
from app.models.ndlm import NdlmSyncLog
from app.schemas.vet import VetTriageRequest, VetReviewResponse
from app.schemas.case import CaseDetailResponse
from app.schemas.ndlm import NdlmIncidencePushRequest
from app.services.auth_service import require_roles
from app.services.case_service import case_service
from app.services.notification_service import notification_service
from app.services.ndlm_client import ndlm_client

router = APIRouter(prefix="/vet", tags=["Veterinarian Workflow"])

@router.get("/cases", response_model=List[CaseDetailResponse])
def get_vet_triage_feed(
    status: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["VET", "ADMIN"]))
):
    query = db.query(Case)
    if district:
        query = query.filter(Case.district == district)
    elif current_user.district:
        query = query.filter(Case.district == current_user.district)
    
    if status:
        query = query.filter(Case.status == status)
    if urgency:
        query = query.filter(Case.urgency_level == urgency)

    cases = query.order_by(Case.created_at.desc()).all()
    return [case_service.get_case_detail(db, c.id) for c in cases]

@router.post("/cases/{case_id}/triage", response_model=VetReviewResponse)
def triage_case(
    case_id: str,
    req: VetTriageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["VET", "ADMIN"]))
):
    case_obj = db.query(Case).filter(Case.id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    # Record review
    review = VetReview(
        case_id=case_id,
        vet_id=current_user.id,
        triage_action=req.triage_action,
        confirmed_disease_code=req.confirmed_disease_code,
        clinical_notes=req.clinical_notes,
        official_prescription=req.official_prescription,
        is_quarantine_advised=req.is_quarantine_advised,
        report_to_ndlm_epidemic_cell=req.report_to_ndlm_epidemic_cell,
        reviewed_at=datetime.now(timezone.utc)
    )
    db.add(review)

    # Transition case status
    if req.triage_action == "ACKNOWLEDGED":
        case_obj.status = "UNDER_REVIEW"
    elif req.triage_action in ["SCHEDULED_VISIT", "TELECONSULT_ADVICE"]:
        case_obj.status = "VERIFIED"
    elif req.triage_action == "ESCALATED":
        case_obj.status = "ESCALATED"
    elif req.triage_action == "DISMISSED":
        case_obj.status = "CLOSED"

    case_obj.assigned_vet_id = current_user.id

    # If flagged for national epidemic surveillance, push to NDLM
    if req.report_to_ndlm_epidemic_cell:
        ndlm_req = NdlmIncidencePushRequest(
            village_lgd_code=case_obj.village or "500001",
            district=case_obj.district or "Default District",
            state=case_obj.state or "National State",
            disease_code=req.confirmed_disease_code or (case_obj.ai_report.primary_disease_code if case_obj.ai_report else "UNKNOWN"),
            animal_species=case_obj.animal.species if case_obj.animal else "CATTLE",
            suspected_cases_count=1,
            reporting_source="VET_CONFIRMED_SURVEILLANCE",
            case_reference_id=case_obj.id
        )
        ndlm_resp = ndlm_client.push_disease_incidence(ndlm_req)

        sync_log = NdlmSyncLog(
            case_id=case_obj.id,
            ndlm_transaction_ref=ndlm_resp.transaction_ref,
            sync_status="SUCCESS",
            request_payload=ndlm_req.model_dump(mode="json"),
            response_payload=ndlm_resp.model_dump(mode="json")
        )
        db.add(sync_log)

    db.commit()
    db.refresh(review)

    # Notify farmer of vet action
    farmer = case_obj.farmer
    if farmer and farmer.phone_number:
        advice_text = req.official_prescription or req.clinical_notes or "Review your updated case status in the app."
        notification_service.notify_farmer_of_vet_action(
            farmer_phone=farmer.phone_number,
            action=req.triage_action,
            advice=advice_text
        )

    return review
