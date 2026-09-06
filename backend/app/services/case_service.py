import os
import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile

from app.config import settings
from app.models.user import User
from app.models.animal import Animal
from app.models.case import Case, CaseMedia, CaseSymptom, AiReport, VetReview
from app.models.ndlm import NdlmSyncLog
from app.schemas.case import CaseCreate, CaseSyncItem, CaseSyncRequest, CaseSyncResult, CaseSyncResponse, CaseDetailResponse, CaseMediaResponse, AnimalResponse
from app.schemas.ai import SymptomInput, AiReportResponse
from app.ml.fusion_engine import fusion_engine
from app.ml.knowledge_base import DISEASE_KNOWLEDGE_BASE
from app.services.notification_service import notification_service
from app.services.ndlm_client import ndlm_client

class CaseService:
    def get_or_create_animal(self, db: Session, farmer_id: str, animal_data) -> Animal:
        tag_id = animal_data.ndlm_animal_tag_id.strip() if animal_data.ndlm_animal_tag_id else None
        
        if tag_id:
            existing = db.query(Animal).filter(
                Animal.farmer_id == farmer_id,
                Animal.ndlm_animal_tag_id == tag_id
            ).first()
            if existing:
                return existing

        animal = Animal(
            farmer_id=farmer_id,
            ndlm_animal_tag_id=tag_id,
            species=animal_data.species.upper(),
            breed=animal_data.breed,
            age_months=animal_data.age_months,
            sex=animal_data.sex
        )
        db.add(animal)
        db.flush()
        return animal

    def create_case_internal(self, db: Session, farmer: User, case_in: CaseCreate) -> Case:
        # 1. Check idempotency
        existing_case = db.query(Case).filter(Case.client_case_uuid == case_in.client_case_uuid).first()
        if existing_case:
            return existing_case

        # 2. Get or create animal
        animal = self.get_or_create_animal(db, farmer.id, case_in.animal)

        # 3. Create Case record
        gps = case_in.gps_location
        new_case = Case(
            client_case_uuid=case_in.client_case_uuid,
            farmer_id=farmer.id,
            animal_id=animal.id,
            status="SYNCED",
            urgency_level="MEDIUM",
            gps_latitude=gps.latitude if gps else (farmer.latitude or 22.5645),
            gps_longitude=gps.longitude if gps else (farmer.longitude or 72.9289),
            village=gps.village if gps and gps.village else (farmer.village or "Khedapa"),
            district=gps.district if gps and gps.district else (farmer.district or "Anand"),
            state=gps.state if gps and gps.state else (farmer.state or "Gujarat"),
            recorded_at_offline=case_in.recorded_at_offline or datetime.now(timezone.utc),
            synced_at=datetime.now(timezone.utc)
        )
        db.add(new_case)
        db.flush()

        # 4. Add symptoms
        for s in case_in.symptoms:
            symp = CaseSymptom(
                case_id=new_case.id,
                symptom_code=s.code.upper(),
                severity=s.severity.upper(),
                duration_days=s.duration_days,
                notes=s.notes
            )
            db.add(symp)
        db.flush()

        # 5. Run Cloud AI Fusion
        ai_resp = fusion_engine.diagnose(
            species=animal.species,
            symptoms=case_in.symptoms,
            image_paths=None,
            inference_mode="CLOUD_FUSED"
        )

        new_case.urgency_level = ai_resp.urgency_level

        # Save AI Report
        ai_report_db = AiReport(
            case_id=new_case.id,
            inference_mode="CLOUD_FUSED",
            primary_disease_code=ai_resp.primary_disease_code,
            primary_confidence=ai_resp.primary_confidence,
            ranked_differential_diagnoses=[d.model_dump() for d in ai_resp.ranked_diagnoses],
            interim_care_guidance=[c.model_dump() for c in ai_resp.interim_care_guidance],
            legal_disclaimer=ai_resp.legal_disclaimer,
            inference_latency_ms=ai_resp.inference_latency_ms,
            model_version=ai_resp.model_version
        )
        db.add(ai_report_db)

        # 6. Create initial NDLM Sync Log stub
        tx_hash = "NDLM-LOG-" + hashlib.sha256(f"{new_case.id}:{datetime.now(timezone.utc)}".encode()).hexdigest()[:14].upper()
        ndlm_log = NdlmSyncLog(
            case_id=new_case.id,
            ndlm_transaction_ref=tx_hash,
            sync_status="PENDING",
            request_payload={
                "tag_id": animal.ndlm_animal_tag_id,
                "species": animal.species,
                "suspected_disease": ai_resp.primary_disease_code,
                "urgency": ai_resp.urgency_level,
                "district": new_case.district
            }
        )
        db.add(ndlm_log)
        db.commit()
        db.refresh(new_case)

        # 7. Vet alerting if high urgency
        if new_case.urgency_level in ["HIGH", "CRITICAL"]:
            # Find local vet in same district or notify district officer
            vet = db.query(User).filter(User.role == "VET", User.district == new_case.district).first()
            vet_phone = vet.phone_number if vet else "+919999988888"
            notification_service.notify_vet_of_urgent_case(
                vet_phone=vet_phone,
                case_id=new_case.id,
                disease_name=ai_resp.primary_disease_name,
                urgency=new_case.urgency_level,
                village=new_case.village or "Unknown Village"
            )

        return new_case

    def sync_cases(self, db: Session, farmer: User, sync_req: CaseSyncRequest) -> CaseSyncResponse:
        results: List[CaseSyncResult] = []

        for case_item in sync_req.cases:
            case_obj = self.create_case_internal(db, farmer, case_item)
            
            # Format AI report
            ai_rep = None
            if case_obj.ai_report:
                ai_rep = AiReportResponse(
                    id=case_obj.ai_report.id,
                    case_id=case_obj.id,
                    inference_mode=case_obj.ai_report.inference_mode,
                    primary_disease_code=case_obj.ai_report.primary_disease_code,
                    primary_disease_name=DISEASE_KNOWLEDGE_BASE.get(
                        case_obj.ai_report.primary_disease_code, {}
                    ).get("name", case_obj.ai_report.primary_disease_code),
                    primary_confidence=case_obj.ai_report.primary_confidence,
                    urgency_level=case_obj.urgency_level,
                    ranked_diagnoses=case_obj.ai_report.ranked_differential_diagnoses,
                    interim_care_guidance=case_obj.ai_report.interim_care_guidance,
                    legal_disclaimer=case_obj.ai_report.legal_disclaimer,
                    inference_latency_ms=case_obj.ai_report.inference_latency_ms,
                    model_version=case_obj.ai_report.model_version
                )

            results.append(
                CaseSyncResult(
                    client_case_uuid=case_obj.client_case_uuid,
                    server_case_id=case_obj.id,
                    status=case_obj.status,
                    ai_report=ai_rep
                )
            )

        return CaseSyncResponse(
            synced_count=len(results),
            results=results
        )

    def add_media(self, db: Session, case_id: str, file: UploadFile, lesion_body_part: str) -> CaseMedia:
        case_obj = db.query(Case).filter(Case.id == case_id).first()
        if not case_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

        ext = os.path.splitext(file.filename)[1] or ".jpg"
        file_name = f"{uuid.uuid4()}{ext}"
        save_path = settings.UPLOAD_DIR / file_name

        content = file.file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        checksum = hashlib.sha256(content).hexdigest()

        media = CaseMedia(
            case_id=case_id,
            media_type="IMAGE",
            storage_path=str(save_path),
            lesion_body_part=lesion_body_part.upper(),
            file_size_bytes=len(content),
            checksum_sha256=checksum
        )
        db.add(media)

        # Re-run AI fusion with newly uploaded lesion image
        symptoms_input = [
            SymptomInput(
                code=s.symptom_code,
                severity=s.severity,
                duration_days=s.duration_days
            ) for s in case_obj.symptoms
        ]

        species = case_obj.animal.species if case_obj.animal else "CATTLE"
        updated_ai = fusion_engine.diagnose(
            species=species,
            symptoms=symptoms_input,
            image_paths=[str(save_path)],
            lesion_site=lesion_body_part
        )

        # Update case report
        if case_obj.ai_report:
            case_obj.ai_report.primary_disease_code = updated_ai.primary_disease_code
            case_obj.ai_report.primary_confidence = updated_ai.primary_confidence
            case_obj.ai_report.ranked_differential_diagnoses = [d.model_dump() for d in updated_ai.ranked_diagnoses]
            case_obj.ai_report.interim_care_guidance = [c.model_dump() for c in updated_ai.interim_care_guidance]
            case_obj.ai_report.inference_latency_ms = updated_ai.inference_latency_ms
            case_obj.urgency_level = updated_ai.urgency_level
        
        db.commit()
        db.refresh(media)
        return media

    def get_case_detail(self, db: Session, case_id: str) -> CaseDetailResponse:
        c = db.query(Case).filter(Case.id == case_id).first()
        if not c:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

        ai_rep = None
        if c.ai_report:
            ai_rep = AiReportResponse(
                id=c.ai_report.id,
                case_id=c.id,
                inference_mode=c.ai_report.inference_mode,
                primary_disease_code=c.ai_report.primary_disease_code,
                primary_disease_name=DISEASE_KNOWLEDGE_BASE.get(
                    c.ai_report.primary_disease_code, {}
                ).get("name", c.ai_report.primary_disease_code),
                primary_confidence=c.ai_report.primary_confidence,
                urgency_level=c.urgency_level,
                ranked_diagnoses=c.ai_report.ranked_differential_diagnoses,
                interim_care_guidance=c.ai_report.interim_care_guidance,
                legal_disclaimer=c.ai_report.legal_disclaimer,
                inference_latency_ms=c.ai_report.inference_latency_ms,
                model_version=c.ai_report.model_version
            )

        animal_resp = None
        if c.animal:
            animal_resp = AnimalResponse(
                id=c.animal.id,
                ndlm_animal_tag_id=c.animal.ndlm_animal_tag_id,
                species=c.animal.species,
                breed=c.animal.breed,
                age_months=c.animal.age_months,
                sex=c.animal.sex
            )

        media_resp = [
            CaseMediaResponse(
                id=m.id,
                media_type=m.media_type,
                storage_path=m.storage_path,
                thumbnail_path=m.thumbnail_path,
                lesion_body_part=m.lesion_body_part,
                file_size_bytes=m.file_size_bytes,
                created_at=m.created_at
            ) for m in c.media
        ]

        symp_resp = [
            SymptomInput(
                code=s.symptom_code,
                severity=s.severity,
                duration_days=s.duration_days,
                notes=s.notes
            ) for s in c.symptoms
        ]

        return CaseDetailResponse(
            id=c.id,
            client_case_uuid=c.client_case_uuid,
            farmer_id=c.farmer_id,
            farmer_phone=c.farmer.phone_number if c.farmer else None,
            animal=animal_resp,
            status=c.status,
            urgency_level=c.urgency_level,
            gps_latitude=c.gps_latitude,
            gps_longitude=c.gps_longitude,
            village=c.village,
            district=c.district,
            state=c.state,
            recorded_at_offline=c.recorded_at_offline,
            synced_at=c.synced_at,
            created_at=c.created_at,
            media=media_resp,
            symptoms=symp_resp,
            ai_report=ai_rep
        )

case_service = CaseService()
