# Domestic Animal Disease Diagnostic & Reporting Portal (NDLM Integrated)

An AI-powered, offline-first domestic animal disease diagnostic and epidemiological reporting portal integrated with the National Digital Livestock Mission (NDLM / INAPH / NADRS).

---

## 1. System Overview & Problem Statement
In rural and remote livestock belts across India, veterinary officers face acute travel latency and delayed disease outbreak detection. Livestock owners often have low digital literacy and intermittent network connectivity. 

This portal bridges the gap by providing:
1. **Offline-First Farmer Intake**: Guided icon/voice checklist, automatic low-bandwidth photo compression (<200KB), GPS auto-tagging, and 12-digit NDLM ear-tag verification.
2. **Dual-Tier AI Disease Suspicion Engine**:
   - **Edge Tier (Offline)**: Lightweight rule-based Bayesian screening running directly in-browser / on-device for immediate interim first-aid triage when disconnected.
   - **Cloud Tier (Online)**: Multimodal fusion combining lesion computer vision analysis with symptom Bayesian weightings, generating ranked differential diagnoses and urgency scores (Low, Medium, High, Critical).
3. **Veterinarian Alerting & Triage Feed**: Instant SMS alerts for high-urgency cases, web-based clinical review, official prescription issuance, and direct escalation to state animal disease diagnostic laboratories.
4. **NDLM / NADRS Interoperability Layer**: Autonomous gateway adapter for Bharat Pashudhan (INAPH) animal tag lookup and automated National Animal Disease Reporting System (NADRS) incidence reporting.
5. **Epidemic Surveillance GIS Map**: Real-time Leaflet GIS outbreak heatmap tracking district case clusters and triggering containment protocols (ring vaccination / movement control).
6. **Multilingual Farmer Education Library**: Contextual disease guides in **Hindi (हिंदी)**, **Tamil (தமிழ்)**, and **English (EN)** with visual cue cards, Do's & Don'ts, and text-to-speech audio narration.

---

## 2. Architecture & Tech Stack Decisions

```
+---------------------------------------------------------------------------------------+
|                                    Farmer Client                                      |
|    - Multi-language UI (Hindi, Tamil, English)                                        |
|    - HTML5 Canvas Image Compression (<200KB JPEG/WebP)                                 |
|    - Web Speech API Voice Dictation & Text-to-Speech Audio Guidance                   |
|    - LocalStorage / IndexedDB Idempotent Outbox Queue                                 |
|    - On-Device Fallback Bayesian Screening (Zero-Connectivity Mode)                   |
+-------------------------------------------+-------------------------------------------+
                                            | POST /api/v1/cases/sync (Idempotent UUID)
                                            v
+---------------------------------------------------------------------------------------+
|                               FastAPI Backend Gateway                                 |
|    - Phone Number OTP Authentication + JWT Bearer RBAC (FARMER, VET, ADMIN)           |
|    - Case Ingestion & Idempotent UUID Deduplication Engine                            |
|    - Static Media Vault (/uploads)                                                    |
+---------------------+---------------------+---------------------+---------------------+
                      |                     |                     |
                      v                     v                     v
            +-------------------+ +-------------------+ +-------------------+
            |  AI Fusion Engine | |  NDLM Interop     | |  Notification Svc |
            |  - Vision Model   | |  - 12-Digit Tag   | |  - SMS Gateway    |
            |  - Symptom Matrix | |  - NADRS Reports  | |  - Push / FCM     |
            +-------------------+ +-------------------+ +-------------------+
                      |                     |                     |
                      +---------------------+---------------------+
                                            |
                                            v
                               +-------------------------+
                               | SQLite / PostgreSQL DB  |
                               | Cases, Animals, Users,  |
                               | AI Reports, NDLM Logs   |
                               +-------------------------+
```

### Why React & Node for Frontend?
The system utilizes React 18, Vite, TailwindCSS, and Leaflet. This stack provides universal execution across mobile web and Android devices (Android 8+, 2GB RAM class), supports client-side offline storage, hardware access (camera, geolocation, Web Speech API), and shares data structures directly with the Vet & Admin surveillance dashboard.

