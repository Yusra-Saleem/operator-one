from pydantic import BaseModel
from typing import Any, List, Optional

class VoiceChunk(BaseModel):
    """Chunk of raw audio received from the frontend."""
    session_id: str
    audio: bytes

class VoiceStartResponse(BaseModel):
    """Response returned when a new voice session is created."""
    session_id: str

class VoiceResponse(BaseModel):
    """Model for streaming text responses back to the client."""
    text: str
    done: bool = False


class VoiceTranscriptResponse(BaseModel):
    """The text recognized from an uploaded voice turn."""
    text: str
