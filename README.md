# Operation One — Enterprise Voice AI Business Operations Platform

**Operation One** is a commercial-grade, voice-first business operations manager powered by FastAPI, Supabase, and the official OpenAI Agents SDK.

---

## Key Features

- **Light-Theme Executive Command Center**: Clean White (`bg-white`) & Purple (`purple-600`) design language.
- **Voice AI Operations Hub**: Integrated speech interaction HUD powered by OpenAI Agents SDK.
- **Explainable AI Decision Engine**: Telemetry risk scoring (0-100), stock-out forecasting, deal stagnation analysis, and grounded recommendations.
- **Enterprise Integrations Framework**: Standardized connectors for Salesforce CRM, NetSuite ERP, QuickBooks Accounting, and Event Webhooks.
- **Supabase Auth & PostgreSQL**: Complete JWT user identity management and relational database storage.
- **Multi-Agent Collaboration Engine**: Domain tool registry supporting Coordinator, Executive, Sales, Inventory, and Reporting agents.

---

## Technical Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS (Light Theme + Purple Accent), TypeScript.
- **Backend**: FastAPI, Python 3.11, Pydantic v2, Uvicorn, SQLAlchemy.
- **Database & Auth**: Supabase PostgreSQL, Supabase Auth.
- **AI Engine**: OpenAI Agents SDK, Python Multi-Agent Framework.

---

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Copy `backend/.env.example` to `backend/.env` and fill in all secrets before
starting the backend. Text commands use the official Agents SDK `Agent`/`Runner`;
voice turns use the SDK `AudioInput`/`VoicePipeline` with the persistent
Operation One voice workflow and are returned as streamed audio over SSE.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the Executive Operations Command Center.
