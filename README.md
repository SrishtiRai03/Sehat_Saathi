# 🏥 Sehat Saathi — AI-Powered Smart Healthcare for Rural India

<div align="center">

![Sehat Saathi](https://img.shields.io/badge/Sehat%20Saathi-Healthcare-6B5CE7?style=for-the-badge&logo=heart&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

**An end-to-end healthcare management platform designed for Primary Health Centers (PHCs) in rural India, featuring multilingual voice-powered AI triage, real-time queue management, pharmacy analytics, and village-level disease surveillance.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Demo](#-demo-credentials)

</div>

---

## 🌟 Problem Statement

Over **65% of India's population** lives in rural areas, yet healthcare infrastructure remains severely limited. Key challenges include:

- **Language barriers** — Patients speak regional languages; most health apps are English-only
- **Low digital literacy** — Complex UIs are inaccessible for rural users
- **No triage system** — Patients wait hours without severity-based prioritisation
- **Paper-based records** — No digital health history; repeat diagnoses are common
- **No outbreak tracking** — Disease surveillance is manual and delayed
- **Pharmacy disconnection** — Prescription fulfillment is slow and untracked

## 💡 Our Solution

**Sehat Saathi** (Health Companion) bridges these gaps with:

| Feature | Description |
|---------|-------------|
| 🎤 **Voice Triage** | Patients speak symptoms in their native language; NLP extracts & scores severity |
| 🌐 **Multilingual UI** | Full i18n support for 8 Indian languages (Hindi, Tamil, Telugu, Bengali, etc.) |
| 🤖 **AI Triage Engine** | 3-stage symptom assessment with weighted scoring algorithm |
| 📊 **Smart Queue** | Severity-based prioritisation with real-time position updates via WebSocket |
| 💊 **Pharmacy Dashboard** | Prescription routing, inventory management, and analytics |
| 🗺️ **Health Heatmap** | Interactive village-level disease outbreak surveillance with Leaflet maps |
| 📋 **Digital Records** | ABHA-linked health records with vitals, allergies, and lab results |
| 🚨 **Emergency SOS** | One-tap ambulance dispatch with GPS and patient info sharing |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework with hooks and functional components |
| **Vite 5** | Lightning-fast HMR dev server and optimised bundling |
| **React Router v6** | Client-side routing with protected routes & RBAC |
| **Framer Motion** | Micro-animations and page transitions |
| **Recharts** | Data visualisation for pharmacy analytics |
| **Leaflet.js** | Interactive disease surveillance mapping |
| **Lucide React** | Consistent icon system (200+ icons) |
| **Web Speech API** | Browser-native speech recognition (multilingual) |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 18+** | JavaScript runtime |
| **Express 4** | RESTful API framework with middleware pipeline |
| **Socket.IO 4** | Real-time bidirectional WebSocket for queue updates |
| **JWT** | Stateless authentication with role-based access control |
| **In-Memory DataStore** | Custom SQLite-compatible data layer (see [Architecture](#-architecture)) |

### Code Quality
| Practice | Implementation |
|----------|---------------|
| **JSDoc Documentation** | All server modules, middleware, and utility functions documented |
| **Input Validation** | `validateBody()` middleware on all POST endpoints |
| **XSS Prevention** | `sanitize()` utility strips HTML tags from user input |
| **Error Handling** | Centralized `errorHandler` middleware + React `ErrorBoundary` |
| **Security Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` |
| **RBAC** | `authMiddleware` + `roleGuard()` for endpoint-level access control |
| **Async Safety** | `asyncHandler()` wrapper prevents unhandled promise rejections |
| **Environment Config** | `.env.example` with all configurable values |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-team/sehat-saathi.git
cd sehat-saathi

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables
cp .env.example .env

# 4. Start development server (frontend + backend)
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Production Build

```bash
npm run build      # Build optimised frontend bundle
npm run start      # Start production server
```
LIVE DEMO: https://sehat-saathi-two.vercel.app
---

## 🏗 Architecture

```
sehat-saathi/
├── server/                    # Backend API
│   ├── index.js               # Express + Socket.IO server entry
│   ├── db.js                  # In-memory DataStore with seed data
│   ├── middleware/
│   │   ├── auth.js            # JWT auth + RBAC middleware
│   │   └── utils.js           # Validation, sanitisation, error handling
│   └── routes/
│       ├── auth.js            # OTP login, demo login, session management
│       ├── triage.js          # 3-stage triage engine with scoring algorithm
│       ├── queue.js           # Priority queue with real-time updates
│       ├── records.js         # ABHA health records API
│       ├── pharmacy.js        # Inventory & prescription management
│       ├── consultation.js    # Doctor consultation & Rx creation
│       ├── heatmap.js         # Village disease surveillance data
│       ├── appointments.js    # Appointment booking system
│       └── stats.js           # Dashboard statistics
├── src/                       # Frontend React App
│   ├── main.jsx               # App entry with ErrorBoundary
│   ├── App.jsx                # Router + context providers
│   ├── index.css              # Design system (CSS custom properties)
│   ├── context/
│   │   ├── AuthContext.jsx    # JWT auth state management
│   │   ├── ToastContext.jsx   # Toast notification system
│   │   └── LanguageContext.jsx # i18n with 8 language translations
│   ├── components/
│   │   ├── Navbar.jsx         # Role-aware bottom navigation
│   │   ├── VoiceTriage.jsx    # Speech-to-triage voice interface
│   │   ├── LanguageSelector.jsx # Language picker modal
│   │   └── ErrorBoundary.jsx  # Graceful error handling
│   ├── lib/
│   │   └── nlpEngine.js       # Multilingual symptom NLP extraction
│   └── pages/
│       ├── Landing.jsx        # Landing page with feature showcase
│       ├── Login.jsx          # OTP-based authentication
│       ├── PatientDashboard.jsx # Patient home with quick actions
│       ├── Triage.jsx         # Voice + manual triage wizard
│       ├── QueueStatus.jsx    # Real-time queue position tracker
│       ├── HealthRecords.jsx  # Digital health records viewer
│       ├── BookAppointment.jsx # Calendar-based appointment booking
│       ├── SOS.jsx            # Emergency ambulance dispatch
│       ├── DoctorDashboard.jsx # Queue mgmt + consultation + Rx builder
│       ├── PharmacyDashboard.jsx # Inventory + analytics + Rx fulfillment
│       └── Heatmap.jsx        # Leaflet disease surveillance map
├── .env.example               # Environment configuration template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration with API proxy
└── index.html                 # HTML entry point with Leaflet CDN
```

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ Patient  │  │  Doctor   │  │ Pharmacy  │  │  Heatmap  │ │
│  │Dashboard │  │ Dashboard │  │ Dashboard │  │   (Map)   │ │
│  └────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ │
│       │              │              │              │        │
│  ┌────▼──────────────▼──────────────▼──────────────▼────┐   │
│  │              AuthContext + LanguageContext             │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ REST API + WebSocket               │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      BACKEND (Express)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware: Auth → Validation → Sanitize → Handler   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────┐ ┌────────┐ ┌───────┐ ┌──────────┐ ┌──────────┐  │
│  │ Auth │ │ Triage │ │ Queue │ │ Pharmacy │ │ Heatmap  │  │
│  └──┬───┘ └───┬────┘ └───┬───┘ └────┬─────┘ └────┬─────┘  │
│     │         │          │          │            │          │
│  ┌──▼─────────▼──────────▼──────────▼────────────▼──────┐  │
│  │              DataStore (In-Memory SQLite)              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Socket.IO (Real-Time Queue)               │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎤 Voice Triage — How It Works

The multilingual voice triage system is a key differentiator:

```
Patient speaks       Web Speech API        NLP Engine           Triage Backend
in any language  →  (SpeechRecognition)  →  analyzeSymptoms()  →  /api/triage/*
                        ↓                       ↓                    ↓
                  Transcript text         Symptom extraction     Score 0-10
                                         Duration detection      Severity label
                                         Severity modifiers      Queue position
```

### Supported Languages

| Language | Native Script | Speech API Locale |
|----------|--------------|-------------------|
| English | English | en-IN |
| Hindi | हिन्दी | hi-IN |
| Tamil | தமிழ் | ta-IN |
| Telugu | తెలుగు | te-IN |
| Bengali | বাংলা | bn-IN |
| Marathi | मराठी | mr-IN |
| Gujarati | ગુજરાતી | gu-IN |
| Kannada | ಕನ್ನಡ | kn-IN |

### NLP Symptom Categories (19 total)

Chest pain, breathing difficulty, unconsciousness, severe bleeding, high fever, fever, severe pain, vomiting, diarrhea, headache, stomach pain, cough, body pain, weakness, skin rash, eye problems, swelling, urinary issues, pregnancy complications.

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/send-otp` | Send OTP to phone | ❌ |
| POST | `/api/auth/verify-otp` | Verify OTP → JWT | ❌ |
| POST | `/api/auth/demo-login` | Instant demo login | ❌ |
| GET | `/api/auth/me` | Get current user profile | ✅ |

### Triage

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/triage/questions/:stage` | Get stage questions | ❌ |
| POST | `/api/triage/start` | Start triage session | ✅ |
| POST | `/api/triage/submit` | Submit stage answers | ✅ |

### Queue Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/queue/doctor/:id` | Get doctor's queue | ❌ |
| GET | `/api/queue/patient/:id` | Get patient's position | ❌ |
| POST | `/api/queue/call-next` | Call next patient | ✅ 🩺 |
| POST | `/api/queue/reprioritise` | Change queue priority | ✅ 🩺 |

### Health Records

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/records/:patientId` | Get patient health records | ✅ |
| GET | `/api/records/:patientId/brief` | Get patient brief for doctor | ✅ |

### Pharmacy

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/pharmacy/:id/prescriptions` | Get pending prescriptions | ✅ |
| POST | `/api/pharmacy/dispense/:rxId` | Mark prescription dispensed | ✅ |
| GET | `/api/pharmacy/:id/inventory` | Get inventory | ✅ |
| GET | `/api/pharmacy/:id/stats` | Get analytics data | ✅ |

### Heatmap

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/heatmap/data` | Village disease data | ❌ |
| GET | `/api/heatmap/alerts` | Active health alerts | ❌ |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

---

## 🎮 Demo Credentials

The app comes pre-seeded with demo data. Use these one-click login options:

| Role | Phone | Name | Features |
|------|-------|------|----------|
| **Patient** | 9876500001 | Rajesh Kumar | Triage, Queue, Records, Appointments, SOS |
| **Doctor** | 9876500101 | Dr. Anil Verma | Queue Management, Consultation, Rx Builder |
| **Pharmacist** | 9876500201 | Jan Aushadhi Kendra | Inventory, Rx Fulfillment, Analytics |

> 💡 **Demo OTP**: `123456` (for manual phone login)

---

## 🗺️ Roadmap

- [ ] **Persistent Database** — Migrate from in-memory to SQLite/PostgreSQL
- [ ] **ABHA Integration** — Real Ayushman Bharat Health Account API
- [ ] **SMS Gateway** — Twilio/MSG91 for real OTP delivery
- [ ] **Offline Support** — Service Worker + IndexedDB for rural connectivity
- [ ] **AI Enhancement** — Transformer-based NLP for deeper symptom understanding
- [ ] **PWA** — Install as native app on Android/iOS
- [ ] **ASHA Worker Module** — Door-to-door health survey tools
- [ ] **Teleconsultation** — WebRTC video calls for remote doctor access

---


---

<div align="center">
  <strong>Built with ❤️ for Rural India</strong>
  <br>
  <em>Sehat Saathi — सेहत साथी — Because Healthcare Should Speak Your Language</em>
</div>
