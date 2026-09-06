from tests.test_cases import get_farmer_token

def test_analytics_outbreaks(client):
    token = get_farmer_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Seed a case
    client.post("/api/v1/cases/sync", json={
        "cases": [
            {
                "client_case_uuid": "analytics-test-case-001",
                "animal": {"species": "CATTLE"},
                "symptoms": [{"code": "SKIN_NODULES", "severity": "SEVERE", "duration_days": 3}],
                "gps_location": {"latitude": 22.56, "longitude": 72.92, "district": "Anand", "village": "Mogar"}
            }
        ]
    }, headers=headers)

    res = client.get("/api/v1/analytics/outbreaks", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert "district_summaries" in data
    assert "features" in data
    assert len(data["features"]) >= 1

def test_education_library_multilingual(client):
    # Test Hindi
    res_hi = client.get("/api/v1/education/library?language=hi")
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert data_hi["language"] == "hi"
    assert data_hi["count"] >= 2
    # Verify Hindi content present
    assert any("लम्पी" in item["title"] for item in data_hi["articles"])

    # Test Tamil
    res_ta = client.get("/api/v1/education/library?language=ta")
    assert res_ta.status_code == 200
    data_ta = res_ta.json()
    assert data_ta["language"] == "ta"
    assert any("தோல்" in item["title"] for item in data_ta["articles"])

    # Test English
    res_en = client.get("/api/v1/education/library?language=en")
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert data_en["language"] == "en"
    assert any("Lumpy Skin" in item["title"] for item in data_en["articles"])