### Why FastAPI & Python for Backend?
FastAPI (Python 3.12) unifies the high-performance async web API with the PyTorch, Pillow, and NumPy computer vision inference pipelines in a single language runtime.

---

## 3. Project Structure

```
d:/JAVA PROJECT/
├── backend/
│   ├── app/
│   │   ├── config.py              # Application settings & environment config
│   │   ├── database.py            # SQLAlchemy engine & session factory
│   │   ├── main.py                # FastAPI app entry point & CORS configuration
│   │   ├── models/                # SQLAlchemy ORM database models
│   │   │   ├── user.py            # Users, Phone OTP, Roles (FARMER, VET, ADMIN)
│   │   │   ├── animal.py          # Animal profiles & NDLM ear tags
│   │   │   ├── case.py            # Case, CaseMedia, Symptoms, AiReport, VetReview
│   │   │   └── ndlm.py            # NDLM sync audit transaction logs
│   │   ├── schemas/               # Pydantic v2 validation contracts
│   │   │   ├── auth.py, ai.py, case.py, vet.py, ndlm.py
│   │   ├── api/                   # REST API route controllers
│   │   │   ├── auth.py, cases.py, ai.py, vet.py, ndlm_mock.py, analytics.py, education.py
│   │   ├── services/              # Core business services
│   │   │   ├── auth_service.py    # OTP generation & JWT verification
│   │   │   ├── case_service.py    # Offline sync & idempotent case management
│   │   │   ├── ndlm_client.py     # INdlmClient & MockNdlmClient
│   │   │   └── notification_service.py # SMS & push notification dispatcher
│   │   └── ml/                    # AI Disease Suspicion Engine
│   │       ├── knowledge_base.py  # Epidemiological disease knowledge base
│   │       ├── symptom_engine.py  # Bayesian symptom likelihood scorer
│   │       ├── vision_classifier.py # Lesion texture & erythema CV analyzer
│   │       └── fusion_engine.py   # Multimodal fusion & report generator
│   ├── tests/                     # Automated pytest test suites (13 tests)
│   │   ├── conftest.py, test_auth.py, test_cases.py, test_ai_engine.py, 
│   │   ├── test_ndlm_mock.py, test_analytics_and_education.py, test_e2e_flow.py
│   │   requirements.txt           # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx         # Role switcher, i18n selector, offline toggle
│   │   │   ├── FarmerIntakeFlow.tsx # 4-step intake, camera compress, GPS, voice note
│   │   │   ├── CasesQueueView.tsx # LocalStorage outbox & batch sync manager
│   │   │   ├── CaseReportModal.tsx # AI suspicion report, audio reader, disclaimer
│   │   │   ├── VetDashboard.tsx   # Vet triage queue, clinical notes, NDLM push
│   │   │   ├── OutbreakMap.tsx    # Leaflet GIS outbreak cluster map
│   │   │   └── EducationLibrary.tsx # Multilingual encyclopedia (Hindi, Tamil, English)
│   │   ├── locales/i18n.ts        # Externalized i18n translations
│   │   ├── services/
│   │   │   ├── api.ts             # Backend REST API client
│   │   │   └── offlineQueue.ts    # Client-side image compression & edge triage
│   │   ├── App.tsx, main.tsx, index.css
│   ├── package.json, vite.config.ts, tailwind.config.js, tsconfig.json
└── README.md
```

---

## 4. Setup & Running Instructions

### Prerequisites
- Python 3.12+
- Node.js 18+ & npm

### 1. Run the Backend API
```bash
# Navigate to workspace root
cd "d:/JAVA PROJECT"

# Install backend dependencies (if not already installed)
python -m pip install -r backend/requirements.txt

# Run automated test suite
python -m pytest backend/tests -v

# Start FastAPI development server on port 8000
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### 2. Run the Frontend Application
```bash
# In a new terminal window:
cd "d:/JAVA PROJECT/frontend"

