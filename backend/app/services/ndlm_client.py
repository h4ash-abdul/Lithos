import re
import uuid
import hashlib
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.schemas.ndlm import NdlmAnimalProfile, NdlmIncidencePushRequest, NdlmIncidencePushResponse

class INdlmClient(ABC):
    @abstractmethod
    def validate_tag_format(self, tag_id: str) -> bool:
        pass

    @abstractmethod
    def lookup_animal(self, tag_id: str) -> Optional[NdlmAnimalProfile]:
        pass

    @abstractmethod
    def push_disease_incidence(self, payload: NdlmIncidencePushRequest) -> NdlmIncidencePushResponse:
        pass

class MockNdlmClient(INdlmClient):
    """
    Mock implementation of NDLM / Bharat Pashudhan (INAPH) API.
    Used for local development, automated testing, and disconnected prototypes.
    """
    
    # Pre-seeded sample tags for demo and testing
    SEED_DATABASE: Dict[str, Dict[str, Any]] = {
        "123456789012": {
            "species": "CATTLE",
            "breed": "Gir",
            "age_months": 38,
            "sex": "FEMALE",
            "owner_name": "Ramesh Patel",
            "owner_phone_masked": "+91 98****3210",
            "village_lgd_code": "512340",
            "district": "Anand",
            "state": "Gujarat",
            "vaccination_records": [
                {"vaccine": "FMD Oil Adjuvant", "date": "2025-10-15", "status": "ACTIVE"},
                {"vaccine": "Brucellosis S19", "date": "2024-03-20", "status": "COMPLETED"},
                {"vaccine": "LSD Heterologous Goat Pox", "date": "2025-06-12", "status": "EXPIRED"}
            ]
        },
        "987654321098": {
            "species": "BUFFALO",
            "breed": "Murrah",
            "age_months": 45,
            "sex": "FEMALE",
            "owner_name": "Suresh Kumar",
            "owner_phone_masked": "+91 94****4567",
            "village_lgd_code": "512341",
            "district": "Rohtak",
            "state": "Haryana",
            "vaccination_records": [
                {"vaccine": "FMD Oil Adjuvant", "date": "2025-11-01", "status": "ACTIVE"},
                {"vaccine": "Black Quarter (BQ)", "date": "2025-07-18", "status": "ACTIVE"}
            ]
        }
    }

    def validate_tag_format(self, tag_id: str) -> bool:
        """
        Validates 12-digit Indian national livestock ear tag format (numeric only).
        """
        if not tag_id:
            return False
        clean_tag = tag_id.strip()
        return bool(re.fullmatch(r"^\d{12}$", clean_tag))

    def lookup_animal(self, tag_id: str) -> Optional[NdlmAnimalProfile]:
        clean_tag = tag_id.strip() if tag_id else ""
        if not self.validate_tag_format(clean_tag):
            return None

        # Return from mock database if present
        if clean_tag in self.SEED_DATABASE:
            data = self.SEED_DATABASE[clean_tag]
            return NdlmAnimalProfile(
                tag_id=clean_tag,
                is_valid_format=True,
                species=data["species"],
                breed=data["breed"],
                age_months=data["age_months"],
                sex=data["sex"],
                owner_name=data["owner_name"],
                owner_phone_masked=data["owner_phone_masked"],
                village_lgd_code=data["village_lgd_code"],
                district=data["district"],
                state=data["state"],
                vaccination_records=data["vaccination_records"]
            )

        # Dynamic fallback for any valid 12-digit tag in dev mode
        return NdlmAnimalProfile(
            tag_id=clean_tag,
            is_valid_format=True,
            species="CATTLE",
            breed="Indigenous Crossbred",
            age_months=30,
            sex="FEMALE",
            owner_name="Registered Livestock Owner",
            owner_phone_masked="+91 99****0000",
            village_lgd_code="500001",
            district="Surveillance Zone",
            state="National Registry",
            vaccination_records=[
                {"vaccine": "FMD", "date": "2025-08-10", "status": "DUE_FOR_BOOSTER"}
            ]
        )

    def push_disease_incidence(self, payload: NdlmIncidencePushRequest) -> NdlmIncidencePushResponse:
        """
        Mock NDLM National Animal Disease Reporting System (NADRS) push endpoint.
        Returns a mock transaction reference with checksum.
        """
        timestamp_str = datetime.now(timezone.utc).isoformat()
        raw_hash = f"{payload.case_reference_id}:{payload.disease_code}:{payload.village_lgd_code}:{timestamp_str}"
        tx_ref = "NDLM-NADRS-" + hashlib.sha256(raw_hash.encode()).hexdigest()[:16].upper()
        ticket_id = f"TKT-SURV-{uuid.uuid4().hex[:8].upper()}"

        return NdlmIncidencePushResponse(
            success=True,
            transaction_ref=tx_ref,
            status="ACKNOWLEDGED_BY_NADRS",
            ndlm_surveillance_ticket=ticket_id,
            message="Disease incidence successfully registered in NDLM Central Surveillance Database",
            recorded_at=datetime.now(timezone.utc)
        )

# Factory singleton
ndlm_client: INdlmClient = MockNdlmClient()
