def test_otp_flow_farmer(client):
    # 1. Request OTP
    req_res = client.post("/api/v1/auth/otp/request", json={
        "phone_number": "+919876543210",
        "role": "FARMER"
    })
    assert req_res.status_code == 200
    data = req_res.json()
    assert data["success"] is True
    assert "session_id" in data
    session_id = data["session_id"]
    dev_otp = data.get("dev_otp", "123456")

    # 2. Verify OTP
    verify_res = client.post("/api/v1/auth/otp/verify", json={
        "phone_number": "+919876543210",
        "otp_code": dev_otp,
        "session_id": session_id
    })
    assert verify_res.status_code == 200
    auth_data = verify_res.json()
    assert "access_token" in auth_data
    assert auth_data["user"]["role"] == "FARMER"
    assert auth_data["user"]["phone_number"] == "+919876543210"

    # 3. Access authenticated endpoint
    token = auth_data["access_token"]
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["phone_number"] == "+919876543210"

def test_otp_flow_invalid_otp(client):
    req_res = client.post("/api/v1/auth/otp/request", json={
        "phone_number": "+919999900000",
        "role": "FARMER"
    })
    session_id = req_res.json()["session_id"]

    verify_res = client.post("/api/v1/auth/otp/verify", json={
        "phone_number": "+919999900000",
        "otp_code": "000000",
        "session_id": session_id
    })
    assert verify_res.status_code == 400
