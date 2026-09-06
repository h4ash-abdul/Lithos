from fastapi import APIRouter, HTTPException, status
from app.schemas.ndlm import NdlmAnimalProfile, NdlmIncidencePushRequest, NdlmIncidencePushResponse
from app.services.ndlm_client import ndlm_client

router = APIRouter(prefix="/ndlm/mock", tags=["NDLM Mock Gateway"])

@router.get("/animal-lookup/{tag_id}", response_model=NdlmAnimalProfile)
def lookup_animal_by_tag(tag_id: str):
    """
    Simulates NDLM (National Digital Livestock Mission) / Bharat Pashudhan / INAPH API.
    Validates 12-digit ear tag format and returns registered animal profile & vaccination history.
    """
    if not ndlm_client.validate_tag_format(tag_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid NDLM Ear Tag ID: Must be exactly 12 numeric digits."
        )
    
    profile = ndlm_client.lookup_animal(tag_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Animal tag {tag_id} not registered in NDLM Central Registry."
        )
    return profile

@router.post("/push-incidence", response_model=NdlmIncidencePushResponse)
def push_surveillance_incidence(req: NdlmIncidencePushRequest):
    """
    Simulates government NADRS (National Animal Disease Reporting System) automated push.
    """
    return ndlm_client.push_disease_incidence(req)
