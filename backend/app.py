"""
---
title: Voice AI Business Assistant (Operation One)
emoji: 🎙️
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 5.20.0
app_file: app.py

pinned: false
---
"""

import os
import sys

# Ensure current working directory is at top of sys.path
cwd = os.path.abspath(os.path.dirname(__file__))
if cwd not in sys.path:
    sys.path.insert(0, cwd)

# Prevent app.py script from shadowing the app/ package directory
if "app" in sys.modules and not hasattr(sys.modules["app"], "__path__"):
    del sys.modules["app"]

import asyncio
import gradio as gr
from typing import Tuple

# Patch Gradio Client schema parser bug for boolean additionalProperties
try:
    import gradio_client.utils as client_utils
    _orig_json_schema_to_python_type = client_utils._json_schema_to_python_type

    def _safe_json_schema_to_python_type(schema, defs=None):
        if isinstance(schema, bool) or not isinstance(schema, dict):
            return "Any"
        try:
            return _orig_json_schema_to_python_type(schema, defs)
        except Exception:
            return "Any"

    client_utils._json_schema_to_python_type = _safe_json_schema_to_python_type
except Exception:
    pass

# ZeroGPU compatibility check for Hugging Face Spaces
try:
    import spaces
    @spaces.GPU(duration=1)
    def zero_gpu_initializer():
        return "ZeroGPU Ready"
    zero_gpu_initializer()
except Exception:
    pass



# Import Operation One SDK Agent runner
from app.agent.core.agents_sdk import run_agent, OperationOneVoiceWorkflow
from app.core.config import settings


def process_command(user_text: str, audio_path: str | None, session_id: str) -> Tuple[str, str, str]:
    """Process text or audio user input through Operation One Agent SDK."""
    prompt = user_text.strip() if user_text else ""
    
    # If audio is provided but no text, note audio input
    if not prompt and audio_path:
        prompt = "[Audio input provided] Please analyze business state or process user query."
    
    if not prompt:
        return "⚠️ Please enter a text message or record voice input.", "System", session_id
        
    s_id = session_id.strip() if session_id and session_id.strip() else "hf_default_session"
    
    try:
        # Run agent in async loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            run_agent(prompt, context={"source": "huggingface_gradio"}, session_id=s_id)
        )
        loop.close()
        
        active_agent = result.get("agent", "OperationOneAgent")
        response_text = result.get("response", "No output returned.")
        return response_text, f"🤖 Active Specialist: {active_agent}", s_id
    except Exception as exc:
        return f"❌ Error processing request: {str(exc)}", "System Error", s_id

def create_gradio_app():
    """Build and return the Gradio UI interface."""
    with gr.Blocks(theme=gr.themes.Soft(), title="Operation One — Voice AI Assistant") as demo:
        gr.Markdown(
            """
            # 🎙️ Operation One — Voice AI Business Assistant
            **Powered by OpenAI Agents SDK & Hugging Face Spaces**
            
            Multi-agent business operations manager supporting **Sales**, **Inventory**, **Finance**, and **Integrations**.
            """
        )
        
        with gr.Row():
            with gr.Column(scale=2):
                session_input = gr.Textbox(
                    label="Session ID",
                    value="hf_default_session",
                    placeholder="Enter session ID to preserve agent memory..."
                )
                text_input = gr.Textbox(
                    label="Command / Query (Text)",
                    placeholder="e.g. Check low stock items, generate sales report, or update inventory...",
                    lines=3
                )
                audio_input = gr.Audio(
                    sources=["microphone", "upload"],
                    type="filepath",
                    label="Voice Command (Audio)"
                )
                submit_btn = gr.Button("🚀 Send Command to Agent", variant="primary")
                clear_btn = gr.Button("🔄 Clear Input")

            with gr.Column(scale=3):
                agent_status = gr.Markdown("🤖 **Active Specialist:** Ready")
                output_text = gr.Textbox(
                    label="Agent Response",
                    lines=12,
                    interactive=False
                )

        submit_btn.click(
            fn=process_command,
            inputs=[text_input, audio_input, session_input],
            outputs=[output_text, agent_status, session_input]
        )
        clear_btn.click(
            fn=lambda: ("", None),
            inputs=None,
            outputs=[text_input, audio_input]
        )

        gr.Markdown("---")
        gr.Markdown("*Note: Set `OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_KEY` in HF Space Secrets.*")
        
    return demo

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import router as v1_router
from app.agent.router import router as agent_router
from app.core.auth import get_current_user

# Initialize FastAPI app to serve REST API endpoints for Next.js frontend
fastapi_app = FastAPI(title="Operation One Backend API")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API endpoints
fastapi_app.include_router(v1_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
fastapi_app.include_router(agent_router, prefix="/agent", dependencies=[Depends(get_current_user)])

# Mount Gradio Web UI at root path
demo = create_gradio_app()
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)