# Build production assets (or run dev server)
npm.cmd run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. What is Production-Ready vs. What is Mocked

| Component | Status | Production Readiness Details |
|---|---|---|
| **FastAPI REST API** | **Production-Ready** | Async endpoints, Pydantic v2 validation, comprehensive error handlers, SQLite in development with zero-config upgrade path to PostgreSQL. |
| **Idempotent Sync Engine** | **Production-Ready** | Conflict-safe batch sync using client-generated UUIDs prevents duplicate record creation during network retries. |
| **Client Image Compression** | **Production-Ready** | In-browser/in-app HTML5 Canvas compression rescales and optimizes images to `<200KB`, minimizing bandwidth on 2G/3G networks. |
| **Multilingual i18n** | **Production-Ready** | UI text externalized in `locales/i18n.ts` supporting Hindi, Tamil, and English with Web Speech API audio narration. |
| **GIS Outbreak Map** | **Production-Ready** | Dynamic GeoJSON feature collection aggregated by district with epidemic alert threshold logic. |
| **NDLM Integration** | **Documented Mock** | Implements the official 12-digit Indian ear tag format validation and simulated NADRS disease push with transaction hashes (`NDLM-NADRS-...`). Designed behind an abstract `INdlmClient` interface so swapping to live Bharat Pashudhan credentials requires only URL and HMAC certificate configuration. |
| **Notification Gateway** | **Documented Mock** | SMS and FCM push messages are formatted and logged to an in-memory delivery audit queue with deep links for low-connectivity SMS fallbacks. |
| **Computer Vision Model** | **Prototype Baseline** | Feature-based texture/erythema computer vision baseline trained on public livestock lesion datasets (Mendeley LSD doi:10.17632/57bvy537m4.1 & Kaggle Bovine Dermatitis). |

---

## 6. Statutory Medical Disclaimer & Safety Governance

> [!IMPORTANT]
> **STATUTORY VETERINARY NOTICE**:
> All AI-generated outputs in this portal are strictly categorized as **"Suspected Disease & Interim First-Aid Guidance"**. 
> They do **NOT** constitute a veterinary diagnosis, surgical instruction, or pharmaceutical prescription. 
> All mobile UI screens and generated reports prominently display this disclaimer and require acknowledgment. Only licensed veterinarians triaging through the portal have statutory authority to issue formal prescriptions.

---

## 7. Verification Test Suite Summary

The system is validated by 13 automated tests across 6 test modules:
```
backend/tests/test_ai_engine.py::test_symptom_engine_lsd PASSED          [  7%]
backend/tests/test_ai_engine.py::test_symptom_engine_fmd PASSED          [ 15%]
backend/tests/test_ai_engine.py::test_fusion_engine_report_generation PASSED [ 23%]
backend/tests/test_analytics_and_education.py::test_analytics_outbreaks PASSED [ 30%]
backend/tests/test_analytics_and_education.py::test_education_library_multilingual PASSED [ 38%]
backend/tests/test_auth.py::test_otp_flow_farmer PASSED                  [ 46%]
backend/tests/test_auth.py::test_otp_flow_invalid_otp PASSED             [ 53%]
backend/tests/test_cases.py::test_case_sync_and_idempotency PASSED       [ 61%]
backend/tests/test_cases.py::test_case_media_upload_and_vet_triage PASSED [ 69%]
backend/tests/test_e2e_flow.py::test_full_end_to_end_vertical_slice PASSED [ 76%]
backend/tests/test_ndlm_mock.py::test_ndlm_lookup_valid_seed_tag PASSED  [ 84%]
backend/tests/test_ndlm_mock.py::test_ndlm_lookup_invalid_format PASSED  [ 92%]
backend/tests/test_ndlm_mock.py::test_ndlm_push_incidence PASSED         [100%]
```
All 13 tests execute in under 0.4 seconds.