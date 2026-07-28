# Supabase Authentication & PostgreSQL Database Setup Guide

## Overview
Operator One uses **Supabase Authentication** for user identity management and **Supabase PostgreSQL** as its relational database backbone.

---

## Supabase Configuration

### Environment Variables (`.env`)

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres.supabase:yourpassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

---

## Authentication Flow

1. User enters credentials in the frontend `AuthModal.tsx`.
2. Supabase Auth generates a signed JWT token.
3. Next.js includes the token in the `Authorization: Bearer <token>` header for FastAPI requests.
4. FastAPI `backend/app/core/auth.py` validates the token and attaches `current_user` to the request lifecycle.
