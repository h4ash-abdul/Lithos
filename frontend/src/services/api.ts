const API_BASE = "http://localhost:8000/api/v1";

let authToken = localStorage.getItem("ndlm_auth_token") || "";

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem("ndlm_auth_token", token);
};

export const getAuthToken = () => authToken;

const getHeaders = (isMultipart: boolean = false) => {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
};

export const api = {
  async requestOtp(phoneNumber: string, role: string = "FARMER") {
    const res = await fetch(`${API_BASE}/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber, role })
    });
    return res.json();
  },

  async verifyOtp(phoneNumber: string, otpCode: string, sessionId: string) {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode, session_id: sessionId })
    });
    const data = await res.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  async lookupNdlmTag(tagId: string) {
    const res = await fetch(`${API_BASE}/ndlm/mock/animal-lookup/${tagId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Tag verification failed");
    }
    return res.json();
  },

  async syncCasesBatch(cases: any[]) {
    const res = await fetch(`${API_BASE}/cases/sync`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ cases })
    });
    if (!res.ok) {
      throw new Error(`Sync failed with status ${res.status}`);
    }
    return res.json();
  },

  async uploadMedia(caseId: string, imageBlob: Blob, lesionPart: string) {
    const formData = new FormData();
    formData.append("file", imageBlob, "lesion_image.jpg");
    formData.append("lesion_body_part", lesionPart);

    const res = await fetch(`${API_BASE}/cases/${caseId}/media`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData
    });
    return res.json();
  },

  async fetchVetCases(params?: { status?: string; urgency?: string; district?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/vet/cases?${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async triageCase(caseId: string, triageData: any) {
    const res = await fetch(`${API_BASE}/vet/cases/${caseId}/triage`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(triageData)
    });
    return res.json();
  },

  async fetchOutbreaks(days: number = 30, diseaseCode?: string) {
    const q = new URLSearchParams({ days: days.toString() });
    if (diseaseCode) q.append("disease_code", diseaseCode);
    const res = await fetch(`${API_BASE}/analytics/outbreaks?${q}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async fetchEducationLibrary(lang: string = "hi") {
    const res = await fetch(`${API_BASE}/education/library?language=${lang}`);
    return res.json();
  }
};
