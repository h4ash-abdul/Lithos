import io
from PIL import Image

def get_farmer_token(client):
    req = client.post("/api/v1/auth/otp/request", json={"phone_number": "+919876543210", "role": "FARMER"})
    data = req.json()
    verify = client.post("/api/v1/auth/otp/verify", json={
        "phone_number": "+919876543210",
        "otp_code": data.get("dev_otp", "123456"),
        "session_id": data["session_id"]
    })
    return verify.json()["access_token"]

def get_vet_token(client):
    req = client.post("/api/v1/auth/otp/request", json={"phone_number": "+919988776655", "role": "VET"})
    data = req.json()
    verify = client.post("/api/v1/auth/otp/verify", json={
        "phone_number": "+919988776655",
        "otp_code": data.get("dev_otp", "123456"),
        "session_id": data["session_id"]
    })
    return verify.json()["access_token"]

def test_case_sync_and_idempotency(client):
    token = get_farmer_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    client_case_uuid = "client-offline-uuid-999"
    payload = {
        "cases": [
            {
                "client_case_uuid": client_case_uuid,
                "animal": {
                    "ndlm_animal_tag_id": "123456789012",
                    "species": "CATTLE",
                    "breed": "Gir",
                    "age_months": 36,
                    "sex": "FEMALE"
                },
                "symptoms": [
                    {"code": "SKIN_NODULES", "severity": "SEVERE", "duration_days": 2},
                    {"code": "FEVER", "severity": "MODERATE", "duration_days": 2}
                ],
                "gps_location": {
                    "latitude": 22.5645,
                    "longitude": 72.9289,
                    "village": "Anand Rural",
                    "district": "Anand",
                    "state": "Gujarat"
                }
            }
        ]
    }

    # 1. First sync attempt
    res1 = client.post("/api/v1/cases/sync", json=payload, headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["synced_count"] == 1
    server_id = data1["results"][0]["server_case_id"]
    assert data1["results"][0]["ai_report"]["primary_disease_code"] == "LUMPY_SKIN_DISEASE"

    # 2. Duplicate sync attempt (idempotency check)
    res2 = client.post("/api/v1/cases/sync", json=payload, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    # Must return same server case id without error or duplicate
    assert data2["results"][0]["server_case_id"] == server_id

def test_case_media_upload_and_vet_triage(client):
    farmer_token = get_farmer_token(client)
    f_headers = {"Authorization": f"Bearer {farmer_token}"}

    # 1. Sync case
    sync_payload = {
        "cases": [
            {
                "client_case_uuid": "client-uuid-media-test",
                "animal": {"species": "CATTLE"},
                "symptoms": [{"code": "FEVER", "severity": "MODERATE", "duration_days": 1}]
            }
        ]
    }
    sync_res = client.post("/api/v1/cases/sync", json=sync_payload, headers=f_headers)
    case_id = sync_res.json()["results"][0]["server_case_id"]

    # 2. Upload synthetic test image
    img = Image.new("RGB", (100, 100), color=(200, 50, 50))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)

    media_res = client.post(
        f"/api/v1/cases/{case_id}/media",
        files={"file": ("lesion.jpg", img_byte_arr, "image/jpeg")},
        data={"lesion_body_part": "SKIN"},
        headers=f_headers
    )
    assert media_res.status_code == 200
    media_data = media_res.json()
    assert media_data["media_type"] == "IMAGE"
    assert media_data["lesion_body_part"] == "SKIN"

    # 3. Vet triage flow
    vet_token = get_vet_token(client)
    v_headers = {"Authorization": f"Bearer {vet_token}"}

    triage_payload = {
        "triage_action": "SCHEDULED_VISIT",
        "confirmed_disease_code": "LUMPY_SKIN_DISEASE",
        "clinical_notes": "Emergency vet dispatched for on-site tissue sampling.",
        "official_prescription": "Keep strictly isolated; apply antiseptic neem wash.",
        "is_quarantine_advised": True,
        "report_to_ndlm_epidemic_cell": True
    }
    triage_res = client.post(f"/api/v1/vet/cases/{case_id}/triage", json=triage_payload, headers=v_headers)
    assert triage_res.status_code == 200
    triage_data = triage_res.json()
    assert triage_data["triage_action"] == "SCHEDULED_VISIT"
    assert triage_data["is_quarantine_advised"] is True

    # 4. Farmer inspects updated case status
    detail_res = client.get(f"/api/v1/cases/{case_id}", headers=f_headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["status"] == "VERIFIED"
    assert len(detail_data["media"]) == 1
