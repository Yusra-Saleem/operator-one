"""Operation One production FastAPI application."""

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware
    from slowapi.util import get_remote_address
    HAS_SLOWAPI = True
except ImportError:
    HAS_SLOWAPI = False

from app.agent.router import router as agent_router
from app.api.v1.router import router as v1_router
from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import db_manager
from app.core.logger import logger


app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description="Operation One — secure AI business operations manager powered by OpenAI Agents SDK.",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
)

if HAS_SLOWAPI:
    limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)



from fastapi.exceptions import HTTPException

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    logger.warning("HTTP %d error on %s: %s", exc.status_code, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "status_code": exc.status_code,
            "error": "Service Unavailable" if exc.status_code == 503 else "Request Error",
            "message": str(exc.detail),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled request error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal Server Error", "message": "An unexpected error occurred. Please try again later."},
    )


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, object]:
    return {
        "status": "healthy",
        "service": settings.project_name,
        "version": "1.0.0",
    }


@app.get("/ready", tags=["Health"])
async def readiness_check() -> JSONResponse:
    database = db_manager.get_db_status()
    ready = database["status"] == "connected"
    return JSONResponse(
        status_code=200 if ready else 503,
        content={"ready": ready, "database": database},
    )


app.include_router(v1_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(agent_router, prefix="/agent", dependencies=[Depends(get_current_user)])
