"""Operation One voice transport backed by the official Agents SDK VoicePipeline."""

from __future__ import annotations

import base64
import json
import uuid
from typing import AsyncIterator

import numpy as np
from agents.voice import AudioInput, VoicePipeline
from agents.voice.events import VoiceStreamEventAudio, VoiceStreamEventError, VoiceStreamEventLifecycle
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

import time

from app.agent.core.agents_sdk import OperationOneVoiceWorkflow, run_agent
from app.core.config import settings
from app.core.logger import logger
from app.voice.models import VoiceResponse, VoiceStartResponse

router = APIRouter(prefix="/voice", tags=["Operation One Voice Agent"])
_audio_sessions: dict[str, bytearray] = {}
_sample_rates: dict[str, int] = {}
_voice_workflows: dict[str, OperationOneVoiceWorkflow] = {}
_last_active: dict[str, float] = {}

_SESSION_TTL_SECONDS = 900  # 15 minutes TTL for session memory cleanup


def _cleanup_expired_sessions() -> None:
    now = time.time()
    expired = [s_id for s_id, last_ts in _last_active.items() if now - last_ts > _SESSION_TTL_SECONDS]
    for s_id in expired:
        _audio_sessions.pop(s_id, None)
        _sample_rates.pop(s_id, None)
        _voice_workflows.pop(s_id, None)
        _last_active.pop(s_id, None)


def _event(payload: dict) -> str:
    return f"data: {json.dumps(payload, default=str)}\n\n"


@router.post("/start", response_model=VoiceStartResponse)
async def start_voice_session() -> VoiceStartResponse:
    _cleanup_expired_sessions()
    session_id = str(uuid.uuid4())
    now = time.time()
    _audio_sessions[session_id] = bytearray()
    _sample_rates[session_id] = 24000
    _voice_workflows[session_id] = OperationOneVoiceWorkflow(session_id)
    _last_active[session_id] = now
    return VoiceStartResponse(session_id=session_id)


@router.post("/chunk/{session_id}")
async def upload_voice_chunk(
    session_id: str,
    audio: UploadFile = File(...),
    sample_rate: int = Form(24000),
) -> dict[str, bool]:
    """Accept raw mono Float32 PCM captured by the browser recorder."""
    _cleanup_expired_sessions()
    now = time.time()
    if session_id not in _audio_sessions:
        _audio_sessions[session_id] = bytearray()
        _sample_rates[session_id] = sample_rate
        _voice_workflows[session_id] = OperationOneVoiceWorkflow(session_id)
    if sample_rate < 8000 or sample_rate > 96000:
        raise HTTPException(status_code=400, detail="Unsupported sample rate")
    _audio_sessions[session_id].extend(await audio.read())
    _sample_rates[session_id] = sample_rate
    _last_active[session_id] = now
    return {"accepted": True}


async def _voice_events(session_id: str, text: str = "") -> AsyncIterator[str]:
    raw_audio = bytes(_audio_sessions.get(session_id, b""))
    clean_text = text.strip()

    # 1. If text is empty or generic, transcribe audio buffer using OpenAI Whisper STT
    if (not clean_text or clean_text == "[Voice Command Dispatched]") and raw_audio and len(raw_audio) > 1000:
        try:
            import io
            import wave
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.openai_api_key.get_secret_value())
            pcm = np.frombuffer(raw_audio, dtype=np.float32)
            pcm_int16 = (pcm * 32767).clip(-32768, 32767).astype(np.int16)

            wav_io = io.BytesIO()
            with wave.open(wav_io, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(_sample_rates.get(session_id, 24000))
                wf.writeframes(pcm_int16.tobytes())
            wav_io.seek(0)
            wav_io.name = "audio.wav"

            transcript_res = await client.audio.transcriptions.create(
                model="whisper-1",
                file=wav_io,
            )
            if transcript_res and transcript_res.text:
                clean_text = transcript_res.text.strip()
                logger.info("OpenAI Whisper STT transcribed: '%s'", clean_text)
        except Exception as exc:
            logger.warning("Whisper STT transcription failed: %s", exc)

    # Clear audio buffer for next turn
    _audio_sessions[session_id] = bytearray()
    _last_active[session_id] = time.time()

    # 2. Stream agent execution response chunk by chunk over SSE
    prompt_to_run = clean_text if (clean_text and clean_text != "[Voice Command Dispatched]") else "Show current inventory stock summary, total sales revenue, and operational status"

    workflow = _voice_workflows.get(session_id) or OperationOneVoiceWorkflow(session_id)
    _voice_workflows[session_id] = workflow

    has_emitted = False
    try:
        async for text_chunk in workflow.run(prompt_to_run):
            if text_chunk:
                has_emitted = True
                yield _event(VoiceResponse(text=text_chunk, done=False).model_dump())

        if not has_emitted:
            res = await run_agent(prompt_to_run)
            response_text = res.get("response") or "Processed your request."
            yield _event(VoiceResponse(text=response_text, done=False).model_dump())

        yield _event(VoiceResponse(text="", done=True).model_dump())
    except Exception as exc:
        logger.exception("Voice agent streaming failed for prompt '%s': %s", prompt_to_run, exc)
        yield _event(VoiceResponse(text="Unable to process request at this moment. Please check backend services.", done=True).model_dump())


@router.get("/stream/{session_id}")
async def stream_voice_response(session_id: str, text: str = "") -> StreamingResponse:
    _cleanup_expired_sessions()
    now = time.time()
    if session_id not in _audio_sessions:
        _audio_sessions[session_id] = bytearray()
        _sample_rates[session_id] = 24000
        _voice_workflows[session_id] = OperationOneVoiceWorkflow(session_id)
    _last_active[session_id] = now

    return StreamingResponse(
        _voice_events(session_id, text=text),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.websocket("/ws/{session_id}")
async def websocket_voice_stream(websocket: WebSocket, session_id: str, token: str | None = None):
    """Bidirectional WebSocket voice streaming transport with authentication verification."""
    auth_token = token or websocket.query_params.get("token")
    if not auth_token:
        # In non-production environments, default to dev-token if query param missing
        if settings.environment != "production":
            auth_token = "dev-token"
        else:
            await websocket.close(code=4040, reason="Authentication token required")
            return

    try:
        verify_token_string(auth_token)
    except Exception:
        logger.warning("Rejecting unauthenticated WebSocket connection for session %s", session_id)
        await websocket.close(code=4040, reason="Invalid authentication token")
        return

    await websocket.accept()
    _cleanup_expired_sessions()
    now = time.time()
    if session_id not in _audio_sessions:
        _audio_sessions[session_id] = bytearray()
        _sample_rates[session_id] = 24000
        _voice_workflows[session_id] = OperationOneVoiceWorkflow(session_id)
    _last_active[session_id] = now

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data) if data.startswith("{") else {"text": data}
            user_text = payload.get("text", "").strip()
            if not user_text:
                continue

            workflow = _voice_workflows.get(session_id) or OperationOneVoiceWorkflow(session_id)
            _voice_workflows[session_id] = workflow
            _last_active[session_id] = time.time()

            async for text_chunk in workflow.run(user_text):
                if text_chunk:
                    await websocket.send_json({"text": text_chunk, "done": False})
            await websocket.send_json({"text": "", "done": True})
    except WebSocketDisconnect:
        logger.info("Voice WebSocket disconnected for session %s", session_id)
    except Exception as exc:
        logger.exception("Voice WebSocket error for session %s: %s", session_id, exc)
        await websocket.close()
