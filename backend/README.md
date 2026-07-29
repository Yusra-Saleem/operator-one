---
title: Operator One Voice AI Backend
emoji: ⚡
colorFrom: purple
colorTo: indigo
sdk: gradio
sdk_version: 5.20.0
app_file: app.py
pinned: false
---



# Operator One - Enterprise Voice AI & Business Operations Assistant Backend

Autonomous multi-agent execution system built with FastAPI, OpenAI Agents SDK, Gradio, WebSockets, and Supabase PostgreSQL.

## Features
- Interactive Gradio Web UI (`app.py`) for Hugging Face Spaces
- Real-time WebSockets Voice Streaming (`/voice/ws/{session_id}`)
- Server-Sent Events (`/voice/stream/{session_id}`)
- Multi-Agent Orchestration Engine (Orchestrator, Sales, Inventory, Finance, Integrations)
- Native Supabase PostgreSQL Database Integration
- High Performance FastAPI ASGI Server

---

## Deploying `backend` to Hugging Face Spaces (Gradio)

### Option 1: Gradio Space Deployment
1. Create a new Space on [Hugging Face Spaces](https://huggingface.co/spaces).
2. Choose **SDK**: `Gradio`.
3. Push all files inside the `backend/` directory directly to the Hugging Face repository root.
4. Go to **Settings -> Variables and Secrets** in your Space and add:
   - `OPENAI_API_KEY`: Your OpenAI API key.
   - `SUPABASE_URL`: Your Supabase URL.
   - `SUPABASE_KEY`: Your Supabase Service Role or Anon key.
5. HF Spaces will automatically install `requirements.txt` and launch `app.py` on port `7860`.

### Option 2: Docker Space Deployment
1. Create a new Space on Hugging Face Spaces and select **SDK**: `Docker`.
2. Push `backend/` including `Dockerfile`.
3. Set your Environment Secrets in Space Settings.
