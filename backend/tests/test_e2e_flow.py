import io
from PIL import Image

def test_full_end_to_end_vertical_slice(client):
    # 1. Farmer Phone OTP Auth
    otp_req = client.post("/api/v1/auth/otp/request", json={
        "phone_number": "+919876543210",
        "role": "FARMER"
    })
    assert otp_req.status_code == 200
    session_id = otp_req.json()["session_id"]
    dev_otp = otp_req.json().get("dev_otp", "123456")

    verify_res = client.post("/api/v1/auth/otp/verify", json={
        "phone_number": "+919876543210",
        "otp_code": dev_otp,
        "session_id": session_id
    })
    assert verify_res.status_code == 200
    farmer_token = verify_res.json()["access_token"]
    f_headers = {"Authorization": f"Bearer {farmer_token}"}

    # 2. NDLM 12-digit ear tag validation & profile lookup
    tag_res = client.get("/api/v1/ndlm/mock/animal-lookup/123456789012")
    assert tag_res.status_code == 200
    animal_profile = tag_res.json()
    assert animal_profile["species"] == "CATTLE"
    assert animal_profile["breed"] == "Gir"

    # 3. Farmer records offline case with symptoms & syncs idempotently
    client_uuid = "e2e-offline-case-001"
    sync_payload = {
        "cases": [
            {
                "client_case_uuid": client_uuid,
                "animal": {
                    "ndlm_animal_tag_id": animal_profile["tag_id"],
                    "species": animal_profile["species"],
                    "breed": animal_profile["breed"],
                    "age_months": animal_profile["age_months"],
                    "sex": animal_profile["sex"]
                },
                "symptoms": [
                    {"code": "SKIN_NODULES", "severity": "SEVERE", "duration_days": 3},
                    {"code": "FEVER", "severity": "MODERATE", "duration_days": 2}
                ],
                "gps_location": {
                    "latitude": 22.5645,
                    "longitude": 72.9289,
                    "village": "Mogar",
                    "district": "Anand",
                    "state": "Gujarat"
                }
            }
        ]
    }

    sync_res = client.post("/api/v1/cases/sync", json=sync_payload, headers=f_headers)
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["synced_count"] == 1
    server_case_id = sync_data["results"][0]["server_case_id"]
    ai_report = sync_data["results"][0]["ai_report"]
    assert ai_report["primary_disease_code"] == "LUMPY_SKIN_DISEASE"
    assert ai_report["urgency_level"] in ["HIGH", "CRITICAL"]

    # 4. Upload compressed lesion photo
    test_img = Image.new("RGB", (160, 160), color=(180, 70, 70))
    buf = io.BytesIO()
    test_img.save(buf, format="JPEG")
    buf.seek(0)

    media_res = client.post(
        f"/api/v1/cases/{server_case_id}/media",
        files={"file": ("lesion_nodule.jpg", buf, "image/jpeg")},
        data={"lesion_body_part": "SKIN"},
        headers=f_headers
    )
    assert media_res.status_code == 200

    # 5. Veterinarian Phone OTP Auth & Case Triage
    vet_otp_req = client.post("/api/v1/auth/otp/request", json={
        "phone_number": "+919988776655",
        "role": "VET"
    })
    v_session_id = vet_otp_req.json()["session_id"]
    v_otp = vet_otp_req.json().get("dev_otp", "123456")

    v_verify = client.post("/api/v1/auth/otp/verify", json={
        "phone_number": "+919988776655",
        "otp_code": v_otp,
        "session_id": v_session_id
    })
    vet_token = v_verify.json()["access_token"]
    v_headers = {"Authorization": f"Bearer {vet_token}"}

    # Vet lists cases
    vet_feed = client.get("/api/v1/vet/cases?district=Anand", headers=v_headers)
    assert vet_feed.status_code == 200
    case_ids = [c["id"] for c in vet_feed.json()]
    assert server_case_id in case_ids

    # Vet triages case and escalates to NDLM Central Surveillance
    triage_payload = {
        "triage_action": "SCHEDULED_VISIT",
        "confirmed_disease_code": "LUMPY_SKIN_DISEASE",
        "clinical_notes": "Emergency mobile dispensary team dispatched.",
        "official_prescription": "Apply antiseptic wash on lumps, isolate from herd, soft succulent green feed.",
        "is_quarantine_advised": True,
        "report_to_ndlm_epidemic_cell": True
    }
    triage_res = client.post(f"/api/v1/vet/cases/{server_case_id}/triage", json=triage_payload, headers=v_headers)
    assert triage_res.status_code == 200
    triage_result = triage_res.json()
    assert triage_result["triage_action"] == "SCHEDULED_VISIT"
    assert triage_result["report_to_ndlm_epidemic_cell"] is True

    # 6. Surveillance Outbreak GIS API reflects newly confirmed case
    outbreak_res = client.get("/api/v1/analytics/outbreaks?district=Anand", headers=v_headers)
    assert outbreak_res.status_code == 200
    outbreak_data = outbreak_res.json()
    assert outbreak_data["total_cases_analyzed"] >= 1
    assert "Anand" in outbreak_data["district_summaries"]

    # 7. Multi-language Farmer Education Library check
    for lang in ["en", "hi", "ta"]:
        edu_res = client.get(f"/api/v1/education/library?language={lang}&disease_code=LUMPY_SKIN_DISEASE")
        assert edu_res.status_code == 200
        assert edu_res.json()["count"] == 1