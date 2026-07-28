# Operator One — Production Deployment Guide

## Overview
This document provides instructions for deploying **Operator One** to production platforms such as Vercel (Frontend) and Railway / AWS / Docker (FastAPI Backend).

---

## 1. Frontend Deployment (Vercel)

```bash
cd frontend
npm run build
```

Configure environment variables on Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Backend Deployment (Docker / FastAPI)

Build and run Docker container:

```bash
cd backend
docker build -t operator-one-backend .
docker run -p 8000:8000 operator-one-backend
```

Production Start Command:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 3. Production Verification Checklist

- [x] CORS Middleware allows specified production domains.
- [x] Global exception handler returns clean JSON responses.
- [x] Database connection pooling initialized with graceful fallback.
- [x] All 8 workspace views rendered in clean Light Theme (White & Purple accent).
- [x] Voice command HUD and speech streaming operational.
