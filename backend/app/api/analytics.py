from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.case import Case, AiReport
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/analytics", tags=["Outbreak Analytics"])

@router.get("/outbreaks")
def get_outbreak_clusters(
    days: int = Query(30, description="Past days to analyze"),
    disease_code: str = Query(None, description="Filter by disease"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    query = db.query(Case).filter(Case.created_at >= cutoff)

    cases = query.all()

    # GeoJSON structure
    features = []
    district_counts: Dict[str, Dict[str, Any]] = {}

    for c in cases:
        d_code = c.ai_report.primary_disease_code if c.ai_report else "UNKNOWN"
        if disease_code and d_code != disease_code:
            continue

        lat = c.gps_latitude or 22.5645
        lng = c.gps_longitude or 72.9289
        dist = c.district or "Unknown"

        # Tally district statistics
        if dist not in district_counts:
            district_counts[dist] = {
                "total_cases": 0,
                "high_urgency_cases": 0,
                "diseases": {},
                "state": c.state or "Gujarat"
            }
        
        district_counts[dist]["total_cases"] += 1
        if c.urgency_level in ["HIGH", "CRITICAL"]:
            district_counts[dist]["high_urgency_cases"] += 1
        district_counts[dist]["diseases"][d_code] = district_counts[dist]["diseases"].get(d_code, 0) + 1

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
            },
            "properties": {
                "case_id": c.id,
                "disease_code": d_code,
                "urgency_level": c.urgency_level,
                "status": c.status,
                "village": c.village,
                "district": c.district,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
        })

    # Outbreak alert thresholds: >= 3 cases or >= 2 HIGH/CRITICAL cases
    alerts = []
    for dist, stats in district_counts.items():
        if stats["total_cases"] >= 3 or stats["high_urgency_cases"] >= 2:
            top_disease = max(stats["diseases"].items(), key=lambda x: x[1])[0] if stats["diseases"] else "UNKNOWN"
            alerts.append({
                "district": dist,
                "state": stats["state"],
                "alert_level": "WARNING" if stats["total_cases"] < 5 else "CRITICAL_EPIDEMIC",
                "dominant_disease": top_disease,
                "case_count": stats["total_cases"],
                "high_urgency_count": stats["high_urgency_cases"],
                "recommended_action": f"Mobilize veterinary response team to {dist}; implement ring vaccination."
            })

    return {
        "type": "FeatureCollection",
        "total_cases_analyzed": len(cases),
        "district_summaries": district_counts,
        "outbreak_alerts": alerts,
        "features": features
    }
