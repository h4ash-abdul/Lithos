def test_ndlm_lookup_valid_seed_tag(client):
    res = client.get("/api/v1/ndlm/mock/animal-lookup/123456789012")
    assert res.status_code == 200
    data = res.json()
    assert data["tag_id"] == "123456789012"
    assert data["species"] == "CATTLE"
    assert data["breed"] == "Gir"
    assert len(data["vaccination_records"]) > 0

def test_ndlm_lookup_invalid_format(client):
    # Too short
    res1 = client.get("/api/v1/ndlm/mock/animal-lookup/12345")
    assert res1.status_code == 400
    assert "12 numeric digits" in res1.json()["detail"]

    # Contains alphabets
    res2 = client.get("/api/v1/ndlm/mock/animal-lookup/12345ABC9012")
    assert res2.status_code == 400

def test_ndlm_push_incidence(client):
    payload = {
        "village_lgd_code": "512340",
        "district": "Anand",
        "state": "Gujarat",
        "disease_code": "LUMPY_SKIN_DISEASE",
        "animal_species": "CATTLE",
        "suspected_cases_count": 2,
        "reporting_source": "FARMER_PORTAL_TEST",
        "case_reference_id": "test-case-uuid-001"
    }
    res = client.post("/api/v1/ndlm/mock/push-incidence", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["status"] == "ACKNOWLEDGED_BY_NADRS"
    assert data["transaction_ref"].startswith("NDLM-NADRS-")
    assert "ndlm_surveillance_ticket" in data
