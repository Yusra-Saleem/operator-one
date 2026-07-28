from fastapi import APIRouter, Depends, HTTPException
from agents.exceptions import InputGuardrailTripwireTriggered, OutputGuardrailTripwireTriggered
from app.agent.models import AgentRequest
from app.agent.core.agents_sdk import run_agent
from app.core.auth import get_current_user

router = APIRouter(tags=["Agent SDK Execution"])

@router.post("/execute", response_model=dict)
async def execute_agent(request: AgentRequest, current_user: dict = Depends(get_current_user)):
    """Execute a natural-language or transcribed voice command with the SDK agent."""
    try:
        return await run_agent(request.user_input, context=current_user, session_id=request.session_id)
    except InputGuardrailTripwireTriggered as exc:
        raise HTTPException(status_code=400, detail="The request failed Operation One safety checks.") from exc
    except OutputGuardrailTripwireTriggered as exc:
        raise HTTPException(status_code=502, detail="Operation One could not produce a safe response.") from exc

@router.post("/sdk/run", response_model=dict)
async def run_openai_agent_sdk(request: AgentRequest, current_user: dict = Depends(get_current_user)):
    """Direct execution route via official OpenAI Agents SDK Runner."""
    return await execute_agent(request, current_user)
