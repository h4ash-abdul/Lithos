from fastapi import APIRouter, Depends
from app.schemas.ai import DiagnoseRequest, AiReportResponse
from app.ml.fusion_engine import fusion_engine
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Suspicion Engine"])

@router.post("/diagnose", response_model=AiReportResponse)
def diagnose_disease(
    req: DiagnoseRequest,
    current_user: User = Depends(get_current_user)
):
    """
    On-demand AI diagnosis inference using Bayesian symptom weighting + visual features.
    Returns ranked differential diagnoses, non-prescriptive interim care guidance, and disclaimer.
    """
    return fusion_engine.diagnose(
        species=req.species,
        symptoms=req.symptoms,
        image_paths=req.image_paths,
        inference_mode="CLOUD_FUSED"
    )
